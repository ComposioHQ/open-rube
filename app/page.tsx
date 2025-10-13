'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RubeGraphic } from './components/RubeGraphic';
import { Navigation } from './components/Navigation';
import { ChatPage } from './components/ChatPageWithAuth';
import { AppsPage } from './components/AppsPageWithAuth';
import { AuthWrapper } from './components/AuthWrapper';
import { UserMenu } from './components/UserMenu';

function HomeContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['chat', 'apps', 'activity', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatPage />;
      case 'apps':
        return <AppsPage />;
      case 'activity':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Activity Logs</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">Your activity logs will appear here.</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">Settings options will appear here.</p>
              </div>
            </div>
          </div>
        );
      default:
        return <ChatPage />;
    }
  };

  return (
    <AuthWrapper>
      {(user, loading) => (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fcfaf9' }}>
          <header className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-3 text-black">
                <RubeGraphic />
                <span className="text-xl font-semibold text-gray-900">Rube</span>
              </div>
              {user && <UserMenu user={user} />}
            </div>
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          </header>
          
          <main className="flex-1 flex flex-col">
            {renderContent()}
          </main>
        </div>
      )}
    </AuthWrapper>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcfaf9' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
