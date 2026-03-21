import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Inicio' },
  { path: '/mapa', label: 'Mapa Interactivo' },
  { path: '/about', label: 'Acerca de' },
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='bg-[var(--color-primary)] text-white shadow-lg'>
        <nav className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <Link to='/' className='text-xl font-bold tracking-tight'>
              Salmones en Chile
            </Link>
            <div className='flex gap-6'>
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={
                    'text-sm font-medium transition-colors hover:text-[var(--color-accent)] ' +
                    (location.pathname === path
                      ? 'text-[var(--color-accent)]'
                      : 'text-white/80')
                  }
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className='flex-1'>{children}</main>

      <footer className='bg-[var(--color-primary)] text-white/60 text-xs py-4 text-center'>
        Universidad Diego Portales &middot; Tremen SpA &middot; 2026
      </footer>
    </div>
  )
}
