import { getCurrentUser, isAdmin } from "@/lib/auth/permissions";
import { MainPageTemplate } from "@/components/templates/MainPageTemplate";
import { getAppSettings } from "@/app/actions/app-settings";
import { checkAdminExists } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ContactFormTableWithPagination } from "@/components/admin/ContactFormTableWithPagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow longer-running imports (batched)

// pageDescription: Discover how our platform helps you build amazing products with our comprehensive feature set

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Discover how our platform helps you build amazing products with our comprehensive feature set",
  openGraph: {
    title: "Welcome",
    description:
      "Discover how our platform helps you build amazing products with our comprehensive feature set",
    images: ["/app/(pages)/landing/preview.png"],
  },
};

export default async function Home() {
  // Check if admin exists - if not, redirect to setup
  const adminExists = await checkAdminExists();

  if (!adminExists) {
    redirect("/auth/setup-admin");
  }

  // Get current user - redirect to signin if not signed in
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/signin");
  }
  const appSettings = await getAppSettings();

  // Fetch contact form submissions if user is admin
  let formSubmissions: any[] = [];
  const userIsAdmin = currentUser ? await isAdmin(currentUser.id) : false;
  if (currentUser && userIsAdmin) {
      try {
        const submissions = await prisma.contactSubmission.findMany({
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        });
        // Serialize dates for client component
        formSubmissions = submissions.map((submission: (typeof submissions)[number]) => ({
          ...submission,
          created_at: submission.created_at.toISOString(),
          updated_at: submission.updated_at.toISOString(),
          deleted_at: submission.deleted_at?.toISOString() ?? null,
          birthdate: submission.birthdate?.toISOString() ?? null,
          babyBirthdate: submission.babyBirthdate?.toISOString() ?? null,
        }));
      } catch (error) {
        console.error("Failed to fetch form submissions:", error);
      }
  }

  return (
    <MainPageTemplate
      currentUser={currentUser}
      appName={appSettings.appName}
      appLogoUrl={appSettings.appLogoUrl}
    >
      {currentUser && userIsAdmin && (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Contact Form Submissions</CardTitle>
              </div>
              <CardDescription>
                {formSubmissions.length > 0
                  ? "Click on any row to view the full submission details"
                  : "Import a CSV or wait for form submissions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactFormTableWithPagination submissions={formSubmissions} />
            </CardContent>
          </Card>
        </div>
      )}
    </MainPageTemplate>
  );
}
