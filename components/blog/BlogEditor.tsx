"use client";

import { useCallback, useEffect } from "react";
import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { EditorState, SerializedEditorState } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { Klass, LexicalNode, ParagraphNode, TextNode } from "lexical";
import { editorTheme } from "@/components/editor/themes/editor-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodes, COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from "lexical";
import { $createImageNode, ImageNode } from "./ImageNode";
import { logger } from "@/lib/logger";

// Extended nodes to include lists and images
const nodes: ReadonlyArray<Klass<LexicalNode>> = [
  HeadingNode,
  ParagraphNode,
  TextNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  ImageNode,
];

const editorConfig: InitialConfigType = {
  namespace: "BlogEditor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    logger.error("Lexical editor error", {}, error);
  },
};

// Plugin to handle image pasting
function ImagePastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        // Check if any item is an image
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            event.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;

            // Handle async image upload
            (async () => {
              try {
                // Upload image to API
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/blog/images/upload", {
                  method: "POST",
                  body: formData,
                });

                if (!response.ok) {
                  throw new Error("Failed to upload image");
                }

                const result = await response.json();
                if (!result.success || !result.url) {
                  throw new Error("Upload failed");
                }

                // Insert image node into editor
                editor.update(() => {
                  const imageNode = $createImageNode(result.url, file.name);
                  $insertNodes([imageNode]);
                });
              } catch (error) {
                logger.error(
                  "Failed to upload pasted image",
                  {},
                  error instanceof Error ? error : undefined
                );
                // Show error to user (could use toast here)
                alert("Failed to upload image. Please try again.");
              }
            })();

            return true; // Prevent default paste behavior
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}

interface BlogEditorProps {
  initialContent?: SerializedEditorState;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (serializedState: SerializedEditorState) => void;
  placeholder?: string;
}

export function BlogEditor({
  initialContent,
  onChange,
  onSerializedChange,
  placeholder = "Start writing...",
}: BlogEditorProps) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(initialContent ? { editorState: JSON.stringify(initialContent) } : {}),
        }}
      >
        <TooltipProvider>
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  placeholder={placeholder}
                  className="min-h-[400px] px-4 py-3 focus:outline-none prose prose-sm max-w-none dark:prose-invert"
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <ImagePastePlugin />
            <ListPlugin />
          </div>

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState);
              onSerializedChange?.(editorState.toJSON());
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}
