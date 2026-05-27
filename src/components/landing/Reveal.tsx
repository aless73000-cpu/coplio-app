'use client'

import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
  as?: 'div' | 'section' | 'article' | 'li'
}

export function Reveal({ children, delay = 0, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(22px)'
    el.style.transition = `opacity 0.75s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms, transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          io.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
