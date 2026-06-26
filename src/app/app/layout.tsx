import { AppChrome } from "@/components/app/app-chrome";
import { WorkspaceProvider } from "@/components/app/workspace-provider";

// The wallet-gated operator app. `data-surface="app"` flips the design tokens to
// the dark v3 theme; WorkspaceProvider holds the shared domain hooks; AppChrome
// renders the top nav + CSPR.click mount nodes + the connect gate around each route.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="app">
      <WorkspaceProvider>
        <AppChrome>{children}</AppChrome>
      </WorkspaceProvider>
    </div>
  );
}
