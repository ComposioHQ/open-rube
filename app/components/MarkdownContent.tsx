'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

/**
 * Reusable component for rendering markdown content with consistent styling
 * Handles code blocks, headings, lists, and links with proper formatting
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="font-inter prose prose-sm max-w-none text-black prose-headings:text-black prose-strong:text-black prose-code:text-black prose-pre:bg-gray-100 prose-a:text-blue-600 prose-a:underline prose-a:font-normal hover:prose-a:text-blue-800">
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
        {content}
      </ReactMarkdown>
    </div>
  );
}
