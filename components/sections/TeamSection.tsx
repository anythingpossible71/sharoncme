import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { getTeamMembers } from "@/app/actions/team-members";

interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

interface TeamSectionProps {
  title?: string;
  subtitle?: string;
  members?: TeamMember[];
  maxCols?: number;
}

export async function TeamSection({
  title = "Our Team",
  subtitle = "Meet the people building amazing products",
  members: propMembers,
  maxCols = 3,
}: TeamSectionProps) {
  // Fetch from database if members not provided
  const dbMembers = propMembers ? null : await getTeamMembers();
  const members =
    propMembers ||
    dbMembers?.map((m) => ({
      name: m.name,
      role: m.role,
      bio: m.bio,
      avatar: m.avatar_url,
      social: {
        github: m.github_url || undefined,
        linkedin: m.linkedin_url || undefined,
        twitter: m.twitter_url || undefined,
        email: m.email || undefined,
      },
    })) ||
    [];
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="py-16 md:py-24 overflow-visible">
      <div className="container mx-auto px-4 overflow-visible">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Grid with proper spacing: avatars are 68px tall, offset -32px above card (extend 32px above) */}
        {/* Vertical gap matches horizontal gap: gap-x-4 (16px) + avatar extension (32px) = gap-y-12 (48px) */}
        {/* On md+: gap-x-6 (24px) + avatar extension (32px) = gap-y-14 (56px) */}
        {/* Adaptive layout: use item count if <= maxCols, otherwise use maxCols */}
        {(() => {
          const itemCount = members.length;
          const cols = Math.min(itemCount, maxCols);

          // Generate grid classes based on column count
          const getGridClasses = () => {
            if (cols === 1) return "grid-cols-1";
            if (cols === 2) return "md:grid-cols-2";
            if (cols === 3) return "md:grid-cols-2 lg:grid-cols-3";
            if (cols === 4) return "md:grid-cols-2 lg:grid-cols-4";
            if (cols === 5) return "md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5";
            if (cols === 6) return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
            return "md:grid-cols-2 lg:grid-cols-4";
          };

          return (
            <div
              className={`grid gap-y-12 md:gap-y-14 gap-x-4 md:gap-x-6 ${getGridClasses()} overflow-visible`}
            >
              {members.map((member, index) => (
                <Card key={index} className="h-full flex flex-col overflow-visible">
                  <CardContent className="p-4 pt-10 flex flex-col items-center text-center space-y-3 relative">
                    {/* Avatar positioned to overlap card (50% outside) - 30% smaller (68px = 96px * 0.7) */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
                      <Avatar className="h-[68px] w-[68px]">
                        {member.avatar && member.avatar.trim() ? (
                          <AvatarImage src={member.avatar} alt={member.name} />
                        ) : null}
                        <AvatarFallback className="text-base">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="space-y-1 mt-2">
                      <h3 className="text-lg font-semibold">{member.name}</h3>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>

                    {member.bio && (
                      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
                        {member.bio}
                      </p>
                    )}

                    {member.social && (
                      <div className="flex items-center gap-2 pt-1">
                        {member.social.github && (
                          <a
                            href={member.social.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`${member.name}'s GitHub`}
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                        {member.social.linkedin && (
                          <a
                            href={member.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`${member.name}'s LinkedIn`}
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {member.social.twitter && (
                          <a
                            href={member.social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`${member.name}'s Twitter`}
                          >
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {member.social.email && (
                          <a
                            href={`mailto:${member.social.email}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`Email ${member.name}`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
