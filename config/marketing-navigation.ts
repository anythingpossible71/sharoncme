export type NavLink = {
  label: string;
  href: string;
};

export type FooterSection = {
  title: string;
  links: NavLink[];
};

export type MarketingNavigation = {
  header: NavLink[];
  cta: {
    label: string;
    href: string;
  };
  footer: {
    sections: FooterSection[];
    copyright: string;
  };
};

export const marketingNavigation: MarketingNavigation = {
  header: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
  ],
  cta: {
    label: "Get Started",
    href: "/auth/signin",
  },
  footer: {
    sections: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Documentation", href: "/docs" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
    copyright: "© 2025 Your Company. All rights reserved.",
  },
};
