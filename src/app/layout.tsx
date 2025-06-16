import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { toastConfig } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "S3RD Chat",
  description: "An AI-powered chat application",
  metadataBase: new URL("https://s3rd-chat.s3rd.dev"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "S3RD Chat",
  },
  openGraph: {
    title: "S3RD Chat",
    description: "Experience intelligent conversations powered by advanced AI",
    images: [{ url: "/logo-512.png", width: 512, height: 512 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "S3RD Chat",
    description: "Experience intelligent conversations powered by advanced AI",
    images: [{ url: "/logo-512.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Toaster position={toastConfig.position} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
