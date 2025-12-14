import { getCurrentUser } from "@/lib/auth/permissions";
import { MainPageTemplate } from "@/components/templates/MainPageTemplate";
import {
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
  TeamSection,
} from "@/components/sections";
import { getAppSettings } from "@/app/actions/app-settings";
import { checkAdminExists } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

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

  // Get current user for header (signed in or unsigned)
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();

  return (
    <MainPageTemplate
      currentUser={currentUser}
      appName={appSettings.appName}
      appLogoUrl={appSettings.appLogoUrl}
      heroTitle="Build Something Amazing"
      heroSubtitle="Your Next.js starter template with authentication, admin dashboard, and role-based access control. Ready to customize and deploy."
      heroPrimaryCta="Get Started"
      heroSecondaryCta="Learn More"
      heroPrimaryCtaHref="/auth/signup"
      heroSecondaryCtaHref="/about"
    >
      <FeaturesSection
        title="Everything You Need to Build"
        subtitle="A production-ready foundation with modern tools and best practices built-in."
      />

      <TestimonialsSection
        title="What Developers Say"
        subtitle="Trusted by developers building amazing products"
      />

      <PricingSection
        title="Simple, Transparent Pricing"
        subtitle="Choose the plan that's right for your project. All plans include the complete starter template."
      />

      <TeamSection title="Our Team" subtitle="Meet the people building amazing products" />
    </MainPageTemplate>
  );
}
