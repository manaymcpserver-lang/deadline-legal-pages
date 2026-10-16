"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MascotVignetteProps = {
  id: string;
  src: string;
  poster: string;
  title: string;
  description: string;
  motionPaused: boolean;
  reducedMotion: boolean;
  className?: string;
};

/** A silent, looping brand story that runs only while visible, with a pause override. */
export function MascotVignette({
  id,
  src,
  poster,
  title,
  description,
  motionPaused,
  reducedMotion,
  className,
}: MascotVignetteProps) {
  const figureRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(false);
  const inViewRef = useRef(false);
  const manuallyPausedRef = useRef(false);
  const autoplayBlockedRef = useRef(false);
  const playRequestRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [playFailed, setPlayFailed] = useState(false);

  const requestPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || document.hidden) return;
    const request = ++playRequestRef.current;
    video.muted = true;
    setPlayFailed(false);
    void video.play().catch(() => {
      if (mountedRef.current && request === playRequestRef.current) {
        autoplayBlockedRef.current = true;
        setIsPlaying(false);
        setPlayFailed(true);
      }
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      playRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const figure = figureRef.current;
    const video = videoRef.current;
    if (!figure || !video) return;

    const pause = () => {
      // An interrupted play promise must not turn a deliberate pause into an error.
      playRequestRef.current += 1;
      video.pause();
    };
    const syncPlayback = () => {
      if (!inViewRef.current || document.hidden || motionPaused || reducedMotion) {
        pause();
        return;
      }
      if (!manuallyPausedRef.current && !autoplayBlockedRef.current && video.paused) {
        requestPlay();
      }
    };

    // Observe the media, not the caption: long copy must not prevent a visible film
    // from reaching the threshold. Without observer support, playback stays manual.
    const media = video.parentElement ?? figure;
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
        inViewRef.current = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.4);
        syncPlayback();
      }, { threshold: [0, 0.4] });
    observer?.observe(media);
    document.addEventListener("visibilitychange", syncPlayback);
    syncPlayback();

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      pause();
    };
  }, [motionPaused, reducedMotion, requestPlay]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused && !video.ended) {
      manuallyPausedRef.current = true;
      playRequestRef.current += 1;
      video.pause();
      return;
    }
    manuallyPausedRef.current = false;
    autoplayBlockedRef.current = false;
    if (video.ended || hasEnded) {
      video.currentTime = 0;
      setHasEnded(false);
    }
    // An explicit Play action may override a motion preference for this film only.
    // Off-screen, hidden-document and subsequent global-pause changes still pause it.
    requestPlay();
  };

  const action = isPlaying ? "Pause" : hasEnded ? "Replay" : "Play";

  return (
    <figure
      id={id}
      ref={figureRef}
      className={`mascot-vignette${className ? ` ${className}` : ""}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="mascot-vignette-media">
        <span className="mascot-vignette-glow" aria-hidden="true" />
        <video
          id={`${id}-video`}
          ref={videoRef}
          src={src}
          poster={poster}
          width="540"
          height="960"
          muted
          playsInline
          loop
          preload="none"
          disablePictureInPicture
          aria-label={`${title}: animated brand story`}
          aria-describedby={`${id}-description ${id}-note`}
          onPlay={() => {
            setHasEnded(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setHasEnded(true);
          }}
          onError={() => {
            setIsPlaying(false);
            setPlayFailed(true);
          }}
        />
      </div>
      <figcaption className="mascot-vignette-caption">
        <p className="mascot-vignette-eyebrow">A little Nonlate story</p>
        <h3 className="mascot-vignette-title" id={`${id}-title`}>{title}</h3>
        <p className="mascot-vignette-description" id={`${id}-description`}>{description}</p>
        <div className="mascot-vignette-controls">
          <button
            className="mascot-vignette-control"
            type="button"
            onClick={togglePlayback}
            aria-controls={`${id}-video`}
            aria-label={`${action} ${title} animation`}
          >
            <span aria-hidden="true">{isPlaying ? "Ⅱ" : hasEnded ? "↻" : "▶"}</span> {action}
          </button>
          <p className="mascot-vignette-note" id={`${id}-note`}>Silent brand animation, not an app recording.</p>
        </div>
        <p className="mascot-vignette-error" role="status">{playFailed ? "The animation couldn’t play. You can try Play again; the story above is always available." : ""}</p>
      </figcaption>
    </figure>
  );
}

export default MascotVignette;
