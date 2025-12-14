import Link from "next/link";
import { marketingNavigation } from "@/config/marketing-navigation";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        {/* Footer Sections Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-8">
          {marketingNavigation.footer.sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            {marketingNavigation.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
