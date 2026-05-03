import { AppProvider, useApp } from './context/AppContext'
import { useRouter }           from './hooks/useRouter'
import Navbar      from './components/Navbar'
import Hero        from './components/Hero'
import About       from './components/About'
import Skills      from './components/Skills'
import Experience  from './components/Experience'
import Education   from './components/Education'
import Contact     from './components/Contact'
import Footer      from './components/Footer'
import Estrategia  from './components/Estrategia'

function Portfolio() {
  const { c } = useApp()
  return (
    <div style={{ background: c.bg1, color: c.primary, minHeight: '100vh', transition: 'background 0.3s, color 0.3s' }}>
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Education />
      <Contact />
      <Footer />
    </div>
  )
}

function AppContent() {
  const { path } = useRouter()

  if (path === '/estrategia' || path === '/estrategia/') {
    return <Estrategia />
  }

  return <Portfolio />
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
