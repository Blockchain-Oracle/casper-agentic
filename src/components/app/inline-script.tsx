"use client";

// Official Next.js "preventing-flash-before-hydration" InlineScript. MUST be a
// Client Component: on the server it renders type="text/javascript" so it executes
// pre-paint (no flash); on the client it re-renders as type="text/plain", which
// React 19 does not flag (a server-rendered inline <script> in a Server Component
// can't flip type and so keeps warning — that was the earlier mistake).
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
