import "./lp.css";
import FaqAccordion from "./FaqAccordion";
import ScrollAnimations from "./ScrollAnimations";

export const metadata = {
  title: 'Análise gratuita da sua presença digital — Bruno Chaves',
  description: 'Seu negócio parece tão profissional no digital quanto ele é na vida real? Solicite uma análise gratuita.',
}

export default function LP() {
  const whatsappLink =
    "https://wa.me/5527999999999?text=Olá,%20Bruno!%20Quero%20receber%20uma%20análise%20gratuita%20da%20minha%20presença%20digital.";

  return (
    <main className="lp-page">
      <ScrollAnimations />

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="container topbar-content">
          <a href="#" className="logo">
            Bruno <span>Chaves</span>
          </a>
          
          <a href={whatsappLink} target="_blank" className="btn btn-primary">
            Quero uma análise
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="shape-blue"></div>
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="eyebrow" data-reveal="left">Presença Digital Estratégica</div>
            <h1 data-reveal="bottom" data-delay="1">
              Seu negócio parece tão profissional no digital quanto ele{' '}
              <em>é na vida real?</em>
            </h1>
            <p data-reveal="bottom" data-delay="2">
              Eu ajudo empresas a terem uma presença digital mais forte,
              consistente e confiável — com identidade visual, site, landing
              page, social media e Google Meu Negócio trabalhando juntos.
            </p>
            <div className="hero-actions" data-reveal="bottom" data-delay="3">
              <a href={whatsappLink} target="_blank" className="btn btn-primary">
                Receber análise gratuita
              </a>
              <a href="#servicos" className="btn btn-secondary">
                Ver o que eu faço
              </a>
            </div>
            <span className="hero-note" data-reveal="fade" data-delay="4">
              Análise rápida pelo WhatsApp, sem compromisso.
            </span>
          </div>
          <aside className="profile-card" data-reveal="right" data-delay="2">
            <div className="profile-frame">
              <img src="/foto-bruno.png" alt="Bruno Chaves" />
            </div>
          </aside>
        </div>
      </section>

      {/* ── Diagnóstico ── */}
      <section id="diagnostico" className="diagnostic-section">
        <div className="container diagnostic-grid">
          <div className="section-head" data-reveal="left">
            <div className="eyebrow">Diagnóstico gratuito</div>
            <h2>O que eu analiso no <em>seu negócio?</em></h2>
            <p>
              Antes de pensar em campanha, site ou post, eu olho para a base da
              sua presença digital: clareza, confiança e consistência.
            </p>
          </div>
          <div className="audit-card" data-reveal="right" data-delay="1">
            <div className="check-list">
              <div className="check-item">
                <div className="check-icon">✓</div>
                <span>Se sua identidade visual transmite confiança ou parece improvisada.</span>
              </div>
              <div className="check-item">
                <div className="check-icon">✓</div>
                <span>Se seu site está claro, profissional e preparado para gerar contato.</span>
              </div>
              <div className="check-item">
                <div className="check-icon">✓</div>
                <span>Se Instagram, site, WhatsApp e Google passam a mesma mensagem.</span>
              </div>
              <div className="check-item">
                <div className="check-icon">✓</div>
                <span>Quais pontos podem estar fazendo clientes desistirem antes de chamar.</span>
              </div>
            </div>
            <a href={whatsappLink} target="_blank" className="btn btn-primary full">
              Pedir diagnóstico agora
            </a>
          </div>
        </div>
      </section>

      {/* ── Problemas ── */}
      <section id="problemas">
        <div className="container">
          <div className="section-head center" data-reveal="bottom">
            <div className="eyebrow">Problemas comuns</div>
            <h2>
              Talvez o problema não seja falta de cliente.{' '}
              <em>Seja falta de percepção.</em>
            </h2>
          </div>
          <div className="problem-grid">
            <article className="card" data-reveal="bottom" data-delay="1">
              <div className="card-number">01</div>
              <h3>Visual inconsistente</h3>
              <p>
                Uma marca diferente em cada canal passa insegurança e reduz a
                percepção de profissionalismo.
              </p>
            </article>
            <article className="card" data-reveal="bottom" data-delay="2">
              <div className="card-number">02</div>
              <h3>Site que só informa</h3>
              <p>
                Um site bonito não basta. Ele precisa guiar o visitante para
                confiar e entrar em contato.
              </p>
            </article>
            <article className="card" data-reveal="bottom" data-delay="3">
              <div className="card-number">03</div>
              <h3>Google mal aproveitado</h3>
              <p>
                Seu perfil no Google pode gerar clientes locais todos os dias,
                mas muita empresa ignora isso.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Soluções ── */}
      <section id="servicos">
        <div className="container split">
          <div className="panel" data-reveal="left">
            <div className="eyebrow light">Soluções</div>
            <h2>Uma presença digital <em>completa.</em></h2>
            <p>
              A ideia é simples: organizar tudo para sua empresa parecer mais
              forte, mais confiável e mais preparada para vender.
            </p>
          </div>
          <div className="stack">
            <div className="stack-item" data-reveal="right" data-delay="1">
              <strong>Identidade visual</strong>
              <span>Marca, cores, tipografia e padrão visual</span>
            </div>
            <div className="stack-item" data-reveal="right" data-delay="2">
              <strong>Site institucional</strong>
              <span>Estrutura profissional para gerar confiança</span>
            </div>
            <div className="stack-item" data-reveal="right" data-delay="3">
              <strong>Landing page</strong>
              <span>Página focada em conversão e campanhas</span>
            </div>
            <div className="stack-item" data-reveal="right" data-delay="4">
              <strong>Social media</strong>
              <span>Posts com consistência e posicionamento</span>
            </div>
            <div className="stack-item" data-reveal="right" data-delay="5">
              <strong>Google Meu Negócio</strong>
              <span>Presença local mais estratégica</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container cta-grid">
          <div className="cta-left" data-reveal="left">
            <h2>Quer saber o que pode estar travando sua <em>presença digital?</em></h2>
            <p>
              Solicite uma análise gratuita. Eu vou olhar sua marca, site, Instagram e
              Google para identificar pontos que podem estar afastando clientes.
            </p>
          </div>
          <div className="cta-card" data-reveal="scale" data-delay="1">
            <ul className="cta-checks">
              <li><span>✓</span> Análise rápida pelo WhatsApp</li>
              <li><span>✓</span> Sem compromisso</li>
              <li><span>✓</span> Foco em melhorias práticas</li>
              <li><span>✓</span> Ideal para empresas locais e prestadores de serviço</li>
            </ul>
            <a href={whatsappLink} target="_blank" className="btn btn-dark full">
              Solicitar análise gratuita
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq-section">
        <div className="container">
          <h2 className="faq-title" data-reveal="bottom">Dúvidas rápidas</h2>
          <FaqAccordion />
        </div>
      </section>

      <a href={whatsappLink} target="_blank" className="whatsapp-float">
        Chamar no WhatsApp
      </a>
    </main>
  );
}
