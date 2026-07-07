import { useEffect, useRef, useState } from 'react';
import { loadYouTubeIframeAPI, KIOSK_PLAYER_VARS } from '../lib/youtubePlayer';

export default function PlayerScreen({ video, onEnded }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeAPI().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: video.youtube_id,
        playerVars: KIOSK_PLAYER_VARS,
        events: {
          onReady: (e) => {
            e.target.playVideo();
            setMuted(e.target.isMuted());
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setMuted(e.target.isMuted());
            if (e.data === YT.PlayerState.ENDED) onEndedRef.current();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  function handleUnmute() {
    const player = playerRef.current;
    if (!player) return;
    player.unMute();
    player.playVideo();
    setMuted(false);
  }

  return (
    <div className="screen player-screen">
      <div className="player-video-area">
        <div className="player-topic-tag">{video.topic.toUpperCase()}</div>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {muted && (
          <div className="unmute-overlay">
            <button className="unmute-btn" onClick={handleUnmute}>
              🔊 Tap to unmute
            </button>
          </div>
        )}
      </div>
      <div className="player-bottom">
        <div className="player-caption-row">{video.title}</div>
      </div>
    </div>
  );
}
