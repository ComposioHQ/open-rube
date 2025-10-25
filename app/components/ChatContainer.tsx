'use client';

import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { User } from '@supabase/supabase-js';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessages } from './ChatMessages';
import { ChatWelcome } from './ChatWelcome';
import { MessageInput } from './MessageInput';
import { useConversations } from '@/app/hooks/useConversations';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatContainerProps {
  user?: User;
}

export function ChatContainer({ user: _user }: ChatContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);

  const { conversations, loadConversations } = useConversations();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
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
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInputValue('');
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const chatMessages = [...messages, userMessage].map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          conversationId: currentConversationId
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const newConversationId = chatResponse.headers.get('X-Conversation-Id');
      if (!currentConversationId && newConversationId) {
        setCurrentConversationId(newConversationId);
        loadConversations();
      }

      const reader = chatResponse.body?.getReader();
      const decoder = new TextDecoder();
      const streamingId = nanoid();
      setCurrentStreamingId(streamingId);

      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;
          setStreamingContent(fullContent);
        }
      }

      const assistantMessage: Message = {
        id: streamingId,
        content: fullContent || 'Sorry, I could not process your request.',
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      setCurrentStreamingId(null);
    } catch (error) {
      console.error('Error calling chat API:', error);

      const errorMessage: Message = {
        id: nanoid(),
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setStreamingContent('');
      setCurrentStreamingId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const showWelcomeScreen = messages.length === 0 && !isLoading;

  return (
    <div className="flex-1 flex relative" style={{ backgroundColor: '#fcfaf9' }}>
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversationMessages}
        onNewChat={startNewChat}
        sidebarOpen={sidebarOpen}
      />

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-80' : 'ml-0'
        }`}
      >
        {/* Sidebar toggle button */}
        <div className="p-6 pb-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-900"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="9" x2="9" y1="3" y2="21" />
            </svg>
          </button>
        </div>

        {/* Welcome screen or chat messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showWelcomeScreen ? (
            <ChatWelcome
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          ) : (
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              streamingContent={streamingContent}
              currentStreamingId={currentStreamingId}
            />
          )}
        </div>

        {/* Input bar at bottom - only show when not on welcome screen */}
        {!showWelcomeScreen && (
          <div className="p-3 sm:p-4" style={{ backgroundColor: '#fcfaf9' }}>
            <div className="max-w-3xl mx-auto">
              <MessageInput
                value={inputValue}
                onChange={setInputValue}
                onSendMessage={handleSendMessage}
                placeholder="Send a message..."
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
