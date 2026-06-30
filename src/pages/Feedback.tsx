import { CheckCircle2, MessageSquareText, Send } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { FeedbackInsert, FeedbackType } from '../types/database'

const FEEDBACK_COMPLETED_KEY = 'parento_feedback_prompt_completed'

const feedbackTypes: Array<{ value: FeedbackType, label: string }> = [
  { value: 'general', label: 'Общее впечатление' },
  { value: 'bug', label: 'Ошибка' },
  { value: 'ux', label: 'Неудобство' },
  { value: 'content', label: 'Контент' },
  { value: 'idea', label: 'Идея' },
]

export default function Feedback() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const sourcePath = useMemo(() => searchParams.get('from') || '/', [searchParams])
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!message.trim()) {
      setError('Напишите пару слов, что было понятно или что стоит улучшить.')
      return
    }

    if (!isSupabaseConfigured) {
      setError('Supabase не настроен. Заполните env-переменные перед отправкой отзыва.')
      return
    }

    setIsSubmitting(true)

    const payload: FeedbackInsert = {
      user_id: user?.id ?? null,
      feedback_type: feedbackType,
      rating,
      message: message.trim(),
      contact: contact.trim() || null,
      path: sourcePath,
    }

    const { error: insertError } = await supabase.from('feedback').insert(payload)

    if (insertError) {
      setError(
        insertError.message.includes('feedback')
          ? 'Не удалось сохранить отзыв. Проверьте, что выполнена миграция supabase/add-feedback.sql.'
          : insertError.message,
      )
      setIsSubmitting(false)
      return
    }

    window.localStorage.setItem(FEEDBACK_COMPLETED_KEY, 'true')
    setIsSuccess(true)
    setMessage('')
    setContact('')
    setRating(null)
    setIsSubmitting(false)
  }

  return (
    <section className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Обратная связь</p>
        <h1 className="mt-2 text-4xl font-semibold text-gray-900">Помогите сделать Parento полезнее</h1>
        <p className="mt-4 text-lg leading-8 text-gray-500">
          Расскажите, что было понятно, где возникли сложности и чего не хватило. Это поможет нам улучшить продукт перед следующими тестами.
        </p>

        {isSuccess ? (
          <Card className="mt-8 p-6 text-center sm:p-8">
            <div className="mx-auto inline-flex size-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={30} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-gray-900">Спасибо, отзыв сохранён</h2>
            <p className="mt-3 text-gray-500">
              Это очень помогает понять, что в Parento уже работает, а что нужно доработать.
            </p>
            <Link
              to={sourcePath}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700"
            >
              Вернуться назад
            </Link>
          </Card>
        ) : (
          <Card className="mt-8 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <MessageSquareText size={21} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Ваш отзыв</h2>
                <p className="mt-1 text-sm text-gray-500">Источник: {sourcePath}</p>
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="form-label">Тип отзыва</span>
                <select
                  className="form-input"
                  value={feedbackType}
                  onChange={(event) => setFeedbackType(event.target.value as FeedbackType)}
                >
                  {feedbackTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="form-label">Оценка опыта</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`inline-flex size-10 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                        rating === value
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-pressed={rating === value}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-2">
                <span className="form-label">Сообщение</span>
                <textarea
                  className="form-input min-h-40"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Что было полезно? Где было непонятно? Чего не хватило?"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="form-label">Контакт для ответа, необязательно</span>
                <input
                  className="form-input"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Email или Telegram"
                />
              </label>

              {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

              <Button type="submit" isLoading={isSubmitting}>
                <Send size={17} aria-hidden="true" />
                Отправить отзыв
              </Button>
            </form>
          </Card>
        )}
      </div>
    </section>
  )
}
