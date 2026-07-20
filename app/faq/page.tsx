import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, ContactCta, PageHero } from "@/components/PageElements";
import { SiteShell } from "@/components/SiteChrome";
import { faqs } from "@/data/site";

export const metadata: Metadata = {
  title: "욕실 부분시공 자주 묻는 질문",
  description: "욕실 부분시공 가능 지역, 사진 상담, 제품 준비, 시공 시간, 철거와 추가 비용에 관한 답변을 확인하세요.",
  alternates: { canonical: "/faq" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
};

export default function FaqPage() {
  return (
    <SiteShell>
      <JsonLd data={faqSchema} />
      <main>
        <Breadcrumbs items={[{ label: "자주 묻는 질문" }]} />
        <PageHero eyebrow="FREQUENTLY ASKED QUESTIONS" title={<>시공 전에 확인하는<br /><em>꼼꼼한 답변</em></>} description="비용과 시간은 제품, 배관과 벽·바닥 상태에 따라 달라질 수 있습니다. 아래 기본 안내를 확인한 뒤 현장 사진으로 상담해 주세요." />
        <section className="content-section faq-page-list">
          {faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary><span>Q{String(index + 1).padStart(2, "0")}</span><h2>{faq.question}</h2><i aria-hidden="true">＋</i></summary><p>{faq.answer}</p></details>)}
        </section>
        <ContactCta title="사진으로 확인하면 더 정확합니다" />
      </main>
    </SiteShell>
  );
}
