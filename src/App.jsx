import Navbar     from './components/Navbar'
import Hero       from './components/Hero'
import About      from './components/About'
import Skills     from './components/Skills'
import Experience from './components/Experience'
import Education  from './components/Education'
import Contact    from './components/Contact'
import Footer     from './components/Footer'

export default function App() {
  return (
    <div className="bg-[#F2EBDF] text-[#084a8a] min-h-screen">
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
