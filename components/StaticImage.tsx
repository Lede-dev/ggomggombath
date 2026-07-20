import type { ComponentPropsWithoutRef } from "react";

type StaticImageProps = Omit<ComponentPropsWithoutRef<"img">, "alt"> & {
  alt: string;
};

export function StaticImage({ alt, ...props }: StaticImageProps) {
  // This site is deployed as assets-only, so native responsive images avoid a
  // runtime image endpoint while keeping decoding and layout hints in HTML.
  // eslint-disable-next-line @next/next/no-img-element
  return <img decoding="async" alt={alt} {...props} />;
}
