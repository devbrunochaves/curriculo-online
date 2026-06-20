import Valores from '../../views/Valores'

export const metadata = {
  title: 'Valores de Referência',
  description:
    'Conheça os valores de referência dos serviços de Design, Branding e Desenvolvimento Front-End. Transparência faz parte do processo.',
  openGraph: {
    title: 'Valores de Referência — Bruno Chaves Design Studio',
    description:
      'Valores iniciais para Design Gráfico, Branding, Identidade Visual, Web Design, Landing Pages e Desenvolvimento Front-End. Mais de 15 anos de experiência.',
    url: 'https://brunochavess.com.br/valores',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Bruno Chaves Design Studio',
    images: [{ url: '/og-preview.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Valores de Referência — Bruno Chaves Design Studio',
    description: 'Design, Branding e Desenvolvimento Front-End. Valores iniciais de referência com transparência e posicionamento premium.',
    images: ['/og-preview.jpg'],
  },
  alternates: {
    canonical: 'https://brunochavess.com.br/valores',
  },
}

export default function ValoresPage() {
  return <Valores />
}
