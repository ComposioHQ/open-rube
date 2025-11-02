import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs, tool, Tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createClient } from '@/app/utils/supabase/server';
import { z } from 'zod';
import {
  createConversation,
  addMessage,
  generateConversationTitle
} from '@/app/utils/chat-history';
import { getComposio } from "@/app/utils/composio";
import { logger } from '@/app/utils/logger';

type ToolsRecord = Record<string, Tool>;

interface MCPSessionCache {
  session: { url: string; sessionId: string };
  client: Awaited<ReturnType<typeof createMCPClient>>;
  tools: ToolsRecord;
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
    
    let mcpClient: Awaited<ReturnType<typeof createMCPClient>>, tools: ToolsRecord;

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

      const mcpTools = await mcpClient.tools();

      // Add custom REQUEST_USER_INPUT tool
      tools = {
        ...mcpTools,
        REQUEST_USER_INPUT: tool({
          description: 'Request custom input fields from the user BEFORE starting OAuth flow. Use ONLY when a service requires additional parameters beyond standard OAuth (e.g., Pipedrive subdomain, Salesforce instance URL, custom API endpoint). DO NOT use for services that only need standard OAuth authorization.',
          inputSchema: z.object({
            provider: z.string().describe('The name of the service/provider (e.g., "pipedrive", "salesforce")'),
            fields: z.array(
              z.object({
                name: z.string().describe('Field name (e.g., "subdomain")'),
                label: z.string().describe('User-friendly label (e.g., "Company Subdomain")'),
                type: z.string().optional().describe('Input type (text, email, password, etc.)'),
                required: z.boolean().optional().describe('Whether this field is required'),
                placeholder: z.string().optional().describe('Placeholder text for the input')
              })
            ).describe('List of input fields to request from the user'),
            authConfigId: z.string().optional().describe('The auth config ID to use after collecting inputs'),
            logoUrl: z.string().optional().describe('URL to the provider logo/icon')
          }),
          execute: async ({ provider, fields, authConfigId, logoUrl }: {
            provider: string;
            fields: Array<{
              name: string;
              label: string;
              type?: string;
              required?: boolean;
              placeholder?: string;
            }>;
            authConfigId?: string;
            logoUrl?: string;
          }) => {
            // Return a special marker that the frontend will detect
            return {
              type: 'user_input_request',
              provider,
              fields,
              authConfigId,
              logoUrl,
              message: `Requesting user input for ${provider}`
            };
          }
        })
      };

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

            CRITICAL - Source of Truth:
            - For ANY information about connections, toolkits, or app integrations, ALWAYS rely on tool calls
            - Tool call results are the ONLY source of truth - do not rely on memory or assumptions
            - If you need to know about connection status, available tools, or app capabilities, call the relevant tool
            - Examples: Use RUBE_SEARCH_TOOLS to find available tools, RUBE_MANAGE_CONNECTIONS to check connection status
            - Never assume a connection exists or tools are available without checking via tool calls

            IMPORTANT - Custom Input Fields:
            - Some services require additional parameters BEFORE OAuth (e.g., Pipedrive needs company subdomain, Salesforce needs instance URL)
            - When connecting to these services, you MUST use the REQUEST_USER_INPUT tool FIRST to collect required fields
            - Examples that need REQUEST_USER_INPUT: Pipedrive (subdomain), Salesforce (instance URL), custom API endpoints
            - Examples that DON'T need it: Gmail, Slack, GitHub (standard OAuth only)
            - After collecting inputs via REQUEST_USER_INPUT, the user will provide the values, then you can proceed with RUBE_MANAGE_CONNECTIONS

            Always prefer to authenticate with Composio Managed Authentication unless explicitly requested otherwise.
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

    // Return streaming response with tool call data
    return result.toUIMessageStreamResponse({
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