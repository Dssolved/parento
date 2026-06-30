import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Progress } from '../types/database'

export function useProgress(userId: string) {
  return useQuery({
    queryKey: ['progress', userId],
    queryFn: async (): Promise<Progress[]> => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      return data as Progress[]
    },
    enabled: isSupabaseConfigured && Boolean(userId),
  })
}

export function useCompleteLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, lessonId }: { userId: string; lessonId: string }) => {
      if (!isSupabaseConfigured) return

      const { error } = await supabase
        .from('progress')
        .upsert(
          { user_id: userId, lesson_id: lessonId },
          { onConflict: 'user_id,lesson_id', ignoreDuplicates: true },
        )

      if (error) throw error
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['progress', userId] })
    },
  })
}
