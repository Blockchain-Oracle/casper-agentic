"use client";

import { useEffect } from "react";

/**
 * Shared overlay primitive (the codebase had only a bespoke PricingDrawer before).
 * Reused by the wallet tabbed modal, funding stepper drawer, audit failure modal,
 * and the runner approve-&-sign modal. Inline styles reference theme CSS vars so it
 * themes correctly (light on public surfaces, dark inside [data-surface="app"]).
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 760,
  variant = "modal",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  /** "modal" = centered dialog; "drawer" = right-side panel (e.g. funding stepper). */
  variant?: "modal" | "drawer";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isDrawer = variant === "drawer";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: isDrawer ? "stretch" : "center",
        justifyContent: isDrawer ? "flex-end" : "center",
        padding: isDrawer ? 0 : 20,
        background: "rgb(7 8 10 / 0.62)",
        backdropFilter: "blur(2px)",
        animation: "cgwFade .15s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: isDrawer ? 460 : maxWidth,
          maxHeight: isDrawer ? "100%" : "90vh",
          height: isDrawer ? "100%" : undefined,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--card)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: isDrawer ? 0 : 14,
          boxShadow: "var(--shadow)",
        }}
      >
        {title ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              padding: "18px 22px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "700 16px/1.2 var(--sans)" }}>{title}</div>
              {subtitle ? (
                <div style={{ marginTop: 4, font: "500 13px/1.4 var(--sans)", color: "var(--ink-2)" }}>{subtitle}</div>
              ) : null}
            </div>
            <button onClick={onClose} type="button" aria-label="Close" style={{ color: "var(--ink-3)", fontSize: 20, lineHeight: 1 }}>
              ✕
            </button>
          </div>
        ) : null}
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
        {footer ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
              padding: "14px 22px",
              borderTop: "1px solid var(--line)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<[T, string]>;
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          style={{
            padding: "9px 12px",
            font: "600 13px/1 var(--sans)",
            color: active === id ? "var(--ink)" : "var(--ink-2)",
            borderBottom: active === id ? "2px solid var(--brand)" : "2px solid transparent",
            marginBottom: -1,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
