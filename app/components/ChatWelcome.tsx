'use client';

import { MessageInput } from './MessageInput';

interface ChatWelcomeProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatWelcome({
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
}: ChatWelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-8">
      <div className="max-w-3xl w-full text-center">
        <h1
          className="mb-8 sm:mb-16 font-flecha text-xl sm:text-4xl text-neutral-600"
          style={{ fontWeight: 900, textShadow: '0 0 1px currentColor' }}
        >
          Get <span className="animated-gradient px-1 font-medium italic tracking-tight">something</span>{' '}
          <br className="block md:hidden" />
          done today!
        </h1>

        {/* Input bar in center for welcome screen */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-10">
          <MessageInput
            value={inputValue}
            onChange={onInputChange}
            onSendMessage={onSendMessage}
            placeholder="hi"
            isLoading={isLoading}
          />
        </div>

        <div className="usecase-container px-2">
          <button
            onClick={() => onSendMessage("What's the latest in Slack?")}
            className="usecase-card justify-start"
          >
            <span>What&apos;s the latest in Slack?</span>
            <img
              src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/slack.svg"
              alt="Slack"
              className="h-6 w-6 rounded object-contain"
            />
          </button>
          <button
            onClick={() => onSendMessage('Look at Github PRs and update Linear')}
            className="usecase-card justify-start"
          >
            <span>Look at Github PRs and update Linear</span>
            <div className="flex items-center gap-1">
              <img
                src="https://logos.composio.dev/api/github"
                alt="GitHub"
                className="h-5 w-5 rounded object-contain flex-shrink-0"
              />
              <img
                src="https://logos.composio.dev/api/linear"
                alt="Linear"
                className="h-5 w-5 rounded object-contain flex-shrink-0"
              />
            </div>
          </button>
          <button
            onClick={() => onSendMessage('Get urgent items from my inbox')}
            className="usecase-card justify-start"
          >
            <span>Get urgent items from my inbox</span>
            <img
              src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg"
              alt="Gmail"
              className="h-7 w-7 rounded object-contain"
            />
          </button>
          <button
            onClick={() => onSendMessage('Find an empty slot and schedule event')}
            className="usecase-card justify-start"
          >
            <span>Find an empty slot and schedule event</span>
            <img
              src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/google-calendar.svg"
              alt="Calendar"
              className="h-7 w-7 rounded object-contain"
            />
          </button>
          <button
            onClick={() => onSendMessage('Analyze competitors on Reddit')}
            className="usecase-card justify-start"
          >
            <span>Analyze competitors on Reddit</span>
            <img
              src="https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/reddit.svg"
              alt="Reddit"
              className="h-7 w-7 rounded object-contain"
            />
          </button>
          <button
            onClick={() => onSendMessage('Discover more usecases')}
            className="usecase-card justify-start"
          >
            <span>Discover more usecases</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
