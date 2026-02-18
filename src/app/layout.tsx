import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { NavigationProvider } from "@/components/providers";

const atten = localFont({
  variable: "--font-atten",
  src: [
    { path: "../../public/fonts/new-atten-book.woff2", weight: "350", style: "normal" },
    { path: "../../public/fonts/new-atten-book-italic.woff2", weight: "350", style: "italic" },
    { path: "../../public/fonts/new-atten-regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/new-atten-regular-italic.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/new-atten-medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/new-atten-medium-italic.woff2", weight: "500", style: "italic" },
    { path: "../../public/fonts/new-atten-bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/new-atten-bold-italic.woff2", weight: "700", style: "italic" },
    { path: "../../public/fonts/new-atten-extrabold.woff2", weight: "800", style: "normal" },
    { path: "../../public/fonts/new-atten-extrabold-italic.woff2", weight: "800", style: "italic" },
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f2ea",
};

export const metadata: Metadata = {
  title: "Personal OS",
  description: "Your personal operating system for thoughts, tasks, and knowledge.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Personal OS",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={atten.variable}>
        <NavigationProvider>
          <AppShell>{children}</AppShell>
        </NavigationProvider>
      </body>
    </html>
  );
}
