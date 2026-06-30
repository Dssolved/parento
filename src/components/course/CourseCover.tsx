import { BookOpen } from 'lucide-react'
import { useState } from 'react'

interface CourseCoverProps {
  src: string | null
  alt: string
  className?: string
  imageClassName?: string
}

export default function CourseCover({
  src,
  alt,
  className = '',
  imageClassName = '',
}: CourseCoverProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const shouldShowImage = Boolean(src) && !hasImageError

  return (
    <div
      className={`flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 ${className}`}
    >
      {shouldShowImage ? (
        <img
          src={src ?? ''}
          alt={alt}
          className={`h-full w-full object-contain p-3 ${imageClassName}`}
          loading="lazy"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-emerald-50">
          <BookOpen className="size-12 text-emerald-600" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
