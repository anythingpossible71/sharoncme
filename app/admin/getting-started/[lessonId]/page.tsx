import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Card, CardContent } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Badge } from "@/components/admin-ui/badge";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import {
  getLessonById,
  getNextLesson,
  getPreviousLesson,
  getLessonIndex,
  lessons,
} from "@/lib/admin/lessons";
import { notFound } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  const nextLesson = getNextLesson(lessonId);
  const previousLesson = getPreviousLesson(lessonId);
  const currentIndex = getLessonIndex(lessonId);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Getting Started" subsectionName={lesson.title} />

      {/* Lesson Info Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            Lesson {currentIndex + 1} of {lessons.length}
          </Badge>
          {lesson.duration && (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {lesson.duration}
            </Badge>
          )}
          {lesson.isCompleted && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe
              src={lesson.youtubeUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lesson Navigation */}
      <div className="flex items-center justify-between pt-4">
        <div>
          {previousLesson ? (
            <Link href={`/admin/getting-started/${previousLesson.id}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous: {previousLesson.title}
              </Button>
            </Link>
          ) : (
            <Link href="/admin/getting-started">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
            </Link>
          )}
        </div>

        <div>
          {nextLesson ? (
            <Link href={`/admin/getting-started/${nextLesson.id}`}>
              <Button variant="default">
                Next: {nextLesson.title}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link href="/admin/getting-started">
              <Button variant="default">
                Back to Overview
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Lesson Content Area (for future transcript/notes) */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">About this lesson</h3>
          <p className="text-muted-foreground">{lesson.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
