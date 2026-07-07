export default function QueueScheduledLists({ queue, scheduled, library, onRemoveQueued, onRemoveScheduled }) {
  return (
    <>
      <div className="doctor-section-title">Queued for next visit</div>
      <div className="queue-list">
        {queue.length === 0 ? (
          <div className="empty-note">Nothing queued — they continue their normal progression.</div>
        ) : (
          queue.map((videoId, idx) => {
            const video = library.byId.get(videoId);
            return (
              <div className="queue-item" key={idx}>
                <div className="queue-item-title">
                  {idx + 1}. {video ? video.title : `Video #${videoId}`}
                </div>
                <button className="queue-remove-btn" onClick={() => onRemoveQueued(idx)}>
                  &times;
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="doctor-section-title">Scheduled for later</div>
      <div className="scheduled-list">
        {scheduled.length === 0 ? (
          <div className="empty-note">Nothing scheduled for later.</div>
        ) : (
          scheduled.map((sched, idx) => (
            <div className="scheduled-item" key={idx}>
              <div>
                <div className="scheduled-item-title">{sched.label}</div>
                <div className="scheduled-item-when">
                  {sched.video_ids.length} video{sched.video_ids.length > 1 ? 's' : ''}
                </div>
              </div>
              <button className="queue-remove-btn" onClick={() => onRemoveScheduled(idx)}>
                &times;
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
