import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getComposioWithVercel } from '../../utils/composio';
import { createClient } from '@/app/utils/supabase/server';
import { 
  createConversation, 
  addMessage, 
  generateConversationTitle
} from '@/app/utils/chat-history';

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

    console.log('Authenticated user:', { id: user.id, email: userEmail });

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

    const composio = getComposioWithVercel();
    const tools = await composio.tools.get(userEmail, {
      tools: ['GMAIL_FETCH_EMAILS']
    });

    const response = await generateText({
      model: openai("gpt-4"), 
      messages: messages,
      tools: tools,
    });
    
    // Save assistant response to database
    await addMessage(
      currentConversationId,
      user.id,
      response.text,
      'assistant'
    );

    return NextResponse.json({
      response: response.text,
      conversationId: currentConversationId
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' }, 
      { status: 500 }
    );
  }
}