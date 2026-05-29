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
    el.style.transform = 'translateY(16px)'
    el.style.transition = `opacity 0.5s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms, transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`

    const show = () => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
      io.unobserve(el)
      clearTimeout(fallback)
    }

    // Fallback : affiche l'élément après 1.5s même si IntersectionObserver ne se déclenche pas
    const fallback = setTimeout(show, 1500)

    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) show() },
      // threshold 0 = déclenche dès qu'un pixel entre dans le viewport
      // rootMargin positif en bas = pré-déclenche avant que l'élément soit visible
      { threshold: 0, rootMargin: '0px 0px 60px 0px' }
    )
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(fallback) }
  }, [delay])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
