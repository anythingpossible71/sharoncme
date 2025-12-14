import { getCurrentUser } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import { AppAdminHero } from "@/components/sections/AppAdminHero";
import { Shield, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for our application",
  openGraph: {
    title: "Privacy Policy",
    description: "Privacy Policy for our application",
  },
};

export default async function PrivacyPolicyPage() {
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
          title="Privacy Policy"
          subtitle="We respect your privacy and are committed to protecting your personal data."
          icon={<Shield className="h-6 w-6 text-primary" />}
        />

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Alert className="mb-8 border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This is mock content for development purposes only.
                  Builders must create their own Privacy Policy document that complies with
                  applicable privacy laws and regulations (such as GDPR, CCPA, etc.) in their
                  jurisdiction. This content should not be used in production.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground">
                          This Privacy Policy describes how we collect, use, and share your personal
                          information when you use our service. We are committed to protecting your
                          privacy and ensuring you have a positive experience on our website and in
                          using our products and services.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                        <p className="text-muted-foreground mb-4">
                          We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          <li>
                            <strong>Account Information:</strong> Name, email address, password, and
                            other information you provide when creating an account
                          </li>
                          <li>
                            <strong>Profile Information:</strong> Additional information you choose
                            to provide in your profile
                          </li>
                          <li>
                            <strong>Usage Information:</strong> Information about how you use our
                            service, including pages visited and features used
                          </li>
                          <li>
                            <strong>Device Information:</strong> IP address, browser type, operating
                            system, and device identifiers
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                        <p className="text-muted-foreground mb-4">
                          We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          <li>Provide, maintain, and improve our services</li>
                          <li>Process transactions and send related information</li>
                          <li>Send technical notices, updates, and support messages</li>
                          <li>Respond to your comments, questions, and requests</li>
                          <li>Monitor and analyze trends, usage, and activities</li>
                          <li>Detect, prevent, and address technical issues</li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
                        <p className="text-muted-foreground mb-4">
                          We do not sell, trade, or rent your personal information to third parties.
                          We may share your information in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          <li>
                            <strong>Service Providers:</strong> With third-party service providers
                            who perform services on our behalf
                          </li>
                          <li>
                            <strong>Legal Requirements:</strong> When required by law or to protect
                            our rights and safety
                          </li>
                          <li>
                            <strong>Business Transfers:</strong> In connection with any merger, sale
                            of company assets, or acquisition
                          </li>
                          <li>
                            <strong>With Your Consent:</strong> When you have given us explicit
                            permission to share your information
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                        <p className="text-muted-foreground">
                          We implement appropriate technical and organizational security measures to
                          protect your personal information against unauthorized access, alteration,
                          disclosure, or destruction. However, no method of transmission over the
                          Internet or electronic storage is 100% secure.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
                        <p className="text-muted-foreground mb-4">
                          Depending on your location, you may have the following rights regarding
                          your personal information:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          <li>
                            <strong>Access:</strong> Request access to your personal information
                          </li>
                          <li>
                            <strong>Correction:</strong> Request correction of inaccurate or
                            incomplete information
                          </li>
                          <li>
                            <strong>Deletion:</strong> Request deletion of your personal information
                          </li>
                          <li>
                            <strong>Objection:</strong> Object to processing of your personal
                            information
                          </li>
                          <li>
                            <strong>Portability:</strong> Request transfer of your personal
                            information
                          </li>
                          <li>
                            <strong>Withdrawal:</strong> Withdraw consent where processing is based
                            on consent
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
                        <p className="text-muted-foreground">
                          We use cookies and similar tracking technologies to track activity on our
                          service and hold certain information. You can instruct your browser to
                          refuse all cookies or to indicate when a cookie is being sent. However, if
                          you do not accept cookies, you may not be able to use some portions of our
                          service.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
                        <p className="text-muted-foreground">
                          Our service is not intended for children under the age of 13. We do not
                          knowingly collect personal information from children under 13. If you are
                          a parent or guardian and believe your child has provided us with personal
                          information, please contact us.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
                        <p className="text-muted-foreground">
                          Your information may be transferred to and maintained on computers located
                          outside of your state, province, country, or other governmental
                          jurisdiction where data protection laws may differ. By using our service,
                          you consent to the transfer of your information to these facilities.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
                        <p className="text-muted-foreground">
                          We may update this Privacy Policy from time to time. We will notify you of
                          any changes by posting the new Privacy Policy on this page and updating
                          the "Last updated" date. You are advised to review this Privacy Policy
                          periodically for any changes.
                        </p>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
                        <p className="text-muted-foreground">
                          If you have any questions about this Privacy Policy, please contact us
                          through our contact page or by email at the address provided on our
                          website.
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
