import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

function useReveal() {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const inView = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh + 200 && r.bottom > -200;
    };
    if (inView()) {
      el.classList.add('in');
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('in');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px 200px 0px' },
    );
    io.observe(el);

    const t = setTimeout(() => {
      el.classList.add('in');
      io.disconnect();
    }, 1200);

    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  return ref;
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', style, ...rest }: RevealProps) {
  const ref = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
