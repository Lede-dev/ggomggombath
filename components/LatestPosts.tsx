"use client";

import { useEffect, useState } from "react";
import type { CasePost } from "@/data/site";

export function LatestPosts({ initialPosts }: { initialPosts: CasePost[] }) {
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/blog", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items?: CasePost[] }) => {
        if (data.items?.length) setPosts(data.items.slice(0, 3));
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  return (
    <div className="post-grid">
      {posts.map((post, index) => (
        <article className={`post-card post-card-${index + 1}`} key={post.link}>
          <a href={post.link} target="_blank" rel="noreferrer" aria-label={`${post.title} 새 창에서 읽기`}>
            <div className="post-image-wrap">
              {/* RSS에 포함된 꼼꼼욕실 자체 시공 이미지입니다. */}
              <img className="post-image" src={post.image} alt="꼼꼼욕실 실제 욕실 부분시공 현장" referrerPolicy="no-referrer" />
              <span className="post-index">0{index + 1}</span>
            </div>
            <div className="post-copy">
              <div className="post-meta">
                <span>{post.category}</span>
                <time>{post.date}</time>
              </div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <span className="text-link">시공 후기 보기 <span aria-hidden="true">↗</span></span>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}

