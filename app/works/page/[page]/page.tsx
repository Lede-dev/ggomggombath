import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorksArchive } from "@/components/WorksArchive";
import { WORKS_PAGE_SIZE, workArchivePath } from "@/components/WorkPagination";
import blogPostsData from "@/data/blog-posts.json";
import blogStatsData from "@/data/blog-stats.json";
import type { BlogStats, CasePost } from "@/data/site";

const posts = blogPostsData as CasePost[];
const stats = blogStatsData as BlogStats;
const totalPages = Math.ceil(posts.length / WORKS_PAGE_SIZE);
type ArchivePageProps = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({ page: String(index + 2) }));
}

export async function generateMetadata({ params }: ArchivePageProps): Promise<Metadata> {
  const currentPage = Number.parseInt((await params).page, 10);
  if (!Number.isInteger(currentPage) || currentPage < 2 || currentPage > totalPages) return {};
  return {
    title: `욕실 부분시공 사례 ${currentPage}페이지`,
    description: `서울·인천·경기 욕실 부분시공 ${stats.completedWorks}건 중 ${currentPage}페이지의 실제 현장과 제품, 작업 내용을 확인하세요.`,
    alternates: { canonical: workArchivePath(currentPage) },
  };
}

export default async function WorksArchivePage({ params }: ArchivePageProps) {
  const currentPage = Number.parseInt((await params).page, 10);
  if (!Number.isInteger(currentPage) || currentPage < 2 || currentPage > totalPages) notFound();
  return <WorksArchive posts={posts} stats={stats} currentPage={currentPage} />;
}
