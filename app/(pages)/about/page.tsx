import { getCurrentUser } from "@/lib/auth/permissions";
import { MainPageTemplate } from "@/components/templates/MainPageTemplate";
import { TeamSection } from "@/components/sections";
import { getAppSettings } from "@/app/actions/app-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Heart, Zap, Users, TrendingUp, Award } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

// pageDescription: Learn about our company mission, values, and meet the team behind the platform

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about our company mission, values, and meet the team behind the platform",
  openGraph: {
    title: "About Us",
    description: "Learn about our company mission, values, and meet the team behind the platform",
    images: ["/app/(pages)/about/preview.png"],
  },
};

export default async function AboutPage() {
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();

  return (
    <MainPageTemplate
      currentUser={currentUser}
      appName={appSettings.appName}
      appLogoUrl={appSettings.appLogoUrl}
      heroTitle="About Our Company"
      heroSubtitle="This is a demo about page showcasing common sections you can include. Each section demonstrates different capabilities and content types you can use to tell your company's story."
    >
      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              This section demonstrates how you can present your company&apos;s mission and core
              purpose. You can include your founding story, what drives your team, and the impact
              you aim to make. This is where visitors learn what your company stands for and why it
              exists.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              You can expand this section with multiple paragraphs, include images, or add a
              call-to-action button. The layout is flexible and can be customized to match your
              brand and messaging style.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This section showcases how you can display your company values using cards or grid
              layouts. Each value can have an icon, title, and description.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Purpose-Driven</h3>
                </div>
                <p className="text-muted-foreground">
                  Every decision we make is guided by our core mission and the impact we want to
                  create in the world.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Customer First</h3>
                </div>
                <p className="text-muted-foreground">
                  Our customers are at the center of everything we do. Their success is our success,
                  and their feedback shapes our direction.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Innovation</h3>
                </div>
                <p className="text-muted-foreground">
                  We embrace new ideas and technologies, constantly pushing boundaries to deliver
                  better solutions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Collaboration</h3>
                </div>
                <p className="text-muted-foreground">
                  We believe in the power of teamwork and open communication to achieve
                  extraordinary results together.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Growth Mindset</h3>
                </div>
                <p className="text-muted-foreground">
                  We view challenges as opportunities to learn and improve, both as individuals and
                  as an organization.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Excellence</h3>
                </div>
                <p className="text-muted-foreground">
                  We strive for excellence in everything we do, setting high standards and
                  continuously raising the bar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">By The Numbers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This section demonstrates how you can showcase key metrics, achievements, or company
              statistics in an engaging visual format.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-muted-foreground">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">99%</div>
              <div className="text-muted-foreground">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-muted-foreground">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSection
        title="Meet Our Team"
        subtitle="This section uses the TeamSection component, which can pull team members from your database or display custom team data. You can manage team members through the admin dashboard."
      />

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg opacity-90">
              This call-to-action section demonstrates how you can encourage visitors to take the
              next step, whether that&apos;s signing up, contacting you, or learning more about your
              products or services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary-foreground px-8 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-foreground/90"
              >
                Contact Us
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-primary-foreground/20 bg-transparent px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainPageTemplate>
  );
}
