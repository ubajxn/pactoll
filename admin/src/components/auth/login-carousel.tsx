"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface CarouselImage {
  src: string;
  alt: string;
}

export function LoginImageCarousel({ images }: { images: CarouselImage[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {images.map((img, i) => (
        <div
          key={img.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="(min-width: 1024px) 60vw, 0px"
          />
        </div>
      ))}

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2d3540]/70 via-transparent to-[#2d3540]/20" />

      {/* Bottom caption */}
      <div className="absolute bottom-8 left-8 right-8">
        <p className="text-sm font-medium text-white/90">
          {images[current].alt}
        </p>
        {/* Dots */}
        <div className="mt-3 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === current ? "24px" : "8px",
                background: i === current ? "#c85a1a" : "rgba(255,255,255,0.4)",
              }}
              aria-label={`Show image ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
