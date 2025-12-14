import { ReactNode } from "react";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { HeroSection } from "@/components/sections/HeroSection";
import { AdminIframes } from "@/components/admin/AdminIframes";
import type { Prisma } from "@prisma/client";

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    profile: true;
    roles: {
      include: {
        role: true;
      };
    };
  };
}>;

interface MainPageTemplateProps {
  currentUser: UserWithRoles | null;
  appName: string;
  appLogoUrl?: string | null;
  heroTitle: string;
  heroSubtitle: string;
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
        <HeroSection
          title={heroTitle}
          subtitle={heroSubtitle}
          primaryCta={heroPrimaryCta}
          secondaryCta={heroSecondaryCta}
          primaryCtaHref={heroPrimaryCtaHref}
          secondaryCtaHref={heroSecondaryCtaHref}
        />

        {children}
      </main>

      <PageFooterExtended appName={appName} appLogoUrl={appLogoUrl || undefined} />
    </AdminIframes>
  );
}
