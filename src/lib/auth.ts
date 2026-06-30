export interface PasswordRule {
  id: string
  label: string
  isValid: boolean
}

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: 'length',
      label: 'Минимум 8 символов',
      isValid: password.length >= 8,
    },
    {
      id: 'letter',
      label: 'Хотя бы одна буква',
      isValid: /[A-Za-zА-Яа-яЁё]/.test(password),
    },
    {
      id: 'number',
      label: 'Хотя бы одна цифра',
      isValid: /\d/.test(password),
    },
  ]
}

export function isPasswordValid(password: string) {
  return getPasswordRules(password).every((rule) => rule.isValid)
}

export function isEmailNotConfirmedError(message: string) {
  return /email not confirmed|not confirmed|confirm/i.test(message)
}

export function getAuthErrorMessage(message: string) {
  if (/profiles_id_fkey|foreign key|violates foreign key/i.test(message)) {
    return 'Не удалось создать профиль для этого аккаунта. Если вы уже регистрировались, подтвердите email или попробуйте войти.'
  }

  if (/rate limit|too many|over email send rate limit/i.test(message)) {
    return 'Слишком много писем за короткое время. Подождите немного и попробуйте снова.'
  }

  if (isEmailNotConfirmedError(message)) {
    return 'Email еще не подтвержден. Проверьте письмо от Parento и перейдите по ссылке подтверждения.'
  }

  if (/invalid login credentials/i.test(message)) {
    return 'Неверный email или пароль.'
  }

  if (/user already registered|already registered|already exists/i.test(message)) {
    return 'Пользователь с таким email уже зарегистрирован. Попробуйте войти.'
  }

  if (/password/i.test(message)) {
    return 'Пароль не подходит. Проверьте требования и попробуйте еще раз.'
  }

  return message
}

export function getEmailRedirectTo() {
  return `${window.location.origin}/login`
}
