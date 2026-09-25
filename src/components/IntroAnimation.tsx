import { useEffect, useState } from "react";

/**
 * Plays once when App mounts, then hands control back to the normal website.
 * The text reveal is driven purely by CSS delays from mount (not by React
 * state), so the wordmark can never get stuck invisible.
 */
export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(
      () => setFading(true),
      reducedMotion ? 420 : 3500,
    );
    const finishTimer = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow;
      onComplete();
    }, reducedMotion ? 700 : 3900);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete]);

  return (
    <div
      className={`gradivo-intro${fading ? " is-fading" : ""}${reducedMotion ? " is-reduced-motion" : ""}`}
      aria-hidden="true"
    >
      {!reducedMotion && (
        <div className="gradivo-intro-thoughts">
          {[
            ["CONFUSED ABOUT", "0.12s", "0.78s"],
            ["SKILLS", "0.58s", "0.7s"],
            ["PROJECTS", "1.02s", "0.76s"],
            ["HACKATHONS", "1.46s", "0.84s"],
          ].map(([word, delay, duration]) => (
            <span key={word} style={{ animationDelay: delay, animationDuration: duration }}>{word}</span>
          ))}
        </div>
      )}
      <div className="gradivo-intro-lockup">
        <span className="gradivo-intro-logo-position">
          <img className="gradivo-intro-logo" src="/gradivo-logo.png" alt="" draggable={false} />
        </span>
        <span className="gradivo-intro-word">GRADIVO</span>
      </div>
    </div>
  );
}
