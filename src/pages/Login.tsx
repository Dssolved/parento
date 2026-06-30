import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import {
  getAuthErrorMessage,
  getEmailRedirectTo,
  isEmailNotConfirmedError,
} from '../lib/auth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile, ProfileInsert } from '../types/database'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const resendConfirmation = async () => {
    setError('')
    setResendMessage('')

    if (!email) {
      setError('Введите email, чтобы повторно отправить письмо подтверждения.')
      return
    }

    if (!isSupabaseConfigured) {
      setError('Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.')
      return
    }

    setResending(true)
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
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
    setShowResendConfirmation(false)

    if (!isSupabaseConfigured) {
      setError('Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.')
      return
    }

    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(getAuthErrorMessage(signInError.message))
      setShowResendConfirmation(isEmailNotConfirmedError(signInError.message))
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      navigate('/dashboard')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    let nextProfile = profile as Profile | null

    if (!nextProfile) {
      const profilePayload: ProfileInsert = {
        id: userId,
        email: data.user.email || email,
        full_name: data.user.user_metadata.full_name as string | null,
        role: 'user',
        stage: null,
        caregiver_role: null,
        subscription: 'free',
      }

      const { data: createdProfile } = await supabase
        .from('profiles')
        .upsert(profilePayload)
        .select('*')
        .single()

      nextProfile = createdProfile as Profile | null
    }

    navigate(nextProfile?.stage ? '/dashboard' : '/onboarding')
  }

  return (
    <section className="container-page flex min-h-[72vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl font-semibold text-gray-900">Войти</h1>
        <p className="mt-2 text-sm text-gray-500">Продолжите обучение в своем кабинете Parento.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              required
            />
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          {resendMessage && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{resendMessage}</p>
          )}

          <Button type="submit" className="w-full" isLoading={loading}>
            Войти
          </Button>
          {showResendConfirmation && (
            <Button variant="secondary" className="w-full" onClick={resendConfirmation} isLoading={resending}>
              Отправить письмо подтверждения еще раз
            </Button>
          )}
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
            Зарегистрироваться
          </Link>
        </p>
      </Card>
    </section>
  )
}
