'use client';

import { useRef, useEffect } from 'react';
import { RubeGraphic } from './RubeGraphic';
import { MarkdownContent } from './MarkdownContent';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  currentStreamingId: string | null;
}

export function ChatMessages({
  messages,
  isLoading,
  streamingContent,
  currentStreamingId,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                message.sender === 'user' ? 'bg-stone-200 text-black' : 'text-black'
              } rounded-lg p-3`}
              style={message.sender === 'assistant' ? { backgroundColor: '#fcfaf9' } : {}}
            >
              {message.sender === 'assistant' ? (
                <MarkdownContent content={message.content} />
              ) : (
                <p className="font-inter text-sm leading-relaxed">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Show streaming content */}
        {currentStreamingId && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] text-black rounded-lg p-3" style={{ backgroundColor: '#fcfaf9' }}>
              <div>
                <MarkdownContent content={streamingContent} />
              </div>
              <div className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !currentStreamingId && (
          <div className="flex justify-start">
            <div className="rounded-lg p-3" style={{ backgroundColor: '#fcfaf9' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 animate-pulse">
                  <RubeGraphic />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
