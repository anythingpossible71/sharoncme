export type Lesson = {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  isCompleted: boolean;
  duration?: string;
};

export const lessons: Lesson[] = [
  {
    id: "setting-up-your-project",
    title: "Setting up your project",
    description:
      "Learn how to install dependencies, configure environment variables, and get your CrunchyCone starter project running locally.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    isCompleted: false,
    duration: "5:30",
  },
  {
    id: "getting-to-know-your-builder-admin",
    title: "Getting to know your builder admin",
    description:
      "Explore the admin dashboard, understand the navigation structure, and discover all the powerful features available to you.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    isCompleted: false,
    duration: "8:15",
  },
  {
    id: "hello-world-your-first-edit",
    title: "Hello world - your first edit",
    description:
      "Make your first change to the application by editing a page and seeing it live. Learn the basics of the component system.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    isCompleted: false,
    duration: "6:45",
  },
  {
    id: "adding-and-removing-pages",
    title: "Adding and removing pages to your app",
    description:
      "Master page management by learning how to create new pages, customize routes, and organize your application structure.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    isCompleted: false,
    duration: "7:20",
  },
  {
    id: "understand-the-crunchycone-template",
    title: "Understand the CrunchyCone template",
    description:
      "Deep dive into the template architecture, folder structure, and learn how all the pieces work together.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    isCompleted: false,
    duration: "12:00",
  },
  {
    id: "how-to-preview-and-publish",
    title: "How to preview and publish your app",
    description:
      "Learn how to preview your changes locally, test your application, and deploy it to production with CrunchyCone.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    isCompleted: false,
    duration: "9:30",
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function getLessonIndex(id: string): number {
  return lessons.findIndex((lesson) => lesson.id === id);
}

export function getNextLesson(currentId: string): Lesson | undefined {
  const currentIndex = getLessonIndex(currentId);
  if (currentIndex === -1 || currentIndex === lessons.length - 1) {
    return undefined;
  }
  return lessons[currentIndex + 1];
}

export function getPreviousLesson(currentId: string): Lesson | undefined {
  const currentIndex = getLessonIndex(currentId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return lessons[currentIndex - 1];
}
