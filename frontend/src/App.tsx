import './styles/global.css';

export function App() {
  return (
    <main className="site-shell">
      <section aria-labelledby="hero-title" className="hero">
        <p className="eyebrow">Personal portfolio</p>
        <h1 id="hero-title">Gabriel Salazar</h1>
        <p className="role">Backend / DevOps engineer building reliable web systems.</p>
        <a href="/assets/Gabriel-Salazar-CV.pdf">Download CV</a>
      </section>
    </main>
  );
}

export default App;
