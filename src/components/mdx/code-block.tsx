"use client";

/**
 * Code Block Component
 * Enhanced code block with copy button and syntax highlighting
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Extract text content from children
    const code = extractTextFromChildren(children);

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="group relative my-6">
      {/* Copy Button */}
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          size="sm"
          variant="ghost"
          className="bg-muted/80 h-8 px-2"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code Block */}
      <pre
        className={`bg-muted overflow-x-auto rounded-lg border p-4 text-sm ${className || ""}`}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}

/**
 * Extract text content from React children (including nested elements)
 */
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join("");
  }

  if (typeof children === "object" && children !== null) {
    const child = children as {
      props?: { children?: React.ReactNode; value?: string };
    };

    // Check for value prop (used by some code elements)
    if (child.props?.value) {
      return child.props.value;
    }

    // Recursively extract from children
    if (child.props?.children) {
      return extractTextFromChildren(child.props.children);
    }
  }

  return "";
}
