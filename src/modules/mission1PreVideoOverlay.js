/**
 * Vídeo de introducción antes de la Misión 1 (mapa → cabina).
 * Coloca el archivo en `public/assets/video/mision1-intro.mp4`.
 */
export const MISSION1_PRE_VIDEO = {
  posterUrl: "",
  sources: [{ src: "/assets/video/mision1-intro.mp4", type: "video/mp4" }],
};

/**
 * Capa a pantalla completa; resuelve al terminar, error o saltar.
 * @param {HTMLElement | null} [mountParent]
 * @returns {Promise<void>}
 */
export function playMission1PreVideo(mountParent = typeof document !== "undefined" ? document.body : null) {
  return new Promise((resolve) => {
    if (!mountParent) {
      resolve();
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "mission1-pre-video-overlay";

    const posterAttr = MISSION1_PRE_VIDEO.posterUrl
      ? ` poster="${MISSION1_PRE_VIDEO.posterUrl}"`
      : "";
    const sourcesHtml = MISSION1_PRE_VIDEO.sources
      .map((s) => `<source src="${s.src}" type="${s.type}" />`)
      .join("");

    overlay.innerHTML = `
      <div class="mission1-pre-video-overlay__backdrop" aria-hidden="true"></div>
      <div class="mission1-pre-video-overlay__frame" role="dialog" aria-modal="true" aria-label="Introducción en vídeo">
        <div class="mission1-pre-video-overlay__film">
          <video
            class="mission1-pre-video-overlay__video"
            playsinline
            controls
            preload="metadata"${posterAttr}>
            ${sourcesHtml}
          </video>
        </div>
        <p class="mission1-pre-video-overlay__hint is-hidden">Pulsa reproducir en el vídeo si no arranca solo.</p>
        <div class="mission1-pre-video-overlay__actions">
          <button type="button" class="btn btn--secondary mission1-pre-video-overlay__skip">Saltar vídeo</button>
        </div>
      </div>
    `;

    mountParent.appendChild(overlay);

    const video = overlay.querySelector("video");
    const hint = overlay.querySelector(".mission1-pre-video-overlay__hint");
    const skip = overlay.querySelector(".mission1-pre-video-overlay__skip");

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener("keydown", onEscape);
      try {
        video?.pause();
      } catch (_) {
        /* noop */
      }
      overlay.remove();
      resolve();
    };

    function onEscape(ev) {
      if (ev.key === "Escape") finish();
    }
    window.addEventListener("keydown", onEscape);

    video?.addEventListener("ended", finish, { once: true });
    video?.addEventListener("error", finish, { once: true });
    skip?.addEventListener("click", finish, { once: true });

    const tryPlay = () => {
      const p = video?.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => hint?.classList.remove("is-hidden"));
      }
    };
    tryPlay();
  });
}
