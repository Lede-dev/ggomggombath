import Link from "next/link";
import { PhoneContact } from "@/components/PhoneContact";
import { StaticImage } from "@/components/StaticImage";
import { brand, primaryNavigation } from "@/data/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/" aria-label="꼼꼼욕실 홈">
        <StaticImage src={brand.logoPath} alt="꼼꼼욕실 로고" width="52" height="52" loading="eager" />
        <span>
          <strong>{brand.name}</strong>
          <small>{brand.englishName}</small>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        {primaryNavigation.map((item) => <Link key={item.path} href={item.path}>{item.label}</Link>)}
      </nav>
      <a className="header-blog-cta" href={brand.naverBlog} target="_blank" rel="noreferrer">
        네이버 블로그 <span aria-hidden="true">↗</span>
      </a>
      <details className="mobile-menu">
        <summary aria-label="메뉴 열기">MENU</summary>
        <nav aria-label="모바일 메뉴">
          {primaryNavigation.map((item) => <Link key={item.path} href={item.path}>{item.label}</Link>)}
          <Link href="/about">꼼꼼욕실 소개</Link>
          <a href={brand.naverBlog} target="_blank" rel="noreferrer">네이버 블로그 ↗</a>
          <PhoneContact className="mobile-phone" />
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <StaticImage src={brand.logoPath} alt="꼼꼼욕실" width="94" height="94" loading="lazy" />
        <div><strong>{brand.name}</strong><span>{brand.englishName}</span></div>
      </div>
      <div className="footer-info">
        <strong>서울·인천·경기 욕실 부분시공</strong>
        <a href={brand.phoneHref}>{brand.phone}</a>
        <span>시공 가능 지역과 일정은 상담 시 확인해 드립니다.</span>
      </div>
      <div className="social-links" aria-label="공식 채널">
        <a href={brand.naverBlog} target="_blank" rel="noreferrer">NAVER BLOG ↗</a>
        <a href={brand.youtube} target="_blank" rel="noreferrer">YOUTUBE ↗</a>
        <a href={brand.instagram} target="_blank" rel="noreferrer">INSTAGRAM ↗</a>
      </div>
      <nav className="footer-nav" aria-label="하단 메뉴">
        <Link href="/about">업체 소개</Link>
        <Link href="/services">부분시공</Link>
        <Link href="/works">시공 사례</Link>
        <Link href="/process">진행 과정</Link>
        <Link href="/faq">자주 묻는 질문</Link>
      </nav>
      <p className="copyright">© {new Date().getFullYear()} GGOMGGOM BATH. ALL RIGHTS RESERVED.</p>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}
