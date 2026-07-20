import { HeroLatestPost } from "@/components/HeroLatestPost";
import { LatestPosts } from "@/components/LatestPosts";
import { brand, fallbackPosts, faqs, processSteps, reasons, services } from "@/data/site";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: brand.name,
  description: brand.description,
  areaServed: ["서울특별시", "인천광역시", "경기도"],
  url: "https://ggomggombath.com",
  logo: "https://ggomggombath.com/logo.svg",
  telephone: brand.phone,
  sameAs: [brand.naverBlog, brand.youtube, brand.instagram],
  knowsAbout: ["변기 교체", "세면기 교체", "욕실 수전 교체", "욕실장 교체", "욕실 부분시공"],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="꼼꼼욕실 홈">
          <img src="/logo.svg" alt="" width="94" height="56" />
          <span>
            <strong>{brand.name}</strong>
            <small>{brand.englishName}</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          <a href="#services">부분시공</a>
          <a href="#cases">시공후기</a>
          <a href="#process">진행과정</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>
        <a className="header-blog-cta" href={brand.naverBlog} target="_blank" rel="noreferrer">
          네이버 블로그 <span aria-hidden="true">↗</span>
        </a>
        <details className="mobile-menu">
          <summary aria-label="메뉴 열기">MENU</summary>
          <nav aria-label="모바일 메뉴">
            <a href="#services">부분시공</a>
            <a href="#cases">시공후기</a>
            <a href="#process">진행과정</a>
            <a href="#faq">자주 묻는 질문</a>
            <a href={brand.naverBlog} target="_blank" rel="noreferrer">네이버 블로그 ↗</a>
            <a href={brand.phoneHref}><span aria-hidden="true">☎️</span> {brand.phone}</a>
          </nav>
        </details>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid-line" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow"><span>욕실 부분시공 전문</span> {brand.serviceArea}</p>
            <h1 id="hero-title">바꿔야 할 곳만,<br /><em>꼼꼼하게.</em></h1>
            <p className="hero-description">전체 공사가 부담스러울 때, 필요한 부분만 정확하게.<br />매일 쓰는 욕실의 불편을 깔끔한 교체 시공으로 해결합니다.</p>
            <p className="hero-phone"><span aria-hidden="true">☎️</span><a href={brand.phoneHref} aria-label={`전화 ${brand.phone}`}>{brand.phone}</a></p>
            <div className="hero-actions">
              <a className="button button-primary" href={brand.naverBlog} target="_blank" rel="noreferrer">네이버 블로그 보기 <span aria-hidden="true">↗</span></a>
              <a className="button button-ghost" href="#cases">실제 시공 보기</a>
            </div>
          </div>

          <div className="hero-visual" aria-label="꼼꼼욕실 브랜드와 실제 시공 현장">
            <HeroLatestPost initialPost={fallbackPosts[0]} />
            <div className="hero-seal">
              <img src="/logo.svg" alt="꼼꼼욕실 로고" width="160" height="94" />
              <span>CLEAN DETAIL</span>
            </div>
            <div className="service-ticket">
              <span>PARTIAL BATH RENOVATION</span>
              <strong>변기 · 세면기 · 수전 · 욕실장</strong>
            </div>
          </div>

          <div className="hero-bottom">
            <span>SCROLL TO DISCOVER</span>
            <div className="scroll-line" aria-hidden="true" />
            <p>작은 교체 하나도<br />생활의 차이를 만듭니다.</p>
          </div>
        </section>

        <section className="intro section-pad" aria-labelledby="intro-title">
          <div className="section-kicker">01 — OUR STANDARD</div>
          <div className="intro-layout">
            <h2 id="intro-title">작은 부분이라도<br />기준은 <span>꼼꼼하게</span></h2>
            <p>욕실은 매일 사용하는 공간입니다. 꼼꼼욕실은 불필요한 전체 공사 대신 지금 불편한 부분을 정확히 확인하고, 제품 선택부터 철거·설치·마감까지 한 흐름으로 안내합니다.</p>
          </div>
          <div className="reason-grid">
            {reasons.map((reason, index) => (
              <article className="reason-card" key={reason.keyword}>
                <span className="reason-number">0{index + 1}</span>
                <span className="reason-keyword">{reason.keyword}</span>
                <h3>{reason.title}</h3>
                <p>{reason.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="services section-pad" id="services" aria-labelledby="services-title">
          <div className="section-kicker light">02 — SERVICES</div>
          <div className="section-heading-row light">
            <h2 id="services-title">필요한 만큼,<br />정확한 부분시공</h2>
            <p>블로그의 실제 상담·시공 범위를 기준으로 구성한 꼼꼼욕실의 주요 서비스입니다.</p>
          </div>
          <div className="service-list">
            {services.map((service) => (
              <article className="service-row" key={service.number}>
                <span className="service-number">{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul>
                  {service.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <div className="service-note">
            <span>시공 가능 지역</span>
            <strong>{brand.serviceArea}</strong>
            <a href={brand.phoneHref}><span aria-hidden="true">☎️</span> {brand.phone} ↗</a>
          </div>
        </section>

        <section className="cases section-pad" id="cases" aria-labelledby="cases-title">
          <div className="section-kicker">03 — RECENT WORK</div>
          <div className="section-heading-row">
            <h2 id="cases-title">말보다 확실한<br />실제 시공 기록</h2>
            <div>
              <p>네이버 블로그의 최신 시공 후기를 자동으로 불러옵니다. 현장별 제품과 시공 과정을 직접 확인해 보세요.</p>
              <a className="underlined-link" href={brand.naverBlog} target="_blank" rel="noreferrer">시공 후기 전체보기 ↗</a>
            </div>
          </div>
          <LatestPosts initialPosts={fallbackPosts} />
        </section>

        <section className="process section-pad" id="process" aria-labelledby="process-title">
          <div className="section-kicker light">04 — PROCESS</div>
          <div className="process-layout">
            <div className="process-title-wrap">
              <h2 id="process-title">문의부터 마감까지<br />한눈에 보는 과정</h2>
              <p>현장 사진이 자세할수록 더 빠르고 정확하게 상담할 수 있습니다.</p>
            </div>
            <ol className="process-list">
              {processSteps.map((item) => (
                <li key={item.step}>
                  <span>{item.step}</span>
                  <div><h3>{item.title}</h3><p>{item.description}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="faq section-pad" id="faq" aria-labelledby="faq-title">
          <div className="section-kicker">05 — FAQ</div>
          <div className="faq-layout">
            <div>
              <h2 id="faq-title">시공 전,<br />많이 묻는 질문</h2>
              <p>더 궁금한 내용은 네이버 블로그 상담을 통해 현장 사진과 함께 문의해 주세요.</p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary><span>Q{index + 1}</span>{faq.question}<i aria-hidden="true">＋</i></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta" aria-labelledby="cta-title">
          <p>YOUR BATHROOM, REFRESHED WITH DETAIL.</p>
          <h2 id="cta-title">사진 한 장에서 시작하는<br /><span>꼼꼼한 욕실 교체</span></h2>
          <div className="final-cta-actions">
            <a className="button button-light" href={brand.phoneHref}><span aria-hidden="true">☎️</span> {brand.phone}</a>
            <a className="button button-outline-light" href={brand.naverBlog} target="_blank" rel="noreferrer">네이버 블로그 <span aria-hidden="true">↗</span></a>
          </div>
          <img className="cta-watermark" src="/logo.svg" alt="" width="420" height="250" />
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/logo.svg" alt="꼼꼼욕실" width="110" height="66" />
          <div><strong>{brand.name}</strong><span>{brand.englishName}</span></div>
        </div>
        <div className="footer-info">
          <p>욕실 부분시공 전문 · {brand.serviceArea}</p>
          <p>상담 및 시공 문의 <a href={brand.phoneHref}>{brand.phone}</a></p>
        </div>
        <div className="social-links" aria-label="공식 채널">
          <a href={brand.naverBlog} target="_blank" rel="noreferrer">NAVER BLOG ↗</a>
          <a href={brand.youtube} target="_blank" rel="noreferrer">YOUTUBE ↗</a>
          <a href={brand.instagram} target="_blank" rel="noreferrer">INSTAGRAM ↗</a>
        </div>
        <p className="copyright">© {new Date().getFullYear()} GGOMGGOM BATH. ALL RIGHTS RESERVED.</p>
      </footer>
    </>
  );
}
