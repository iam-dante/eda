// import React from "react";
// import ReactMarkdown from "react-markdown";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// interface MarkdownRendererProps {
//   content: string;
// }

// // Add type for the code component props
// interface CodeProps {
//   inline?: boolean;
//   className?: string;
//   children: React.ReactNode;
//   [key: string]: any;
// }

// const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
//   return (
//     <div className="markdown-content">
//       <ReactMarkdown
//         components={{
//           code({ node, inline, className, children, ...props }:CodeProps) {
//             const match = /language-(\w+)/.exec(className || "");

//             if (!inline && match) {
//               return (
//                 <div className="relative my-2">
//                   <div className="absolute right-2 top-2 text-xs text-gray-400">
//                     {match[1]}
//                   </div>
//                   <SyntaxHighlighter
//                     {...props}
//                     style={oneDark}
//                     language={match[1]}
//                     PreTag="div"
//                     className="rounded-md"
//                     customStyle={{
//                       fontSize: "0.75rem", // Smaller font size
//                       padding: "0.75rem", // Reduced padding
//                       margin: "0.5rem 0", // Reduced margin
//                       lineHeight: "1.2", // Tighter line height
//                     }}
//                     codeTagProps={{
//                       style: {
//                         fontSize: "0.75rem", // Ensuring consistent font size
//                         lineHeight: "1.2",
//                       },
//                     }}
//                   >
//                     {String(children).replace(/\n$/, "")}
//                   </SyntaxHighlighter>
//                 </div>
//               );
//             }

//             return (
//               <code
//                 className="bg-gray-100 rounded px-1 py-0.5 text-xs"
//                 {...props}
//               >
//                 {children}
//               </code>
//             );
//           },
//           p: ({ children }) => (
//             <p className="text-sm leading-relaxed my-2">{children}</p>
//           ),
//           h1: ({ children }) => (
//             <h1 className="text-xl font-bold my-3">{children}</h1>
//           ),
//           h2: ({ children }) => (
//             <h2 className="text-lg font-semibold my-2">{children}</h2>
//           ),
//           ul: ({ children }) => (
//             <ul className="list-disc pl-4 my-2">{children}</ul>
//           ),
//           li: ({ children }) => <li className="text-sm my-1">{children}</li>,
//         }}
//       >
//         {content}
//       </ReactMarkdown>
//     </div>
//   );
// };

// export default MarkdownRenderer;

import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const components = {
    code({ node, className, children, ...props }:any) {
      const hasLanguage = /language-\w+/.test(className || "");
      return hasLanguage ? (
        <div className="relative my-2">
          <div className="absolute right-2 top-2 text-xs text-gray-400">
            {className.replace("language-", "")}
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={className.replace("language-", "")}
            PreTag="div"
            className="rounded-md"
            customStyle={{
              fontSize: "0.75rem",
              padding: "0.75rem",
              margin: "0.5rem 0",
              lineHeight: "1.2",
            }}
            codeTagProps={{
              style: {
                fontSize: "0.75rem",
                lineHeight: "1.2",
              },
            }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-100 rounded px-1 py-0.5 text-xs" {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }:any) => (
      <p className="text-sm leading-relaxed my-2">{children}</p>
    ),
    h1: ({ children }:any) => (
      <h1 className="text-xl font-bold my-3">{children}</h1>
    ),
    h2: ({ children }:any) => (
      <h2 className="text-lg font-semibold my-2">{children}</h2>
    ),
    ul: ({ children }:any) => <ul className="list-disc pl-4 my-2">{children}</ul>,
    li: ({ children }:any) => <li className="text-sm my-1">{children}</li>,
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
