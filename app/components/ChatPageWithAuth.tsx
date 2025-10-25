'use client';

import { ChatContainer } from './ChatContainer';
import { AuthWrapper } from './AuthWrapper';

/**
 * Chat page component with authentication wrapper
 * Handles auth state and delegates rendering to ChatContainer
 */
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

        return <ChatContainer user={user} />;
      }}
    </AuthWrapper>
  );
}
