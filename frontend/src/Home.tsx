import { Nav, Hero, About, Stack, Services, Security, Contact, Footer } from './sections';

export function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Stack />
        <Services />
        <Contact />
        <Security />
      </main>
      <Footer />
    </>
  );
}
