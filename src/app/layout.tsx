import type { Metadata } from "next";
import localFont from "next/font/local";

import "@/styles/globals.css";

import { Providers } from "./providers";

const inter = localFont({
  src: "../../public/fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: { default: "SPOTTED", template: "%s | SPOTTED" },
  description: "Save what you crave. Find it nearby.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
