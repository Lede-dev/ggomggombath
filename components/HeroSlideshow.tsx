"use client";

import { useEffect, useMemo, useState } from "react";
import type { CasePost } from "@/data/site";

const AUTOPLAY_DELAY = 4200;

export function HeroSlideshow({ initialPosts }: { initialPosts: CasePost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const slides = useMemo(() => posts.filter((post) => post.image), [posts]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(media.matches);
    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);
    return () => media.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/blog", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items?: CasePost[] }) => {
        const latestPosts = data.items?.filter((post) => post.image).slice(0, 6);
        if (latestPosts?.length) {
          setPosts(latestPosts);
          setActiveIndex(0);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (isPaused || reduceMotion || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion, slides.length]);

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  if (!slides.length) return null;

  return (
    <div
      className="hero-photo-frame"
      role="region"
      aria-roledescription="carousel"
      aria-label="네이버 블로그 최신 시공 사진"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        className="hero-slider-track"
        style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
      >
        {slides.map((post, index) => (
          <a
            className="hero-slide"
            href={post.link}
            target="_blank"
            rel="noreferrer"
            key={post.link}
            aria-hidden={index !== activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            aria-label={`${post.title} 시공 후기 보기`}
          >
            <img
              src={post.image}
              alt={`꼼꼼욕실 최신 시공 현장 ${index + 1}`}
              referrerPolicy="no-referrer"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </a>
        ))}
      </div>

      <span className="photo-label" aria-hidden="true">
        RECENT WORK · {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </span>

      {slides.length > 1 && (
        <div className="hero-slider-controls">
          <button type="button" onClick={showPrevious} aria-label="이전 시공 사진">←</button>
          <div className="hero-slider-dots" aria-label="시공 사진 선택">
            {slides.map((post, index) => (
              <button
                type="button"
                key={post.link}
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => setActiveIndex(index)}
                aria-label={`${index + 1}번째 시공 사진 보기`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
          <button type="button" onClick={showNext} aria-label="다음 시공 사진">→</button>
        </div>
      )}
    </div>
  );
}

