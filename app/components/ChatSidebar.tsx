'use client';

import { useState } from 'react';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  sidebarOpen: boolean;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  sidebarOpen,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    (conv.title || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed left-0 top-[120px] h-full w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
      </div>

      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 mb-3"
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
            className="text-gray-600"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="text-gray-700">New Chat</span>
        </button>

        <div className="relative mb-4">
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
            className="absolute left-3 top-3 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="px-4">
        {filteredConversations.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Recent</p>
            <div className="space-y-1">
              {filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
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
  );
}
