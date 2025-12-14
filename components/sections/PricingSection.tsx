import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  badge?: string;
  features: PricingFeature[];
  cta: string;
  popular?: boolean;
}

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  plans?: PricingPlan[];
}

const defaultPlans: PricingPlan[] = [
  {
    name: "Starter",
    description: "Perfect for personal projects and small teams",
    price: "Free",
    period: "",
    features: [
      { text: "Complete authentication system", included: true },
      { text: "User & admin roles", included: true },
      { text: "Basic admin dashboard", included: true },
      { text: "Email templates", included: true },
      { text: "SQLite database", included: true },
      { text: "TypeScript & Tailwind CSS", included: true },
      { text: "Priority support", included: false },
      { text: "Custom integrations", included: false },
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    description: "Ideal for growing businesses and teams",
    price: "$29",
    period: "/month",
    badge: "Most Popular",
    popular: true,
    features: [
      { text: "Everything in Starter", included: true },
      { text: "Priority support", included: true },
      { text: "Custom integrations", included: true },
      { text: "Advanced admin features", included: true },
      { text: "PostgreSQL & MySQL support", included: true },
      { text: "Production email providers", included: true },
      { text: "Custom themes", included: true },
      { text: "Team collaboration", included: true },
    ],
    cta: "Start Pro Trial",
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: "Custom",
    period: "",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Dedicated support", included: true },
      { text: "Custom development", included: true },
      { text: "White-label options", included: true },
      { text: "Advanced security features", included: true },
      { text: "SLA guarantees", included: true },
      { text: "Training & onboarding", included: true },
      { text: "Custom integrations", included: true },
    ],
    cta: "Contact Sales",
  },
];

export function PricingSection({
  title = "Simple, Transparent Pricing",
  subtitle = "Choose the plan that's right for your project. All plans include the complete starter template.",
  plans = defaultPlans,
}: PricingSectionProps) {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">{subtitle}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">{plan.badge}</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span
                        className={feature.included ? "text-foreground" : "text-muted-foreground"}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button className="w-full" variant={plan.popular ? "default" : "outline"} size="lg">
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include source code, documentation, and community support.
          </p>
        </div>
      </div>
    </section>
  );
}
