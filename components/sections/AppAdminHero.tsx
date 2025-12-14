import { ReactNode } from "react";

interface AppAdminHeroProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function AppAdminHero({ title, subtitle, icon }: AppAdminHeroProps) {
  return (
    <section className="pt-6 pb-4 md:pt-12 md:pb-8 lg:pt-16 lg:pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4 text-center max-w-3xl mx-auto">
          {icon && <div className="rounded-full bg-primary/10 p-3">{icon}</div>}
          <h1 className="text-3xl font-bold tracking-tighter">{title}</h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground md:text-xl max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}
