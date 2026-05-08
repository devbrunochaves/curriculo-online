import StudioSite from '../pages/StudioSite'

export const metadata = {
  title: 'Bruno Chaves — Design Studio',
  description: 'Estúdio de design especializado em identidade visual, branding e design digital para marcas que querem se destacar.',
  openGraph: {
    title: 'Bruno Chaves — Design Studio',
    description: 'Estúdio de design especializado em identidade visual, branding e design digital.',
    url: 'https://brunochavess.com.br',
  },
}

export default function HomePage() {
  return <StudioSite />
}
