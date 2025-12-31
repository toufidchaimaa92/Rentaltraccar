"use client";

import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ThemeProvider } from "@/components/dashboard/theme-provider"; // ⭐ ADDED

export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme="system">
      <div className="min-h-screen relative flex flex-col overflow-hidden">
        {/* 🌄 Animated gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-100 via-white to-blue-200/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors duration-500" />

        <motion.div
          className="pointer-events-none absolute -z-10 w-[1000px] h-[1000px] rounded-full blur-3xl opacity-30 bg-gradient-to-tr from-fuchsia-400 via-pink-400 to-orange-300 dark:from-fuchsia-700 dark:via-fuchsia-500 dark:to-orange-400"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          style={{ top: "10%", left: "50%", transform: "translateX(-50%)" }}
        />

        {/* 🌸 Header (Centered Logo + Text same line) */}
        <header className="relative flex justify-center items-center px-4 sm:px-6 pt-4 sm:pt-6 pb-2 text-center">
          <Link
            href="/"
            aria-label="PasterLink home"
            className="flex items-center gap-2"
          >
            <motion.span
              className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r 
             from-foreground to-foreground/40 bg-clip-text text-transparent"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              TalianiAuto
            </motion.span>


          </Link>
        </header>

        {/* 🌿 Main Content */}
        <main className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full max-w-3xl flex items-center justify-center">{children}</div>
        </main>

        {/* 🩵 Decorative glow blobs */}
        <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-fuchsia-200/30 dark:bg-fuchsia-700/20 rounded-full blur-3xl opacity-40" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-pink-200/20 dark:bg-fuchsia-800/10 rounded-full blur-3xl opacity-40" />
      </div>
    </ThemeProvider>
  );
}
