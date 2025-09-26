import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const flecha = Crimson_Text({
  variable: "--font-flecha",
  subsets: ["latin"],
  weight: ["600", "600"],
});

export const metadata: Metadata = {
  title: "Rube",
  description: "Get something done today",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${flecha.variable} font-inter antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
