export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className='flex items-center px-2 h-10 shrink-0' style={{ background: '#0d1b2a' }}>
      <span className='text-white/40 text-xs font-mono mr-4 hidden sm:block'>salmones_viz</span>
      <div className='flex gap-0.5'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={
              'px-4 py-1.5 text-xs font-medium rounded-t transition-colors ' +
              (activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5')
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
