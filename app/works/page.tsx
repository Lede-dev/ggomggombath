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
        <PageHero eyebrow="REAL WORKS" title={<>현장에서 확인한<br /><em>실제 시공 기록</em></>} description={`사람이 직접 작성한 꼼꼼욕실 네이버 블로그의 ${stats.completedWorks.toLocaleString("ko-KR")}건을 지역·제품·증상 중심으로 구조화했습니다. 각 사례의 정확한 표현과 전체 과정은 연결된 원문에서 확인할 수 있습니다.`}>
          <div className="works-summary"><strong>{stats.completedWorks.toLocaleString("ko-KR")}<small>건</small></strong><span>네이버 블로그 시공후기 카테고리 기준</span></div>
        </PageHero>
        <section className="content-section works-list-section" aria-label="시공 사례 목록"><WorkPagination posts={cardPosts} /></section>
        <section className="content-section source-note"><div><p className="section-label">SOURCE &amp; METHOD</p><h2>사람이 쓴 기록을<br />기준으로 정리합니다</h2></div><div className="prose-stack"><p>홈페이지는 네이버 원문 전체를 복제하지 않습니다. 원문에서 확인되는 지역, 제품, 증상과 대표 사진만 구조화하며 새로운 사실을 임의로 추가하지 않습니다. 해석이 필요한 내용은 사람이 직접 작성한 네이버 원문을 우선합니다.</p><a className="underlined-link" href={stats.sourceUrl} target="_blank" rel="noreferrer">네이버 시공후기 전체보기 ↗</a></div></section>
        <ContactCta title="비슷한 현장인지 사진으로 확인하세요" />
      </main>
    </SiteShell>
  );
}
