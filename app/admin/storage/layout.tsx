// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Don't wrap in StorageLayout here - the page component already uses StorageLayoutTabs
  return <>{children}</>;
}
