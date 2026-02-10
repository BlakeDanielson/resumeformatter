import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Formatter",
  description: "Upload a PDF resume and get it reformatted to US standard format",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
