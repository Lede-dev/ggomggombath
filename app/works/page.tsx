import type { Metadata } from "next";
import { WorksArchive } from "@/components/WorksArchive";
import blogPostsData from "@/data/blog-posts.json";
import blogStatsData from "@/data/blog-stats.json";
import type { BlogStats, CasePost } from "@/data/site";

const posts = blogPostsData as CasePost[];
const stats = blogStatsData as BlogStats;

export const metadata: Metadata = {
  title: "욕실 부분시공 사례",
  description: `서울·인천·경기 욕실 부분시공 ${stats.completedWorks}건의 기록 중 최근 변기 교체 현장과 제품, 문제 해결 과정을 확인하세요.`,
  alternates: { canonical: "/works" },
};

export default function WorksPage() {
  return <WorksArchive posts={posts} stats={stats} currentPage={1} />;
}
