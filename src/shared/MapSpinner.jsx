export default function MapSpinner({ show, label = 'Cargando mapa...' }) {
  if (!show) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, background: '#f0f4f3', color: '#1b3a4b', fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        border: '3px solid rgba(27,58,75,0.15)', borderTopColor: '#e07b39',
        animation: 'svspin 0.8s linear infinite'
      }} />
      <p style={{ fontSize: 13, letterSpacing: 0.4, opacity: 0.6, margin: 0 }}>{label}</p>
      <style>{`@keyframes svspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
