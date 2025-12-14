import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function TestThemePage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Theme Test" />

      {/* Color Variables Showcase */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Background & Foreground */}
        <Card>
          <CardHeader>
            <CardTitle>Background & Foreground</CardTitle>
            <CardDescription>Base page colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background text-foreground p-4 rounded-md border">
              <p className="font-medium">background / foreground</p>
              <p className="text-sm text-muted-foreground">Default page background and text</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Card Colors</CardTitle>
            <CardDescription>Card backgrounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-card text-card-foreground p-4 rounded-md border">
              <p className="font-medium">card / card-foreground</p>
              <p className="text-sm text-muted-foreground">Card background and text</p>
            </div>
          </CardContent>
        </Card>

        {/* Primary Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Colors</CardTitle>
            <CardDescription>Main brand colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-md">
              <p className="font-medium">primary / primary-foreground</p>
              <p className="text-sm opacity-90">Primary brand color</p>
            </div>
            <Button>Primary Button</Button>
          </CardContent>
        </Card>

        {/* Secondary Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Secondary Colors</CardTitle>
            <CardDescription>Supporting colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary text-secondary-foreground p-4 rounded-md">
              <p className="font-medium">secondary / secondary-foreground</p>
              <p className="text-sm">Secondary color</p>
            </div>
            <Button variant="secondary">Secondary Button</Button>
          </CardContent>
        </Card>

        {/* Muted Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Muted Colors</CardTitle>
            <CardDescription>Subtle, disabled elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted text-muted-foreground p-4 rounded-md">
              <p className="font-medium">muted / muted-foreground</p>
              <p className="text-sm">Muted, disabled elements</p>
            </div>
            <Button variant="ghost" disabled>
              Disabled Button
            </Button>
          </CardContent>
        </Card>

        {/* Accent Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Accent Colors</CardTitle>
            <CardDescription>Highlights and focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent text-accent-foreground p-4 rounded-md">
              <p className="font-medium">accent / accent-foreground</p>
              <p className="text-sm">Accent highlights</p>
            </div>
            <Badge>Accent Badge</Badge>
          </CardContent>
        </Card>

        {/* Destructive Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Destructive Colors</CardTitle>
            <CardDescription>Error and delete actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive text-destructive-foreground p-4 rounded-md">
              <p className="font-medium">destructive / destructive-foreground</p>
              <p className="text-sm">Error and delete actions</p>
            </div>
            <Button variant="destructive">Delete Button</Button>
          </CardContent>
        </Card>

        {/* Popover Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Popover Colors</CardTitle>
            <CardDescription>Dropdown and popover backgrounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-popover text-popover-foreground p-4 rounded-md border shadow-md">
              <p className="font-medium">popover / popover-foreground</p>
              <p className="text-sm">Popover and dropdown backgrounds</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Border, Input, Ring */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Elements</CardTitle>
          <CardDescription>Borders, inputs, and focus rings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Border Color</label>
            <div className="border-4 rounded-md p-4">
              <p className="text-sm text-muted-foreground">Elements use the border color</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Input Border (with Ring on Focus)</label>
            <Input placeholder="Focus me to see the ring color" />
            <p className="text-xs text-muted-foreground">
              Focus on the input to see the ring color
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Button with Ring on Focus</label>
            <Button>Focus me to see ring</Button>
            <p className="text-xs text-muted-foreground">
              Tab to this button to see the focus ring
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>Theme radius setting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary text-primary-foreground p-6 rounded">
              <p className="text-sm font-medium">rounded</p>
            </div>
            <div className="bg-secondary text-secondary-foreground p-6 rounded-md">
              <p className="text-sm font-medium">rounded-md</p>
            </div>
            <div className="bg-accent text-accent-foreground p-6 rounded-lg">
              <p className="text-sm font-medium">rounded-lg</p>
            </div>
            <div className="bg-muted text-muted-foreground p-6 rounded-xl">
              <p className="text-sm font-medium">rounded-xl</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Component Variations</CardTitle>
          <CardDescription>All button and badge variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Button Variants</p>
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Badge Variants</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
