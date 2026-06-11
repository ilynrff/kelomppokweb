import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const inter = Inter({ subsets: ["latin"], display: 'swap', variable: "--font-inter" });
const syne = Syne({ subsets: ["latin"], display: 'swap', variable: "--font-syne", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "PadelGo - Premium Booking System",
  description: "Book your padel courts efficiently.",
  icons: {
    icon: "/images/tennis-balls.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="min-h-screen flex flex-col bg-dark-bg text-white font-sans antialiased">
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
