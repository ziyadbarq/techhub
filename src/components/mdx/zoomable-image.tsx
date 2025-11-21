"use client";

/**
 * Zoomable Image Component for MDX
 * Allows clicking images to view them in a lightbox
 */

import { useState } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ZoomableImage({
  src,
  alt,
  width,
  height,
  className,
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <div
        className="group relative my-6 cursor-zoom-in"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative overflow-hidden rounded-lg border">
          {width && height ? (
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className={cn(
                "transition-transform group-hover:scale-105",
                className,
              )}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className={cn(
                "transition-transform group-hover:scale-105",
                className,
              )}
            />
          )}
        </div>
        {/* Zoom icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
          <div className="bg-background/90 rounded-full p-2 shadow-lg">
            <ZoomIn className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Lightbox dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] p-0 sm:max-w-[80vw]">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="bg-background/80 hover:bg-background absolute top-4 right-4 z-10 rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>

            {/* Full-size image */}
            <div className="flex items-center justify-center p-4">
              {width && height ? (
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  className="max-h-[80vh] w-auto object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[80vh] w-auto object-contain"
                />
              )}
            </div>

            {/* Caption */}
            {alt && (
              <div className="bg-background/90 border-t px-4 py-3">
                <p className="text-muted-foreground text-center text-sm">
                  {alt}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
