import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const htmlContent = React.useMemo(() => {
    if (!content) return '';
    
    try {
      // Convert markdown to HTML and sanitize it
      const rawHtml = marked(content);
      
      // Configure DOMPurify for clean HTML
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'u', 'i', 'b',
          'ul', 'ol', 'li',
          'blockquote', 'code', 'pre',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'a', 'img',
          'span'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title',
          'class'
        ]
      });
      
      return cleanHtml;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return '<p>Error rendering markdown content</p>';
    }
  }, [content]);

  return (
    <div 
      className="markdown-content prose prose-slate max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};