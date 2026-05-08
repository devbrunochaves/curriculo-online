import './globals.css'

export const metadata = {
  metadataBase: new URL('https://brunochavess.com.br'),
  title: {
    default: 'Bruno Chaves — Design Studio',
    template: '%s — Bruno Chaves',
  },
  description: 'Estúdio de design especializado em identidade visual, branding e design digital para marcas que querem se destacar.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://brunochavess.com.br',
    siteName: 'Bruno Chaves Design Studio',
    images: [
      {
        url: '/og-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'Bruno Chaves Design Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-preview.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
