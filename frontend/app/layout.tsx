import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PDMProvider } from "@/lib/pdmContext";

export const metadata: Metadata = {
  title: "AllIsWell - Project Status Tracker",
  description: "Track weekly project status updates",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-text">
        <PDMProvider>
          {children}
        </PDMProvider>
      </body>
    </html>
  );
}
