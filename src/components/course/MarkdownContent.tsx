import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string | null
  emptyText?: string
}

export default function MarkdownContent({
  content,
  emptyText = 'Контент урока пока не добавлен.',
}: MarkdownContentProps) {
  const source = content?.trim() || emptyText

  return (
    <div className="space-y-5 text-base leading-8 text-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-semibold leading-tight text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="pt-2 text-2xl font-semibold leading-tight text-gray-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="pt-1 text-xl font-semibold leading-tight text-gray-900">{children}</h3>
          ),
          p: ({ children }) => <p>{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="font-medium text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-800"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="ml-5 list-disc space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-2">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-5 py-4 text-emerald-950">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="text-gray-800">{children}</em>,
          code: ({ children }) => (
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-900">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-sm leading-6 text-gray-100">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-gray-100 bg-gray-50 px-4 py-3 font-semibold text-gray-900">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border-b border-gray-100 px-4 py-3">{children}</td>,
          hr: () => <hr className="border-gray-100" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
