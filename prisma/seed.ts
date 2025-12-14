import { seedPrisma as prisma } from "./seed-client";

async function main() {
  // Create default roles
  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
    },
  });

  // Create page templates - only pages that exist in app/(pages)
  const pageTemplates = [
    {
      title: "Landing page",
      path: "/landing",
      dev_instructions:
        "Placeholder landing page showcasing different components you can find in the admin components library that you can add, remove, or modify to your needs.",
      preview_image: "/page-previews/landing.png",
      requires_login: false,
    },
    {
      title: "Home page",
      path: "/home",
      dev_instructions:
        "Placeholder home page for signed-in users you can modify to your needs and enhance with real user data.",
      preview_image: "/page-previews/home.png",
      requires_login: true,
    },
    {
      title: "About page",
      path: "/about",
      dev_instructions:
        "Placeholder about page where you can add your company mission, values, and team information.",
      preview_image: "/page-previews/about.png",
      requires_login: false,
    },
    {
      title: "Contact page",
      path: "/contact",
      dev_instructions:
        "This is a sample contact page. The form submits entries to your database. You can see them in your admin database viewer.",
      preview_image: "/page-previews/contact.png",
      requires_login: false,
    },
    {
      title: "Subscribe page",
      path: "/subscribe",
      dev_instructions:
        "Newsletter subscription page with form that saves subscribers to your database for email campaigns.",
      preview_image: "/page-previews/subscribe.png",
      requires_login: false,
    },
  ];

  for (const page of pageTemplates) {
    // Check if page already exists
    const existingPage = await prisma.pageTemplate.findUnique({
      where: { path: page.path },
    });

    if (!existingPage) {
      await prisma.pageTemplate.create({
        data: page,
      });
    } else {
      await prisma.pageTemplate.update({
        where: { path: page.path },
        data: page,
      });
    }
  }

  // Seed team members - soft delete existing and create new ones
  await prisma.teamMember.updateMany({
    where: { deleted_at: null },
    data: { deleted_at: new Date() },
  });

  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "Founder & CEO",
      bio: "Building products that developers love. Previously at Google and Stripe.",
      avatar_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces",
      github_url: "https://github.com",
      linkedin_url: "https://linkedin.com",
      twitter_url: "https://twitter.com",
      email: "alex@example.com",
      order: 0,
    },
    {
      name: "Sarah Chen",
      role: "Lead Developer",
      bio: "Full-stack engineer passionate about React and Next.js. Open source contributor.",
      avatar_url:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces",
      github_url: "https://github.com",
      linkedin_url: "https://linkedin.com",
      email: "sarah@example.com",
      order: 1,
    },
    {
      name: "Marcus Rodriguez",
      role: "Design Lead",
      bio: "Creating beautiful and intuitive user experiences. Design systems enthusiast.",
      avatar_url:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces",
      github_url: "https://github.com",
      linkedin_url: "https://linkedin.com",
      twitter_url: "https://twitter.com",
      order: 2,
    },
    {
      name: "Emily Watson",
      role: "Product Manager",
      bio: "Turning ideas into reality. Passionate about user-centered design and agile development.",
      avatar_url:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces",
      github_url: "https://github.com",
      linkedin_url: "https://linkedin.com",
      email: "emily@example.com",
      order: 3,
    },
  ];

  for (const member of teamMembers) {
    await prisma.teamMember.create({
      data: member,
    });
  }
  console.log("Team members seeded successfully!");

  // Seed contact messages with realistic timestamps from the past year
  const now = new Date();
  const contactMessages = [
    {
      name: "John Smith",
      email: "john.smith@example.com",
      subject: "Product Inquiry",
      message:
        "Hello, I'm interested in learning more about your product. Could you provide more information about pricing and features?",
      created_at: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
    },
    {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      subject: "Support Request",
      message:
        "I'm having trouble logging into my account. I've tried resetting my password but haven't received the email. Can you help?",
      created_at: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
    },
    {
      name: "Michael Chen",
      email: "mchen@example.com",
      subject: null,
      message:
        "Just wanted to say thank you for the excellent service! Your team has been very helpful throughout the onboarding process.",
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      name: "Emily Davis",
      email: "emily.davis@example.com",
      subject: "Feature Request",
      message:
        "I love using your platform! Would it be possible to add dark mode support? It would be a great addition for night-time usage.",
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      name: "Robert Wilson",
      email: "rwilson@example.com",
      subject: "Partnership Opportunity",
      message:
        "I represent a company that would be interested in a potential partnership. Could we schedule a call to discuss this further?",
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      name: "Lisa Anderson",
      email: "lisa.a@example.com",
      subject: "Bug Report",
      message:
        "I noticed that when I upload a file larger than 10MB, the upload fails without showing an error message. This happens consistently.",
      created_at: new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000), // 2 weeks ago
    },
    {
      name: "David Martinez",
      email: "david.m@example.com",
      subject: "Account Question",
      message:
        "I'm trying to upgrade my account but I'm not sure which plan would be best for my needs. Can someone guide me?",
      created_at: new Date(now.getTime() - 1 * 30 * 24 * 60 * 60 * 1000), // 1 month ago
    },
    {
      name: "Jennifer Brown",
      email: "jennifer.brown@example.com",
      subject: "Feedback",
      message:
        "The new dashboard design looks great! The improved navigation makes it much easier to find what I need. Keep up the good work!",
      created_at: new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000), // 3 months ago
    },
    {
      name: "Thomas Taylor",
      email: "thomas.t@example.com",
      subject: "Technical Support",
      message:
        "I'm experiencing slow loading times on the analytics page. It takes about 30 seconds to load. Is this a known issue?",
      created_at: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
    },
    {
      name: "Amanda White",
      email: "amanda.white@example.com",
      subject: null,
      message:
        "I wanted to reach out and express my appreciation for the quick response to my previous inquiry. Your customer service is outstanding!",
      created_at: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    },
  ];

  // Soft delete existing contact messages first
  await prisma.contactMessage.updateMany({
    where: { deleted_at: null },
    data: { deleted_at: new Date() },
  });

  // Create new contact messages with timestamps
  for (const msg of contactMessages) {
    await prisma.contactMessage.create({
      data: {
        name: msg.name,
        email: msg.email,
        subject: msg.subject,
        message: msg.message,
        read: false, // All unread for testing
        created_at: msg.created_at,
      },
    });
  }

  // Seed blog posts - find an admin user first
  const adminUser = await prisma.user.findFirst({
    where: {
      deleted_at: null,
      roles: {
        some: {
          role_id: adminRole.id,
          deleted_at: null,
        },
      },
    },
  });

  if (adminUser) {
    // Helper function to create serialized Lexical editor state
    const createLexicalContent = (text: string): string => {
      return JSON.stringify({
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: text,
                  type: "text",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "root",
          version: 1,
        },
      });
    };

    // Soft delete existing blog posts first
    await prisma.blogPost.updateMany({
      where: { deleted_at: null },
      data: { deleted_at: new Date() },
    });

    const now = new Date();
    const blogPosts = [
      // Published posts
      {
        title: "Getting Started with Next.js 16",
        slug: "getting-started-with-nextjs-16",
        content: createLexicalContent(
          "Next.js 16 brings exciting new features and improvements. In this post, we'll explore the latest updates including the new App Router enhancements, improved performance, and developer experience improvements. Whether you're new to Next.js or upgrading from a previous version, this guide will help you get started."
        ),
        excerpt:
          "Explore the latest features and improvements in Next.js 16, including App Router enhancements and performance optimizations.",
        status: "published" as const,
        author_id: adminUser.id,
        published_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        title: "Building Scalable React Applications",
        slug: "building-scalable-react-applications",
        content: createLexicalContent(
          "Building scalable React applications requires careful planning and architecture decisions. In this comprehensive guide, we'll cover best practices for component structure, state management, performance optimization, and code organization. Learn how to build applications that can grow with your team and user base."
        ),
        excerpt:
          "Learn best practices for building React applications that scale with your team and user base.",
        status: "published" as const,
        author_id: adminUser.id,
        published_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        created_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      },
      {
        title: "TypeScript Tips for Better Code Quality",
        slug: "typescript-tips-for-better-code-quality",
        content: createLexicalContent(
          "TypeScript is a powerful tool for writing maintainable and type-safe code. In this post, we'll share practical tips and patterns that will help you write better TypeScript code. From advanced type patterns to common pitfalls, we'll cover everything you need to know to improve your code quality."
        ),
        excerpt:
          "Discover practical TypeScript tips and patterns to improve your code quality and type safety.",
        status: "published" as const,
        author_id: adminUser.id,
        published_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        created_at: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000), // 17 days ago
      },
      {
        title: "Modern CSS Techniques You Should Know",
        slug: "modern-css-techniques-you-should-know",
        content: createLexicalContent(
          "CSS has evolved significantly over the years, and modern techniques can help you write more efficient and maintainable styles. From CSS Grid and Flexbox to custom properties and container queries, we'll explore the latest CSS features that can improve your development workflow."
        ),
        excerpt:
          "Explore modern CSS techniques including Grid, Flexbox, custom properties, and container queries.",
        status: "published" as const,
        author_id: adminUser.id,
        published_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        created_at: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
      },
      {
        title: "Database Design Best Practices",
        slug: "database-design-best-practices",
        content: createLexicalContent(
          "Good database design is crucial for application performance and maintainability. In this post, we'll discuss normalization, indexing strategies, relationship design, and query optimization. Whether you're working with SQL or NoSQL databases, these principles will help you build better data models."
        ),
        excerpt:
          "Learn essential database design principles including normalization, indexing, and query optimization.",
        status: "published" as const,
        author_id: adminUser.id,
        published_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        created_at: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000), // 27 days ago
      },
      // Draft posts
      {
        title: "Advanced Authentication Patterns",
        slug: "advanced-authentication-patterns",
        content: createLexicalContent(
          "Authentication is a critical part of any application. In this upcoming post, we'll explore advanced authentication patterns including OAuth flows, JWT strategies, session management, and security best practices. Stay tuned for this comprehensive guide."
        ),
        excerpt: "A deep dive into advanced authentication patterns and security best practices.",
        status: "draft" as const,
        author_id: adminUser.id,
        published_at: null,
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        title: "Performance Optimization Strategies",
        slug: "performance-optimization-strategies",
        content: createLexicalContent(
          "Performance optimization is key to providing a great user experience. This post will cover various strategies including code splitting, lazy loading, caching, and monitoring. We'll explore both frontend and backend optimization techniques."
        ),
        excerpt:
          "Learn effective strategies for optimizing application performance across the stack.",
        status: "draft" as const,
        author_id: adminUser.id,
        published_at: null,
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        title: "Testing Strategies for Modern Applications",
        slug: "testing-strategies-for-modern-applications",
        content: createLexicalContent(
          "Testing is essential for maintaining code quality and preventing regressions. In this post, we'll discuss different testing strategies including unit tests, integration tests, and end-to-end tests. We'll also cover testing tools and best practices."
        ),
        excerpt: "Explore comprehensive testing strategies for modern web applications.",
        status: "draft" as const,
        author_id: adminUser.id,
        published_at: null,
        created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      {
        title: "API Design Principles",
        slug: "api-design-principles",
        content: createLexicalContent(
          "Well-designed APIs are crucial for building scalable and maintainable applications. This post will cover RESTful design principles, GraphQL best practices, versioning strategies, and documentation. Learn how to design APIs that are both developer-friendly and performant."
        ),
        excerpt: "Learn essential principles for designing robust and developer-friendly APIs.",
        status: "draft" as const,
        author_id: adminUser.id,
        published_at: null,
        created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
      {
        title: "Deployment and DevOps Best Practices",
        slug: "deployment-and-devops-best-practices",
        content: createLexicalContent(
          "Deployment and DevOps practices can make or break your development workflow. In this post, we'll explore CI/CD pipelines, containerization, infrastructure as code, and monitoring strategies. Learn how to build a robust deployment process."
        ),
        excerpt:
          "Discover best practices for deployment and DevOps to streamline your development workflow.",
        status: "draft" as const,
        author_id: adminUser.id,
        published_at: null,
        created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
    ];

    for (const post of blogPosts) {
      // Check if post with this slug already exists (even if soft deleted)
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: post.slug },
      });

      if (existingPost) {
        // Update existing post
        await prisma.blogPost.update({
          where: { slug: post.slug },
          data: {
            ...post,
            deleted_at: null, // Restore if it was soft deleted
          },
        });
      } else {
        // Create new post
        await prisma.blogPost.create({
          data: post,
        });
      }
    }

    console.log("Blog posts seeded successfully! (5 published, 5 drafts)");
  } else {
    console.log("No admin user found - skipping blog post seeding. Create an admin user first.");
  }

  console.log({ userRole, adminRole });
  console.log("Page templates seeded successfully!");
  console.log("Team members seeded successfully!");
  console.log("Contact messages seeded successfully!");
  console.log("Database seeded successfully!");
  console.log("Note: No users created - use the first-time setup flow to create an admin user.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
