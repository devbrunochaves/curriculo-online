'use client'
import { AppProvider } from '../context/AppContext'
import Navbar      from '../components/Navbar'
import Hero        from '../components/Hero'
import About       from '../components/About'
import Skills      from '../components/Skills'
import Experience  from '../components/Experience'
import Education   from '../components/Education'
import Contact     from '../components/Contact'
import Footer      from '../components/Footer'
import { useApp }  from '../context/AppContext'

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

export default function HomePage() {
  return (
    <AppProvider>
      <Portfolio />
    </AppProvider>
  )
}
