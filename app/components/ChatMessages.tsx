'use client';

import { useRef, useEffect } from 'react';
import { MarkdownContent } from './MarkdownContent';
import { ToolCallDisplay } from './ToolCallDisplay';
import { OAuthInputModal } from './OAuthInputModal';

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'running' | 'completed' | 'error';
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  toolCalls?: ToolCall[];
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  streamingToolCalls?: ToolCall[];
  onOAuthInputSubmit?: (values: Record<string, string>) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  streamingContent,
  streamingToolCalls = [],
  onOAuthInputSubmit,
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
        {messages.map(message => {
          // Check if this message has a REQUEST_USER_INPUT tool call
          const userInputTool = message.toolCalls?.find(
            tool => tool.name === 'REQUEST_USER_INPUT'
          );

          return (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`${message.sender === 'user' ? 'max-w-[80%]' : 'w-full max-w-3xl'}`}>
                {/* Tool calls (for assistant messages) - hide REQUEST_USER_INPUT */}
                {message.sender === 'assistant' && message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mb-2">
                    {message.toolCalls
                      .filter(toolCall => toolCall.name !== 'REQUEST_USER_INPUT')
                      .map(toolCall => (
                        <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
                      ))}
                  </div>
                )}

                {/* Message content */}
                <div
                  className={`${
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

                {/* Inline OAuth Input Form - show if REQUEST_USER_INPUT was called */}
                {message.sender === 'assistant' && userInputTool && onOAuthInputSubmit && (
                  <OAuthInputModal
                    provider={(userInputTool.input.provider as string) || 'Service'}
                    fields={(userInputTool.input.fields as Array<{
                      name: string;
                      label: string;
                      type?: string;
                      required?: boolean;
                      placeholder?: string;
                    }>) || []}
                    logoUrl={userInputTool.input.logoUrl as string | undefined}
                    onSubmit={onOAuthInputSubmit}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Show streaming content or loading */}
        {isLoading && (() => {
          // Check if streaming has a REQUEST_USER_INPUT tool call
          const streamingUserInputTool = streamingToolCalls.find(
            tool => tool.name === 'REQUEST_USER_INPUT'
          );

          return (
            <div className="flex justify-start">
              <div className="w-full max-w-3xl">
                {/* Streaming tool calls - hide REQUEST_USER_INPUT */}
                {streamingToolCalls.length > 0 && (
                  <div className="mb-2">
                    {streamingToolCalls
                      .filter(toolCall => toolCall.name !== 'REQUEST_USER_INPUT')
                      .map(toolCall => (
                        <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
                      ))}
                  </div>
                )}

                {/* Streaming text content */}
                {streamingContent && (
                  <div className="text-black rounded-lg p-3" style={{ backgroundColor: '#fcfaf9' }}>
                    <div>
                      <MarkdownContent content={streamingContent} />
                    </div>
                    <div className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></div>
                  </div>
                )}

                {/* Inline OAuth Input Form - show if REQUEST_USER_INPUT is in streaming */}
                {streamingUserInputTool && onOAuthInputSubmit && (
                  <OAuthInputModal
                    provider={(streamingUserInputTool.input.provider as string) || 'Service'}
                    fields={(streamingUserInputTool.input.fields as Array<{
                      name: string;
                      label: string;
                      type?: string;
                      required?: boolean;
                      placeholder?: string;
                    }>) || []}
                    logoUrl={streamingUserInputTool.input.logoUrl as string | undefined}
                    onSubmit={onOAuthInputSubmit}
                  />
                )}

                {/* Loading indicator - only show if no content yet */}
                {!streamingContent && streamingToolCalls.length === 0 && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: '#fcfaf9' }}>
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
                )}
              </div>
            </div>
          );
        })()}

        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
