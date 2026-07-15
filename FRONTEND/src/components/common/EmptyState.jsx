function EmptyState({ icon = "fa-circle-info", title, text }) {
  return (
    <div className="empty-state">
      <i className={`fa-solid ${icon}`} />
      <strong>{title}</strong>
      {text && <span>{text}</span>}
    </div>
  );
}

export default EmptyState;
