import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { WorkPagination, WORKS_PAGE_SIZE } from "@/components/WorkPagination";
import type { BlogStats, CasePost } from "@/data/site";

export function WorksArchive({ posts, stats, currentPage }: { posts: CasePost[]; stats: BlogStats; currentPage: number }) {
  const start = (currentPage - 1) * WORKS_PAGE_SIZE;
  const visiblePosts = posts.slice(start, start + WORKS_PAGE_SIZE);
  const cardPosts = posts.map(({ id, displayTitle, date, dateIso, image, excerpt, area, product, service }) => ({ id, displayTitle, date, dateIso, image, excerpt, area, product, service }));
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: currentPage === 1 ? "꼼꼼욕실 실제 시공 사례" : `꼼꼼욕실 실제 시공 사례 ${currentPage}페이지`,
    numberOfItems: posts.length,
    itemListElement: visiblePosts.map((post, index) => ({
      "@type": "ListItem",
      position: start + index + 1,
      name: post.displayTitle,
      url: `https://ggomggombath.com/works/${post.id}`,
    })),
  };

  return (
    <SiteShell>
      <JsonLd data={itemListSchema} />
      <main>
        <Breadcrumbs items={[{ label: currentPage === 1 ? "시공 사례" : `시공 사례 ${currentPage}페이지` }]} />
        <PageHero eyebrow="REAL WORKS" title={<>우리 집과 비슷한<br /><em>시공 사례를 찾아보세요</em></>} description={`꼼꼼욕실이 직접 작업한 ${stats.completedWorks.toLocaleString("ko-KR")}건의 욕실 현장을 모았습니다. 지역과 제품, 교체 전 불편 사항을 비교하며 우리 집에 필요한 시공을 미리 살펴보세요.`}>
          <div className="works-summary"><strong>{stats.completedWorks.toLocaleString("ko-KR")}<small>건</small></strong><span>지금까지 소개한 실제 시공 현장</span></div>
        </PageHero>
        <section className="content-section works-list-section" aria-label="시공 사례 목록"><WorkPagination posts={cardPosts} currentPage={currentPage} /></section>
        <section className="content-section source-note"><div><p className="section-label">TRUSTED RECORDS</p><h2>사진과 기록으로<br />미리 확인해 보세요</h2></div><div className="prose-stack"><p>모든 사례는 꼼꼼욕실이 직접 작업하고 네이버 블로그에 남긴 현장 기록을 바탕으로 소개합니다. 궁금한 현장의 핵심 내용을 먼저 살펴보고, 더 많은 사진과 전체 작업 과정은 블로그에서 이어서 확인할 수 있습니다.</p><a className="underlined-link" href={stats.sourceUrl} target="_blank" rel="noreferrer">네이버 시공후기 전체보기 ↗</a></div></section>
        <ContactCta title="비슷한 현장인지 사진으로 확인하세요" />
      </main>
    </SiteShell>
  );
}
