import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video call",
  description: "1:1 video calls with Next.js, WebRTC and Supabase Realtime",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
