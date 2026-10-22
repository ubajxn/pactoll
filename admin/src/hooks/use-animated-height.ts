"use client";

import { useReducedMotion } from "motion/react";
import { useLayoutEffect, useState } from "react";

/** Measure an inner element and spread motionProps onto its outer motion.div.
 * Keep padding on the inner element; the outer element clips the animation.
 */
export function useAnimatedHeight<T extends HTMLElement = HTMLDivElement>({
  open = true,
  duration = 0.15,
}: {
  open?: boolean;
  duration?: number;
} = {}) {
  const [element, ref] = useState<T | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (!element) return;
    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element, { box: "border-box" });
    return () => observer.disconnect();
  }, [element]);

  return {
    ref,
    motionProps: {
      initial: false as const,
      animate: { height: open ? (height ?? "auto") : 0 },
      transition: {
        duration: reducedMotion ? 0 : duration,
        ease: "easeOut" as const,
      },
      style: { overflow: "hidden" as const },
    },
  };
}
