import { BookOpenCheck, Crown, LogOut, Menu, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }`

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const handleSignOut = async () => {
    closeMenu()
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="container-page py-3">
        <div className="flex min-h-10 items-center justify-between gap-3">
          <Link to="/" onClick={closeMenu} className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <BookOpenCheck size={20} aria-hidden="true" />
            </span>
            Parento
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {user && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Моё обучение
                </NavLink>
                <NavLink to="/catalog" className={navLinkClass}>
                  Курсы
                </NavLink>
                <NavLink to="/subscribe" className={navLinkClass}>
                  Подписка
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  Профиль
                </NavLink>
                {profile?.role === 'admin' && (
                  <NavLink to="/admin" className={navLinkClass}>
                    Админ
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                  <Crown size={15} aria-hidden="true" />
                  {profile?.subscription === 'premium' ? 'Premium' : 'Free'}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Выйти">
                  <LogOut size={17} aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <UserRound size={16} aria-hidden="true" />
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="inline-flex min-h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Начать бесплатно
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 md:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-white p-3 shadow-soft md:hidden">
            {user ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-2">
                    <Crown size={15} aria-hidden="true" />
                    Подписка
                  </span>
                  <span>{profile?.subscription === 'premium' ? 'Premium' : 'Free'}</span>
                </div>
                <nav className="grid gap-1" aria-label="Мобильная навигация">
                  <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={closeMenu}>
                    Моё обучение
                  </NavLink>
                  <NavLink to="/catalog" className={mobileNavLinkClass} onClick={closeMenu}>
                    Курсы
                  </NavLink>
                  <NavLink to="/subscribe" className={mobileNavLinkClass} onClick={closeMenu}>
                    Подписка
                  </NavLink>
                  <NavLink to="/profile" className={mobileNavLinkClass} onClick={closeMenu}>
                    Профиль
                  </NavLink>
                  {profile?.role === 'admin' && (
                    <NavLink to="/admin" className={mobileNavLinkClass} onClick={closeMenu}>
                      Админ
                    </NavLink>
                  )}
                </nav>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={17} aria-hidden="true" />
                  Выйти
                </button>
              </>
            ) : (
              <div className="grid gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <UserRound size={16} aria-hidden="true" />
                  Войти
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Начать бесплатно
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
