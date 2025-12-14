"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin-ui/card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { CodePreview } from "@/components/admin-ui/code-preview";

export const dynamic = "force-dynamic";

export default function UsefulCommandsPage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Useful commands" />

      <Card>
        <CardHeader>
          <CardTitle>Useful Commands</CardTitle>
          <CardDescription>
            Common commands and shortcuts for development and administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Slash shortcuts</h3>
              <p className="text-sm text-muted-foreground mb-3">
                These custom slash commands provide specialized code review and analysis
                capabilities in Cursor IDE. Type "/" in the chat to use them.
              </p>
              <div className="space-y-2">
                <div className="border rounded-md p-3">
                  <div className="inline-block">
                    <CodePreview code="/code-review" />
                  </div>
                  <p className="mt-2">
                    Comprehensive code quality analysis with security, performance, and
                    maintainability assessment
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <div className="inline-block">
                    <CodePreview code="/security-review" />
                  </div>
                  <p className="mt-2">
                    Specialized security assessment focusing on vulnerabilities, OWASP Top 10
                    compliance, and authentication patterns
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <div className="inline-block">
                    <CodePreview code="/test-review" />
                  </div>
                  <p className="mt-2">
                    Test quality and coverage analysis, including test structure, mocking
                    strategies, and CI/CD integration
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <div className="inline-block">
                    <CodePreview code="/performance-review" />
                  </div>
                  <p className="mt-2">
                    Performance and scalability analysis, including database query optimization, N+1
                    problem detection, and caching strategies
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <div className="inline-block">
                    <CodePreview code="/architecture-review" />
                  </div>
                  <p className="mt-2">
                    System architecture and design pattern evaluation, SOLID principles, API design,
                    and scalability assessment
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <div className="inline-block">
                    <CodePreview code="/refactor-suggest" />
                  </div>
                  <p className="mt-2">
                    Refactoring recommendations with implementation steps, code smell detection, and
                    before/after examples
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <div className="inline-block">
                    <CodePreview code="/crunchycone-build-log" />
                  </div>
                  <p className="mt-2">
                    Automatically fetches recent CrunchyCone build status, retrieves detailed logs
                    for failed builds, and diagnoses deployment issues
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
