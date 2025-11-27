/**
 * MDX Components
 * Custom component mappings for MDX content
 */

import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CodeBlock } from "./code-block";
import { ZoomableImage } from "./zoomable-image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Steps, Step } from "./steps";

/**
 * Custom components available in MDX files
 */
export const customComponents = {
  Card: ({
    title,
    description,
    children,
    ...props
  }: {
    title?: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <Card {...props}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  ),

  Callout: ({
    type = "info",
    children,
  }: {
    type?: "info" | "warning" | "error" | "success";
    children: React.ReactNode;
  }) => {
    const typeStyles = {
      info: "border-blue-500",
      warning: "border-yellow-500",
      error: "border-red-500",
      success: "border-green-500",
    };

    return (
      <Alert className={`my-6 ${typeStyles[type]}`}>
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    );
  },

  // Tabbed content
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,

  // Step-by-step guides
  Steps,
  Step,

  // Zoomable images
  ZoomableImage,
};

/**
 * MDX component mappings
 * Maps standard HTML elements to styled components
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ children, ...props }) => (
      <h1
        className="mt-8 mb-6 scroll-m-20 text-4xl font-bold tracking-tight first:mt-0"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="mt-10 mb-4 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="mt-8 mb-3 scroll-m-20 text-2xl font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="mt-6 mb-2 scroll-m-20 text-xl font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h4>
    ),

    // Paragraphs and text
    p: ({ children, ...props }) => (
      <p
        className="text-muted-foreground leading-7 [&:not(:first-child)]:mt-6"
        {...props}
      >
        {children}
      </p>
    ),

    // Links
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      const Component = isExternal ? "a" : Link;

      return (
        <Component
          href={href || "#"}
          className="dark:text-barq-yellow font-medium text-amber-600 hover:underline"
          {...(isExternal && {
            target: "_blank",
            rel: "noopener noreferrer",
          })}
          {...props}
        >
          {children}
        </Component>
      );
    },

    // Lists
    ul: ({ children, ...props }) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-muted-foreground" {...props}>
        {children}
      </li>
    ),

    // Code
    code: ({ children, className, ...props }) => {
      const isInline = !className;

      if (isInline) {
        return (
          <code
            className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
            {...props}
          >
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
    pre: ({ children, ...props }) => (
      <CodeBlock {...props}>{children}</CodeBlock>
    ),

    // Blockquote
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-barq-yellow mt-6 border-l-4 pl-6 italic"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: ({ ...props }) => <hr className="border-border my-8" {...props} />,

    // Table
    table: ({ children, ...props }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="border-border border-b" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => (
      <tr
        className="border-border hover:bg-muted/50 border-b transition-colors"
        {...props}
      >
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" {...props}>
        {children}
      </td>
    ),

    // Custom components
    ...customComponents,

    // Allow component overrides
    ...components,
  };
}
