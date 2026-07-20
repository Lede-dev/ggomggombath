"use client";

import { useEffect, useState } from "react";
import type { CasePost } from "@/data/site";

export function HeroLatestPost({ initialPost }: { initialPost: CasePost }) {
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/blog", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items?: CasePost[] }) => {
        const latestPostWithImage = data.items?.find((item) => item.image);
        if (latestPostWithImage) setPost(latestPostWithImage);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  return (
    <div className="hero-photo-frame" aria-label="네이버 블로그 최신 시공 글">
      <a
        className="hero-latest-link"
        href={post.link}
        target="_blank"
        rel="noreferrer"
        aria-label={`${post.title} 시공 후기 보기`}
      >
        <img
          src={post.image}
          alt={`꼼꼼욕실 최신 시공 현장: ${post.title}`}
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </a>
      <span className="photo-label" aria-hidden="true">
        LATEST WORK · {post.date}
      </span>
    </div>
  );
}
