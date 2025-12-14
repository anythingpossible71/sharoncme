import { getCurrentUser } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooter } from "@/components/pages/PageFooter";
import {
  HeroSection,
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
} from "@/components/sections";
import { getAppSettings } from "@/app/actions/app-settings";
import { checkAdminExists } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

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

export default async function LandingPage() {
  // Check if admin exists - if not, redirect to setup
  const adminExists = await checkAdminExists();

  if (!adminExists) {
    redirect("/auth/setup-admin");
  }

  // Get current user for header (signed in or unsigned)
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
      />

      <main>
        <HeroSection
          title="Build Something Amazing"
          subtitle="Your Next.js starter template with authentication, admin dashboard, and role-based access control. Ready to customize and deploy."
          primaryCta="Get Started"
          secondaryCta="Learn More"
        />

        <TestimonialsSection
          title="What Developers Say"
          subtitle="Trusted by developers building amazing products"
        />

        <PricingSection
          title="Simple, Transparent Pricing"
          subtitle="Choose the plan that's right for your project. All plans include the complete starter template."
        />

        <FeaturesSection
          title="Everything You Need to Build"
          subtitle="A production-ready foundation with modern tools and best practices built-in."
        />
      </main>

      <PageFooter appName={appSettings.appName} />
    </div>
  );
}
