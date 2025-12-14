import { getCurrentUser } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import { AppAdminHero } from "@/components/sections/AppAdminHero";
import { FileText, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for our application",
  openGraph: {
    title: "Terms of Service",
    description: "Terms of Service for our application",
  },
};

export default async function TermsOfServicePage() {
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();

  return (
    <AdminIframes>
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
      />

      <main className="pt-[74px]">
        <AppAdminHero
          title="Terms of Service"
          subtitle="Please read these terms carefully before using our service."
          icon={<FileText className="h-6 w-6 text-primary" />}
        />

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Alert className="mb-8 border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This is mock content for development purposes only.
                  Builders must create their own Terms of Service document that complies with
                  applicable laws and regulations in their jurisdiction. This content should not be
                  used in production.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground">
                          By accessing and using this service, you accept and agree to be bound by
                          the terms and provision of this agreement. If you do not agree to abide by
                          the above, please do not use this service.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
                        <p className="text-muted-foreground mb-4">
                          Permission is granted to temporarily use this service for personal,
                          non-commercial transitory viewing only. This is the grant of a license,
                          not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          <li>Modify or copy the materials</li>
                          <li>
                            Use the materials for any commercial purpose or for any public display
                          </li>
                          <li>Attempt to reverse engineer any software contained in the service</li>
                          <li>
                            Remove any copyright or other proprietary notations from the materials
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                        <p className="text-muted-foreground">
                          When you create an account with us, you must provide information that is
                          accurate, complete, and current at all times. You are responsible for
                          safeguarding the password and for all activities that occur under your
                          account. You agree not to disclose your password to any third party.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">4. Content</h2>
                        <p className="text-muted-foreground">
                          Our service allows you to post, link, store, share and otherwise make
                          available certain information, text, graphics, or other material. You are
                          responsible for the content that you post on or through the service,
                          including its legality, reliability, and appropriateness.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">5. Prohibited Uses</h2>
                        <p className="text-muted-foreground mb-4">You may not use our service:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          <li>
                            In any way that violates any applicable national or international law or
                            regulation
                          </li>
                          <li>
                            To transmit, or procure the sending of, any advertising or promotional
                            material
                          </li>
                          <li>
                            To impersonate or attempt to impersonate the company, a company
                            employee, another user, or any other person or entity
                          </li>
                          <li>
                            In any way that infringes upon the rights of others, or in any way is
                            illegal, threatening, fraudulent, or harmful
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">6. Termination</h2>
                        <p className="text-muted-foreground">
                          We may terminate or suspend your account and bar access to the service
                          immediately, without prior notice or liability, under our sole discretion,
                          for any reason whatsoever and without limitation, including but not
                          limited to a breach of the Terms.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">7. Disclaimer</h2>
                        <p className="text-muted-foreground">
                          The information on this service is provided on an "as is" basis. To the
                          fullest extent permitted by law, this company excludes all
                          representations, warranties, and conditions relating to our service and
                          the use of this service.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
                        <p className="text-muted-foreground">
                          In no event shall the company, nor its directors, employees, partners,
                          agents, suppliers, or affiliates, be liable for any indirect, incidental,
                          special, consequential, or punitive damages, including without limitation,
                          loss of profits, data, use, goodwill, or other intangible losses.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">9. Governing Law</h2>
                        <p className="text-muted-foreground">
                          These Terms shall be interpreted and governed by the laws of the
                          jurisdiction in which the company operates, without regard to its conflict
                          of law provisions.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
                        <p className="text-muted-foreground">
                          We reserve the right, at our sole discretion, to modify or replace these
                          Terms at any time. If a revision is material, we will provide at least 30
                          days notice prior to any new terms taking effect.
                        </p>
                      </div>

                      <div className="pt-8 border-t">
                        <p className="text-sm text-muted-foreground">
                          Last updated:{" "}
                          {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PageFooterExtended appName={appSettings.appName} appLogoUrl={appSettings.appLogoUrl} />
    </AdminIframes>
  );
}
