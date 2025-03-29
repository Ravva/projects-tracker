import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
}

export function PageLayout({ children, title, subtitle, hideTitle = false }: PageLayoutProps) {
  return (
    <div className="page-container">
      <section className="page-section">
        {/* Фоновый узор */}
        <div className="bg-grid"></div>
        
        {/* Зеленое свечение */}
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
        
        {/* Линии соединения */}
        <div className="bg-lines">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 L100,50" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M50,0 L50,100" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M0,0 L100,100" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M100,0 L0,100" stroke="#1E3A29" strokeWidth="0.2" />
          </svg>
        </div>
        
        <div className="page-content">
          {!hideTitle && title && (
            <div className="mb-8">
              <h1 className="page-title">
                {title.split(' ').map((word, i) => 
                  i % 2 === 1 ? <span key={i} className="gradient-text"> {word} </span> : <span key={i}>{word} </span>
                )}
              </h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
          )}
          
          {children}
        </div>
      </section>
      
      <footer className="w-full py-6 bg-[#0A0A0A] border-t border-[#1E3A29] mt-auto">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-sm text-[#ABABAB]">
              © 2025 Digital Projects Tracker. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}