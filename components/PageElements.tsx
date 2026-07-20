import Link from "next/link";
import { PhoneContact } from "@/components/PhoneContact";
import { StaticImage } from "@/components/StaticImage";
import { brand, services, type WorkCardPost } from "@/data/site";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumbs" aria-label="현재 위치">
      <Link href="/">홈</Link>
      {items.map((item) => <span key={`${item.href ?? "current"}-${item.label}`}><i aria-hidden="true">/</i>{item.href ? <Link href={item.href}>{item.label}</Link> : <b>{item.label}</b>}</span>)}
    </nav>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: React.ReactNode; description: string; children?: React.ReactNode }) {
  return (
    <section className="page-hero">
      <div className="page-hero-grid" aria-hidden="true" />
      <p className="page-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-lead">{description}</p>
      {children}
    </section>
  );
}

export function ServiceCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`service-card-grid${compact ? " compact" : ""}`}>
      {services.map((service) => (
        <article className="service-card" key={service.slug}>
          <span>{service.number}</span>
          <h2>{service.title}</h2>
          <p>{service.description}</p>
          <ul>{service.items.map((item) => <li key={item}>{item}</li>)}</ul>
          <Link href={`/services/${service.slug}`}>자세히 보기 <span aria-hidden="true">→</span></Link>
        </article>
      ))}
    </div>
  );
}

export function WorkCards({ posts, limit }: { posts: WorkCardPost[]; limit?: number }) {
  const visiblePosts = typeof limit === "number" ? posts.slice(0, limit) : posts;
  return (
    <div className="work-card-grid">
      {visiblePosts.map((post) => (
        <article className="work-card" key={post.id}>
          <Link href={`/works/${post.id}`}>
            <div className="work-card-image">
              <StaticImage src={post.image} alt={`${post.area} ${post.product || post.service} 시공 현장`} width="800" height="600" loading="lazy" referrerPolicy="no-referrer" />
            </div>
            <div className="work-card-copy">
              <div><span>{post.area}</span><time dateTime={post.dateIso}>{post.date}</time></div>
              <h2>{post.displayTitle}</h2>
              <p>{post.excerpt}</p>
              <b>사례 자세히 보기 <span aria-hidden="true">→</span></b>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}

export function ContactCta({ title = "사진으로 먼저 확인해 드립니다" }: { title?: string }) {
  return (
    <section className="page-contact-cta" aria-labelledby="page-contact-title">
      <p>PHOTO CONSULTATION</p>
      <h2 id="page-contact-title">{title}</h2>
      <span>교체할 제품 전체와 배관·바닥 주변, 시공 지역을 알려주시면 설치 가능 여부와 예상 범위를 안내합니다.</span>
      <div>
        <PhoneContact className="final-phone" />
        <a className="button button-outline-light" href={brand.naverBlog} target="_blank" rel="noreferrer">네이버 블로그 상담 <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}
