export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className='flex items-center px-2 h-10 shrink-0 border-b border-[#1b3a4b]/10' style={{ background: '#f0f4f3' }}>
      <span className='text-[#1b3a4b]/40 text-xs font-mono mr-4 hidden sm:block'>salmones_viz</span>
      <div className='flex gap-0.5'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={
              'px-4 py-1.5 text-xs font-medium rounded-t transition-colors ' +
              (activeTab === tab.id
                ? 'bg-white/80 text-[#1b3a4b]'
                : 'text-[#1b3a4b]/50 hover:text-[#1b3a4b] hover:bg-white/40')
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
