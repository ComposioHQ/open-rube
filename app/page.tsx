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
    if (tab && ['chat', 'apps'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatPage />;
      case 'apps':
        return <AppsPage />;
      default:
        return <ChatPage />;
    }
  };

  return (
    <AuthWrapper>
      {(user) => (
        <div className="flex flex-col h-screen" style={{ backgroundColor: '#fcfaf9' }}>
          {/* Fixed Header */}
          <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-3 text-black">
                <RubeGraphic />
                <span className="text-xl font-semibold text-gray-900">Rube</span>
              </div>
              {user && <UserMenu user={user} />}
            </div>
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          </header>

          {/* Main content with top padding to account for fixed header */}
          <main className="flex-1 flex flex-col pt-[120px]">
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
