import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobGiga CALL Platform",
  description: "A premium Next.js template using Vanilla CSS",
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
