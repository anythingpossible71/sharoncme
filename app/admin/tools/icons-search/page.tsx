"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/admin-ui/input";
import { Button } from "@/components/admin-ui/button";
import { Card, CardContent } from "@/components/admin-ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin-ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/admin-ui/dialog";
import { Label } from "@/components/admin-ui/label";
import { Copy, Download, Search, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

interface IconData {
  body: string;
  hidden?: boolean;
}

interface IconsData {
  prefix: string;
  icons: Record<string, IconData>;
  aliases: Record<string, { parent: string }>;
}

// Semantic metadata mapping - maps search terms to related icon names
const semanticMetadata: Record<string, string[]> = {
  tool: ["wrench", "screwdriver", "hammer", "drill", "saw", "tool-case", "pen-tool"],
  tools: ["wrench", "screwdriver", "hammer", "drill", "saw", "tool-case", "pen-tool"],
  user: ["user", "users", "person", "people", "account", "profile"],
  users: ["user", "users", "person", "people", "account", "profile"],
  settings: ["settings", "cog", "gear", "sliders", "wrench"],
  setting: ["settings", "cog", "gear", "sliders", "wrench"],
  search: ["search", "magnifying-glass", "filter"],
  edit: ["edit", "pen", "pencil", "square-pen"],
  delete: ["delete", "trash", "x", "remove"],
  add: ["plus", "add", "create"],
  save: ["save", "download", "check"],
  close: ["x", "close", "cancel"],
  menu: ["menu", "hamburger", "bars"],
  home: ["home", "house"],
  mail: ["mail", "email", "envelope", "message"],
  file: ["file", "document", "paper"],
  folder: ["folder", "directory"],
  image: ["image", "picture", "photo", "camera"],
  video: ["video", "film", "play"],
  music: ["music", "audio", "sound"],
  arrow: ["arrow", "chevron", "triangle"],
  check: ["check", "tick", "verify"],
  star: ["star", "favorite", "rating"],
  heart: ["heart", "like", "love"],
  lock: ["lock", "secure", "private"],
  unlock: ["unlock", "open", "public"],
  eye: ["eye", "view", "see", "visible"],
  eyeOff: ["eye-off", "hide", "invisible"],
  calendar: ["calendar", "date", "schedule"],
  clock: ["clock", "time", "watch"],
  bell: ["bell", "notification", "alert"],
  tag: ["tag", "label", "badge"],
  link: ["link", "chain", "url"],
  share: ["share", "send", "forward"],
  download: ["download", "save", "get"],
  upload: ["upload", "send", "put"],
  copy: ["copy", "duplicate", "clone"],
  cut: ["cut", "scissors"],
  paste: ["paste", "clipboard"],
};

// Parse icon name into keywords for search
function parseIconKeywords(iconName: string): string[] {
  // Split by hyphens and convert to lowercase
  const parts = iconName.toLowerCase().split("-");
  // Also include the full name
  return [...parts, iconName.toLowerCase()];
}

// Get semantic matches for a query
function getSemanticMatches(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const matches: string[] = [];

  // Check if query matches any semantic category
  Object.keys(semanticMetadata).forEach((category) => {
    if (category.includes(lowerQuery) || lowerQuery.includes(category)) {
      matches.push(...semanticMetadata[category]);
    }
  });

  return [...new Set(matches)]; // Remove duplicates
}

// Search function that prioritizes name matches
function searchIcons(
  query: string,
  icons: Record<string, IconData>,
  aliases: Record<string, { parent: string }>
): Array<{ name: string; isAlias: boolean; parent?: string }> {
  if (!query.trim()) {
    // Return all icons if no query
    return Object.keys(icons)
      .filter((name) => !icons[name].hidden)
      .map((name) => ({ name, isAlias: false }));
  }

  const lowerQuery = query.toLowerCase().trim();
  const results: Array<{ name: string; isAlias: boolean; parent?: string; score: number }> = [];

  // Get semantic matches for the query
  const semanticMatches = getSemanticMatches(lowerQuery);

  // Search in icon names (priority)
  Object.keys(icons).forEach((iconName) => {
    if (icons[iconName].hidden) return;

    const keywords = parseIconKeywords(iconName);
    let score = 0;

    // Exact match gets highest score
    if (iconName.toLowerCase() === lowerQuery) {
      score = 1000;
    }
    // Starts with query gets high score
    else if (iconName.toLowerCase().startsWith(lowerQuery)) {
      score = 500;
    }
    // Contains query gets medium score
    else if (iconName.toLowerCase().includes(lowerQuery)) {
      score = 200;
    }
    // Semantic match gets medium-high score (between contains and keyword match)
    else if (semanticMatches.includes(iconName.toLowerCase())) {
      score = 250;
    }
    // Keyword match gets lower score
    else {
      const keywordMatch = keywords.some(
        (keyword) => keyword.includes(lowerQuery) || lowerQuery.includes(keyword)
      );
      if (keywordMatch) {
        score = 100;
      }
    }

    if (score > 0) {
      results.push({ name: iconName, isAlias: false, score });
    }
  });

  // Search in aliases (lower priority)
  Object.keys(aliases).forEach((aliasName) => {
    const parent = aliases[aliasName].parent;
    if (!parent || !icons[parent] || icons[parent].hidden) return;

    let score = 0;

    // Exact match gets medium-high score
    if (aliasName.toLowerCase() === lowerQuery) {
      score = 300;
    }
    // Starts with query gets medium score
    else if (aliasName.toLowerCase().startsWith(lowerQuery)) {
      score = 150;
    }
    // Contains query gets lower score
    else if (aliasName.toLowerCase().includes(lowerQuery)) {
      score = 50;
    }

    if (score > 0) {
      results.push({ name: aliasName, isAlias: true, parent, score });
    }
  });

  // Sort by score (highest first), then by name
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });

  // Remove duplicates (keep highest score)
  const seen = new Set<string>();
  return results
    .filter((result) => {
      const key = result.isAlias ? result.parent! : result.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ name, isAlias, parent }) => ({ name, isAlias, parent }));
}

// Convert kebab-case to PascalCase for component name
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// Render SVG from icon body
function IconSVG({
  body,
  strokeWidth,
  animation,
  iconSize,
}: {
  body: string;
  strokeWidth: number;
  animation: string;
  iconSize: number;
}) {
  // Remove stroke-width and stroke color from path elements in the body (they override the SVG attributes)
  const cleanedBody = body.replace(/\sstroke-width="[^"]*"/g, "").replace(/\sstroke="[^"]*"/g, "");

  const animationClass =
    animation === "pulse" ? "animate-pulse" : animation === "spin" ? "animate-spin" : "";
  return (
    <div
      className={`${animationClass}`}
      style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
      dangerouslySetInnerHTML={{
        __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${cleanedBody}</svg>`,
      }}
    />
  );
}

export default function IconsSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [iconsData, setIconsData] = useState<IconsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState<number>(1);
  const [animation, setAnimation] = useState<string>("none");
  const [iconSize, setIconSize] = useState<number>(28);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Temporary state for dialog form
  const [tempStrokeWidth, setTempStrokeWidth] = useState<number>(1);
  const [tempAnimation, setTempAnimation] = useState<string>("none");
  const [tempIconSize, setTempIconSize] = useState<number>(28);

  const { toast } = useToast();

  // Initialize temp state when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setTempStrokeWidth(strokeWidth);
      setTempAnimation(animation);
      setTempIconSize(iconSize);
    }
  }, [dialogOpen, strokeWidth, animation, iconSize]);

  const handleApply = () => {
    setStrokeWidth(tempStrokeWidth);
    setAnimation(tempAnimation);
    setIconSize(tempIconSize);
    setDialogOpen(false);
    toast({
      title: "Settings applied",
      description: "Icon settings have been updated",
    });
  };

  const handleReset = () => {
    setTempStrokeWidth(1);
    setTempAnimation("none");
    setTempIconSize(28);
    toast({
      title: "Settings reset",
      description: "Icon settings have been reset to defaults",
    });
  };

  useEffect(() => {
    fetch("/lucide-icons-all.json")
      .then((res) => res.json())
      .then((data) => {
        setIconsData(data as IconsData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load icons data:", error);
        setIsLoading(false);
      });
  }, []);

  const filteredIcons = useMemo(() => {
    if (!iconsData) return [];
    return searchIcons(searchQuery, iconsData.icons, iconsData.aliases);
  }, [searchQuery, iconsData]);

  const copyIconName = (iconName: string) => {
    navigator.clipboard.writeText(iconName);
    toast({
      title: "Copied!",
      description: `Icon name "${iconName}" copied to clipboard`,
    });
  };

  const copyImportStatement = (iconName: string) => {
    const pascalName = kebabToPascal(iconName);
    const importStatement = `import { ${pascalName} } from "lucide-react";`;
    navigator.clipboard.writeText(importStatement);
    toast({
      title: "Copied!",
      description: `Import statement copied to clipboard`,
    });
  };

  const downloadSVG = (iconName: string, body: string) => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${iconName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: `Icon "${iconName}" downloaded as SVG`,
    });
  };

  const getIconBody = (iconName: string, isAlias: boolean, parent?: string): string => {
    if (!iconsData) return "";
    if (isAlias && parent) {
      return iconsData.icons[parent]?.body || "";
    }
    return iconsData.icons[iconName]?.body || "";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminBreadcrumb sectionName="Icon Search" sectionHref="/admin/tools/icons-search" />
        <div className="text-center py-12 text-muted-foreground">Loading icons...</div>
      </div>
    );
  }

  if (!iconsData) {
    return (
      <div className="space-y-6">
        <AdminBreadcrumb sectionName="Icon Search" sectionHref="/admin/tools/icons-search" />
        <div className="text-center py-12 text-muted-foreground">Failed to load icons data</div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <AdminBreadcrumb sectionName="Icon Search" sectionHref="/admin/tools/icons-search" />

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search icons by name or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Icon Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Icon Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon-size">Icon Size (px)</Label>
                    <Input
                      id="icon-size"
                      type="number"
                      min="16"
                      max="128"
                      value={tempIconSize}
                      onChange={(e) => setTempIconSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stroke-width">Stroke Width</Label>
                    <Select
                      value={tempStrokeWidth.toString()}
                      onValueChange={(value) => setTempStrokeWidth(Number(value))}
                    >
                      <SelectTrigger id="stroke-width">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="animation">Animation</Label>
                    <Select value={tempAnimation} onValueChange={setTempAnimation}>
                      <SelectTrigger id="animation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="spin">Spin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApply}>Apply</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="text-sm text-muted-foreground">
              {filteredIcons.length} {filteredIcons.length === 1 ? "icon" : "icons"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredIcons.map(({ name, isAlias, parent }) => {
              const iconBody = getIconBody(name, isAlias, parent);
              const displayName = name;
              const actualIconName = isAlias ? parent! : name;

              return (
                <Card key={name}>
                  <CardContent className="p-2 flex flex-col items-center gap-1.5">
                    <div
                      className="flex items-center justify-center text-muted-foreground"
                      style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                    >
                      <IconSVG
                        key={`${name}-${strokeWidth}-${animation}-${iconSize}`}
                        body={iconBody}
                        strokeWidth={strokeWidth}
                        animation={animation}
                        iconSize={iconSize}
                      />
                    </div>
                    <div className="w-full text-center">
                      <p className="text-xs font-medium truncate" title={displayName}>
                        {displayName}
                      </p>
                      {isAlias && (
                        <p className="text-xs text-muted-foreground truncate" title={parent}>
                          → {parent}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => copyIconName(displayName)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          copyImportStatement(actualIconName);
                        }}
                        title="Click to copy icon name, right-click to copy import statement"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => downloadSVG(displayName, iconBody)}
                        title="Download SVG"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No icons found matching "{searchQuery}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
