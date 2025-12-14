import { Card, CardContent } from "@/components/admin-ui/card";
import { CopyPathButton } from "@/components/pages/CopyPathButton";

interface PagePlaceholderProps {
  pageName: string;
  pagePath: string;
}

export function PagePlaceholder({ pageName, pagePath }: PagePlaceholderProps) {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-6">
      <Card className="border-2 border-dashed border-muted-foreground/25">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold mb-4">This is the {pageName} placeholder page</h2>
          <p className="text-muted-foreground mb-6">
            You can now ask your agent to build anything on this page referring to it as the page
            path in the chat.
          </p>

          <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-md p-3 border">
            <code className="text-sm font-mono">{pagePath}</code>
            <CopyPathButton path={pagePath} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
