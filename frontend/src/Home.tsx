import { Nav, Hero, About, Stack, Services, Contact, Footer } from './sections';

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
      </main>
      <Footer />
    </>
  );
}
