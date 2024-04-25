import "./globals.css";
import HolyLoader from "holy-loader";

import { ClerkProvider } from "@clerk/nextjs";

import { fontSans } from "@/components/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Brainshare",
  description: "Why screenshare when you can brainshare?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // TODO set up offline development
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        {/* https://github.com/tomcru/holy-loader/issues/2 */}
        {/* color from globals.css:root:input */}
        <HolyLoader height={2} color="#738c7b" />
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
