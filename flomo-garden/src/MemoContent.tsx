import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import './MemoContent.css';

interface MemoContentProps {
  content: string;
}

export const MemoContent: React.FC<MemoContentProps> = ({ content }) => {
  return (
    <div className="memo-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
        // Custom link renderer to open external links in new tab
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
        // Custom code block renderer
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <div className="code-block-wrapper">
              <div className="code-language">{match[1]}</div>
              <code className={className} {...props}>
                {children}
              </code>
            </div>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // Custom blockquote renderer
        blockquote: ({ node, ...props }) => (
          <blockquote className="memo-blockquote" {...props} />
        ),
        // Custom table renderer
        table: ({ node, ...props }) => (
          <div className="table-wrapper">
            <table {...props} />
          </div>
        ),
        // Custom image renderer
        img: ({ node, ...props }) => (
          <img className="memo-image" loading="lazy" {...props} />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};