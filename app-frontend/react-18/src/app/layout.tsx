import "./globals.css";
import { fontSans } from "brainshare-components/fonts";
import { cn } from "brainshare-components/utils";
import HolyLoader from "holy-loader";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Brainshare",
  description: "Why screenshare when you can brainshare?",
};

const config_json = process.env.NEXT_PUBLIC_CONFIG_JSON;
if (!config_json) {
  throw Error("Missing environment variable NEXT_PUBLIC_CONFIG_JSON");
}
const config = JSON.parse(config_json);
const PUBLISHABLE_KEY = config.CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <HolyLoader height={2} color="#738c7b" />
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
