import { useEffect, useState } from "react";

/**
 * Plays once when App mounts, then hands control back to the normal website.
 * The wordmark reveal runs on fixed CSS delays from mount (not React state),
 * so the text can never get stuck invisible. Total runtime ~2.15 seconds.
 */
export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false);
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(
      () => setFading(true),
      reducedMotion ? 940 : 1750,
    );
    const finishTimer = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow;
      onComplete();
    }, reducedMotion ? 1220 : 2150);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete, reducedMotion]);

  return (
    <div
      className={`gradivo-intro${fading ? " is-fading" : ""}`}
      aria-hidden="true"
    >
      <div className="gradivo-intro-lockup">
        <span className="gradivo-intro-logo-position">
          <img className="gradivo-intro-logo" src="/gradivo-logo.png" alt="" draggable={false} />
        </span>
        <span className="gradivo-intro-word" aria-label="GRADIVO">
          {"GRADIVO".split("").map((letter, index) => (
            <span className="gradivo-intro-letter-mask" key={`${letter}-${index}`}>
              <span
                className="gradivo-intro-letter"
                style={{ animationDelay: `${0.5 + index * 0.065}s` }}
              >
                {letter}
              </span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
