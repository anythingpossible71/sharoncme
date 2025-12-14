import { checkAdminExists } from "../actions/admin";
import { SetupAdminForm } from "../auth/setup-admin/SetupAdminForm";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function WelcomeBuilder() {
  const adminExists = await checkAdminExists();

  // Only show admin setup if no admin exists
  if (!adminExists) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <Image src="/crunchycone.svg" alt="CrunchyCone" width={80} height={80} />
              </div>
              <h1 className="text-4xl font-bold">Welcome Builder :-)</h1>
              <h2 className="text-xl text-muted-foreground">
                Create your project&apos;s admin account before you start building to control your
                project setting
              </h2>
            </div>

            {/* Admin signup form without card header */}
            <div className="flex justify-center">
              <SetupAdminForm />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If admin exists, show a message instead of redirecting
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Image src="/crunchycone.svg" alt="CrunchyCone" width={80} height={80} />
            </div>
            <h1 className="text-4xl font-bold">Welcome Builder :-)</h1>
            <h2 className="text-xl text-muted-foreground">
              Admin account already exists. You can still use this page to create additional admin
              accounts.
            </h2>
          </div>

          {/* Admin signup form without card header */}
          <div className="flex justify-center">
            <SetupAdminForm />
          </div>
        </div>
      </div>
    </div>
  );
}
