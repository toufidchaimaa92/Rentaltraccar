"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AuthCard({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <Card className="relative overflow-hidden rounded-2xl shadow-xl border border-border/60 backdrop-blur-md bg-white/70 dark:bg-zinc-900/80 p-8 text-center">
        {icon && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-4"
          >
            {icon}
          </motion.div>
        )}
        {children}
      </Card>
    </motion.div>
  );
}
