'use client';

import { useState, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}/messages`);
      if (response.ok) {
        const data = await response.json();
        interface ApiMessage {
          id: string;
          content: string;
          role: string;
          created_at: string;
        }
        const formattedMessages = (data.messages as ApiMessage[]).map((msg: ApiMessage) => {
          const sender: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
          return {
            id: msg.id,
            content: msg.content,
            sender,
            timestamp: new Date(msg.created_at)
          };
        });
        setMessages(formattedMessages);
        return id;
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const id = Math.random().toString();
    setMessages(prev => [...prev, { ...message, id }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    setMessages,
    loadMessages,
    addMessage,
    clearMessages,
  };
}
