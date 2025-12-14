"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Force dynamic rendering to prevent build errors with useSearchParams
export const dynamic = "force-dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Copy, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Import components for preview
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CodePreview } from "@/components/ui/code-preview";
import { Separator } from "@/components/ui/separator";
import {
  HeroSection,
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
} from "@/components/sections";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooter } from "@/components/pages/PageFooter";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";

interface ComponentInfo {
  name: string;
  path: string;
  category: string;
  description: string;
  type: "ui" | "section" | "page";
  preview?: React.ComponentType<any>;
}

// Preview components for UI elements
const AlertPreview = () => (
  <div className="space-y-4 max-w-2xl">
    <Alert>
      <AlertDescription>ℹ️ This is a default alert message.</AlertDescription>
    </Alert>
    <Alert variant="destructive">
      <AlertDescription>⚠️ Error! Something went wrong with your request.</AlertDescription>
    </Alert>
  </div>
);

const AvatarPreview = () => (
  <div className="flex items-center gap-4">
    <Avatar>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  </div>
);

const BadgePreview = () => (
  <div className="flex gap-2 flex-wrap">
    <Badge>Default</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="destructive">Destructive</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
);

const ButtonPreview = () => (
  <div className="flex gap-2 flex-wrap">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
);

const CheckboxPreview = () => (
  <div className="flex items-center space-x-2">
    <Checkbox id="preview" />
    <label htmlFor="preview">Checkbox preview</label>
  </div>
);

const SeparatorPreview = () => (
  <div className="space-y-2">
    <div>Content above</div>
    <Separator />
    <div>Content below</div>
  </div>
);

const CodePreviewComponent = () => (
  <div className="w-full">
    <CodePreview
      code={`const greeting = "Hello, World!";
console.log(greeting);

function add(a, b) {
  return a + b;
}

// This is a longer line that would previously scroll horizontally but now wraps nicely
const veryLongVariableName = "This is a much longer string that demonstrates how the code now wraps instead of scrolling horizontally";
`}
    />
  </div>
);

const PageHeaderPreview = () => {
  // Mock user data for signed in mode (simplified for preview)

  const mockUser: any = {
    id: "mock-user-id",
    name: "John Doe",
    email: "john@example.com",
    email_verified: new Date(),
    image: "",
    password: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    profile: null,
    roles: [
      {
        id: "mock-role-id",
        user_id: "mock-user-id",
        role_id: "admin-role-id",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        role: {
          id: "admin-role-id",
          name: "admin",
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Signed In Mode</h4>
        <div className="border rounded-lg overflow-hidden">
          <PageHeader currentUser={mockUser} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Unsigned Mode</h4>
        <div className="border rounded-lg overflow-hidden">
          <PageHeader currentUser={null} />
        </div>
      </div>
    </div>
  );
};

const PageFooterPreview = () => <PageFooter />;

const PageFooterExtendedPreview = () => <PageFooterExtended />;

const CardPreview = () => (
  <Card className="w-full max-w-md">
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card description goes here</CardDescription>
    </CardHeader>
    <CardContent>
      <p>This is the card content area. You can put any content here.</p>
    </CardContent>
  </Card>
);

const InputPreview = () => (
  <div className="space-y-2 max-w-md">
    <Input placeholder="Enter text..." />
    <Input placeholder="With default value" defaultValue="Default text" />
    <Input placeholder="Disabled input" disabled />
  </div>
);

const PasswordInputPreview = () => (
  <div className="space-y-2 max-w-md">
    <PasswordInput placeholder="Enter password..." />
    <PasswordInput placeholder="With default value" defaultValue="password123" />
  </div>
);

const TablePreview = () => (
  <div className="w-full max-w-2xl">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">John Doe</TableCell>
          <TableCell>Active</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Jane Smith</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell className="text-right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Bob Johnson</TableCell>
          <TableCell>Inactive</TableCell>
          <TableCell className="text-right">$350.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

const TabsPreview = () => (
  <Tabs defaultValue="account" className="w-full max-w-md">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="password">Password</TabsTrigger>
    </TabsList>
    <TabsContent value="account" className="space-y-2">
      <p className="text-sm">Make changes to your account here.</p>
    </TabsContent>
    <TabsContent value="password" className="space-y-2">
      <p className="text-sm">Change your password here.</p>
    </TabsContent>
  </Tabs>
);

const SelectPreview = () => (
  <div className="space-y-2 max-w-md">
    <Select defaultValue="apple">
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const AlertDialogPreview = () => {
  const [open, setOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState({ top: 0 });

  const handleOpen = (e: React.MouseEvent) => {
    // Get click position relative to document
    const clickY = e.clientY + window.scrollY;

    console.log("AlertDialog - Click position:", clickY);
    setDialogPosition({ top: clickY });
    setOpen(true);
  };

  return (
    <div className="relative">
      {!open ? (
        <Button variant="destructive" onClick={handleOpen}>
          Show Alert Dialog
        </Button>
      ) : (
        <div className="fixed inset-0 z-50" style={{ top: 0, height: "100%" }}>
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Dialog Content - positioned at parent viewport center */}
          <div
            className="absolute left-1/2 z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg"
            style={{
              top: `${dialogPosition.top}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <h2 className="text-lg font-semibold">⚠️ Are you absolutely sure?</h2>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete your account and remove
                your data from our servers.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => setOpen(false)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DialogPreview = () => {
  const [open, setOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState({ top: 0 });

  const handleOpen = (e: React.MouseEvent) => {
    // Get click position relative to document
    const clickY = e.clientY + window.scrollY;

    console.log("Dialog - Click position:", clickY);
    setDialogPosition({ top: clickY });
    setOpen(true);
  };

  return (
    <div className="relative">
      {!open ? (
        <Button variant="outline" onClick={handleOpen}>
          Open Dialog
        </Button>
      ) : (
        <div className="fixed inset-0 z-50" style={{ top: 0, height: "100%" }}>
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Dialog Content - positioned at parent viewport center */}
          <div
            className="absolute left-1/2 z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg"
            style={{
              top: `${dialogPosition.top}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              <p className="text-sm text-muted-foreground">
                Make changes to your profile here. Click save when you&apos;re done.
              </p>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="Email" defaultValue="john@example.com" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DropdownMenuPreview = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">Open Menu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuItem>Team</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Logout</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const TooltipPreview = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a helpful tooltip message</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ToastPreview = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Success!",
            description: "Your changes have been saved.",
          });
        }}
      >
        Show Toast
      </Button>
      <p className="text-xs text-muted-foreground">Click the button to see a toast notification</p>
    </div>
  );
};

const LabelPreview = () => (
  <div className="space-y-4 max-w-md">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" placeholder="Enter your email" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" placeholder="Enter your password" />
    </div>
  </div>
);

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bio: z.string().max(160).optional(),
});

const FormPreview = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Input placeholder="Tell us about yourself..." {...field} />
              </FormControl>
              <FormDescription>Optional. Max 160 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

// Component database - all user-facing components
const components: ComponentInfo[] = [
  // UI Components
  {
    name: "Alert",
    path: "components/ui/alert.tsx",
    category: "Feedback",
    description: "Displays an alert message to the user",
    type: "ui",
    preview: AlertPreview,
  },
  {
    name: "Alert Dialog",
    path: "components/ui/alert-dialog.tsx",
    category: "Overlay",
    description: "A modal dialog that interrupts the user with important content",
    type: "ui",
    preview: AlertDialogPreview,
  },
  {
    name: "Avatar",
    path: "components/ui/avatar.tsx",
    category: "Display",
    description: "An image element with a fallback to represent the user",
    type: "ui",
    preview: AvatarPreview,
  },
  {
    name: "Badge",
    path: "components/ui/badge.tsx",
    category: "Display",
    description: "Displays a badge or a component that looks like a badge",
    type: "ui",
    preview: BadgePreview,
  },
  {
    name: "Button",
    path: "components/ui/button.tsx",
    category: "Form",
    description: "Displays a button or a component that looks like a button",
    type: "ui",
    preview: ButtonPreview,
  },
  {
    name: "Card",
    path: "components/ui/card.tsx",
    category: "Layout",
    description: "Displays a card with header, content, and footer",
    type: "ui",
    preview: CardPreview,
  },
  {
    name: "Checkbox",
    path: "components/ui/checkbox.tsx",
    category: "Form",
    description: "A control that allows the user to toggle between checked and not checked",
    type: "ui",
    preview: CheckboxPreview,
  },
  {
    name: "Code Preview",
    path: "components/ui/code-preview.tsx",
    category: "Display",
    description: "Displays code with syntax highlighting and copy button on dark background",
    type: "ui",
    preview: CodePreviewComponent,
  },
  {
    name: "Dialog",
    path: "components/ui/dialog.tsx",
    category: "Overlay",
    description: "A window overlaid on either the primary window or another dialog window",
    type: "ui",
    preview: DialogPreview,
  },
  {
    name: "Dropdown Menu",
    path: "components/ui/dropdown-menu.tsx",
    category: "Navigation",
    description: "Displays a menu to the user",
    type: "ui",
    preview: DropdownMenuPreview,
  },
  {
    name: "Form",
    path: "components/ui/form.tsx",
    category: "Form",
    description: "Building forms with React Hook Form and Zod",
    type: "ui",
    preview: FormPreview,
  },
  {
    name: "Input",
    path: "components/ui/input.tsx",
    category: "Form",
    description: "Displays a form input field or a component that looks like an input field",
    type: "ui",
    preview: InputPreview,
  },
  {
    name: "Label",
    path: "components/ui/label.tsx",
    category: "Form",
    description: "Renders an accessible label associated with controls",
    type: "ui",
    preview: LabelPreview,
  },
  {
    name: "Password Input",
    path: "components/ui/password-input.tsx",
    category: "Form",
    description: "An input field for passwords with show/hide toggle",
    type: "ui",
    preview: PasswordInputPreview,
  },
  {
    name: "Select",
    path: "components/ui/select.tsx",
    category: "Form",
    description: "Displays a list of options for the user to pick from",
    type: "ui",
    preview: SelectPreview,
  },
  {
    name: "Separator",
    path: "components/ui/separator.tsx",
    category: "Layout",
    description: "Visually or semantically separates content",
    type: "ui",
    preview: SeparatorPreview,
  },
  {
    name: "Table",
    path: "components/ui/table.tsx",
    category: "Data Display",
    description: "A responsive table component",
    type: "ui",
    preview: TablePreview,
  },
  {
    name: "Tabs",
    path: "components/ui/tabs.tsx",
    category: "Navigation",
    description: "A set of layered sections of content",
    type: "ui",
    preview: TabsPreview,
  },
  {
    name: "Toast",
    path: "components/ui/toast.tsx",
    category: "Feedback",
    description: "A succinct message that is displayed temporarily",
    type: "ui",
    preview: ToastPreview,
  },
  {
    name: "Tooltip",
    path: "components/ui/tooltip.tsx",
    category: "Overlay",
    description: "A popup that displays information related to an element",
    type: "ui",
    preview: TooltipPreview,
  },

  // Section Components
  {
    name: "Hero Section",
    path: "components/sections/HeroSection.tsx",
    category: "Landing",
    description: "Hero banner with title, subtitle, and CTA buttons",
    type: "section",
    preview: HeroSection,
  },
  {
    name: "Features Section",
    path: "components/sections/FeaturesSection.tsx",
    category: "Landing",
    description: "Feature grid with icons, titles, and descriptions",
    type: "section",
    preview: FeaturesSection,
  },
  {
    name: "Testimonials Section",
    path: "components/sections/TestimonialsSection.tsx",
    category: "Landing",
    description: "Customer testimonials carousel/grid",
    type: "section",
    preview: TestimonialsSection,
  },
  {
    name: "Pricing Section",
    path: "components/sections/PricingSection.tsx",
    category: "Landing",
    description: "Pricing cards with features and CTAs",
    type: "section",
    preview: PricingSection,
  },

  // Page Components (public ones only)
  {
    name: "Page Header",
    path: "components/pages/PageHeader.tsx",
    category: "Layout",
    description: "Site header with navigation and user menu",
    type: "page",
    preview: PageHeaderPreview,
  },
  {
    name: "Page Footer",
    path: "components/pages/PageFooter.tsx",
    category: "Layout",
    description: "Site footer with links and information",
    type: "page",
    preview: PageFooterPreview,
  },
  {
    name: "Page Footer Extended",
    path: "components/pages/PageFooterExtended.tsx",
    category: "Layout",
    description: "Professional footer with organized links, social media, and legal information",
    type: "page",
    preview: PageFooterExtendedPreview,
  },
];

function ComponentsLibraryContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreviews, setShowPreviews] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle search and showpreviews parameters from URL
  useEffect(() => {
    const search = searchParams.get("search");
    const showpreviewsParam = searchParams.get("showpreviews");

    if (search) {
      setSearchTerm(search);
    }

    // Default to true, only false if explicitly set to 'false'
    if (showpreviewsParam === "false") {
      setShowPreviews(false);
    } else {
      setShowPreviews(true);
    }
  }, [searchParams]);

  const filteredComponents = components.filter((component) => {
    const matchesSearch =
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Send height updates to parent frame when overflow occurs
  useEffect(() => {
    let lastSentHeight = 0;

    const sendHeight = () => {
      requestAnimationFrame(() => {
        const height = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          document.documentElement.offsetHeight,
          document.body.offsetHeight
        );

        // Only send if height changed
        if (height !== lastSentHeight) {
          console.log(
            "Sending height to parent (overflow detected):",
            height,
            "previous:",
            lastSentHeight
          );
          window.parent.postMessage({ type: "iframe-height", height }, window.location.origin);
          lastSentHeight = height;
        }
      });
    };

    // Initial height after DOM loads
    const sendInitialHeight = () => {
      if (document.readyState === "complete") {
        requestAnimationFrame(() => {
          setTimeout(() => sendHeight(), 300);
        });
      } else {
        window.addEventListener(
          "load",
          () => {
            requestAnimationFrame(() => {
              setTimeout(() => sendHeight(), 300);
            });
          },
          { once: true }
        );
      }
    };

    sendInitialHeight();

    // Set up ResizeObserver to watch for overflow
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const contentHeight = target.scrollHeight;
        const visibleHeight = target.clientHeight;

        // Only send height if there's overflow
        if (contentHeight > visibleHeight) {
          console.log("Overflow detected - content:", contentHeight, "visible:", visibleHeight);
          sendHeight();
        }
      }
    });

    // Observe body for size changes
    resizeObserver.observe(document.body);

    // Listen for height requests from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "request-height-once") {
        console.log("Received height request");
        sendHeight();
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const copyPath = async (path: string, name: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
      toast({
        title: "Path copied!",
        description: `Copied "${name}" path to clipboard: ${path}`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy path to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <style>{`
        /* Allow content to flow naturally */
        html, body {
          overflow: visible !important;
          min-height: 100%;
          height: auto !important;
        }
        
        /* Ensure dialogs render in a way that expands the document */
        [data-radix-portal] {
          position: absolute !important;
          top: 0;
          left: 0;
          width: 100%;
          min-height: 100vh;
          z-index: 9999;
        }
        
        /* Dialog overlay should cover the entire iframe */
        [data-radix-dialog-overlay],
        [data-radix-alert-dialog-overlay] {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(0, 0, 0, 0.8);
        }
        
        /* Dialog content centered in viewport */
        [data-radix-dialog-content],
        [data-radix-alert-dialog-content] {
          position: fixed !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>
      <div className="min-h-screen bg-background p-6">
        <Toaster />
        <div className="space-y-6">
          {/* Components Grid */}
          <div className="space-y-6">
            {filteredComponents.map((component) => {
              const PreviewComponent = component.preview;

              return (
                <Card key={component.path} className="w-full border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-lg">{component.name}</CardTitle>
                        <CardDescription>{component.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyPath(component.path, component.name)}
                                className="h-auto px-2 py-1 hover:bg-muted"
                              >
                                <code className="text-xs">{component.path}</code>
                                {copiedPath === component.path ? (
                                  <Check className="h-3 w-3 ml-2 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 ml-2" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {copiedPath === component.path
                                  ? "Copied!"
                                  : "Copy component path as context"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>

                  {showPreviews && PreviewComponent && (
                    <CardContent className="pt-0">
                      <div className="border-2 border-border rounded-lg p-6 bg-muted/60">
                        <div className="w-full">
                          <PreviewComponent />
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {showPreviews && !PreviewComponent && (
                    <CardContent className="pt-0">
                      <div className="border rounded-lg p-4 bg-muted/20 text-center">
                        <div className="text-xs text-muted-foreground">No preview available</div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {filteredComponents.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No components found matching your search.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export default function ComponentsLibraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentsLibraryContent />
    </Suspense>
  );
}
