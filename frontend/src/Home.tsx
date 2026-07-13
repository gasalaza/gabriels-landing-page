import { Nav, Hero, About, Stack, Services, Process, Security, Contact, Footer } from './sections';

export function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Stack />
        <Services />
        <Process />
        <Contact />
        <Security />
      </main>
      <Footer />
    </>
  );
}
