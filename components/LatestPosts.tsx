import Link from "next/link";
import { StaticImage } from "@/components/StaticImage";
import { getNaverImageVariants, type CasePost } from "@/data/site";

export function LatestPosts({ posts }: { posts: CasePost[] }) {
  return (
    <div className="post-grid">
      {posts.map((post, index) => {
        const image = getNaverImageVariants(post.image);

        return <article className={`post-card post-card-${index + 1}`} key={post.link}>
          <Link href={`/works/${post.id}`} aria-label={`${post.displayTitle} 자세히 보기`}>
            <div className="post-image-wrap">
              {/* RSS에 포함된 꼼꼼욕실 자체 시공 이미지입니다. */}
              <StaticImage
                className="post-image"
                src={image.thumbnail}
                srcSet={`${image.thumbnail} 365w, ${image.medium} 743w`}
                sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1100px) 50vw, 380px"
                alt="꼼꼼욕실 실제 욕실 부분시공 현장"
                width="365"
                height="365"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="post-index">0{index + 1}</span>
            </div>
            <div className="post-copy">
              <div className="post-meta">
                <span>{post.category}</span>
                <time>{post.date}</time>
              </div>
              <h3>{post.displayTitle}</h3>
              <p>{post.excerpt}</p>
              <span className="text-link">시공 사례 보기 <span aria-hidden="true">→</span></span>
            </div>
          </Link>
        </article>;
      })}
    </div>
  );
}
