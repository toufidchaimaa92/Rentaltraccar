"use client";

import React, { ReactNode, useState } from "react";
import { toast } from "sonner";
import { ClipboardIcon } from "lucide-react";

interface CopyButtonProps {
  children: ReactNode; // text to copy
}

export default function CopyButton({ children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const textToCopy = typeof children === "string" ? children : "";

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not supported");
      return;
    }
    if (!textToCopy) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success("Copied to clipboard!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all 
        ${
          copied
            ? "bg-green-400 text-white hover:bg-green-500 active:bg-green-600"
            : "bg-fuchsia-300/20 text-fuchsia-800 hover:bg-fuchsia-300/15 active:bg-fuchsia-300/30 dark:text-fuchsia-400"
        }`}
      onClick={handleCopy}
      type="button"
      aria-label="Copy paste link"
    >
      Copy Paste Link
      <ClipboardIcon className="h-4 w-4" />
    </button>
  );
}
