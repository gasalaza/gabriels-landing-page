import { Nav, Hero, About, Stack, Services, Projects, Contact, Footer } from './sections';

export function Home() {
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
