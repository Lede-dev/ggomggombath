import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { processSteps } from "@/data/site";

export const metadata: Metadata = {
  title: "욕실 부분시공 진행 과정",
  description: "사진 상담부터 제품·비용 안내, 일정 확정, 방문 시공과 마감 확인까지 꼼꼼욕실의 진행 과정을 안내합니다.",
  alternates: { canonical: "/process" },
};

const processSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "욕실 부분시공 진행 과정",
  description: "사진 상담부터 마감 확인까지 꼼꼼욕실의 욕실 부분시공 과정",
  step: processSteps.map((step) => ({ "@type": "HowToStep", position: Number(step.step), name: step.title, text: step.description })),
};

export default function ProcessPage() {
  return (
    <SiteShell>
      <JsonLd data={processSchema} />
      <main>
        <Breadcrumbs items={[{ label: "진행 과정" }]} />
        <PageHero eyebrow="WORK PROCESS" title={<>사진 상담부터<br /><em>마감 확인까지</em></>} description="현장 사진이 자세할수록 설치 가능 여부와 작업 범위를 빠르게 확인할 수 있습니다. 확인되지 않은 추가 작업은 현장에서 먼저 설명합니다." />
        <section className="content-section process-page-list">
          {processSteps.map((step) => <article key={step.step}><span>{step.step}</span><div><h2>{step.title}</h2><p>{step.description}</p></div></article>)}
        </section>
        <section className="content-section prepare-panel">
          <div><p className="section-label">BEFORE CONTACT</p><h2>상담 전에 준비하면<br />좋은 사진</h2></div>
          <ul>
            <li>교체할 제품 전체가 보이는 정면 사진</li>
            <li>제품 좌우 공간과 벽·바닥 주변 사진</li>
            <li>급수·배수 연결부와 누수 부위 사진</li>
            <li>희망 제품명 또는 모델명</li>
            <li>시공 지역과 가능한 날짜</li>
          </ul>
        </section>
        <ContactCta />
      </main>
    </SiteShell>
  );
}
