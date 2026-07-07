function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function HistoryList({ history, library, emptyText }) {
  if (history.length === 0) {
    return (
      <div className="prompt-sub" style={{ marginTop: 14 }}>
        {emptyText}
      </div>
    );
  }

  const groups = [];
  const byTopic = new Map();
  for (const entry of history) {
    const video = library.byId.get(entry.video_id);
    if (!video) continue;
    if (!byTopic.has(video.topic)) {
      const g = { topic: video.topic, entries: [] };
      byTopic.set(video.topic, g);
      groups.push(g);
    }
    byTopic.get(video.topic).entries.push(entry);
  }

  return (
    <div style={{ width: '100%' }}>
      {groups.map((g) => (
        <div key={g.topic}>
          <div className="topic-group-title">{g.topic}</div>
          {g.entries.map((e, i) => {
            const video = library.byId.get(e.video_id);
            return (
              <div className="history-item" key={i}>
                <div className="history-check">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="#2E9E5B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="history-item-title">
                    {video.title}
                    {e.added_by_doctor && <span className="doctor-tag-inline">Doctor added</span>}
                  </div>
                  <div className="history-item-date">Watched {formatDate(e.watched_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
