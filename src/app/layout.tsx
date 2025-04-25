import type { Metadata } from "next";
import { PostHogProvider } from './providers'
// import localFont from "next/font/local";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Tape",
  description: "Rhythm Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
