"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

type SectionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  targetId: string;
  path: string;
};

export function scrollToSection(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
  const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerHeight);
  window.scrollTo({ top, behavior: "auto" });
}

export function SectionLink({ targetId, path, onClick, children, ...props }: SectionLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    if (!document.getElementById(targetId)) return;

    event.preventDefault();
    if (window.location.pathname !== path) {
      window.history.pushState(window.history.state, "", path);
    }
    scrollToSection(targetId);

    const mobileMenu = event.currentTarget.closest("details");
    if (mobileMenu instanceof HTMLDetailsElement) mobileMenu.open = false;
  }

  return (
    <a {...props} href={path} onClick={handleClick}>
      {children}
    </a>
  );
}
