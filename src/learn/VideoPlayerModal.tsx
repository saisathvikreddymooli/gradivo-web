import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import type { LearnVideoResource } from "./videoCatalog";
import type { VideoProgressRecord } from "./useVideoProgress";
import "./videoPlayer.css";

type PlayerStateEvent = { data: number; target: YouTubePlayer };
type PlayerErrorEvent = { data: number };
type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};
type YouTubePlayerApi = {
  Player: new (element: HTMLElement, options: {
    width: string;
    height: string;
    videoId: string;
    host: string;
    playerVars: Record<string, number | string>;
    events: {
      onReady: (event: PlayerStateEvent) => void;
      onStateChange: (event: PlayerStateEvent) => void;
      onError: (event: PlayerErrorEvent) => void;
    };
  }) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};

declare global {
  interface Window {
    YT?: YouTubePlayerApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let iframeApiPromise: Promise<YouTubePlayerApi> | null = null;

function loadIframeApi(): Promise<YouTubePlayerApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (iframeApiPromise) return iframeApiPromise;
  iframeApiPromise = new Promise<YouTubePlayerApi>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    let timeout = 0;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (timeout) window.clearTimeout(timeout);
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("The YouTube player could not be initialized."));
    };
    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        if (timeout) window.clearTimeout(timeout);
        reject(new Error("The video player could not load."));
      };
      document.head.appendChild(script);
    }
    timeout = window.setTimeout(() => reject(new Error("The video player took too long to load.")), 15000);
  }).catch((error: unknown) => {
    iframeApiPromise = null;
    throw error;
  });
  return iframeApiPromise;
}

function errorMessage(code: number): string {
  if (code === 101 || code === 150) return "This video’s owner has disabled playback on other websites.";
  if (code === 2 || code === 5 || code === 100) return "This video can’t be played inside the site.";
  return "The video player couldn’t start this video.";
}

type Props = {
  video: LearnVideoResource;
  progress?: VideoProgressRecord;
  isTracking: boolean;
  onProgress: (video: LearnVideoResource, furthestPoint: number, duration: number, forceSave?: boolean) => Promise<void>;
  onClose: () => void;
};

export default function VideoPlayerModal({ video, progress, isTracking, onProgress, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const furthestRef = useRef(progress?.lastPosition ?? 0);
  const durationRef = useRef(progress?.duration ?? 0);
  const fallbackRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  const videoRef = useRef(video);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [closePending, setClosePending] = useState(false);

  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { videoRef.current = video; }, [video]);

  const sample = useCallback(async (forceSave = false) => {
    const player = playerRef.current;
    if (!player || fallbackRef.current) return;
    const duration = player.getDuration();
    const currentTime = player.getCurrentTime();
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return;
    durationRef.current = duration;
    furthestRef.current = Math.max(furthestRef.current, currentTime);
    await onProgressRef.current(videoRef.current, furthestRef.current, duration, forceSave);
  }, []);

  const close = useCallback(async () => {
    if (closePending) return;
    setClosePending(true);
    await sample(true);
    onClose();
  }, [closePending, onClose, sample]);

  useEffect(() => {
    let active = true;
    let timer = 0;
    let monitor = 0;
    fallbackRef.current = false;
    furthestRef.current = progress?.lastPosition ?? 0;
    durationRef.current = progress?.duration ?? 0;

    void loadIframeApi().then((api) => {
      if (!active || !containerRef.current) return;
      playerRef.current = new api.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        videoId: video.videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!active) return;
            playerRef.current = event.target;
            setReady(true);
            if (furthestRef.current > 0) event.target.seekTo(furthestRef.current, true);
            timer = window.setTimeout(() => {
              if (!active || fallbackRef.current) return;
              const duration = event.target.getDuration();
              if (!Number.isFinite(duration) || duration <= 0) {
                fallbackRef.current = true;
                setMessage("This video doesn’t provide a duration, so watch time can’t be tracked here.");
              }
            }, 6000);
            monitor = window.setInterval(() => {
              if (!active || fallbackRef.current) return;
              const actualDuration = event.target.getDuration();
              if (Number.isFinite(actualDuration) && actualDuration > 0) {
                durationRef.current = actualDuration;
                if (event.target.getPlayerState() === api.PlayerState.PLAYING) void sample(false);
              }
            }, 2000);
          },
          onStateChange: (event) => {
            if (event.data === api.PlayerState.PAUSED || event.data === api.PlayerState.ENDED) void sample(true);
          },
          onError: (event) => {
            if (!active) return;
            fallbackRef.current = true;
            setMessage(errorMessage(event.data));
          },
        },
      });
    }).catch((error: unknown) => {
      if (!active) return;
      fallbackRef.current = true;
      setMessage(error instanceof Error ? error.message : "The video player could not load.");
    });

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      if (monitor) window.clearInterval(monitor);
      if (!fallbackRef.current) void sample(true);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [sample, video.videoId]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") void close(); };
    const handleVisibility = () => { if (document.visibilityState === "hidden") void sample(true); };
    const handlePageHide = () => { void sample(true); };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibility);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, sample]);

  return (
    <div className="learn-player-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) void close(); }}>
      <section className="learn-player-modal" role="dialog" aria-modal="true" aria-labelledby="learn-player-title">
        <div className="learn-player-header">
          <div><h2 id="learn-player-title">{video.title}</h2><p>{video.channel}</p></div>
          <button type="button" className="learn-player-close" aria-label="Close video" onClick={() => void close()}><X size={20} /></button>
        </div>
        <div className="learn-player-stage">
          <div ref={containerRef} className="learn-player-iframe" />
          {!ready && !message && <div className="learn-player-loading" role="status">Loading player…</div>}
          {message && <div className="learn-player-fallback"><p>{message}</p><a href={video.url} target="_blank" rel="noopener noreferrer">Open on YouTube <ExternalLink size={15} /></a></div>}
        </div>
        <div className="learn-player-footer">
          {isTracking && progress && <span>{progress.percent}% watched{progress.completed ? " · Completed" : ""}</span>}
          <span>{closePending ? "Saving progress…" : message ? "Progress tracking is unavailable for this video." : isTracking ? "Your progress saves as you watch." : "Sign in to save your progress."}</span>
        </div>
      </section>
    </div>
  );
}
