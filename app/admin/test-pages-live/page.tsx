import { getTemplatePages } from "@/app/actions/template-pages";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin-ui/card";

export const dynamic = "force-dynamic";

export default async function TestPagesLivePage() {
  const result = await getTemplatePages();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AdminBreadcrumb sectionName="Test Pages Live" />

      <Card>
        <CardHeader>
          <CardTitle>Pages from Project Tree</CardTitle>
          <CardDescription>
            Pages discovered by scanning the file system (not from database)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result.success ? (
            <div className="text-red-500">
              <p>Error: {result.error || "Failed to fetch pages"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Found {result.pages?.length || 0} pages
              </div>
              <div className="space-y-2">
                {result.pages && result.pages.length > 0 ? (
                  result.pages.map((page) => (
                    <div
                      key={page.id}
                      className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{page.path}</div>
                          <div className="text-sm text-muted-foreground mt-1">{page.title}</div>
                          {page.dev_instructions && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {page.dev_instructions}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 text-xs text-muted-foreground space-y-1">
                          <div>ID: {page.id}</div>
                          {page.requires_login && (
                            <div className="text-orange-500">Requires Login</div>
                          )}
                          {page.preview_image && <div>Has Preview</div>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No pages found</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
