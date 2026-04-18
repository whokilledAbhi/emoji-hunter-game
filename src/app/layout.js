import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sans-display",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Emoji Hunter",
  description: "A fast, touch-friendly emoji arcade game built with Next.js.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
