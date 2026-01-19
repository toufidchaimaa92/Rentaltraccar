"use client";

import React, { useState } from "react";
import { MinusCircle, PlusCircle, RotateCcw, RotateCw, X } from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DEFAULT_PLACEHOLDER_URL =
  "https://raw.githubusercontent.com/stackzero-labs/ui/refs/heads/main/public/placeholders/headphone-2.jpg";

export type ImageZoomProps = {
  className?: string;
  classNameImageViewer?: string;
  classNameThumbnailViewer?: string;
  thumbnailClassName?: string;
  imageTitle?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  placeholderUrl?: string;
  showControls?: boolean;
};

export const ImageZoom = ({
  className,
  classNameImageViewer,
  classNameThumbnailViewer,
  imageTitle,
  imageUrl,
  placeholderUrl = DEFAULT_PLACEHOLDER_URL,
  showControls = true,
  thumbnailUrl,
  thumbnailClassName,
}: ImageZoomProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleImgError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = placeholderUrl;
  };

  const resolvedThumbnailClassName =
    thumbnailClassName ?? classNameThumbnailViewer;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setRotation(0);
        }
      }}
    >
      <DialogTrigger asChild>
        <div className={cn("cursor-pointer", className)}>
          <img
            src={thumbnailUrl || imageUrl}
            alt={`${imageTitle ?? "Image"} - Preview`}
            className={cn(
              "h-auto w-full rounded-lg object-contain transition-opacity hover:opacity-90",
              resolvedThumbnailClassName
            )}
            onError={handleImgError}
            loading="lazy"
          />
        </div>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogContent
          className="bg-background fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center p-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 !shadow-none !max-w-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {imageTitle || "Image"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {imageTitle || "Image"}
          </DialogDescription>
          <div
            className="relative flex h-screen w-screen items-center justify-center"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsOpen(false);
              }
            }}
          >
            <TransformWrapper initialScale={1} initialPositionX={0} initialPositionY={0}>
              {({ zoomIn, zoomOut }) => (
                <>
                  <TransformComponent>
                    <img
                      src={imageUrl}
                      alt={`${imageTitle ?? "Image"} - Full`}
                      className={cn(
                        "max-h-[90vh] max-w-[90vw] object-contain",
                        classNameImageViewer
                      )}
                      onError={handleImgError}
                      style={{ transform: `rotate(${rotation}deg)` }}
                    />
                  </TransformComponent>
                  {showControls && (
                    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                      <button
                        type="button"
                        onClick={() => zoomOut()}
                        className="cursor-pointer rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                        aria-label="Zoom out"
                      >
                        <MinusCircle className="size-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => zoomIn()}
                        className="cursor-pointer rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                        aria-label="Zoom in"
                      >
                        <PlusCircle className="size-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((value) => value - 90)}
                        className="cursor-pointer rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                        aria-label="Rotate left"
                      >
                        <RotateCcw className="size-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((value) => value + 90)}
                        className="cursor-pointer rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                        aria-label="Rotate right"
                      >
                        <RotateCw className="size-6" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </TransformWrapper>
            <DialogClose asChild>
              <button
                type="button"
                className="absolute top-4 right-4 z-10 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Close"
              >
                <X className="size-6" />
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export type ImageViewerProps = ImageZoomProps;
export const ImageViewer = ImageZoom;
export default ImageZoom;