"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "lucide-react";

type Props = Omit<ImageProps, "onLoad" | "onError"> & {
  /** Use native img when remote domains aren't configured */
  unoptimizedFallback?: boolean;
  containerClassName?: string;
  fallbackLabel?: string;
};

export function SmartImage({
  className,
  containerClassName,
  alt,
  src,
  unoptimizedFallback = true,
  fallbackLabel,
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2",
          containerClassName,
          className
        )}
      >
        <Film className="h-6 w-6 opacity-50" />
        {fallbackLabel && <span className="text-xs px-2 text-center">{fallbackLabel}</span>}
      </div>
    );
  }

  const isRemote = typeof src === "string" && src.startsWith("http");

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {!loaded && <Skeleton className="absolute inset-0 z-[1]" />}
      {unoptimizedFallback || isRemote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={typeof src === "string" ? src : ""}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          {...props}
        />
      )}
    </div>
  );
}
