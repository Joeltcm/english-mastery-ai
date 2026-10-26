import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = { title: "English Mastery AI", description: "A practical AI assistant and adaptive English-learning companion.", manifest: "/manifest.webmanifest", icons: { icon: "/icon.svg", apple: "/icon.svg" }, appleWebApp: { capable: true, title: "English Mastery", statusBarStyle: "default" } };
export const viewport: Viewport = { themeColor: "#28243e" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
