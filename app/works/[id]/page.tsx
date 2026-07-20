import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, WorkCards } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { StaticImage } from "@/components/StaticImage";
import blogPostsData from "@/data/blog-posts.json";
import { brand, type CasePost } from "@/data/site";

const posts = blogPostsData as CasePost[];
type WorkPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return posts.map((post) => ({ id: post.id }));
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = posts.find((item) => item.id === id);
  if (!post) return {};
  return {
    title: post.seoTitle,
    description: post.summary,
    alternates: { canonical: `/works/${post.id}` },
    robots: post.quality === "indexable" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "article",
      title: post.seoTitle,
      description: post.summary,
      publishedTime: post.dateIso,
      modifiedTime: post.processedAt,
      images: post.image ? [{ url: post.image, alt: `${post.area} ${post.service} 현장` }] : undefined,
    },
  };
}

function relevanceScore(candidate: CasePost, source: CasePost) {
  let score = 0;
  if (candidate.service === source.service) score += 5;
  if (candidate.area === source.area) score += 4;
  if (candidate.product && candidate.product === source.product) score += 3;
  score += candidate.issues.filter((issue) => source.issues.includes(issue)).length;
  return score;
}

export default async function WorkDetailPage({ params }: WorkPageProps) {
  const { id } = await params;
  const post = posts.find((item) => item.id === id);
  if (!post) notFound();
  const canonical = `https://ggomggombath.com/works/${post.id}`;
  const relatedPosts = posts
    .filter((item) => item.id !== post.id)
    .map((item) => ({ item, score: relevanceScore(item, post) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle,
    alternativeHeadline: post.title,
    description: post.summary,
    image: post.images.slice(0, 5),
    datePublished: post.dateIso,
    dateModified: post.processedAt,
    mainEntityOfPage: canonical,
    isBasedOn: post.link,
    citation: post.link,
    articleSection: "원문 기반 시공 사례",
    keywords: [post.area, post.service, post.product, ...post.issues].filter(Boolean).join(", "),
    author: { "@id": "https://ggomggombath.com/#business", name: brand.name },
    publisher: { "@id": "https://ggomggombath.com/#business", name: brand.name, logo: { "@type": "ImageObject", url: `https://ggomggombath.com${brand.logoPath}` } },
    about: [post.area, post.service, post.product, ...post.issues].filter(Boolean),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://ggomggombath.com/" },
      { "@type": "ListItem", position: 2, name: "시공 사례", item: "https://ggomggombath.com/works" },
      { "@type": "ListItem", position: 3, name: post.displayTitle, item: canonical },
    ],
  };

  return (
    <SiteShell>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <main>
        <Breadcrumbs items={[{ label: "시공 사례", href: "/works" }, { label: `${post.area} ${post.service}` }]} />
        <article className="work-detail">
          <header className="work-detail-header">
            <p>실제 시공 사례 · <time dateTime={post.dateIso}>{post.date}</time></p>
            <h1>{post.displayTitle}</h1>
            <p>{post.summary}</p>
            <aside className="source-provenance" aria-label="실제 시공 기록 안내">
              <span>꼼꼼욕실의 실제 현장 기록</span>
              <strong>직접 작업하고 사진과 함께 남긴 시공 사례입니다.</strong>
              <p>사진과 핵심 내용을 먼저 살펴보며 우리 집과 비슷한 조건인지 비교해 보세요. 더 자세한 작업 과정은 네이버 블로그에서 이어서 확인할 수 있습니다.</p>
              <a href={post.link} target="_blank" rel="noreferrer">전체 작업 과정 보기 ↗</a>
            </aside>
            <div className="work-facts">
              <div><span>지역</span><strong>{post.area}</strong></div>
              <div><span>시공</span><strong>{post.service}</strong></div>
              <div><span>제품</span><strong>{post.product || "원문에서 확인"}</strong></div>
              <div><span>교체 전 불편</span><strong>{post.issues.length ? post.issues.join(" · ") : "상세 기록에서 확인"}</strong></div>
            </div>
          </header>
          {post.images.length > 0 ? (
            <div className="work-gallery lead-gallery">
              {post.images.slice(0, 3).map((image, index) => (
                <figure key={image}>
                  <StaticImage src={image} alt={`${post.area} ${post.product || post.service} 시공 현장 ${index + 1}`} width="800" height="800" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} referrerPolicy="no-referrer" />
                </figure>
              ))}
            </div>
          ) : null}
          <section className="work-article-body structured-case-body" aria-labelledby="source-highlights-title">
            <p className="section-label">WORK NOTES</p>
            <h2 id="source-highlights-title">이 현장에서 눈여겨볼 점</h2>
            <p className="structured-case-intro">교체를 고민하는 분들이 가장 궁금해할 만한 내용을 실제 현장 기록에서 골라 소개합니다.</p>
            <ol className="source-highlights">
              {post.highlights.map((highlight, index) => (
                <li key={`${index}-${highlight}`}>
                  <span>0{index + 1}</span>
                  <p>{highlight}</p>
                </li>
              ))}
            </ol>
            <aside className="case-reading-note">
              <span>우리 집과 비교할 때 참고하세요</span>
              <p>같은 불편이라도 배관 위치, 설치 공간과 기존 제품 규격에 따라 알맞은 제품과 작업 범위가 달라질 수 있습니다. 정확한 내용은 현장 사진을 확인한 뒤 안내해 드립니다.</p>
            </aside>
          </section>
          {post.images.length > 3 ? (
            <div className="work-gallery secondary-gallery">
              {post.images.slice(3, 5).map((image, index) => (
                <figure key={image}>
                  <StaticImage src={image} alt={`${post.area} ${post.service} 원문 기록 사진 ${index + 4}`} width="800" height="800" loading="lazy" referrerPolicy="no-referrer" />
                </figure>
              ))}
            </div>
          ) : null}
          <footer className="work-source">
            <span>MORE PHOTOS &amp; DETAILS</span>
            <h2>더 많은 사진과 작업 과정</h2>
            <dl>
              <div><dt>네이버 현장 기록</dt><dd>{post.title}</dd></div>
              <div><dt>시공 사례 등록일</dt><dd><time dateTime={post.dateIso}>{post.date}</time></dd></div>
            </dl>
            <a href={post.link} target="_blank" rel="noreferrer">네이버 블로그에서 전체 시공 과정 보기 ↗</a>
          </footer>
        </article>
        <section className="content-section related-works"><p className="section-label">RELATED WORKS</p><h2>조건이 비슷한 시공 사례</h2><WorkCards posts={relatedPosts} /></section>
        <ContactCta title="같은 증상인지 사진으로 확인하세요" />
      </main>
    </SiteShell>
  );
}
