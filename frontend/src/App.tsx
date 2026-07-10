import './styles/global.css';
import { Nav, Hero, About, Stack, Services, Projects, Contact, Footer } from './sections';

export function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Stack />
        <Services />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
