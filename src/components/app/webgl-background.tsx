/**
 * Ambient gradient background — soft animated blobs inspired by the
 * AI Platform Interface design: dark base with slow-breathing teal/cyan orbs.
 * Pure CSS, no canvas, no Three.js.
 */
export function WebGLBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* ── Primary orb: large teal glow, bottom-center ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: "90vw",
          height: "65vh",
          bottom: "-25vh",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(6,182,212,0.22) 0%, rgba(20,184,166,0.12) 38%, transparent 68%)",
          animation: "orb-breathe 9s ease-in-out infinite",
          filter: "blur(2px)",
        }}
      />

      {/* ── Secondary orb: teal, lower-left ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: "55vw",
          height: "45vh",
          bottom: "-15vh",
          left: "-10vw",
          background:
            "radial-gradient(ellipse at center, rgba(20,184,166,0.16) 0%, rgba(6,182,212,0.07) 45%, transparent 70%)",
          animation: "orb-breathe-free 12s ease-in-out infinite reverse",
          filter: "blur(4px)",
        }}
      />

      {/* ── Accent orb: small cyan, upper-right ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: "45vw",
          height: "40vh",
          top: "-10vh",
          right: "-8vw",
          background:
            "radial-gradient(ellipse at center, rgba(6,182,212,0.10) 0%, rgba(14,116,144,0.05) 50%, transparent 72%)",
          animation: "orb-breathe-free 15s ease-in-out infinite",
          animationDelay: "-5s",
          filter: "blur(6px)",
        }}
      />

      {/* ── Deep blue vignette: edges stay fully dark ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(11,14,22,0.55) 75%, rgba(11,14,22,0.85) 100%)",
        }}
      />
    </div>
  );
}
