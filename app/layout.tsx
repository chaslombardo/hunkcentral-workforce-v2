import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUNKCentral - Workforce Management",
  description: "Digital workforce management system for College Hunks Hauling Junk & Moving",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}