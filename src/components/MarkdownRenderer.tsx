import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

const CodeBlock = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  // Extract language from className (format: language-xxx)
  const language = className
    ? className.replace("language-", "")
    : "javascript";

  return (
    <div className="relative my-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-1.5">
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
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: 1.5,
          borderRadius: 0,
        }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUser = false,
}) => {
  const components: Partial<Components> = {
    code({ node, className, children, ...props }: any) {
      const hasLanguage = /language-\w+/.test(className || "");
      return hasLanguage ? (
        <CodeBlock className={className}>{String(children)}</CodeBlock>
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
      <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-4">
        {children}
      </p>
    ),
    h1: ({ children, ...props }) => (
      <h1
        className="text-3xl font-semibold text-gray-900 dark:text-white mt-6 mb-2"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-2xl font-semibold text-gray-900 dark:text-white mt-6 mb-2"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5
        className="text-base font-semibold text-gray-900 dark:text-white mt-6 mb-2"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6
        className="text-sm font-semibold text-gray-900 dark:text-white mt-6 mb-2"
        {...props}
      >
        {children}
      </h6>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc pl-5 my-4 text-gray-800 dark:text-gray-200"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal pl-5 my-4 text-gray-800 dark:text-gray-200"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-base py-1 mb-1" {...props}>
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
      <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-6 border-gray-200 dark:border-gray-700" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
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
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
        {children}
      </td>
    ),
    // img: ({ src, alt }) => (
    //   <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-4" />
    // ),
    strong: ({ children, ...props }) => (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    ),
  };

  return (
    <div
      className={`markdown-content ${
        isUser ? "user" : "assistant"
      } py-2`}
    >
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Memoized version to prevent unnecessary re-renders
export const MemoizedMarkdownRenderer = memo(
  MarkdownRenderer,
  (prevProps, nextProps) =>
    prevProps.content === nextProps.content &&
    prevProps.isUser === nextProps.isUser
);

export default MarkdownRenderer;
