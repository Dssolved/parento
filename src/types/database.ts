export type Stage = 'planning' | 'pregnancy' | 'newborn'
export type Role = 'user' | 'admin'
export type Subscription = 'free' | 'premium'
export type CaregiverRole =
  | 'mother'
  | 'father'
  | 'partner'
  | 'caregiver'
  | 'prefer_not_to_say'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  stage: Stage | null
  caregiver_role: CaregiverRole | null
  subscription: Subscription
  due_date: string | null
  birth_date: string | null
  created_at: string
}

export interface ProfileInsert {
  id: string
  email: string
  full_name: string | null
  role?: Role
  stage?: Stage | null
  caregiver_role?: CaregiverRole | null
  subscription?: Subscription
  due_date?: string | null
  birth_date?: string | null
}

export interface Course {
  id: string
  title: string
  description: string | null
  stage: Stage | 'all'
  is_premium: boolean
  is_published: boolean
  cover_url: string | null
  week_from: number | null
  week_to: number | null
  created_at: string
}

export type CourseInsert = Omit<Course, 'id' | 'created_at'>

export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string | null
  order_index: number
  is_premium: boolean
  is_published: boolean
  week_from: number | null
  week_to: number | null
  created_at: string
}

export type LessonInsert = Omit<Lesson, 'id' | 'created_at'>

export interface Progress {
  id: string
  user_id: string
  lesson_id: string
  completed_at: string
}

export type FeedbackType = 'general' | 'bug' | 'ux' | 'content' | 'idea'

export interface FeedbackInsert {
  user_id?: string | null
  feedback_type: FeedbackType
  rating?: number | null
  message: string
  contact?: string | null
  path?: string | null
}

export interface WaitlistSignupInsert {
  email: string
  source?: string | null
}

export interface EventInsert {
  user_id?: string | null
  event_name: string
  properties?: Record<string, string | number | boolean | null>
}
