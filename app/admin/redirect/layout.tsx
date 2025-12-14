/**
 * Theme-neutral redirect layout
 * This layout has NO styles, NO themes, NO CSS imports
 * Theme clearing is handled by root layout script - no need to duplicate here
 */
export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  // Root layout script already handles theme clearing for redirect routes
  // No need to duplicate the clearing logic here
  return <>{children}</>;
}
