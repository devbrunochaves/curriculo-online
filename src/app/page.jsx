import { AppProvider } from '../context/AppContext'
import Header from '../components/home/Header'
import Hero from '../components/home/Hero'
import FeaturedProjects from '../components/home/FeaturedProjects'
import Services from '../components/home/Services'
import About from '../components/home/About'
import Manifesto from '../components/home/Manifesto'
import Process from '../components/home/Process'
import Tools from '../components/home/Tools'
import FinalCTA from '../components/home/FinalCTA'
import Footer from '../components/home/Footer'
import { CONTACT } from '../data/brand'

export const metadata = {
  title: 'Bruno Chaves | Design, Desenvolvimento Web e IA',
  description: 'Designer e desenvolvedor criando marcas, sites e produtos digitais que unem estratégia, experiência e tecnologia.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: 'Bruno Chaves | Design, Desenvolvimento Web e IA',
    description: 'Designer e desenvolvedor criando marcas, sites e produtos digitais que unem estratégia, experiência e tecnologia.',
    siteName: 'Bruno Chaves',
    images: [{ url: '/og-preview.jpg', width: 1200, height: 630, alt: 'Bruno Chaves — Design, Desenvolvimento Web e IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bruno Chaves | Design, Desenvolvimento Web e IA',
    description: 'Designer e desenvolvedor criando marcas, sites e produtos digitais que unem estratégia, experiência e tecnologia.',
    images: ['/og-preview.jpg'],
  },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Bruno Chaves dos Santos',
  jobTitle: 'Designer e Desenvolvedor Web',
  url: 'https://brunochavess.com.br',
  email: `mailto:${CONTACT.email}`,
  sameAs: [CONTACT.linkedin, CONTACT.behance],
}

export default function HomePage() {
  return (
    <AppProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Header />
      <main style={{ background: 'var(--brand-bg)' }}>
        <Hero />
        <FeaturedProjects />
        <Services />
        <About />
        <Manifesto />
        <Process />
        <Tools />
        <FinalCTA />
      </main>
      <Footer />
    </AppProvider>
  )
}
