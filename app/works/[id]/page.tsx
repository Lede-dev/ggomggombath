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
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/works/${post.id}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.dateIso, images: post.image ? [{ url: post.image, alt: `${post.area} 욕실 시공 현장` }] : undefined },
  };
}

function isSectionTitle(paragraph: string) {
  return paragraph.length < 72 && (/^[✅📌■▶]/.test(paragraph) || /(시공 전|시공 과정|시공 완료|제품 안내|교체 요청|마무리|전문 꼼꼼욕실)/.test(paragraph));
}

export default async function WorkDetailPage({ params }: WorkPageProps) {
  const { id } = await params;
  const post = posts.find((item) => item.id === id);
  if (!post) notFound();
  const canonical = `https://ggomggombath.com/works/${post.id}`;
  const relatedPosts = posts.filter((item) => item.id !== post.id).slice(0, 3);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.images.length ? post.images : [post.image],
    datePublished: post.dateIso,
    dateModified: post.dateIso,
    mainEntityOfPage: canonical,
    author: { "@id": "https://ggomggombath.com/#business", name: brand.name },
    publisher: { "@id": "https://ggomggombath.com/#business", name: brand.name, logo: { "@type": "ImageObject", url: `https://ggomggombath.com${brand.logoPath}` } },
    about: [post.area, post.product, "변기 교체"],
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://ggomggombath.com/" },
      { "@type": "ListItem", position: 2, name: "시공 사례", item: "https://ggomggombath.com/works" },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <SiteShell>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <main>
        <Breadcrumbs items={[{ label: "시공 사례", href: "/works" }, { label: `${post.area} 변기 교체` }]} />
        <article className="work-detail">
          <header className="work-detail-header">
            <p>REAL WORK · <time dateTime={post.dateIso}>{post.date}</time></p>
            <h1>{post.title}</h1>
            <p>{post.excerpt}</p>
            <div className="work-facts">
              <div><span>지역</span><strong>{post.area}</strong></div>
              <div><span>시공</span><strong>양변기 교체</strong></div>
              <div><span>제품</span><strong>{post.product}</strong></div>
              <div><span>주요 증상</span><strong>{post.issues.join(" · ")}</strong></div>
            </div>
          </header>
          {post.images.length > 0 && <div className="work-gallery lead-gallery">{post.images.slice(0, 3).map((image, index) => <figure key={image}><StaticImage src={image} alt={`${post.area} ${post.product} 변기 교체 현장 ${index + 1}`} width="800" height="800" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} referrerPolicy="no-referrer" /></figure>)}</div>}
          <div className="work-article-body">
            {post.content.map((paragraph, index) => isSectionTitle(paragraph) ? <h2 key={`${index}-${paragraph}`}>{paragraph.replace(/^[✅📌■▶]\s*/, "")}</h2> : <p key={`${index}-${paragraph}`}>{paragraph}</p>)}
          </div>
          {post.images.length > 3 && <div className="work-gallery secondary-gallery">{post.images.slice(3).map((image, index) => <figure key={image}><StaticImage src={image} alt={`${post.area} ${post.product} 변기 교체 상세 ${index + 4}`} width="800" height="800" loading="lazy" referrerPolicy="no-referrer" /></figure>)}</div>}
          <footer className="work-source"><span>기록 출처</span><p>이 페이지는 꼼꼼욕실이 직접 운영하는 네이버 블로그의 실제 시공 기록을 바탕으로 정리했습니다.</p><a href={post.link} target="_blank" rel="noreferrer">네이버 블로그 원문 보기 ↗</a></footer>
        </article>
        <section className="content-section related-works"><p className="section-label">RELATED WORKS</p><h2>다른 변기 교체 사례</h2><WorkCards posts={relatedPosts} /></section>
        <ContactCta title="같은 증상인지 사진으로 확인하세요" />
      </main>
    </SiteShell>
  );
}
