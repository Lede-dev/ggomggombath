import { StaticImage } from "@/components/StaticImage";
import { getNaverImageVariants, type CasePost } from "@/data/site";

export function HeroLatestPost({ post }: { post: CasePost }) {
  const image = getNaverImageVariants(post.image);

  return (
    <>
      <div className="hero-photo-frame" aria-label="네이버 블로그 최신 시공 글">
        <a
          className="hero-latest-link"
          href={post.link}
          target="_blank"
          rel="noreferrer"
          aria-label={`${post.title} 시공 후기 보기`}
        >
          <StaticImage
            src={image.medium}
            srcSet={`${image.thumbnail} 365w, ${image.medium} 743w, ${image.large} 936w`}
            sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1100px) 52vw, 620px"
            alt={`꼼꼼욕실 최신 시공 현장: ${post.title}`}
            width="743"
            height="991"
            referrerPolicy="no-referrer"
            loading="eager"
            fetchPriority="high"
          />
        </a>
      </div>
      <span className="photo-label" aria-hidden="true">
        LATEST WORK · {post.date}
      </span>
    </>
  );
}
