"use client";

import { useMemo } from "react";
import type { SerializedEditorState } from "lexical";

interface BlogPostRendererProps {
  content: string; // Serialized Lexical JSON string
  className?: string;
}

export function BlogPostRenderer({ content, className = "" }: BlogPostRendererProps) {
  const html = useMemo(() => {
    try {
      const editorState: SerializedEditorState = JSON.parse(content);

      // Create a temporary editor state to generate HTML
      // We'll use Lexical's HTML generation utility
      const root = editorState.root;

      // Simple HTML generation from nodes
      let htmlString = "";

      const processNode = (node: any): string => {
        if (!node) return "";

        switch (node.type) {
          case "paragraph":
            const paragraphText =
              node.children?.map((child: any) => processNode(child)).join("") || "";
            return `<p>${paragraphText}</p>`;

          case "text":
            let text = node.text || "";
            if (node.format) {
              if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
              if (node.format & 2) text = `<em>${text}</em>`; // Italic
              if (node.format & 4) text = `<u>${text}</u>`; // Underline
            }
            return text;

          case "heading":
            const headingLevel = node.tag || "h1";
            const headingText =
              node.children?.map((child: any) => processNode(child)).join("") || "";
            return `<${headingLevel}>${headingText}</${headingLevel}>`;

          case "quote":
            const quoteText = node.children?.map((child: any) => processNode(child)).join("") || "";
            return `<blockquote>${quoteText}</blockquote>`;

          case "list":
            const listTag = node.listType === "number" ? "ol" : "ul";
            const listItems = node.children?.map((child: any) => processNode(child)).join("") || "";
            return `<${listTag}>${listItems}</${listTag}>`;

          case "listitem":
            const itemText = node.children?.map((child: any) => processNode(child)).join("") || "";
            return `<li>${itemText}</li>`;

          case "image":
            return `<img src="${node.src || ""}" alt="${node.altText || ""}" class="max-w-full h-auto rounded-lg my-4" style="display: block; margin: 1rem auto;" />`;

          default:
            if (node.children) {
              return node.children.map((child: any) => processNode(child)).join("");
            }
            return "";
        }
      };

      if (root?.children) {
        htmlString = root.children.map((child: any) => processNode(child)).join("");
      }

      return htmlString;
    } catch (error) {
      console.error("Error rendering blog post content:", error);
      return "<p>Error rendering content</p>";
    }
  }, [content]);

  return (
    <div
      className={`prose prose-lg max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
