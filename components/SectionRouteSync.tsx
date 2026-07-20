"use client";

import { useEffect } from "react";
import { sectionNavigation } from "@/data/site";
import { scrollToSection } from "@/components/SectionLink";

const routeTargets = new Map<string, string>([
  ["/", "top"],
  ...sectionNavigation.map(({ path, targetId }) => [path, targetId] as const),
]);

export function SectionRouteSync() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const scrollToCurrentRoute = () => {
      const targetId = routeTargets.get(window.location.pathname);
      if (targetId) window.requestAnimationFrame(() => scrollToSection(targetId));
    };

    scrollToCurrentRoute();
    window.addEventListener("popstate", scrollToCurrentRoute);

    return () => {
      window.removeEventListener("popstate", scrollToCurrentRoute);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
}
