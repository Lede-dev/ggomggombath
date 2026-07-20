import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { brand, reasons } from "@/data/site";

export const metadata: Metadata = {
  title: "꼼꼼욕실 소개",
  description: "서울·인천·경기 욕실 부분시공 전문 꼼꼼욕실의 시공 원칙과 상담 방식을 안내합니다.",
  alternates: { canonical: "/about" },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "꼼꼼욕실 소개",
  url: "https://ggomggombath.com/about",
  about: { "@id": "https://ggomggombath.com/#business" },
};

export default function AboutPage() {
  return (
    <SiteShell>
      <JsonLd data={aboutSchema} />
      <main>
        <Breadcrumbs items={[{ label: "꼼꼼욕실 소개" }]} />
        <PageHero eyebrow="ABOUT GGOMGGOM BATH" title={<>전체 공사보다<br /><em>필요한 교체에 집중합니다</em></>} description="꼼꼼욕실은 서울·인천·경기 주거 공간을 방문해 변기, 세면기, 수전, 욕실장 등 필요한 부분만 확인하고 교체하는 욕실 부분시공 서비스입니다." />
        <section className="content-section split-copy">
          <div><p className="section-label">OUR APPROACH</p><h2>작은 부분이라도<br />확인할 것은 분명하게</h2></div>
          <div className="prose-stack">
            <p>욕실 제품은 겉모양이 비슷해도 배관 위치와 설치 규격, 벽면과 바닥 상태에 따라 시공 가능 여부가 달라집니다. 꼼꼼욕실은 현장 사진과 요청 내용을 먼저 확인하고 필요한 제품과 작업 범위를 안내합니다.</p>
            <p>철거 후에는 배관과 고정 상태를 살피고, 설치 후에는 수평·작동·누수와 주변 마감을 확인합니다. 사진으로 알 수 없는 추가 작업이 필요한 경우에는 진행 전에 상태와 범위를 설명합니다.</p>
          </div>
        </section>
        <section className="content-section soft-section">
          <p className="section-label">OUR STANDARD</p>
          <div className="principle-grid">
            {reasons.map((reason, index) => <article key={reason.keyword}><span>0{index + 1}</span><small>{reason.keyword}</small><h2>{reason.title}</h2><p>{reason.description}</p></article>)}
          </div>
        </section>
        <section className="content-section service-area-panel">
          <div><p className="section-label">SERVICE AREA</p><h2>{brand.serviceArea}</h2></div>
          <p>지역과 일정, 이동 거리 및 현장 조건에 따라 방문 가능 여부가 달라질 수 있습니다. 상담 시 지역과 희망 일정을 알려주시면 함께 확인해 드립니다.</p>
        </section>
        <ContactCta title="필요한 부분부터 정확하게 상담하세요" />
      </main>
    </SiteShell>
  );
}
