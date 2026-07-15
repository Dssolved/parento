import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  id?: string
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const MONTHS_NOMINATIVE = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/** Разбирает ISO-строку yyyy-mm-dd в локальные части даты (без сдвига по TZ). */
function parseISO(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) }
}

function formatDisplay(value: string) {
  const parsed = parseISO(value)
  if (!parsed) return ''
  return `${parsed.day} ${MONTHS[parsed.month]} ${parsed.year}`
}

export default function DatePicker({ value, onChange, min, max, placeholder = 'Выберите дату', id }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = parseISO(value)
  const today = new Date()

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? { year: today.getFullYear(), month: today.getMonth() }
    return { year: base.year, month: base.month }
  })

  // Синхронизируем показанный месяц с выбранной датой при открытии.
  useEffect(() => {
    if (open && selected) {
      setViewMonth({ year: selected.year, month: selected.month })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const minParsed = min ? parseISO(min) : null
  const maxParsed = max ? parseISO(max) : null

  const isDisabled = (year: number, month: number, day: number) => {
    const iso = toISO(year, month, day)
    if (min && iso < min) return true
    if (max && iso > max) return true
    return false
  }

  const days = useMemo(() => {
    const firstDay = new Date(viewMonth.year, viewMonth.month, 1)
    const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate()
    // getDay(): 0 = воскресенье. Приводим к понедельнику как первому дню недели.
    const leading = (firstDay.getDay() + 6) % 7

    const cells: Array<number | null> = []
    for (let i = 0; i < leading; i += 1) cells.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewMonth])

  const shiftMonth = (delta: number) => {
    setViewMonth((current) => {
      const next = new Date(current.year, current.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const shiftYear = (delta: number) => {
    setViewMonth((current) => ({ ...current, year: current.year + delta }))
  }

  const handleSelect = (day: number) => {
    onChange(toISO(viewMonth.year, viewMonth.month, day))
    setOpen(false)
  }

  const isSelectedDay = (day: number) =>
    selected != null && selected.year === viewMonth.year && selected.month === viewMonth.month && selected.day === day

  const isToday = (day: number) =>
    today.getFullYear() === viewMonth.year && today.getMonth() === viewMonth.month && today.getDate() === day

  // Отключаем стрелки навигации, когда весь соседний месяц вне диапазона.
  const prevMonthEnd = new Date(viewMonth.year, viewMonth.month, 0)
  const nextMonthStart = new Date(viewMonth.year, viewMonth.month + 1, 1)
  const canGoPrev = !minParsed || toISO(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate()) >= min!
  const canGoNext = !maxParsed || toISO(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), 1) <= max!

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((value) => !value)}
        className="form-input flex items-center justify-between gap-2 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute z-50 mt-2 w-72 rounded-lg border border-gray-100 bg-white p-3 shadow-soft"
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex">
              <button
                type="button"
                onClick={() => shiftYear(-1)}
                disabled={!canGoPrev}
                className="inline-flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                aria-label="Предыдущий год"
              >
                <ChevronsLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={!canGoPrev}
                className="inline-flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
            </div>

            <span className="text-sm font-semibold text-gray-900">
              {MONTHS_NOMINATIVE[viewMonth.month]} {viewMonth.year}
            </span>

            <div className="flex">
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={!canGoNext}
                className="inline-flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                aria-label="Следующий месяц"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => shiftYear(1)}
                disabled={!canGoNext}
                className="inline-flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                aria-label="Следующий год"
              >
                <ChevronsRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="text-center text-xs font-medium text-gray-400">
                {weekday}
              </div>
            ))}
            {days.map((day, index) => {
              if (day == null) return <div key={`empty-${index}`} />

              const disabled = isDisabled(viewMonth.year, viewMonth.month, day)
              const active = isSelectedDay(day)

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={`inline-flex size-9 items-center justify-center rounded-md text-sm transition ${
                    active
                      ? 'bg-emerald-600 font-semibold text-white'
                      : disabled
                        ? 'cursor-not-allowed text-gray-300'
                        : `text-gray-700 hover:bg-emerald-50 ${isToday(day) ? 'font-semibold text-emerald-700 ring-1 ring-emerald-200' : ''}`
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
