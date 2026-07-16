/** Русские формы числительного: [1, 2-4, 5-20/0]. Пример: ['урок', 'урока', 'уроков']. */
type PluralForms = [one: string, few: string, many: string]

export function pluralize(count: number, forms: PluralForms): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod100 >= 11 && mod100 <= 14) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

export function pluralizeWithCount(count: number, forms: PluralForms): string {
  return `${count} ${pluralize(count, forms)}`
}
