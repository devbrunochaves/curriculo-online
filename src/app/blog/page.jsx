import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '../../lib/sanity'
import { urlFor } from '../../lib/sanity'

export const metadata = {
  title: 'Blog — Bruno Chaves Design Studio',
  description: 'Artigos sobre design, branding, identidade visual e estratégia criativa para marcas que querem se destacar.',
  openGraph: {
    title: 'Blog — Bruno Chaves Design Studio',
    description: 'Artigos sobre design, branding, identidade visual e estratégia criativa.',
    url: 'https://brunochavess.com.br/blog',
  },
}

const CATEGORY_LABELS = {
  'branding':           'Branding',
  'identidade-visual':  'Identidade Visual',
  'design-digital':     'Design Digital',
  'social-media':       'Social Media',
  'processo-criativo':  'Processo Criativo',
  'negocios':           'Negócios',
  'tendencias':         'Tendências',
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <>
      {/* Injeta CSS do site estúdio */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');
        .blog-page { --sp-bg:#f8f8f6; --sp-black:#0a0a0a; --sp-pink:#01aeff; --sp-gray:#888; --sp-gray-light:#e8e8e8; --sp-white:#fff; }
        .blog-page * { box-sizing:border-box; margin:0; padding:0; }
        .blog-page { background:var(--sp-bg); color:var(--sp-black); font-family:'Inter',sans-serif; min-height:100vh; }
        .blog-nav { position:sticky;top:0;z-index:100;background:rgba(248,248,246,.94);backdrop-filter:blur(18px);border-bottom:1px solid var(--sp-gray-light);height:68px;display:flex;align-items:center;padding:0 60px;justify-content:space-between; }
        .blog-nav-logo { font-weight:900;font-size:18px;letter-spacing:-.5px;color:var(--sp-black);text-decoration:none; }
        .blog-nav-logo span { color:var(--sp-pink); }
        .blog-nav-back { font-size:13px;font-weight:600;color:var(--sp-gray);text-decoration:none;display:flex;align-items:center;gap:6px;transition:color .2s; }
        .blog-nav-back:hover { color:var(--sp-black); }
        .blog-hero { padding:80px 60px 60px;max-width:1100px;margin:0 auto; }
        .blog-hero-label { font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--sp-pink);margin-bottom:20px;display:flex;align-items:center;gap:8px; }
        .blog-hero-label::before { content:'';width:24px;height:1.5px;background:var(--sp-pink); }
        .blog-hero h1 { font-family:'Playfair Display',serif;font-size:clamp(40px,5vw,72px);font-weight:800;line-height:1.05;letter-spacing:-2px;margin-bottom:20px; }
        .blog-hero p { font-size:17px;color:var(--sp-gray);max-width:520px;line-height:1.7; }
        .blog-grid { padding:0 60px 100px;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:40px; }
        .blog-card { display:flex;flex-direction:column;text-decoration:none;color:inherit;group:true; }
        .blog-card-img { aspect-ratio:16/9;overflow:hidden;background:#e8e8e8;position:relative;margin-bottom:20px; }
        .blog-card-img img { width:100%;height:100%;object-fit:cover;transition:transform .55s cubic-bezier(.22,1,.36,1); }
        .blog-card:hover .blog-card-img img { transform:scale(1.06); }
        .blog-card-img-placeholder { width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#e8e8e8,#d0d0d0);font-size:32px; }
        .blog-card-cats { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px; }
        .blog-cat-pill { font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--sp-pink);background:rgba(1,174,255,.08);padding:4px 10px; }
        .blog-card-title { font-family:'Playfair Display',serif;font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-.5px;margin-bottom:10px;transition:color .2s; }
        .blog-card:hover .blog-card-title { color:var(--sp-pink); }
        .blog-card-excerpt { font-size:14px;color:var(--sp-gray);line-height:1.65;flex:1;margin-bottom:16px; }
        .blog-card-date { font-size:12px;color:var(--sp-gray);font-weight:500;display:flex;align-items:center;gap:6px; }
        .blog-card-date::before { content:'';width:20px;height:1px;background:var(--sp-gray-light); }
        .blog-empty { grid-column:1/-1;text-align:center;padding:80px 0;color:var(--sp-gray); }
        .blog-empty h2 { font-size:24px;font-weight:700;margin-bottom:12px; }
        @media(max-width:900px) { .blog-grid { grid-template-columns:1fr 1fr; } }
        @media(max-width:600px) {
          .blog-nav,.blog-hero,.blog-grid { padding-left:20px;padding-right:20px; }
          .blog-grid { grid-template-columns:1fr;gap:32px; }
          .blog-hero h1 { letter-spacing:-1px; }
        }
      `}</style>

      <div className="blog-page">
        {/* Nav */}
        <nav className="blog-nav">
          <a href="/" className="blog-nav-logo">BRUNO<span>.</span>CHAVES</a>
          <a href="/" className="blog-nav-back">← Voltar ao site</a>
        </nav>

        {/* Hero */}
        <header className="blog-hero">
          <div className="blog-hero-label">Blog</div>
          <h1>Ideias que<br /><em>constroem</em><br />marcas</h1>
          <p>Design, branding e estratégia criativa — artigos para quem quer entender o que faz uma marca ser inesquecível.</p>
        </header>

        {/* Grid de posts */}
        <main className="blog-grid">
          {posts.length === 0 ? (
            <div className="blog-empty">
              <h2>Em breve...</h2>
              <p>Os primeiros artigos estão a caminho. Volte logo!</p>
            </div>
          ) : (
            posts.map(post => (
              <Link key={post._id} href={`/blog/${post.slug.current}`} className="blog-card">
                <div className="blog-card-img">
                  {post.coverImage?.asset ? (
                    <Image
                      src={urlFor(post.coverImage).width(640).height(360).url()}
                      alt={post.coverImage.alt || post.title}
                      fill
                      sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="blog-card-img-placeholder">✏️</div>
                  )}
                </div>
                {post.categories?.length > 0 && (
                  <div className="blog-card-cats">
                    {post.categories.map(cat => (
                      <span key={cat} className="blog-cat-pill">
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="blog-card-title">{post.title}</h2>
                {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                <span className="blog-card-date">{formatDate(post.publishedAt)}</span>
              </Link>
            ))
          )}
        </main>
      </div>
    </>
  )
}
