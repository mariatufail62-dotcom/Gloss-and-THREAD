"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-US">
      <body style={{ fontFamily: "Georgia, serif", textAlign: "center", padding: "6rem 1rem", color: "#171717" }}>
        <p style={{ letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", color: "#A65F6F" }}>Gloss &amp; Thread</p>
        <h1 style={{ fontSize: 36, fontWeight: 500 }}>Something went wrong</h1>
        <p style={{ color: "#696969" }}>Please try again in a moment.{error.digest ? ` Reference: ${error.digest}` : ""}</p>
        <button onClick={reset} style={{ marginTop: 24, padding: "12px 24px", background: "#171717", color: "#fff", border: 0, cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
