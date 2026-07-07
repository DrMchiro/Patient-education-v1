export default function RoadmapBar({ topicBlocks, corePosition, coreSequenceLength, activeIdx, onSelectBlock }) {
  return (
    <div className="roadmap-wrap">
      <div className="roadmap-bar">
        {topicBlocks.map((block, idx) => (
          <button
            key={idx}
            className={`roadmap-segment topic-${idx % 2}${activeIdx === idx ? ' selected' : ''}`}
            style={{ width: `${(block.videoIds.length / coreSequenceLength) * 100}%` }}
            onClick={() => onSelectBlock(idx)}
          >
            {block.topic}
          </button>
        ))}
        <div
          className="roadmap-marker"
          style={{ left: `${(corePosition / coreSequenceLength) * 100}%` }}
        ></div>
      </div>
      <div className="roadmap-phase-ticks">
        <span>Foundations</span>
        <span>Building</span>
        <span>Mastery</span>
      </div>
    </div>
  );
}
