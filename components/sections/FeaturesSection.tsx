import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Users } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
}

const defaultFeatures: Feature[] = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Complete Authentication",
    description:
      "Email/password, magic links, OAuth providers (Google, GitHub) with secure JWT sessions.",
    badge: "Security",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Role-Based Access Control",
    description:
      "Built-in user and admin roles with custom role creation and management capabilities.",
    badge: "RBAC",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Next.js 16 & App Router",
    description:
      "Latest Next.js with Server Components, Server Actions, and modern React patterns.",
    badge: "Performance",
  },
];

export function FeaturesSection({
  title = "Everything You Need to Build",
  subtitle = "A production-ready foundation with modern tools and best practices built-in.",
  features = defaultFeatures,
}: FeaturesSectionProps) {
  const maxCols = 3;
  const itemCount = features.length;
  // Adaptive layout: use item count if <= maxCols, otherwise use maxCols
  const cols = Math.min(itemCount, maxCols);

  // Generate grid classes based on column count
  const getGridClasses = () => {
    if (cols === 1) return "grid-cols-1";
    if (cols === 2) return "md:grid-cols-2";
    if (cols === 3) return "md:grid-cols-2 lg:grid-cols-3";
    return "md:grid-cols-2 lg:grid-cols-3";
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">{subtitle}</p>
        </div>

        <div className={`grid gap-6 ${getGridClasses()}`}>
          {features.map((feature, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">{feature.icon}</div>
                  {feature.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
