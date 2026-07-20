"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

type SectionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  targetId: string;
};

export function SectionLink({ targetId, onClick, children, ...props }: SectionLinkProps) {
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

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();

    const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerHeight);

    window.scrollTo({ top, behavior: "auto" });
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);

    const mobileMenu = event.currentTarget.closest("details");
    if (mobileMenu instanceof HTMLDetailsElement) mobileMenu.open = false;
  }

  return (
    <a {...props} href={`#${targetId}`} onClick={handleClick}>
      {children}
    </a>
  );
}
