import { Link, Navigate, useParams } from 'react-router-dom'
import Card from '../components/ui/Card'

type LegalSlug = 'disclaimer' | 'privacy' | 'terms'

interface LegalSection {
  title: string
  paragraphs?: string[]
  items?: string[]
}

interface LegalDocument {
  title: string
  description: string
  updatedAt: string
  sections: LegalSection[]
}

const legalDocuments: Record<LegalSlug, LegalDocument> = {
  disclaimer: {
    title: 'Дисклеймер',
    description: 'Как понимать материалы Parento и где проходит граница образовательного контента.',
    updatedAt: '30 июня 2026',
    sections: [
      {
        title: 'Образовательный характер материалов',
        paragraphs: [
          'Материалы Parento предназначены для образовательных целей и помогают лучше ориентироваться в темах планирования, беременности, родительства и ухода за ребенком.',
          'Parento не является медицинским, психологическим или иным профессиональным сервисом консультаций.',
        ],
      },
      {
        title: 'Что Parento не делает',
        items: [
          'не ставит диагнозы;',
          'не назначает лечение;',
          'не оценивает симптомы как безопасные или опасные;',
          'не заменяет очный прием врача, психолога или другого профильного специалиста.',
        ],
      },
      {
        title: 'Когда обращаться к специалисту',
        paragraphs: [
          'Если у вас есть вопросы о здоровье, симптомах, беременности, развитии ребенка, лечении, эмоциональном состоянии или безопасности, обратитесь к профильному специалисту.',
          'Материалы сервиса могут быть общими и не учитывать вашу индивидуальную ситуацию.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Политика конфиденциальности',
    description: 'Какие данные нужны Parento для работы продукта и как они используются.',
    updatedAt: '30 июня 2026',
    sections: [
      {
        title: 'Какие данные мы собираем',
        items: [
          'email для регистрации и входа;',
          'имя, если пользователь его указывает;',
          'выбранный этап: планирование, беременность или первый год ребенка;',
          'роль в семье: мама, папа, партнер, близкий взрослый или другой вариант;',
          'статус подписки;',
          'прогресс по урокам;',
          'отзывы, оценки и контакт для ответа, если пользователь отправляет форму обратной связи;',
          'технические данные, необходимые для работы сайта.',
        ],
      },
      {
        title: 'Зачем мы используем данные',
        items: [
          'создать и поддерживать аккаунт;',
          'персонализировать рекомендации и обучение;',
          'сохранять прогресс по урокам;',
          'управлять доступом к Free и Premium-материалам;',
          'обрабатывать обратную связь и улучшать пользовательский опыт;',
          'улучшать продукт и исправлять ошибки.',
        ],
      },
      {
        title: 'Где хранятся данные',
        paragraphs: [
          'Данные проекта хранятся в Supabase и могут обрабатываться сервисами, которые обеспечивают работу приложения и хостинга.',
          'Мы не продаем персональные данные третьим лицам.',
        ],
      },
      {
        title: 'Удаление данных',
        paragraphs: [
          'Пользователь может удалить аккаунт в профиле. При удалении аккаунта удаляются профиль, выбранный этап, роль, статус подписки, прогресс по урокам и отзывы, связанные с этим аккаунтом.',
          'Удаление необратимо. После удаления для использования Parento потребуется создать новый аккаунт.',
        ],
      },
    ],
  },
  terms: {
    title: 'Условия использования',
    description: 'Базовые правила использования Parento на этапе MVP.',
    updatedAt: '30 июня 2026',
    sections: [
      {
        title: 'Назначение сервиса',
        paragraphs: [
          'Parento предоставляет образовательные материалы и инструменты для организации обучения будущих и молодых родителей.',
          'Используя сервис, вы соглашаетесь, что материалы Parento не заменяют консультацию врача, психолога или другого специалиста.',
        ],
      },
      {
        title: 'MVP-статус',
        paragraphs: [
          'Сервис находится на этапе MVP. Отдельные функции могут изменяться, работать в тестовом режиме или быть временно недоступны.',
          'Мы стараемся поддерживать стабильность продукта, но не гарантируем отсутствие ошибок.',
        ],
      },
      {
        title: 'Аккаунт и доступ',
        items: [
          'пользователь отвечает за корректность данных, которые указывает в профиле;',
          'доступ к Premium-материалам может зависеть от статуса подписки;',
          'на этапе MVP Premium-функции могут использоваться для проверки модели и пользовательского спроса.',
        ],
      },
      {
        title: 'Контент',
        paragraphs: [
          'Материалы Parento предназначены для личного использования внутри сервиса. Копирование и распространение материалов без разрешения владельца проекта не допускается.',
        ],
      },
      {
        title: 'Ограничение ответственности',
        paragraphs: [
          'Решения, связанные со здоровьем, беременностью, развитием ребенка или лечением, должны приниматься вместе с профильным специалистом.',
          'Parento не несет ответственности за решения, принятые пользователем на основе общего образовательного материала без консультации специалиста.',
        ],
      },
    ],
  },
}

export default function LegalPage() {
  const { slug = '' } = useParams()
  const document = legalDocuments[slug as LegalSlug]

  if (!document) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="container-page py-10">
      <Link to="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
        На главную
      </Link>

      <div className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Правовая информация</p>
        <h1 className="mt-2 text-4xl font-semibold text-gray-900">{document.title}</h1>
        <p className="mt-4 text-lg leading-8 text-gray-500">{document.description}</p>
        <p className="mt-3 text-sm text-gray-400">Обновлено: {document.updatedAt}</p>
      </div>

      <Card className="mt-8 max-w-3xl p-6 sm:p-8">
        <div className="space-y-8">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              {section.paragraphs && (
                <div className="mt-3 space-y-3 text-gray-600">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="leading-7">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
              {section.items && (
                <ul className="mt-3 space-y-2 text-gray-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2 leading-7">
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Этот документ подготовлен для MVP и не является юридической консультацией. Перед публичным коммерческим запуском тексты стоит проверить с юристом.
          </div>
        </div>
      </Card>
    </section>
  )
}
