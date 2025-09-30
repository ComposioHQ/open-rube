'use client';

import { useState, useEffect, useRef } from 'react';
import { RubeGraphic } from './RubeGraphic';
import { MessageInput } from './MessageInput';
import { AuthWrapper } from './AuthWrapper';
import { createClient } from '@/app/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

function ChatPageContent({ user }: { user: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'assistant',
          timestamp: new Date(msg.created_at)
        }));
        setMessages(formattedMessages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const [streamingContent, setStreamingContent] = useState('');
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change or streaming content updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Prepare messages for the chat API (include conversation history)
      const chatMessages = [...messages, userMessage].map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Call the streaming chat API
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

      // Get conversation ID from headers
      const newConversationId = chatResponse.headers.get('X-Conversation-Id');
      if (!currentConversationId && newConversationId) {
        setCurrentConversationId(newConversationId);
        loadConversations(); // Refresh conversations list
      }

      // Handle streaming response
      const reader = chatResponse.body?.getReader();
      const decoder = new TextDecoder();
      const streamingId = (Date.now() + 1).toString();
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

      // Add the complete message
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
        id: (Date.now() + 1).toString(),
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
      <div className={`fixed left-0 top-[120px] h-full w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
        </div>
        
        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 mb-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span className="text-gray-700">New Chat</span>
          </button>
          
          <div className="relative mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 text-gray-400">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="px-4">
          {conversations.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Recent</p>
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    onClick={() => loadConversationMessages(conversation.id)}
                    className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${
                      currentConversationId === conversation.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-700 truncate">
                      {conversation.title || 'Untitled Chat'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'ml-80' : 'ml-0'
      }`}>
        {/* Sidebar toggle button */}
        <div className="p-6 pb-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <line x1="9" x2="9" y1="3" y2="21"/>
            </svg>
          </button>
        </div>

        {/* Welcome screen or chat messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showWelcomeScreen ? (
            <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-8">
              <div className="max-w-3xl w-full text-center">
                <h1 className="mb-8 sm:mb-16 font-flecha text-xl sm:text-4xl text-neutral-600" style={{ fontWeight: 900, textShadow: '0 0 1px currentColor' }}>
                  Get <span className="animated-gradient px-1 font-medium italic tracking-tight">something</span> <br className="block md:hidden" />done today!
                </h1>
                
                {/* Input bar in center for welcome screen */}
                <div className="max-w-2xl mx-auto mb-6 sm:mb-10">
                  <MessageInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSendMessage={handleSendMessage}
                    placeholder="hi"
                    isLoading={isLoading}
                  />
                </div>

                <div className="usecase-container px-2">
                  <button onClick={() => handleSendMessage("What's the latest in Slack?")} className="usecase-card justify-start">
                    <span>What's the latest in Slack?</span>
                    <img src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/slack.svg" alt="Slack" className="h-6 w-6 rounded object-contain" />
                  </button>
                  <button onClick={() => handleSendMessage("Look at Github PRs and update Linear")} className="usecase-card justify-start">
                    <span>Look at Github PRs and update Linear</span>
                    <div className="flex items-center gap-1">
                      <img src="https://logos.composio.dev/api/github" alt="GitHub" className="h-5 w-5 rounded object-contain flex-shrink-0" />
                      <img src="https://logos.composio.dev/api/linear" alt="Linear" className="h-5 w-5 rounded object-contain flex-shrink-0" />
                    </div>
                  </button>
                  <button onClick={() => handleSendMessage("Get urgent items from my inbox")} className="usecase-card justify-start">
                    <span>Get urgent items from my inbox</span>
                    <img src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg" alt="Gmail" className="h-7 w-7 rounded object-contain" />
                  </button>
                  <button onClick={() => handleSendMessage("Find an empty slot and schedule event")} className="usecase-card justify-start">
                    <span>Find an empty slot and schedule event</span>
                    <img src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/google-calendar.svg" alt="Calendar" className="h-7 w-7 rounded object-contain" />
                  </button>
                  <button onClick={() => handleSendMessage("Analyze competitors on Reddit")} className="usecase-card justify-start">
                    <span>Analyze competitors on Reddit</span>
                    <img src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/reddit.svg" alt="Reddit" className="h-7 w-7 rounded object-contain" />
                  </button>
                  <button onClick={() => handleSendMessage("Discover more usecases")} className="usecase-card justify-start">
                    <span>Discover more usecases</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M5 12h14"/>
                      <path d="m12 5 7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'bg-stone-200 text-black' : 'text-black'} rounded-lg p-3`} style={message.sender === 'assistant' ? { backgroundColor: '#fcfaf9' } : {}}>
                      {message.sender === 'assistant' ? (
                        <div className="prose prose-sm max-w-none text-black prose-headings:text-black prose-strong:text-black prose-code:text-black prose-pre:bg-gray-100">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                            pre: ({ children, ...props }) => (
                              <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm" {...props}>
                                {children}
                              </pre>
                            ),
                            code: ({ children, className, ...props }) => {
                              const isInline = !className;
                              if (isInline) {
                                return (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            h1: ({ children, ...props }) => (
                              <h1 className="text-lg font-bold mb-2 text-black" {...props}>
                                {children}
                              </h1>
                            ),
                            h2: ({ children, ...props }) => (
                              <h2 className="text-base font-semibold mb-2 text-black" {...props}>
                                {children}
                              </h2>
                            ),
                            ul: ({ children, ...props }) => (
                              <ul className="list-disc list-inside space-y-1" {...props}>
                                {children}
                              </ul>
                            ),
                            ol: ({ children, ...props }) => (
                              <ol className="list-decimal list-inside space-y-1" {...props}>
                                {children}
                              </ol>
                            ),
                            a: ({ children, href, ...props }) => (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline text-blue-600 hover:text-blue-800" 
                                {...props}
                              >
                                {children}
                              </a>
                            ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show streaming content */}
                {currentStreamingId && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] text-black rounded-lg p-3" style={{ backgroundColor: '#fcfaf9' }}>
                      <div className="prose prose-sm max-w-none text-black prose-headings:text-black prose-strong:text-black prose-code:text-black prose-pre:bg-gray-100">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                          pre: ({ children, ...props }) => (
                            <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm" {...props}>
                              {children}
                            </pre>
                          ),
                          code: ({ children, className, ...props }) => {
                            const isInline = !className;
                            if (isInline) {
                              return (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                          h1: ({ children, ...props }) => (
                            <h1 className="text-lg font-bold mb-2 text-black" {...props}>
                              {children}
                            </h1>
                          ),
                          h2: ({ children, ...props }) => (
                            <h2 className="text-base font-semibold mb-2 text-black" {...props}>
                              {children}
                            </h2>
                          ),
                          ul: ({ children, ...props }) => (
                            <ul className="list-disc list-inside space-y-1" {...props}>
                              {children}
                            </ul>
                          ),
                          ol: ({ children, ...props }) => (
                            <ol className="list-decimal list-inside space-y-1" {...props}>
                              {children}
                            </ol>
                          ),
                          a: ({ children, href, ...props }) => (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="underline text-blue-600 hover:text-blue-800" 
                              {...props}
                            >
                              {children}
                            </a>
                          ),
                          }}
                        >
                          {streamingContent}
                        </ReactMarkdown>
                      </div>
                      <div className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></div>
                    </div>
                  </div>
                )}
                
                {isLoading && !currentStreamingId && (
                  <div className="flex justify-start">
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#fcfaf9' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 animate-pulse">
                          <RubeGraphic />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>
            </div>
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

export function ChatPage() {
  return (
    <AuthWrapper>
      {(user, loading) => {
        if (loading) {
          return (
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#fcfaf9' }}>
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
          );
        }

        if (!user) {
          return (
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#fcfaf9' }}>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to continue</h2>
                <a 
                  href="/auth" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700"
                >
                  Sign In
                </a>
              </div>
            </div>
          );
        }

        return <ChatPageContent user={user} />;
      }}
    </AuthWrapper>
  );
}