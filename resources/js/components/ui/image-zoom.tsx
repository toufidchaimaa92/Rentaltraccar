// components/ui/image-zoom.tsx
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Maximize2, Minus, Plus, RotateCcw, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageZoomProps = {
  src: string;
  alt?: string;
  className?: string;
  /** Thumbnail element (optional). If omitted, we'll render an <img>. */
  children?: React.ReactNode;
};

export function ImageZoom({ src, alt, className, children }: ImageZoomProps) {
  const [open, setOpen] = React.useState(false);
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const reset = () => {
    setScale(1);
    setRotation(0);
  };

  const zoomIn = () => setScale((s) => Math.min(5, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)));
  const rotateLeft = () => setRotation((r) => r - 90);
  const rotateRight = () => setRotation((r) => r + 90);

  // reset each time you open
  React.useEffect(() => {
    if (open) reset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <img
            src={src}
            alt={alt}
            className={cn(
              "h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover cursor-zoom-in bg-muted",
              className
            )}
            loading="lazy"
          />
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl p-2 sm:p-3">
        <div className="flex items-center justify-between gap-2 py-1 px-2 border-b rounded-t">
          <div className="text-sm text-muted-foreground truncate">{alt || "Image"}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom out">
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom in">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={rotateLeft} title="Rotate left">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={rotateRight} title="Rotate right">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={reset} title="Reset">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative w-full max-h-[75vh] overflow-auto flex items-center justify-center bg-background">
          <img
            src={src}
            alt={alt}
            className="max-w-none select-none"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
            onWheel={(e) => {
              e.preventDefault();
              if (e.deltaY < 0) zoomIn();
              else zoomOut();
            }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
