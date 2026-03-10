import { ReactNode } from "react";
import { PageHeader } from "@/components/pages/PageHeader";
import { HeroSection } from "@/components/sections/HeroSection";
import { AdminIframes } from "@/components/admin/AdminIframes";
import type { CurrentUserWithRoles } from "@/lib/auth/permissions";

interface MainPageTemplateProps {
  currentUser: CurrentUserWithRoles | null;
  appName: string;
  appLogoUrl?: string | null;
  heroTitle?: string;
  heroSubtitle?: string;
  heroPrimaryCta?: string;
  heroSecondaryCta?: string;
  heroPrimaryCtaHref?: string;
  heroSecondaryCtaHref?: string;
  children: ReactNode;
}

export function MainPageTemplate({
  currentUser,
  appName,
  appLogoUrl,
  heroTitle,
  heroSubtitle,
  heroPrimaryCta,
  heroSecondaryCta,
  heroPrimaryCtaHref,
  heroSecondaryCtaHref,
  children,
}: MainPageTemplateProps) {
  return (
    <AdminIframes>
      <PageHeader
        currentUser={currentUser}
        appName={appName}
        appLogoUrl={appLogoUrl || undefined}
      />

      <main>
        {heroTitle && (
          <HeroSection
            title={heroTitle}
            subtitle={heroSubtitle}
            primaryCta={heroPrimaryCta}
            secondaryCta={heroSecondaryCta}
            primaryCtaHref={heroPrimaryCtaHref}
            secondaryCtaHref={heroSecondaryCtaHref}
          />
        )}

        {children}
      </main>
    </AdminIframes>
  );
}
