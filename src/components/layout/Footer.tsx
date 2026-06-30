import { BookOpenCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const footerGroups = [
  {
    title: 'Обучение',
    links: [
      { label: 'О проекте', to: '/about' },
      { label: 'Моё обучение', to: '/dashboard' },
      { label: 'Каталог курсов', to: '/catalog' },
      { label: 'Premium', to: '/subscribe' },
    ],
  },
  {
    title: 'Аккаунт',
    links: [
      { label: 'Профиль', to: '/profile' },
      { label: 'Контекст', to: '/onboarding' },
    ],
  },
  {
    title: 'Документы',
    links: [
      { label: 'Дисклеймер', to: '/legal/disclaimer' },
      { label: 'Конфиденциальность', to: '/legal/privacy' },
      { label: 'Условия', to: '/legal/terms' },
    ],
  },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-emerald-100 bg-emerald-950 text-emerald-50">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold text-white">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <BookOpenCheck size={20} aria-hidden="true" />
              </span>
              Parento
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-emerald-100">
              Курсы и материалы для родителей от планирования до первых месяцев. Спокойно, последовательно и без информационного шума.
            </p>
          </div>

          <nav className="grid gap-6 sm:grid-cols-3" aria-label="Навигация в подвале">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold text-white">{group.title}</h2>
                <div className="mt-3 grid gap-2 text-sm">
                  {group.links.map((link) => (
                    <Link key={link.to} to={link.to} className="text-emerald-100 hover:text-white">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="max-w-3xl text-xs leading-5 text-emerald-200">
            Материалы Parento носят образовательный характер и не заменяют консультацию врача, психолога или другого профильного специалиста.
          </p>
          <p className="mt-4 text-xs text-emerald-300">© {currentYear} Parento</p>
        </div>
      </div>
    </footer>
  )
}
