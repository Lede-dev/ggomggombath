import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero, WorkCards } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
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

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "꼼꼼욕실 실제 시공 사례",
  numberOfItems: posts.length,
  itemListElement: posts.map((post, index) => ({ "@type": "ListItem", position: index + 1, name: post.title, url: `https://ggomggombath.com/works/${post.id}` })),
};

export default function WorksPage() {
  return (
    <SiteShell>
      <JsonLd data={itemListSchema} />
      <main>
        <Breadcrumbs items={[{ label: "시공 사례" }]} />
        <PageHero eyebrow="REAL WORKS" title={<>현장에서 확인한<br /><em>실제 시공 기록</em></>} description={`꼼꼼욕실이 기록한 ${stats.completedWorks.toLocaleString("ko-KR")}건의 시공 사례 중 최근 현장을 정리했습니다. 지역, 제품과 교체 전 문제를 확인하고 비슷한 조건의 사례를 찾아보세요.`}>
          <div className="works-summary"><strong>{stats.completedWorks.toLocaleString("ko-KR")}<small>건</small></strong><span>네이버 블로그 시공후기 카테고리 기준</span></div>
        </PageHero>
        <section className="content-section works-list-section"><WorkCards posts={posts} /></section>
        <section className="content-section source-note"><div><p className="section-label">SOURCE &amp; UPDATE</p><h2>현장 원문도 함께<br />확인할 수 있습니다</h2></div><div className="prose-stack"><p>각 사례는 꼼꼼욕실이 직접 운영하는 네이버 블로그의 시공 기록을 바탕으로 구성했습니다. 상세 페이지에서 원문 링크와 작업일을 함께 확인할 수 있습니다.</p><a className="underlined-link" href={stats.sourceUrl} target="_blank" rel="noreferrer">네이버 시공후기 전체보기 ↗</a></div></section>
        <ContactCta title="비슷한 현장인지 사진으로 확인하세요" />
      </main>
    </SiteShell>
  );
}
