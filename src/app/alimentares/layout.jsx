export const metadata = {
  title: 'Plataforma Gabriela — Controle de Equipamentos',
  description: 'Sistema interno de controle de manutenção e localização de equipamentos.',
  robots: { index: false, follow: false },
}

export default function AlimentaresLayout({ children }) {
  // Layout standalone: não herda Navbar / Footer do site principal
  return children
}
