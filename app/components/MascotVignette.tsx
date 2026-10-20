"use client";
import { useWebsiteLocale } from "./WebsiteLocale";
import { useCallback, useEffect, useRef, useState } from "react";
export type MascotVignetteProps = {
    id: string;
    src: string;
    poster: string;
    title: string;
    description: string;
    reducedMotion: boolean;
    className?: string;
};
/** A silent looping brand story, respecting visibility and device motion preferences. */
export function MascotVignette({ id, src, poster, title, description, reducedMotion, className, }: MascotVignetteProps) {
    const { t } = useWebsiteLocale();
    const figureRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mountedRef = useRef(false);
    const inViewRef = useRef(false);
    const autoplayBlockedRef = useRef(false);
    const playRequestRef = useRef(0);
    const [playFailed, setPlayFailed] = useState(false);
    const requestPlay = useCallback(() => {
        const video = videoRef.current;
        if (!video || document.hidden)
            return;
        const request = ++playRequestRef.current;
        video.muted = true;
        setPlayFailed(false);
        void video.play().catch(() => {
            if (mountedRef.current && request === playRequestRef.current) {
                autoplayBlockedRef.current = true;
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
        if (!figure || !video)
            return;
        const pause = () => {
            // An interrupted play promise must not turn a deliberate pause into an error.
            playRequestRef.current += 1;
            video.pause();
        };
        const syncPlayback = () => {
            if (!inViewRef.current || document.hidden || reducedMotion) {
                pause();
                return;
            }
            if (!autoplayBlockedRef.current && video.paused) {
                requestPlay();
            }
        };
        // Observe the media, not the caption: long copy must not prevent a visible film
        // from reaching the threshold. Without observer support, the poster stays visible.
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
    }, [reducedMotion, requestPlay]);
    return (<figure id={id} ref={figureRef} className={`mascot-vignette${className ? ` ${className}` : ""}`} aria-labelledby={`${id}-title`}>
      <div className="mascot-vignette-media">
        <span className="mascot-vignette-glow" aria-hidden="true"/>
        <video id={`${id}-video`} ref={videoRef} src={src} poster={poster} width="540" height="960" muted playsInline loop preload="none" disablePictureInPicture aria-label={`${title}: ${t("animated brand story")}`} aria-describedby={`${id}-description ${id}-note`} onError={() => setPlayFailed(true)}/>
      </div>
      <figcaption className="mascot-vignette-caption">
        <p className="mascot-vignette-eyebrow">{t("A little Nonlate story")}</p>
        <h3 className="mascot-vignette-title" id={`${id}-title`}>{t(title)}</h3>
        <p className="mascot-vignette-description" id={`${id}-description`}>{t(description)}</p>
        <p className="mascot-vignette-note" id={`${id}-note`}>{t("Silent brand animation, not an app recording.")}</p>
        <p className="mascot-vignette-error" role="status">{t(playFailed ? "This browser couldn’t play the animation. Its still image and story remain available." : "")}</p>
      </figcaption>
    </figure>);
}
export default MascotVignette;
