import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { WorkPagination } from "@/components/WorkPagination";
import blogPostsData from "@/data/blog-posts.json";
import blogStatsData from "@/data/blog-stats.json";
import type { BlogStats, CasePost } from "@/data/site";

const posts = blogPostsData as CasePost[];
const stats = blogStatsData as BlogStats;
const cardPosts = posts.map(({ id, displayTitle, date, dateIso, image, excerpt, area, product, service }) => ({ id, displayTitle, date, dateIso, image, excerpt, area, product, service }));

export const metadata: Metadata = {
  title: "욕실 부분시공 사례",
  description: `서울·인천·경기 욕실 부분시공 ${stats.completedWorks}건의 기록 중 최근 변기 교체 현장과 제품, 문제 해결 과정을 확인하세요.`,
  alternates: { canonical: "/works" },
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "꼼꼼욕실 실제 시공 사례",
  numberOfItems: posts.length,
  itemListElement: posts.map((post, index) => ({ "@type": "ListItem", position: index + 1, name: post.displayTitle, url: `https://ggomggombath.com/works/${post.id}` })),
};

export default function WorksPage() {
  return (
    <SiteShell>
      <JsonLd data={itemListSchema} />
      <main>
        <Breadcrumbs items={[{ label: "시공 사례" }]} />
        <PageHero eyebrow="REAL WORKS" title={<>우리 집과 비슷한<br /><em>시공 사례를 찾아보세요</em></>} description={`꼼꼼욕실이 직접 작업한 ${stats.completedWorks.toLocaleString("ko-KR")}건의 욕실 현장을 모았습니다. 지역과 제품, 교체 전 불편 사항을 비교하며 우리 집에 필요한 시공을 미리 살펴보세요.`}>
          <div className="works-summary"><strong>{stats.completedWorks.toLocaleString("ko-KR")}<small>건</small></strong><span>지금까지 소개한 실제 시공 현장</span></div>
        </PageHero>
        <section className="content-section works-list-section" aria-label="시공 사례 목록"><WorkPagination posts={cardPosts} /></section>
        <section className="content-section source-note"><div><p className="section-label">TRUSTED RECORDS</p><h2>사진과 기록으로<br />미리 확인해 보세요</h2></div><div className="prose-stack"><p>모든 사례는 꼼꼼욕실이 직접 작업하고 네이버 블로그에 남긴 현장 기록을 바탕으로 소개합니다. 궁금한 현장의 핵심 내용을 먼저 살펴보고, 더 많은 사진과 전체 작업 과정은 블로그에서 이어서 확인할 수 있습니다.</p><a className="underlined-link" href={stats.sourceUrl} target="_blank" rel="noreferrer">네이버 시공후기 전체보기 ↗</a></div></section>
        <ContactCta title="비슷한 현장인지 사진으로 확인하세요" />
      </main>
    </SiteShell>
  );
}
