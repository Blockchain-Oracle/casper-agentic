"use client";

import Link from "next/link";
import { screens } from "@/lib/fixtures";
import type { Screen } from "@/lib/types";

export function AppShell({
  active,
  navOpen,
  onToggleNav,
  onScreen,
}: {
  active: Screen;
  navOpen: boolean;
  onToggleNav: () => void;
  onScreen: (screen: Screen) => void;
}) {
  const navButtons = screens.map((screen, index) => {
    const previous = screens[index - 1];
    const needsDivider = Boolean(previous && previous.group !== screen.group);
    return (
      <div style={{ display: "contents" }} key={screen.id}>
        {needsDivider ? <span className="navDivider" /> : null}
        <button
          className="navButton"
          data-active={active === screen.id}
          onClick={() => onScreen(screen.id)}
          type="button"
        >
          <span className="dot" />
          {screen.short}
        </button>
      </div>
    );
  });

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brandMark" />
          <span>
            casper<span className="brandHyphen">-</span>gw
          </span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {navButtons}
        </nav>
        <span className="networkPill">
          <span className="dot" style={{ background: "var(--signal)", opacity: 1 }} />
          Testnet
        </span>
        <Link className="runButton" href="/explorer">Public explorer</Link>
        <button className="mobileMenuButton" onClick={onToggleNav} type="button">
          <span className="hamburger" />
        </button>
      </header>
      <div className="mobilePanel" hidden={!navOpen}>
        {screens.map((screen) => (
          <button
            className="navButton"
            data-active={active === screen.id}
            key={screen.id}
            onClick={() => onScreen(screen.id)}
            type="button"
          >
            <span className="dot" />
            {screen.label}
          </button>
        ))}
        <Link className="runButton" href="/explorer">Public explorer</Link>
      </div>
    </>
  );
}
