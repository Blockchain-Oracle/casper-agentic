import type { Metadata } from "next";
import "./globals.css";
import { InlineScript } from "@/components/app/inline-script";
import { ThemeProvider } from "@/components/app/theme-provider";
import { CsprClickProvider } from "@/components/csprclick/csprclick-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Casper GW — proof for every agent payment",
  description:
    "An x402 payment gateway on Casper. Publish paid tools, pay per call with an API key, and verify every settlement on-chain in the public explorer.",
};

// Runs in the server-rendered <head> before paint: sets data-theme from storage
// (default dark) with no flash. Rendered by a Server Component, so React never
// client-renders this <script> (which is what triggered the next-themes warning).
const THEME_NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InlineScript html={THEME_NO_FLASH_SCRIPT} />
      </head>
      <body>
        <div id="csprclick-ui" />
        <div id="app">
          <ThemeProvider>
            <CsprClickProvider>
              {children}
              <Toaster position="bottom-right" />
            </CsprClickProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
