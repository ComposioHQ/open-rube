'use client';

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface StreamingState {
  isLoading: boolean;
  streamingContent: string;
  currentStreamingId: string | null;
}

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    isLoading: false,
    streamingContent: '',
    currentStreamingId: null,
  });

  const sendMessage = useCallback(
    async (
      message: string,
      messages: Message[],
      conversationId: string | null
    ): Promise<{ success: boolean; newConversationId?: string; content?: string }> => {
      if (!message.trim() || state.isLoading) {
        return { success: false };
      }

      setState(prev => ({ ...prev, isLoading: true, streamingContent: '' }));

      try {
        const chatMessages = [...messages].map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: chatMessages,
            conversationId
          }),
        });

        if (!chatResponse.ok) {
          throw new Error(`Chat API error: ${chatResponse.status}`);
        }

        const newConversationId = chatResponse.headers.get('X-Conversation-Id');

        const reader = chatResponse.body?.getReader();
        const decoder = new TextDecoder();
        const streamingId = nanoid();
        setState(prev => ({ ...prev, currentStreamingId: streamingId }));

        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullContent += chunk;
            setState(prev => ({ ...prev, streamingContent: fullContent }));
          }
        }

        return {
          success: true,
          newConversationId: newConversationId || undefined,
          content: fullContent || 'Sorry, I could not process your request.',
        };
      } catch (error) {
        console.error('Error calling chat API:', error);
        return {
          success: false,
          content: 'Sorry, I encountered an error while processing your message. Please try again.',
        };
      } finally {
        setState(prev => ({
          ...prev,
          isLoading: false,
          streamingContent: '',
          currentStreamingId: null,
        }));
      }
    },
    [state.isLoading]
  );

  const resetStreaming = useCallback(() => {
    setState({
      isLoading: false,
      streamingContent: '',
      currentStreamingId: null,
    });
  }, []);

  return {
    ...state,
    sendMessage,
    resetStreaming,
  };
}
