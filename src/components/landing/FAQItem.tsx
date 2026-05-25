'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
      open ? 'border-[#0F6E56]/30 bg-[#F5F5F7]' : 'border-gray-100 bg-white hover:border-gray-200'
    }`}>
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-[#1D1D1F] text-sm pr-6 leading-relaxed">{question}</span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          open ? 'bg-[#0F6E56]' : 'bg-[#E5F5EF]'
        }`}>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? 'rotate-180 text-white' : 'text-[#0F6E56]'
          }`} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-gray-500 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}
