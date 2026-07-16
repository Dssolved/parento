import { isSupabaseConfigured, supabase } from './supabase'
import type { EventInsert } from '../types/database'

export async function logEvent(
  eventName: string,
  properties: Record<string, string | number | boolean | null> = {},
  userId: string | null = null,
) {
  if (!isSupabaseConfigured) return

  const payload: EventInsert = {
    user_id: userId,
    event_name: eventName,
    properties,
  }

  const { error } = await supabase.from('events').insert(payload)

  if (error) {
    console.error(
      error.message.includes('events')
        ? `Не удалось сохранить событие "${eventName}". Проверьте, что выполнена миграция supabase/add-events.sql.`
        : `Failed to log event "${eventName}": ${error.message}`,
    )
  }
}
