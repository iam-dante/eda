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
    // Dynamically import the component and set the style
    const loadComponent = async () => {
      const syntaxModule = await import("react-syntax-highlighter");
      // Keep PrismLight as used previously
      setSyntaxHighlighterComponent(() => syntaxModule.PrismLight);

      // Define the custom style
      setHighlighterStyle({
        'code[class*="language-"]': {
          color: "#f8f8f2",
          background: "none",
          textShadow: "0 1px rgba(0, 0, 0, 0.3)",
          fontFamily:
            "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
          textAlign: "left",
          whiteSpace: "pre",
          wordSpacing: "normal",
          wordBreak: "normal",
          wordWrap: "normal",
          lineHeight: "1.5",
          tabSize: 4,
          hyphens: "none",
        },
        'pre[class*="language-"]': {
          color: "#f8f8f2",
          background: "#ff9800", // Orange background
          textShadow: "0 1px rgba(0, 0, 0, 0.3)",
          fontFamily:
            "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
          textAlign: "left",
          whiteSpace: "pre",
          wordSpacing: "normal",
          wordBreak: "normal",
          wordWrap: "normal",
          lineHeight: "1.5",
          tabSize: 4,
          hyphens: "none",
          padding: "1em",
          margin: "0.5em 0",
          overflow: "auto",
          borderRadius: "0.3em",
        },
        ':not(pre) > code[class*="language-"]': {
          background: "#ff9800", // Orange background
          padding: ".1em",
          borderRadius: ".3em",
          whiteSpace: "normal",
        },
        comment: { color: "#6a9955" },
        prolog: { color: "#6a9955" },
        doctype: { color: "#6a9955" },
        cdata: { color: "#6a9955" },
        punctuation: { color: "#d4d4d4" },
        property: { color: "#9cdcfe" },
        tag: { color: "#569cd6" },
        boolean: { color: "#569cd6" },
        number: { color: "#b5cea8" },
        constant: { color: "#9cdcfe" },
        symbol: { color: "#b5cea8" },
        selector: { color: "#d7ba7d" },
        "attr-name": { color: "#9cdcfe" },
        string: { color: "#ce9178" },
        char: { color: "#ce9178" },
        builtin: { color: "#569cd6" },
        inserted: { color: "#b5cea8" },
        operator: { color: "#d4d4d4" },
        entity: { color: "#9cdcfe", cursor: "help" },
        url: { color: "#9cdcfe" },
        ".language-css .token.string": { color: "#ce9178" },
        ".style .token.string": { color: "#ce9178" },
        variable: { color: "#9cdcfe" },
        atrule: { color: "#c586c0" },
        "attr-value": { color: "#ce9178" },
        function: { color: "#dcdcaa" },
        keyword: { color: "#569cd6" },
        regex: { color: "#d16969" },
        important: { color: "#569cd6", fontWeight: "bold" },
        bold: { fontWeight: "bold" },
        italic: { fontStyle: "italic" },
      });

      // Removed explicit language imports and registration as requested
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
          // Pass the language and style to the loaded component
          <SyntaxHighlighterComponent
            language={language}
            style={highlighterStyle}
            customStyle={{
              margin: 0,
              padding: "0.7rem",
              fontSize: "0.875rem",
              lineHeight: "1.5", // Adjusted line height for readability
              borderRadius: 0,
            }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighterComponent>
        ) : (
          // Fallback if syntax highlighter not loaded
          <pre className="p-3 overflow-auto text-sm text-white bg-orange-800">
            {String(children).replace(/\n$/, "")}
          </pre>
        )}
      </div>
    </div>
  );
};

// Custom component for fixing list item display
const CustomListItem = ({ children, ...props }: any) => {
  // If the first child is a paragraph, we need to handle it specially
  let modifiedChildren = children;

  if (Array.isArray(children) && children.length > 0) {
    // Check if first element is a <p> tag
    const firstChild = children[0];
    // Check if it's a React element and its type is 'p'
    if (
      React.isValidElement(firstChild) &&
      typeof firstChild.type === "string" &&
      firstChild.type === "p"
    ) {
      // Replace the first paragraph with its contents
      const restChildren = children.slice(1);
      const paragraphContents = React.isValidElement(firstChild)
        ? (firstChild as React.ReactElement).props.children
       : null;
      modifiedChildren = [paragraphContents, ...restChildren];
    }
  }

  return (
    <li className="text-base mb-1" {...props}>
      {modifiedChildren}
    </li>
  );
};

// This function preprocesses the Markdown content, now with awareness of code blocks,
// to fix common list rendering issues, particularly handling streaming text.
const preprocessMarkdown = (content: string): string => {
  const lines = content.split("\n");
  const processedLines: string[] = [];
  let inFencedCodeBlock = false; // State to track if we are inside a fenced code block
  // Note: Handling indentation of fenced code blocks nested in lists precisely is complex
  // without a full markdown parser state. This attempts a basic detection.
  let fencedCodeBlockIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for the start or end of a fenced code block (allowing up to 3 spaces before the fence)
    const fencedCodeMatch = line.match(/^(\s*)(```+|~~~+)\s*(\S*)/); // Capture leading spaces and fence type

    if (fencedCodeMatch) {
      const leadingSpaces = fencedCodeMatch[1];
      const fence = fencedCodeMatch[2];
      const fenceIndent = leadingSpaces.length;

      if (!inFencedCodeBlock) {
        // Starting a fenced code block
        inFencedCodeBlock = true;
        // Store the indent of the opening fence
        fencedCodeBlockIndent = fenceIndent;
        processedLines.push(line); // Add the fence line as is
      } else {
        // Ending a fenced code block
        // A closing fence must have indentation less than or equal to the opening fence
        if (fenceIndent <= fencedCodeBlockIndent) {
          inFencedCodeBlock = false;
          fencedCodeBlockIndent = 0; // Reset indent state
          processedLines.push(line); // Add the closing fence line as is
        } else {
          // This fence is indented more than the opening fence, treat it as part of the code block content
          processedLines.push(line);
        }
      }
      continue; // Skip further processing for fence lines
    }

    if (inFencedCodeBlock) {
      // If inside a fenced code block, add the line as is.
      // Markdown handles indentation within fenced code blocks based on the opening fence.
      processedLines.push(line);
      continue; // Skip further processing for lines inside fences
    }

    // --- Start of List Preprocessing Logic (only if NOT in a code block) ---

    // Check for a line that is just a list marker (possibly with trailing space)
    const markerOnlyMatch = trimmedLine.match(/^(\d+\.|[*+-])\s*$/);

    if (markerOnlyMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const trimmedNextLine = nextLine.trim();

      // If the next line is not empty, not a new list item marker, AND NOT the start of a code fence...
      if (
        trimmedNextLine !== "" &&
        !trimmedNextLine.match(/^(\d+\.|[*+-])/) &&
        // Ensure the next line isn't a code fence start
        !nextLine.match(/^(\s*)(```+|~~~+)\s*(\S*)/)
      ) {
        // Combine the marker and the next line, adding a space.
        // Use original nextLine to preserve its potential leading space if any (though trim was used for check)
        processedLines.push(`${markerOnlyMatch[1]} ${nextLine}`);

        // Process subsequent continuation lines (indent them)
        let j = i + 2;
        while (j < lines.length) {
          const currentContinuationLine = lines[j];
          const trimmedContinuationLine = currentContinuationLine.trim();
          // Stop if blank, new list item, OR A CODE FENCE
          if (
            trimmedContinuationLine === "" ||
            trimmedContinuationLine.match(/^(\d+\.|[*+-])/) ||
            // Stop if the line is a code fence start
            currentContinuationLine.match(/^(\s*)(```+|~~~+)\s*(\S*)/)
          ) {
            break;
          }

          // Add indented continuation line
          processedLines.push(`    ${currentContinuationLine}`);
          j++;
        }
        // Adjust the outer loop index to skip the lines that were just processed as continuations
        i = j - 1;
        continue; // Move to the next outer loop iteration
      }
    }

    // If the line was not a marker-only line handled above, and not a code block line, add it directly.
    processedLines.push(line);

    // --- End of List Preprocessing Logic ---
  }

  // Final pass to catch any remaining cases of marker immediately followed by newline
  // This might be redundant with the line-by-line pass but can serve as a fallback.
  const finalProcessedContent = processedLines.join("\n");
  return finalProcessedContent
    .replace(/^(\d+\.)\s*\n+/gm, "$1 ")
    .replace(/^([*+-])\s*\n+/gm, "$1 ");
};

const SimpleMarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUser = false,
}) => {
  // Preprocess the markdown content to fix list and code block rendering issues
  const processedContent = preprocessMarkdown(content);

  const components: Partial<Components> = {
    code({ node, className, children, ...props }: any) {
      const hasLanguage = /language-\w+/.test(className || "");
      return hasLanguage ? (
        <SimpleCodeBlock className={className}>
          {String(children)}
        </SimpleCodeBlock>
      ) : (
        <code
          className="bg-orange-200 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-gray-800 dark:text-gray-200"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => <>{children}</>,
    p: ({ children }) => (
      <p className="text-gray-800 dark:text-gray-200 text-base mb-2">
        {children}
      </p>
    ),
    h1: ({ children, ...props }) => (
      <h1
        className="text-3xl font-semibold text-gray-900 dark:text-white mt-2 mb-0.5"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-2xl font-semibold text-gray-900 dark:text-white mt-2 mb-0.5"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-xl font-semibold text-gray-900 dark:text-white mt-2 mb-0.5"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="text-lg font-semibold text-gray-900 dark:text-white mt-2 mb-0.5"
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
        className="list-disc pl-5 text-gray-800 dark:text-gray-200 mb-2"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal pl-5 text-gray-800 dark:text-gray-200 mb-2"
        {...props}
      >
        {children}
      </ol>
    ),
    li: CustomListItem,
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
        {processedContent}
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
