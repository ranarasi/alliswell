import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AllIsWell - Project Status Tracker",
  description: "Track weekly project status updates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-text">
        {children}
      </body>
    </html>
  );
}
