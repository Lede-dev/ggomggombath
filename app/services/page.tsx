import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero, ServiceCards } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { services } from "@/data/site";

export const metadata: Metadata = {
  title: "욕실 부분시공 서비스",
  description: "서울·인천·경기 변기, 세면대, 수전·샤워, 욕실장·거울 교체 서비스와 상담 준비사항을 안내합니다.",
  alternates: { canonical: "/services" },
};

const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "꼼꼼욕실 부분시공 서비스",
  itemListElement: services.map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `https://ggomggombath.com/services/${service.slug}`,
    name: service.title,
  })),
};

export default function ServicesPage() {
  return (
    <SiteShell>
      <JsonLd data={servicesSchema} />
      <main>
        <Breadcrumbs items={[{ label: "부분시공 서비스" }]} />
        <PageHero eyebrow="BATHROOM SERVICES" title={<>필요한 곳만 선택하는<br /><em>욕실 부분시공</em></>} description="전체 욕실 공사가 부담스럽거나 특정 제품만 불편할 때, 현재 구조와 규격을 확인해 필요한 제품만 교체합니다." />
        <section className="content-section"><ServiceCards /></section>
        <section className="content-section service-notice">
          <div><p className="section-label">PLEASE NOTE</p><h2>현장마다 설치 조건이<br />다를 수 있습니다</h2></div>
          <div className="prose-stack"><p>같은 제품이라도 배관 위치와 타공 규격, 벽·바닥 상태에 따라 설치 방법이 달라집니다. 제품 구매 전에 현장 사진과 모델명을 함께 확인받는 것을 권장합니다.</p><p>사진으로 확인하기 어려운 손상이나 추가 보수가 발견되면 작업 전에 상태와 범위를 설명합니다.</p></div>
        </section>
        <ContactCta title="어떤 제품이 맞는지 먼저 확인하세요" />
      </main>
    </SiteShell>
  );
}
