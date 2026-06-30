import {
  ArrowRight,
  BookOpenCheck,
  Compass,
  HeartHandshake,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

const principles = [
  {
    title: 'Маршрут вместо шума',
    text: 'Мы собираем материалы в понятный путь: что важно сейчас, что пройти дальше и где остановиться.',
    Icon: Compass,
  },
  {
    title: 'Роль семьи имеет значение',
    text: 'Parento учитывает не только этап, но и роль: маму, папу, партнера или близкого взрослого.',
    Icon: UsersRound,
  },
  {
    title: 'Спокойный тон',
    text: 'Без давления, запугивания и обещаний идеального родительства. Только бережные шаги и здравый смысл.',
    Icon: HeartHandshake,
  },
  {
    title: 'Честные границы',
    text: 'Материалы помогают ориентироваться, но не заменяют врача, психолога или другого специалиста.',
    Icon: ShieldCheck,
  },
]

export default function About() {
  const { user } = useAuth()

  return (
    <section className="bg-gray-50">
      <div className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">О проекте</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
              Parento помогает будущим и молодым родителям не теряться в потоке информации
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-500">
              Это образовательная платформа с курсами, уроками и персональным маршрутом по этапу семьи.
              Мы строим продукт для тех, кому нужен не еще один список статей, а понятный следующий шаг.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-600 px-6 font-medium text-white hover:bg-emerald-700"
              >
                {user ? 'Перейти к обучению' : 'Начать бесплатно'}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                to="/legal/disclaimer"
                className="inline-flex min-h-12 items-center rounded-lg border border-gray-200 bg-white px-6 font-medium text-gray-700 hover:bg-gray-50"
              >
                Дисклеймер
              </Link>
            </div>
          </div>

          <Card className="p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpenCheck size={26} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-gray-900">Сейчас Parento находится на этапе MVP</h2>
            <p className="mt-3 leading-7 text-gray-500">
              Мы проверяем, помогает ли формат маршрутов, коротких уроков и прогресса сделать подготовку к родительству спокойнее и понятнее.
            </p>
          </Card>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map(({ title, text, Icon }) => (
            <Card key={title} className="p-5">
              <Icon className="size-7 text-emerald-600" aria-hidden="true" />
              <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Для кого</h2>
            <div className="mt-5 space-y-4 text-gray-600">
              <p className="leading-7">
                Для людей, которые планируют первого ребенка, проходят беременность или адаптируются к первым месяцам родительства.
              </p>
              <p className="leading-7">
                Отдельно мы учитываем партнеров и близких взрослых: родительство редко держится на одном человеке, а поддержка становится легче, когда у каждого есть понятная роль.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Чем Parento не является</h2>
            <div className="mt-5 space-y-4 text-gray-600">
              <p className="leading-7">
                Parento не ставит диагнозы, не назначает лечение и не заменяет консультацию врача, психолога или другого профильного специалиста.
              </p>
              <p className="leading-7">
                Наша задача - помочь ориентироваться в материалах, подготовить вопросы, выстроить обучение и снизить информационный хаос.
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-12 rounded-lg bg-emerald-950 p-6 text-white shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Начните с понятного первого шага</h2>
              <p className="mt-3 max-w-2xl leading-7 text-emerald-100">
                Parento подберет материалы по вашему этапу и поможет двигаться без лишнего информационного шума.
              </p>
            </div>
            <Link
              to={user ? '/catalog' : '/register'}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 font-medium text-emerald-950 hover:bg-emerald-50"
            >
              {user ? 'Открыть курсы' : 'Попробовать Parento'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
