import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin-ui/card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Badge } from "@/components/admin-ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Users, UserCheck, Clock, TrendingUp, CheckCircle2, Play } from "lucide-react";
import { lessons } from "@/lib/admin/lessons";

// Force dynamic rendering for Docker builds
export const dynamic = "force-dynamic";

async function getStats() {
  const [totalUsers, activeUsers, recentSignups] = await Promise.all([
    prisma.user.count({
      where: { deleted_at: null },
    }),
    prisma.user.count({
      where: {
        deleted_at: null,
        last_signed_in: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    }),
    prisma.user.count({
      where: {
        deleted_at: null,
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    recentSignups,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Project Dashboard" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentSignups}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Signups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.recentSignups / 7).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">7 day average</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Getting Started</h2>
          <p className="text-muted-foreground mt-2">
            Step-by-step guides to help you master the CrunchyCone starter project
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson, index) => (
            <Link key={lesson.id} href={`/admin/getting-started/${lesson.id}`} className="group">
              <Card className="h-full hover:shadow-lg transition-all border-2 hover:border-primary/50">
                <CardHeader className="p-0">
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                    <Image
                      src={lesson.thumbnailUrl}
                      alt={lesson.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary rounded-full p-4">
                        <Play className="h-8 w-8 text-primary-foreground fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/70 text-white border-0">
                        Lesson {index + 1}
                      </Badge>
                    </div>
                    {lesson.duration && (
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white border-0">
                          <Clock className="h-3 w-3 mr-1" />
                          {lesson.duration}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {lesson.title}
                    </CardTitle>
                    {lesson.isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
