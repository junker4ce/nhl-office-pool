"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

const MASCOTS = [
  "/mascot/vee-goalie.webp",
  "/mascot/vee-celebrate.webp",
  "/mascot/vee-stickhandle.webp",
] as const;

const STORAGE_KEY = "nhl-office-pool:mascot-index";

let cachedIndex: number | null = null;

// Picks one mascot per browser session and keeps it for the rest of that session.
function getSessionMascotIndex() {
  if (cachedIndex !== null) return cachedIndex;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const parsed = stored === null ? NaN : Number(stored);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < MASCOTS.length) {
      cachedIndex = parsed;
    } else {
      cachedIndex = Math.floor(Math.random() * MASCOTS.length);
      sessionStorage.setItem(STORAGE_KEY, String(cachedIndex));
    }
  } catch {
    cachedIndex = Math.floor(Math.random() * MASCOTS.length);
  }

  return cachedIndex;
}

const subscribe = () => () => {};

export function BackgroundMascot() {
  const index = useSyncExternalStore(subscribe, getSessionMascotIndex, () => null);
  const mascot = index === null ? null : MASCOTS[index];

  // Decorative backdrop shared by every page: centred in the empty left gutter
  // on wide screens, and a faint corner watermark behind content otherwise.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 left-0 -z-10 w-56 opacity-15 select-none sm:w-72 2xl:inset-y-0 2xl:flex 2xl:w-[calc((100vw-72rem)/2)] 2xl:items-center 2xl:justify-center 2xl:opacity-100"
    >
      {mascot && (
        <Image
          src={mascot}
          alt=""
          width={600}
          height={600}
          className="h-auto w-full drop-shadow-xl 2xl:w-[min(26rem,calc(100%-2rem))]"
        />
      )}
    </div>
  );
}
