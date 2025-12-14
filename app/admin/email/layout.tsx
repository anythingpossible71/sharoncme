// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Don't wrap in EmailLayout here - the page component already does that
  return <>{children}</>;
}
