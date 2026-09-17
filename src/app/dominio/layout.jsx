export const metadata = {
  title: 'Bruno Chaves — Currículo',
  description: 'Currículo online de Bruno Chaves: mais de 20 anos de experiência em design gráfico, desenvolvimento web, habilidades, formação e experiência profissional.',
  alternates: { canonical: '/dominio' },
  openGraph: {
    type: 'profile',
    locale: 'pt_BR',
    url: '/dominio',
    title: 'Bruno Chaves — Currículo',
    description: 'Currículo online de Bruno Chaves: design gráfico, desenvolvimento web e experiência profissional.',
    siteName: 'Bruno Chaves',
    images: [{ url: '/og-preview.jpg', width: 1200, height: 630, alt: 'Bruno Chaves — Currículo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bruno Chaves — Currículo',
    description: 'Currículo online de Bruno Chaves: design gráfico, desenvolvimento web e experiência profissional.',
    images: ['/og-preview.jpg'],
  },
}

export default function DominioLayout({ children }) {
  return children
}
