import "./globals.css";

import { ReactNode } from "react";

import HolyLoader from "holy-loader";
import { type Metadata } from "next";

import { fontSans } from "@/components/fonts";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils/tailwind";

export const metadata: Metadata = {
  title: "Brainshare",
  description: "Why screenshare when you can brainshare?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
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
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
