"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu";
import { Download, MoreVertical, Plus, Trash2, ExternalLink, Settings } from "lucide-react";
import Image from "next/image";
import { logger } from "@/lib/logger";

interface MockProject {
  id: string;
  title: string;
  createdAt: Date;
  lastEdited?: Date;
  isPublished: boolean;
  thumbnailUrl?: string;
}

// Mock project data - sorted by most recent first
// Using local images from public/admin/mocks/images folder
const mockProjects: MockProject[] = [
  {
    id: "1",
    title: "Pawfect Gallery",
    createdAt: new Date("2024-11-03T10:30:00"),
    lastEdited: new Date("2024-11-04T14:20:00"),
    isPublished: true,
    thumbnailUrl: "/admin/mocks/images/pawfect-gallery.webp",
  },
  {
    id: "2",
    title: "Propico",
    createdAt: new Date("2024-11-02T09:15:00"),
    lastEdited: new Date("2024-11-03T16:45:00"),
    isPublished: true,
    thumbnailUrl: "/admin/mocks/images/propico.webp",
  },
  {
    id: "3",
    title: "M&A Gateway",
    createdAt: new Date("2024-11-01T11:00:00"),
    lastEdited: new Date("2024-11-02T10:30:00"),
    isPublished: true,
    thumbnailUrl: "/admin/mocks/images/ma-gateway.webp",
  },
  {
    id: "4",
    title: "Elevate IV Therapy",
    createdAt: new Date("2024-10-30T08:00:00"),
    lastEdited: new Date("2024-10-31T12:15:00"),
    isPublished: true,
    thumbnailUrl: "/admin/mocks/images/elevate-iv-therapy.webp",
  },
  {
    id: "5",
    title: "REST RECOVERY",
    createdAt: new Date("2024-10-28T14:20:00"),
    isPublished: false,
    // No lastEdited - will show "Not edited yet"
    // No thumbnailUrl - will show skeleton placeholder
  },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ProjectCard({ project }: { project: MockProject }) {
  const handleDownload = () => {
    logger.info(`Downloading project: ${project.title}`);
    // Mock download functionality
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
      logger.info(`Deleting project: ${project.title}`);
      // Mock delete functionality
    }
  };

  const _handlePreview = () => {
    logger.info(`Previewing project: ${project.title}`);
    // Mock preview functionality - would open project in new tab
    window.open("/", "_blank");
  };

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden group w-full min-w-0">
      {/* Thumbnail Section */}
      <div className="relative w-full h-48 bg-muted overflow-hidden">
        {project.isPublished && project.thumbnailUrl ? (
          <>
            <Image
              src={project.thumbnailUrl}
              alt={project.title}
              fill
              className="object-cover"
              unoptimized
            />
            {/* 20% Black Overlay - Always visible */}
            <div className="absolute inset-0 bg-black/20"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted relative overflow-hidden">
            {/* Skeleton/Ghost Placeholder - No animation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3">
              {/* Skeleton Header Bar */}
              <div className="w-full space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded-full w-3/4"></div>
                <div className="h-3 bg-muted-foreground/20 rounded-full w-1/2"></div>
              </div>

              {/* Skeleton Content Blocks */}
              <div className="w-full space-y-2 mt-4">
                <div className="h-2 bg-muted-foreground/15 rounded-full w-full"></div>
                <div className="h-2 bg-muted-foreground/15 rounded-full w-5/6"></div>
                <div className="h-2 bg-muted-foreground/15 rounded-full w-4/6"></div>
              </div>

              {/* Skeleton Card Blocks */}
              <div className="w-full grid grid-cols-3 gap-2 mt-4">
                <div className="h-16 bg-muted-foreground/10 rounded"></div>
                <div className="h-16 bg-muted-foreground/10 rounded"></div>
                <div className="h-16 bg-muted-foreground/10 rounded"></div>
              </div>

              {/* Skeleton Button */}
              <div className="w-32 h-8 bg-muted-foreground/15 rounded-full mt-4"></div>
            </div>

            {/* Overlay Text - Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                App Not published yet
              </p>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 truncate">{project.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Created at {formatDate(project.createdAt)}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {project.lastEdited
              ? `Last edited: ${formatDate(project.lastEdited)}`
              : "Not edited yet"}
          </p>
          {project.isPublished && (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="https://your-project.com"
                className="flex-1"
                defaultValue={`https://${project.title.toLowerCase().replace(/\s+/g, "-")}.com`}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => {
                  // TODO: Open project in new tab
                }}
                title="View latest version"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View latest version</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => {
                  // TODO: Open project admin
                }}
                title="Open Project admin"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Open Project admin</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => {
                  // TODO: Download project files
                }}
                title="Download project files"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download project files</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddProjectCard() {
  return (
    <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer hover:shadow-md w-full min-w-0">
      <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm mb-1">Add New Project</h3>
            <p className="text-xs text-muted-foreground">Create a new project to get started</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MyProjectsContent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {/* Add Project Card - First position */}
      <AddProjectCard />

      {/* Project Cards - sorted by most recent first */}
      {mockProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
