import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from 'assets/logo.png'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const showBackground = scrolled || open
  const linkBase = 'px-4 py-3 rounded-md text-2xl font-medium whitespace-nowrap'
  const linkActive = 'text-brand-700 font-semibold'
  const linkIdle = 'text-black hover:text-brand-700'

  const menuItems = [
    { to: '/map', label: '지도검색' },
    { to: '/search', label: '상세검색' },
    { to: '/region', label: '지역정보' },
    { to: '/compare', label: '비교분석' }
  ]

  return (
    <header
      className={`sticky top-0 z-50 text-black transition-all duration-300 ${
        showBackground ? 'bg-white shadow-[0_6px_18px_-12px_rgba(15,23,42,0.12)]' : 'bg-transparent shadow-none'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-24 grid grid-cols-3 items-center">
        <div className="col-start-1 flex items-center gap-4">
          <NavLink to="/">
            <img src={logo} alt="로고" className="h-16 w-auto" />
          </NavLink>
        </div>
        <button
          className="col-start-3 justify-self-end inline-flex items-center justify-center rounded-md p-3 text-black hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/30 md:hidden"
          aria-label="메뉴 열기"
          onClick={() => setOpen(!open)}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden md:flex items-center justify-end gap-4 col-start-3 justify-self-end">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      {open && (
        <div className="md:hidden">
          <div className="space-y-1 px-4 py-3">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }: { isActive: boolean }) => `${linkBase} block ${isActive ? 'text-brand-700 font-semibold' : 'text-black hover:text-brand-700'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}


