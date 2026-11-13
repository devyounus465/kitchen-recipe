"use client";
// Last-resort error page if the root layout itself fails (must render its own <html>/<body>).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", color: "#111" }}>
        <main style={{ padding: 32 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: "#ce4620" }}>Uh-oh!</div>
          <h1 style={{ fontSize: 26 }}>Something went wrong.</h1>
          <p style={{ color: "#595959" }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 16, background: "#ce4620", color: "#fff", border: 0, borderRadius: 999, padding: "12px 28px", fontWeight: 700, cursor: "pointer" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
