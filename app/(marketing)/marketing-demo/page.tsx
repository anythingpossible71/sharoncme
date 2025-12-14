import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingDemoPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Build Something
            <span className="text-primary"> Amazing</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A production-ready starter template with authentication, admin dashboard, and everything
            you need to launch your next project.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/signin">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">Everything You Need</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Built with modern technologies and best practices.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Authentication",
                description:
                  "Secure authentication with Auth.js v5, supporting multiple providers.",
              },
              {
                title: "Admin Dashboard",
                description:
                  "Full-featured admin panel with user management and role-based access.",
              },
              {
                title: "Modern Stack",
                description: "Next.js 16, TypeScript, Tailwind CSS, Prisma, and shadcn/ui.",
              },
              {
                title: "Database Ready",
                description: "Prisma ORM with PostgreSQL, migrations, and seeding included.",
              },
              {
                title: "Beautiful UI",
                description: "Carefully crafted components with dark mode and theme support.",
              },
              {
                title: "Production Ready",
                description: "Optimized for deployment with Docker and environment management.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to Get Started?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start building your application today with our production-ready template.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/auth/signin">Start Building</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
