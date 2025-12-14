export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your application dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users", value: "1,234" },
          { title: "Active Sessions", value: "56" },
          { title: "Revenue", value: "$12,345" },
          { title: "Growth", value: "+12.5%" },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
          >
            <div className="text-sm font-medium text-muted-foreground">{stat.title}</div>
            <div className="mt-2 text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a placeholder for the App Sidebar Layout. Navigate using the sidebar on the left.
        </p>
      </div>
    </div>
  );
}
