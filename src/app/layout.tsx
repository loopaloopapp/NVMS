import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydraSEO - Next.js Metadata Visibility Scanner",
  description: "A tool to analyze technical SEO problems in Next.js sites caused by client-side rendering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
