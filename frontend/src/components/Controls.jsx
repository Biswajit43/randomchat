export default function Controls({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onSkip,
  onStop,
  onReport,
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <IconButton active={micOn} onClick={onToggleMic} label={micOn ? "Mute mic" : "Unmute mic"}>
        {micOn ? "🎙️" : "🔇"}
      </IconButton>
      <IconButton active={camOn} onClick={onToggleCam} label={camOn ? "Turn camera off" : "Turn camera on"}>
        {camOn ? "📹" : "🚫"}
      </IconButton>

      <button
        onClick={onSkip}
        className="px-5 py-3 rounded-full bg-signal text-ink font-display font-semibold text-sm hover:brightness-110 transition"
      >
        Next →
      </button>

      <button
        onClick={onStop}
        className="px-5 py-3 rounded-full bg-panel2 text-mist font-display font-medium text-sm border border-white/10 hover:text-white transition"
      >
        Stop
      </button>

      <button
        onClick={onReport}
        className="px-4 py-3 rounded-full bg-coral/10 text-coral border border-coral/30 font-display text-sm hover:bg-coral/20 transition"
      >
        Report
      </button>
    </div>
  );
}

function IconButton({ active, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-12 h-12 rounded-full flex items-center justify-center border transition ${
        active ? "bg-panel2 border-white/10 text-white" : "bg-coral/10 border-coral/30 text-coral"
      }`}
    >
      {children}
    </button>
  );
}
