import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "PadelX - Premium Booking System",
  description: "Book your padel courts efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
          <NextAuthProvider>
            <Navbar />
            <main className="flex-1 w-full flex flex-col">
              {children}
            </main>
          </NextAuthProvider>
      </body>
    </html>
  );
}
