import Link from "next/link";
import { WorkCards } from "@/components/PageElements";
import type { WorkCardPost } from "@/data/site";

export const WORKS_PAGE_SIZE = 10;

export function workArchivePath(page: number) {
  return page <= 1 ? "/works" : `/works/page/${page}`;
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

export function WorkPagination({ posts, currentPage }: { posts: WorkCardPost[]; currentPage: number }) {
  const totalPages = Math.max(1, Math.ceil(posts.length / WORKS_PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (safePage - 1) * WORKS_PAGE_SIZE;
  const visiblePosts = posts.slice(start, start + WORKS_PAGE_SIZE);
  const firstItem = posts.length ? start + 1 : 0;
  const lastItem = Math.min(safePage * WORKS_PAGE_SIZE, posts.length);

  return (
    <div className="works-paginated" id="works-list">
      <div className="works-page-summary">
        <strong>전체 시공 사례</strong>
        <span>{firstItem.toLocaleString("ko-KR")}–{lastItem.toLocaleString("ko-KR")} / {posts.length.toLocaleString("ko-KR")}건</span>
      </div>
      <WorkCards posts={visiblePosts} />
      {totalPages > 1 ? (
        <nav className="works-pagination" aria-label="시공 사례 페이지">
          {safePage > 1
            ? <Link className="works-page-direction" href={workArchivePath(safePage - 1)} rel="prev" aria-label="이전 페이지">이전</Link>
            : <span className="works-page-direction disabled" aria-disabled="true" aria-label="이전 페이지">이전</span>}
          <div className="works-page-numbers">
            {paginationItems(safePage, totalPages).map((item) => typeof item === "number" ? (
              <Link key={item} href={workArchivePath(item)} aria-current={item === safePage ? "page" : undefined} aria-label={`${item}페이지`}>{item}</Link>
            ) : <span key={item} aria-hidden="true">…</span>)}
          </div>
          {safePage < totalPages
            ? <Link className="works-page-direction" href={workArchivePath(safePage + 1)} rel="next" aria-label="다음 페이지">다음</Link>
            : <span className="works-page-direction disabled" aria-disabled="true" aria-label="다음 페이지">다음</span>}
          <p className="works-page-status">총 {totalPages}페이지 중 {safePage}페이지</p>
        </nav>
      ) : null}
    </div>
  );
}
