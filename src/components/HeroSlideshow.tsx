"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";

type Slide = {
  src: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  position?: "left" | "right";
  objectPosition?: string;
};

const slides: Slide[] = [
  {
    src: "/assets/hero-1.webp",
    eyebrow: "Signature Drop",
    title: "Koalafied Classic",
    subtitle: "Worn by champions. Built for combat.",
    cta: { label: "Shop the rashguard", href: "/products/the-koalafied-classic-red-navy" },
    position: "left",
    objectPosition: "center",
  },
  {
    src: "/assets/hero-2.jpeg",
    eyebrow: "Heritage Tee",
    title: "Koalafied to Submit You",
    subtitle: "Streetwear with bite. Made in Australia.",
    cta: { label: "Shop tees", href: "/shop?cat=tees" },
    position: "left",
    objectPosition: "center 18%",
  },
  {
    src: "/assets/hero-3.jpeg",
    eyebrow: "The Mascot",
    title: "Wear the Koala",
    subtitle: "Purple drop. Limited run. Step on the mat in style.",
    cta: { label: "Shop the drop", href: "/shop?cat=rashguards" },
    position: "left",
    objectPosition: "center 25%",
  },
];

export function HeroSlideshow() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      className="relative w-full h-screen min-h-[600px] overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, idx) => (
        <div
          key={s.src}
          className={clsx(
            "absolute inset-0 transition-opacity duration-1000 ease-out",
            idx === i ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={idx !== i}
        >
          <Image
            src={s.src}
            alt={s.title}
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: s.objectPosition ?? "center" }}
          />
          {/* Bottom gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div
            className={clsx(
              "absolute bottom-0 p-6 md:p-14 max-w-2xl text-white",
              s.position === "right" ? "right-0 text-right" : "left-0"
            )}
          >
            <p className="text-[11px] md:text-xs tracking-[0.3em] uppercase mb-3 opacity-90">
              {s.eyebrow}
            </p>
            <h1 className="font-bold text-4xl md:text-6xl leading-[1.05] tracking-tight mb-3">
              {s.title}
            </h1>
            <p className="text-base md:text-xl mb-5 max-w-xl opacity-95">{s.subtitle}</p>
            <Link
              href={s.cta.href}
              className="inline-block bg-white text-ink px-7 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              {s.cta.label}
            </Link>
          </div>
        </div>
      ))}

      {/* Pause / play */}
      <button
        aria-label={paused ? "Play slideshow" : "Pause slideshow"}
        onClick={() => setPaused((p) => !p)}
        className="absolute right-4 md:right-6 top-4 md:top-6 z-10 grid place-items-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white"
      >
        {paused ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        )}
      </button>

      {/* Slide dots */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              idx === i ? "w-8 bg-white" : "w-4 bg-white/50 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}
