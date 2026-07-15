function LoadingState({ text = "Chargement..." }) {
  return (
    <div className="loading-state">
      <div className="spinner-border spinner-border-sm text-primary" role="status" />
      <span>{text}</span>
    </div>
  );
}

export default LoadingState;
