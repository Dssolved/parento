import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`min-w-0 rounded-lg border border-gray-100 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
