import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
}

const defaultTestimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Full Stack Developer",
    company: "TechCorp",
    content:
      "This starter template saved me weeks of setup time. The authentication system is rock solid and the admin dashboard is exactly what I needed for my SaaS project.",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Rodriguez",
    role: "Startup Founder",
    company: "InnovateLab",
    content:
      "The component system and theming is incredibly well thought out. I was able to customize everything to match our brand in just a few hours.",
    rating: 5,
    avatar: "MR",
  },
  {
    name: "Emily Watson",
    role: "Product Manager",
    company: "DataFlow",
    content:
      "Finally, a Next.js starter that includes everything we need for production. The role-based access control and user management features are top-notch.",
    rating: 5,
    avatar: "EW",
  },
];

export function TestimonialsSection({
  title = "Loved by Developers",
  subtitle = "See what others are saying about this starter template.",
  testimonials = defaultTestimonials,
}: TestimonialsSectionProps) {
  const maxCols = 3;
  const itemCount = testimonials.length;
  // Adaptive layout: use item count if <= maxCols, otherwise use maxCols
  const cols = Math.min(itemCount, maxCols);

  // Generate grid classes based on column count
  const getGridClasses = () => {
    if (cols === 1) return "grid-cols-1";
    if (cols === 2) return "md:grid-cols-2";
    if (cols === 3) return "md:grid-cols-2 lg:grid-cols-3";
    return "md:grid-cols-2 lg:grid-cols-3";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">{subtitle}</p>
        </div>

        <div className={`grid gap-6 ${getGridClasses()}`}>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                <blockquote className="text-muted-foreground mb-6 italic">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.avatar ||
                        testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Badge variant="outline" className="text-sm">
            ⭐ {testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length} average
            rating
          </Badge>
        </div>
      </div>
    </section>
  );
}
