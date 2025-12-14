import { ReactNode } from "react";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { AppAdminHero } from "@/components/sections/AppAdminHero";
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

interface InnerPageTemplateProps {
  currentUser: UserWithRoles | null;
  appName: string;
  appLogoUrl?: string | null;
  heroTitle: string;
  heroSubtitle?: string;
  heroIcon?: ReactNode;
  children: ReactNode;
}

export function InnerPageTemplate({
  currentUser,
  appName,
  appLogoUrl,
  heroTitle,
  heroSubtitle,
  heroIcon,
  children,
}: InnerPageTemplateProps) {
  return (
    <AdminIframes>
      <PageHeader
        currentUser={currentUser}
        appName={appName}
        appLogoUrl={appLogoUrl || undefined}
      />

      <main>
        <AppAdminHero title={heroTitle} subtitle={heroSubtitle} icon={heroIcon} />

        {children}
      </main>

      <PageFooterExtended appName={appName} appLogoUrl={appLogoUrl || undefined} />
    </AdminIframes>
  );
}
