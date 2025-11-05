import { useEffect, useMemo, useRef } from 'react'
import { classNames } from 'utils'

const DEFAULT_MESSAGES = [
  '데이터를 정리하고 있어요...',
  '잠시만 기다려 주세요. 더 나은 정보를 준비 중입니다.',
  '최신 정보를 수집하는 중입니다.',
  '필요한 자료를 모으고 있어요...'
]

function sanitizeMessages(messages?: string[]): string[] {
  if (!Array.isArray(messages)) return DEFAULT_MESSAGES
  const filtered = messages
    .map((msg) => (typeof msg === 'string' ? msg.trim() : ''))
    .filter((msg) => msg.length > 0)
  return filtered.length > 0 ? filtered : DEFAULT_MESSAGES
}

type LoadingIndicatorProps = {
  messages?: string[]
  className?: string
  compact?: boolean
  description?: string
}

export default function LoadingIndicator({
  messages,
  className,
  compact = false,
  description
}: LoadingIndicatorProps) {
  const messagePool = useMemo(() => sanitizeMessages(messages), [messages])
  const messageRef = useRef<string>(
    messagePool[Math.floor(Math.random() * messagePool.length)]
  )

  useEffect(() => {
    messageRef.current =
      messagePool[Math.floor(Math.random() * messagePool.length)]
  }, [messagePool])

  const spinnerSize = compact ? 'h-8 w-8' : 'h-12 w-12'
  const dotSize = compact ? 'h-2.5 w-2.5' : 'h-3 w-3'

  return (
    <div
      role="status"
      aria-live="assertive"
      className={classNames(
        compact
          ? 'flex items-center gap-3 text-sm text-gray-600'
          : 'flex flex-col items-center gap-4 text-center text-sm text-gray-600',
        className
      )}
    >
      <div
        className={classNames(
          'relative flex items-center justify-center',
          compact ? 'h-8 w-8' : 'h-14 w-14'
        )}
      >
        <span
          className={classNames(
            'absolute rounded-full border-2 border-brand-100',
            spinnerSize
          )}
        />
        <span
          className={classNames(
            'absolute rounded-full border-2 border-brand-500 border-t-transparent animate-loading-rotate',
            spinnerSize
          )}
        />
        {/*<span className="flex items-center gap-1">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={classNames(
                'rounded-full bg-brand-500 animate-loading-bounce',
                dotSize
              )}
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </span>*/}
      </div>
      <div className="space-y-1">
        <p>{messageRef.current}</p>
        {description ? (
          <p className="text-xs text-gray-400">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
