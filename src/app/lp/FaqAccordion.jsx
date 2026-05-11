'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'Preciso já ter site?',
    a: 'Não. A análise cobre qualquer ponto da sua presença digital — Instagram, Google Meu Negócio, WhatsApp Business ou site. Se você não tiver site, já identificamos isso como uma oportunidade.',
  },
  {
    q: 'Você faz apenas o site?',
    a: 'Não. Trabalho com presença digital completa: identidade visual, site, landing page, social media e Google Meu Negócio. A ideia é que tudo comunique a mesma mensagem.',
  },
  {
    q: 'A análise é gratuita mesmo?',
    a: 'Sim, 100% gratuita e sem compromisso. É uma conversa rápida pelo WhatsApp onde olho o que você já tem e aponto o que pode melhorar.',
  },
]

export default function FaqAccordion() {
  const [open, setOpen] = useState(null)

  return (
    <div className="faq-list">
      {faqs.map((item, i) => (
        <div
          key={i}
          className={`faq-item${open === i ? ' faq-open' : ''}`}
          onClick={() => setOpen(open === i ? null : i)}
        >
          <div className="faq-question">
            <span className="faq-arrow">{open === i ? '▼' : '▶'}</span>
            {item.q}
          </div>
          {open === i && <div className="faq-answer">{item.a}</div>}
        </div>
      ))}
    </div>
  )
}
