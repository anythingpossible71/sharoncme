import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  primaryCta?: string;
  secondaryCta?: string;
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
}

export function HeroSection({
  title = "Build Something Amazing",
  subtitle = "Your Next.js starter template with authentication, admin dashboard, and role-based access control. Ready to customize and deploy.",
  primaryCta = "Get Started",
  secondaryCta = "Learn More",
  primaryCtaHref = "/auth/signin",
  secondaryCtaHref = "/about",
}: HeroSectionProps) {
  return (
    <section className="py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              {title}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href={primaryCtaHref}>{primaryCta}</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={secondaryCtaHref}>{secondaryCta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
