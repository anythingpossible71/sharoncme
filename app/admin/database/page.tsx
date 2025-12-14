import { DatabaseViewerPanel } from "@/components/admin/DatabaseViewerPanel";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminDocumentationSection } from "@/components/admin/AdminDocumentationSection";

// Force dynamic rendering for Docker builds
export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Database" />

      <AdminDocumentationSection
        title="Viewing your database"
        description="Your startup project come with a fully functional SQLite database, the most deployed database in the world. Unlike cloud based databases your data base is save locally which means that at any point of time if the AI agent damages you database you can simply restore it from backup. The database provides a full view of all the tables and their records. You use prompts to complete any opration on your database including read, write, wdit ad delete. But If you would like to directly add, remove or eidt table or records your can use a prompt to open the Prisma Studio. see sample prompts below."
        promptExamples={[
          "List all tables in my database",
          "Add a new table called products. For each product save: title, description, price, image url",
          'Add a new user tole labeled "Moderator"',
          "Open Prisma Studio data base editor",
        ]}
      />

      <DatabaseViewerPanel />
    </div>
  );
}
