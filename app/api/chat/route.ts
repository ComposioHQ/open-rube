import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createClient } from '@/app/utils/supabase/server';
import {
  createConversation,
  addMessage,
  generateConversationTitle
} from '@/app/utils/chat-history';
import { getComposio } from "@/app/utils/composio";
import { logger } from '@/app/utils/logger';

type MCPTools = Awaited<ReturnType<Awaited<ReturnType<typeof createMCPClient>>['tools']>>;

interface MCPSessionCache {
  session: { url: string; sessionId: string };
  client: Awaited<ReturnType<typeof createMCPClient>>;
  tools: MCPTools;
}

// Session cache to store MCP sessions per chat session per user
const sessionCache = new Map<string, MCPSessionCache>();


export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = await request.json();
    
    if (!messages) {
      return NextResponse.json(
        { error: 'messages is required' }, 
        { status: 400 }
      );
    }

    // Get authenticated user from server-side session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' }, 
        { status: 400 }
      );
    }

    logger.info('User authenticated', { userId: user.id });

    let currentConversationId = conversationId;
    const latestMessage = messages[messages.length - 1];
    const isFirstMessage = !conversationId;

    // Create new conversation if this is the first message
    if (isFirstMessage) {
      const title = generateConversationTitle(latestMessage.content);
      currentConversationId = await createConversation(user.id, title);
      
      if (!currentConversationId) {
        return NextResponse.json(
          { error: 'Failed to create conversation' }, 
          { status: 500 }
        );
      }
    }

    // Save user message to database
    await addMessage(
      currentConversationId,
      user.id,
      latestMessage.content,
      'user'
    );

    logger.info('Starting Tool Router Agent execution', { conversationId: currentConversationId });

    // Create a unique session key based on user and conversation
    const sessionKey = `${user.id}-${currentConversationId}`;
    
    let mcpClient, tools;

    // Check if we have a cached session for this chat
    if (sessionCache.has(sessionKey)) {
      logger.debug('Reusing existing MCP session', { sessionKey });
      const cached = sessionCache.get(sessionKey)!;
      mcpClient = cached.client;
      tools = cached.tools;
    } else {
      logger.info('Creating new MCP session', { sessionKey });
      const composio = getComposio();

      // Access the experimental ToolRouter for specific toolkits
      const mcpSession = await composio.experimental.toolRouter.createSession(userEmail, {
        toolkits: []
      });
      const url = new URL(mcpSession.url);
      logger.debug('MCP session created', { sessionId: mcpSession.sessionId, url: url.toString() });

      mcpClient = await createMCPClient({
        transport: new StreamableHTTPClientTransport(url, {
          sessionId: mcpSession.sessionId,
        }),
      });

      tools = await mcpClient.tools();
      
      // Cache the session, client, and tools for this chat
      sessionCache.set(sessionKey, { session: mcpSession, client: mcpClient, tools });
    }

    const result = await streamText({
      model: openai('gpt-4.1'),
      tools,
      system: `You are a helpful AI assistant called Rube that can interact with 500+ applications through Composio's Tool Router.

            When responding to users:
            - Always format your responses using Markdown syntax
            - Use **bold** for emphasis and important points
            - Use bullet points and numbered lists for clarity
            - Format links as [text](url) so they are clickable
            - Use code blocks with \`\`\` for code snippets
            - Use inline code with \` for commands, file names, and technical terms
            - Use headings (##, ###) to organize longer responses
            - Make your responses clear, concise, and well-structured

            When executing actions:
            - Explain what you're doing before using tools
            - Provide clear feedback about the results
            - Include relevant links when appropriate
            
          `,
      messages: messages,
      stopWhen: stepCountIs(50),
      onStepFinish: () => {
        logger.debug('AI step completed');
      },
      onFinish: async (event) => {
        // Save assistant response to database when streaming finishes
        try {
          const result = await addMessage(
            currentConversationId,
            user.id,
            event.text,
            'assistant'
          );

          if (!result) {
            logger.warn('Failed to save assistant message to database', {
              conversationId: currentConversationId,
              userId: user.id,
              textLength: event.text.length
            });
          } else {
            logger.debug('Assistant message saved to database', {
              conversationId: currentConversationId,
              messageLength: event.text.length
            });
          }
        } catch (error) {
          logger.error('Error saving assistant message', error, {
            conversationId: currentConversationId,
            userId: user.id
          });
        }
      },
    });

    // Return streaming response
    return result.toTextStreamResponse({
      headers: {
        'X-Conversation-Id': currentConversationId,
      },
    });
  } catch (error) {
    logger.error('Error in chat endpoint', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}