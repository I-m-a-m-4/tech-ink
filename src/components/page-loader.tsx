
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { loaderEventTarget } from "@/lib/loader-events";

export function PageLoader() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<NodeJS.Timeout>();

  // Effect for listening to the manual 'start' event
  useEffect(() => {
    const startLoading = () => {
      setIsVisible(true);
      setProgress(10);
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            if(timerRef.current) clearInterval(timerRef.current);
            return 95;
          }
          if (prev < 70) return prev + Math.random() * 10;
          return prev + Math.random() * 2;
        });
      }, 250);
    };

    loaderEventTarget.addEventListener('start', startLoading);

    return () => {
      loaderEventTarget.removeEventListener('start', startLoading);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Effect for finishing the loader when the route changes
  useEffect(() => {
    if (isVisible) {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        // Reset progress after fade out, ready for next load
        setTimeout(() => setProgress(0), 300);
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 w-full z-[99] transition-opacity duration-300 pointer-events-none",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <Progress value={progress} className="h-1 w-full rounded-none bg-primary/20" />
    </div>
  );
}
