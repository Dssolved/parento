import { CheckCircle2, Circle, MailCheck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import {
  getAuthErrorMessage,
  getEmailRedirectTo,
  getPasswordRules,
  isPasswordValid,
} from '../lib/auth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { ProfileInsert } from '../types/database'

export default function Register() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [successEmail, setSuccessEmail] = useState<string>('')
  const [resendMessage, setResendMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const passwordRules = useMemo(() => getPasswordRules(password), [password])
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const resendConfirmation = async () => {
    const targetEmail = successEmail || email
    setError('')
    setResendMessage('')

    if (!targetEmail) return
    if (!isSupabaseConfigured) {
      setError('Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.')
      return
    }

    setResending(true)
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
      options: {
        emailRedirectTo: getEmailRedirectTo(),
      },
    })

    if (resendError) {
      setError(getAuthErrorMessage(resendError.message))
    } else {
      setResendMessage('Письмо отправлено повторно. Проверьте входящие и папку спам.')
    }
    setResending(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setResendMessage('')

    if (!isSupabaseConfigured) {
      setError('Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.')
      return
    }

    if (!isPasswordValid(password)) {
      setError('Пароль слишком простой. Проверьте требования ниже.')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || null,
        },
        emailRedirectTo: getEmailRedirectTo(),
      },
    })

    if (signUpError || !data.user) {
      setError(getAuthErrorMessage(signUpError?.message || 'Не удалось создать пользователя.'))
      setLoading(false)
      return
    }

    if (data.session) {
      const profile: ProfileInsert = {
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName.trim() || null,
        role: 'user',
        stage: null,
        caregiver_role: null,
        subscription: 'free',
      }

      const { error: profileError } = await supabase.from('profiles').upsert(profile)

      if (profileError) {
        setError(getAuthErrorMessage(profileError.message))
        setLoading(false)
        return
      }

      await refreshProfile()
      navigate('/onboarding')
      return
    }

    setSuccessEmail(email)
    setLoading(false)
  }

  if (successEmail) {
    return (
      <section className="container-page flex min-h-[72vh] items-center justify-center py-12">
        <Card className="w-full max-w-md p-6 text-center sm:p-8">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <MailCheck size={28} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-gray-900">Подтвердите email</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Мы отправили письмо на <span className="font-medium text-gray-900">{successEmail}</span>. Перейдите по ссылке в письме, затем войдите в аккаунт.
          </p>

          {resendMessage && (
            <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{resendMessage}</p>
          )}
          {error && <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <div className="mt-6 space-y-3">
            <Link
              to="/login"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700"
            >
              Перейти ко входу
            </Link>
            <Button variant="secondary" className="w-full" onClick={resendConfirmation} isLoading={resending}>
              Отправить письмо еще раз
            </Button>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className="container-page flex min-h-[72vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl font-semibold text-gray-900">Регистрация</h1>
        <p className="mt-2 text-sm text-gray-500">Создайте профиль и выберите актуальный этап.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="form-label">Имя</span>
            <input
              className="form-input"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Как к вам обращаться"
            />
          </label>
          <label className="block space-y-2">
            <span className="form-label">Email</span>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="form-label">Пароль</span>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            {passwordRules.map((rule) => (
              <p
                key={rule.id}
                className={`flex items-center gap-2 text-sm ${rule.isValid ? 'text-emerald-700' : 'text-gray-500'}`}
              >
                {rule.isValid ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <Circle size={16} aria-hidden="true" />
                )}
                {rule.label}
              </p>
            ))}
          </div>
          <label className="block space-y-2">
            <span className="form-label">Повторите пароль</span>
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-rose-600">Пароли не совпадают.</p>
          )}

          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
            disabled={!isPasswordValid(password) || !passwordsMatch}
          >
            Начать бесплатно
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
            Войти
          </Link>
        </p>
      </Card>
    </section>
  )
}
