import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero, ServiceCards } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { brand, serviceBySlug, services } from "@/data/site";

type ServicePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug.get(slug);
  if (!service) return {};
  return {
    title: `${service.shortTitle} 시공 | 서울·인천·경기`,
    description: `${service.intro} 꼼꼼욕실 ${service.shortTitle} 서비스의 작업 범위와 상담 준비사항을 확인하세요.`,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = serviceBySlug.get(slug);
  if (!service) notFound();

  const serviceUrl = `https://ggomggombath.com/services/${service.slug}`;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    serviceType: service.shortTitle,
    description: service.intro,
    url: serviceUrl,
    areaServed: ["서울특별시", "인천광역시", "경기도"],
    provider: { "@id": "https://ggomggombath.com/#business", name: brand.name, telephone: brand.phone },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://ggomggombath.com/" },
      { "@type": "ListItem", position: 2, name: "부분시공", item: "https://ggomggombath.com/services" },
      { "@type": "ListItem", position: 3, name: service.title, item: serviceUrl },
    ],
  };

  return (
    <SiteShell>
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      <main>
        <Breadcrumbs items={[{ label: "부분시공", href: "/services" }, { label: service.title }]} />
        <PageHero eyebrow={`SERVICE ${service.number}`} title={<>{service.title}<br /><em>현장에 맞게 정확하게</em></>} description={service.intro}>
          <div className="page-hero-tags">{service.items.map((item) => <span key={item}>{item}</span>)}</div>
        </PageHero>
        <section className="content-section service-detail-grid">
          <article><p className="section-label">WHEN TO REPLACE</p><h2>교체를 고려할 때</h2><ul>{service.concerns.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><p className="section-label">WORK SCOPE</p><h2>기본 작업 범위</h2><ol>{service.included.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ol></article>
        </section>
        <section className="content-section prepare-panel">
          <div><p className="section-label">PHOTO CHECK</p><h2>상담에 필요한<br />현장 정보</h2></div>
          <ul>{service.checks.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="content-section related-services"><p className="section-label">OTHER SERVICES</p><ServiceCards compact /></section>
        <ContactCta title={`${service.shortTitle}, 사진으로 먼저 확인하세요`} />
      </main>
    </SiteShell>
  );
}
