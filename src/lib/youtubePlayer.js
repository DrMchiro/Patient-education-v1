// Loads the YouTube IFrame API script once and caches the ready promise —
// every PlayerScreen mount after the first reuses it, so only the iframe
// embed itself needs to spin up, not the whole script.
let apiPromise = null;

export function loadYouTubeIframeAPI() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previous) previous();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });

  return apiPromise;
}

// rel=0, modestbranding=1, iv_load_policy=3 minimize related-video/branding
// chrome. Starts muted because autoplay-with-sound is blocked by most
// browsers regardless of user gesture history on a shared kiosk profile;
// the caller shows a "tap to unmute" affordance instead of trying to detect
// whether autoplay-with-sound would have worked.
export const KIOSK_PLAYER_VARS = {
  autoplay: 1,
  mute: 1,
  controls: 1,
  rel: 0,
  modestbranding: 1,
  iv_load_policy: 3,
  playsinline: 1,
  fs: 0,
  disablekb: 1,
};
