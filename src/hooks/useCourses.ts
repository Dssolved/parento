import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Course, Lesson, Stage } from '../types/database'

export function useCourses(stage: Stage | 'all' = 'all') {
  return useQuery({
    queryKey: ['courses', stage],
    queryFn: async (): Promise<Course[]> => {
      if (!isSupabaseConfigured) return []

      let query = supabase.from('courses').select('*').eq('is_published', true).order('created_at')

      if (stage !== 'all') {
        query = query.in('stage', [stage, 'all'])
      }

      const { data, error } = await query
      if (error) throw error
      return data as Course[]
    },
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: async (): Promise<Course> => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (error) throw error
      return data as Course
    },
    enabled: isSupabaseConfigured && Boolean(id),
  })
}

export function useLessons(courseId: string) {
  return useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async (): Promise<Lesson[]> => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index')

      if (error) throw error
      return data as Lesson[]
    },
    enabled: isSupabaseConfigured && Boolean(courseId),
  })
}

export function useAllLessons() {
  return useQuery({
    queryKey: ['lessons', 'all'],
    queryFn: async (): Promise<Lesson[]> => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .order('course_id')
        .order('order_index')

      if (error) throw error
      return data as Lesson[]
    },
  })
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ['lesson', id],
    queryFn: async (): Promise<Lesson> => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (error) throw error
      return data as Lesson
    },
    enabled: isSupabaseConfigured && Boolean(id),
  })
}
