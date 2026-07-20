"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WorkCards } from "@/components/PageElements";
import type { WorkCardPost } from "@/data/site";

const PAGE_SIZE = 10;

function pageFromLocation(totalPages: number) {
  const value = Number.parseInt(new URLSearchParams(window.location.search).get("page") ?? "1", 10);
  return Number.isInteger(value) ? Math.min(Math.max(value, 1), totalPages) : 1;
}

function paginationItems(currentPage: number, totalPages: number) {
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]
    .filter((page) => page >= 1 && page <= totalPages))].sort((a, b) => a - b);
  const items: Array<number | string> = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push(`ellipsis-${pages[index - 1]}-${page}`);
    items.push(page);
  });
  return items;
}

export function WorkPagination({ posts }: { posts: WorkCardPost[] }) {
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPage = () => setCurrentPage(pageFromLocation(totalPages));
    syncPage();
    window.addEventListener("popstate", syncPage);
    return () => window.removeEventListener("popstate", syncPage);
  }, [totalPages]);

  const visiblePosts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return posts.slice(start, start + PAGE_SIZE);
  }, [currentPage, posts]);

  const firstItem = posts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(currentPage * PAGE_SIZE, posts.length);

  function moveToPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === currentPage) return;

    const url = new URL(window.location.href);
    if (nextPage === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(nextPage));
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setCurrentPage(nextPage);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior, block: "start" }));
  }

  return (
    <div className="works-paginated" id="works-list" ref={sectionRef}>
      <div className="works-page-summary">
        <strong>전체 시공 사례</strong>
        <span>{firstItem.toLocaleString("ko-KR")}–{lastItem.toLocaleString("ko-KR")} / {posts.length.toLocaleString("ko-KR")}건</span>
      </div>
      <WorkCards posts={visiblePosts} />
      {totalPages > 1 ? (
        <nav className="works-pagination" aria-label="시공 사례 페이지">
          <button type="button" onClick={() => moveToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="이전 페이지">이전</button>
          <div className="works-page-numbers">
            {paginationItems(currentPage, totalPages).map((item) => typeof item === "number" ? (
              <button type="button" key={item} onClick={() => moveToPage(item)} aria-current={item === currentPage ? "page" : undefined} aria-label={`${item}페이지`}>{item}</button>
            ) : <span key={item} aria-hidden="true">…</span>)}
          </div>
          <button type="button" onClick={() => moveToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="다음 페이지">다음</button>
          <p className="works-page-status" aria-live="polite">총 {totalPages}페이지 중 {currentPage}페이지</p>
        </nav>
      ) : null}
    </div>
  );
}
