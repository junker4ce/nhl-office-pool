"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

const MASCOTS = [
  {
    src: "/mascot/vee-goalie.webp",
    alt: "Vee, the VitaOne mascot, making a butterfly save in goalie gear",
  },
  {
    src: "/mascot/vee-celebrate.webp",
    alt: "Vee, the VitaOne mascot, celebrating with a stick raised overhead",
  },
  {
    src: "/mascot/vee-stickhandle.webp",
    alt: "Vee, the VitaOne mascot, skating with the puck",
  },
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

export function PoolMascot() {
  const index = useSyncExternalStore(subscribe, getSessionMascotIndex, () => null);
  const mascot = index === null ? null : MASCOTS[index];

  // Sits beside the content on tablet/laptop widths, then moves out into the
  // empty left gutter once the viewport is wide enough to hold it.
  return (
    <div className="mx-auto aspect-square w-40 md:w-full 2xl:absolute 2xl:right-full 2xl:top-24 2xl:w-[min(26rem,calc((100vw-72rem)/2-2rem))]">
      {mascot && (
        <Image
          src={mascot.src}
          alt={mascot.alt}
          width={600}
          height={600}
          priority
          className="h-auto w-full drop-shadow-xl"
        />
      )}
    </div>
  );
}
