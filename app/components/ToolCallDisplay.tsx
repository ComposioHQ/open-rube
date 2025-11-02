'use client';

import { useState } from 'react';

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'running' | 'completed' | 'error';
}

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    if (toolCall.status === 'running') {
      return (
        <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    if (toolCall.status === 'completed') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (toolCall.status === 'running') return 'Running';
    if (toolCall.status === 'completed') return 'Completed';
    return 'Error';
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 my-2 max-w-2xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900 text-sm">
            {toolCall.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            toolCall.status === 'running' ? 'bg-blue-100 text-blue-700' :
            toolCall.status === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {getStatusText()}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 text-xs">
          {/* Arguments */}
          <div>
            <div className="font-semibold text-gray-700 mb-1">ARGS:</div>
            <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto text-gray-800">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {toolCall.output !== undefined && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">RESULT:</div>
              <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto text-gray-800 max-h-64 overflow-y-auto">
                {typeof toolCall.output === 'string'
                  ? toolCall.output
                  : JSON.stringify(toolCall.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
