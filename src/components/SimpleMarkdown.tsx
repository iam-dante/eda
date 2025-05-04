import React, { memo, useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
// We'll import the style when we need it

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

// Dynamic import for SyntaxHighlighter to avoid type conflicts
const SimpleCodeBlock = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  const [SyntaxHighlighterComponent, setSyntaxHighlighterComponent] =
    useState<any>(null);
  const [highlighterStyle, setHighlighterStyle] = useState<any>(null);
  const language = className
    ? className.replace("language-", "")
    : "javascript";

  useEffect(() => {
    // Dynamically import both the component and the style
    const loadComponent = async () => {
      const syntaxModule = await import("react-syntax-highlighter");
      setSyntaxHighlighterComponent(() => syntaxModule.PrismLight);

      // Define a custom style with orange background and syntax colors
      setHighlighterStyle({
        'code[class*="language-"]': {
          color: '#f8f8f2',
          background: 'none',
          textShadow: '0 1px rgba(0, 0, 0, 0.3)',
          fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
          textAlign: 'left',
          whiteSpace: 'pre',
          wordSpacing: 'normal',
          wordBreak: 'normal',
          wordWrap: 'normal',
          lineHeight: '1.5',
          tabSize: 4,
          hyphens: 'none',
        },
        'pre[class*="language-"]': {
          color: '#f8f8f2',
          background: '#ff9800', // Orange background
          textShadow: '0 1px rgba(0, 0, 0, 0.3)',
          fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
          textAlign: 'left',
          whiteSpace: 'pre',
          wordSpacing: 'normal',
          wordBreak: 'normal',
          wordWrap: 'normal',
          lineHeight: '1.5',
          tabSize: 4,
          hyphens: 'none',
          padding: '1em',
          margin: '0.5em 0',
          overflow: 'auto',
          borderRadius: '0.3em',
        },
        ':not(pre) > code[class*="language-"]': {
          background: '#ff9800', // Orange background
          padding: '.1em',
          borderRadius: '.3em',
          whiteSpace: 'normal',
        },
        comment: { color: '#6a9955' },
        prolog: { color: '#6a9955' },
        doctype: { color: '#6a9955' },
        cdata: { color: '#6a9955' },
        punctuation: { color: '#d4d4d4' },
        property: { color: '#9cdcfe' },
        tag: { color: '#569cd6' },
        boolean: { color: '#569cd6' },
        number: { color: '#b5cea8' },
        constant: { color: '#9cdcfe' },
        symbol: { color: '#b5cea8' },
        selector: { color: '#d7ba7d' },
        'attr-name': { color: '#9cdcfe' },
        string: { color: '#ce9178' },
        char: { color: '#ce9178' },
        builtin: { color: '#569cd6' },
        inserted: { color: '#b5cea8' },
        operator: { color: '#d4d4d4' },
        entity: { color: '#9cdcfe', cursor: 'help' },
        url: { color: '#9cdcfe' },
        '.language-css .token.string': { color: '#ce9178' },
        '.style .token.string': { color: '#ce9178' },
        variable: { color: '#9cdcfe' },
        atrule: { color: '#c586c0' },
        'attr-value': { color: '#ce9178' },
        function: { color: '#dcdcaa' },
        keyword: { color: '#569cd6' },
        regex: { color: '#d16969' },
        important: { color: '#569cd6', fontWeight: 'bold' },
        bold: { fontWeight: 'bold' },
        italic: { fontStyle: 'italic' },
      });
    };

    loadComponent();
  }, []);

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {language}
        </span>
        <button
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
          onClick={() => {
            navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
          }}
        >
          Copy
        </button>
      </div>
      <div>
        {SyntaxHighlighterComponent && highlighterStyle ? (
          <SyntaxHighlighterComponent
            language={language}
            style={highlighterStyle}
            customStyle={{
              margin: 0,
              padding: "0.7rem",
              fontSize: "0.875rem",
              lineHeight: 0.1,
              borderRadius: 0,
            }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighterComponent>
        ) : (
          <pre className="p-3 overflow-auto text-sm text-gray-200 bg-gray-800">
            {String(children).replace(/\n$/, "")}
          </pre>
        )}
      </div>
    </div>
  );
};

const SimpleMarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUser = false,
}) => {
  const components: Partial<Components> = {
    code({ node, className, children, ...props }: any) {
      const hasLanguage = /language-\w+/.test(className || "");
      return hasLanguage ? (
        <SimpleCodeBlock className={className}>
          {String(children)}
        </SimpleCodeBlock>
      ) : (
        <code
          className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-gray-800 dark:text-gray-200"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => <>{children}</>,
    p: ({ children }) => (
      <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed ">
        {children}
      </p>
    ),
    h1: ({ children, ...props }) => (
      <h1
        className="text-3xl font-semibold text-gray-900 dark:text-white mt-4 mb-1"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-2xl font-semibold text-gray-900 dark:text-white mt-4 mb-1"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-1"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-1"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5
        className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-1"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6
        className="text-sm font-semibold text-gray-900 dark:text-white mt-4 mb-1"
        {...props}
      >
        {children}
      </h6>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc pl-5 my-1 text-gray-800 dark:text-gray-200"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal pl-5 my-1 text-gray-800 dark:text-gray-200"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-base py-0.5 mb-0.5" {...props}>
        {children}
      </li>
    ),
    a: ({ href, children, ...props }) => (
      <Link
        href={href || "#"}
        className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </Link>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic text-gray-600 dark:text-gray-400 my-2">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-3 border-gray-200 dark:border-gray-700" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </tbody>
    ),
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200">
        {children}
      </td>
    ),
    strong: ({ children, ...props }) => (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    ),
  };

  return (
    <div className={`markdown-content ${isUser ? "user" : "assistant"} py-1`}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Memoized version to prevent unnecessary re-renders
export const MemoizedSimpleMarkdownRenderer = memo(
  SimpleMarkdownRenderer,
  (prevProps, nextProps) =>
    prevProps.content === nextProps.content &&
    prevProps.isUser === nextProps.isUser
);

export default SimpleMarkdownRenderer;