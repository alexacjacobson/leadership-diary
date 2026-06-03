export default function EmptyState({ onStart }) {
  return (
    <div className="empty-state">
      <div className="empty-state-inner">
        <h1 className="empty-headline">My Leadership Diary</h1>
        <p className="empty-subline">Where leadership takes shape.</p>
        <button className="btn btn-primary empty-cta" onClick={onStart}>
          Start your first entry →
        </button>
      </div>
    </div>
  )
}
