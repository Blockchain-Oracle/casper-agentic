"use client";

import { useMemo, useState } from "react";
import { Server } from "lucide-react";

function faviconUrl(endpointUrl: string) {
  try {
    const host = new URL(endpointUrl).hostname;
    return host ? `https://icons.duckduckgo.com/ip3/${host}.ico` : null;
  } catch {
    return null;
  }
}

export function ServerLogo({
  endpointUrl,
  name,
  size = 40,
}: {
  endpointUrl: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => faviconUrl(endpointUrl), [endpointUrl]);
  const style = { height: size, width: size };

  if (!src || failed) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-md border border-hairline bg-well text-ink"
        style={style}
        title={name}
      >
        <Server className="size-4.5" />
      </span>
    );
  }

  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-md border border-hairline bg-well"
      style={style}
      title={name}
    >
      {/* Native img keeps arbitrary favicon hosts out of next/image config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        className="size-[62%] object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
