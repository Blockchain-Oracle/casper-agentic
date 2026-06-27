import Link from "next/link";

/**
 * Custom 404 — framed in the product's own language. A missing route is a proof
 * lookup that found nothing, so it reads like a failed receipt (verify-fail chip,
 * the diamond mark) and points the visitor at the explorer. Token-driven, so it
 * renders correctly in both themes.
 */
export default function NotFound() {
  return (
    <main className="app" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            font: "600 12px/1 var(--mono)",
            letterSpacing: "0.16em",
            color: "var(--brand-ink)",
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 11, height: 11, background: "var(--brand)", transform: "rotate(45deg)", borderRadius: 2 }} />
          Proof not found
        </div>

        <div style={{ font: "800 clamp(72px, 16vw, 104px)/1 var(--sans)", letterSpacing: "-0.04em", color: "var(--ink)", marginTop: 16 }}>
          404
        </div>

        <h1 style={{ font: "700 24px/1.15 var(--sans)", letterSpacing: "-0.02em", color: "var(--ink)", margin: "12px 0 0" }}>
          No receipt at this address
        </h1>
        <p style={{ font: "500 15px/1.6 var(--sans)", color: "var(--ink-2)", margin: "12px auto 0", maxWidth: 440 }}>
          The page, receipt, or deploy you&rsquo;re looking for doesn&rsquo;t exist — or never settled. Verify a proof in the
          explorer, or head back to the gateway.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 22,
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--danger-soft)",
            border: "1px solid var(--danger-line)",
            font: "600 11px/1 var(--mono)",
            letterSpacing: "0.04em",
            color: "var(--brand-ink)",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--brand)" }} />
          VERIFY FAIL · 404
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
          <Link
            href="/explorer"
            style={{ padding: "13px 22px", borderRadius: 9, background: "var(--ink)", color: "var(--paper)", font: "600 14px/1 var(--sans)" }}
          >
            Open explorer →
          </Link>
          <Link
            href="/"
            style={{
              padding: "13px 22px",
              borderRadius: 9,
              background: "var(--card)",
              border: "1px solid var(--line-2)",
              color: "var(--ink)",
              font: "600 14px/1 var(--sans)",
            }}
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
