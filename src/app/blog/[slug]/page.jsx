import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPostSlugs, urlFor } from '../../../lib/sanity'

// Gera as páginas estáticas em build time
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map(s => ({ slug: s.slug }))
}

// SEO dinâmico por post
export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}

  const title       = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt || ''
  const image       = post.coverImage?.asset
    ? urlFor(post.coverImage).width(1200).height(630).url()
    : '/og-preview.jpg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://brunochavess.com.br/blog/${params.slug}`,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Renderizador simples de Portable Text (sem dependência extra)
function renderBlock(block, index) {
  if (block._type === 'image') {
    const src = urlFor(block).width(900).url()
    return (
      <figure key={index} style={{ margin: '40px 0' }}>
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
          <Image src={src} alt={block.alt || ''} fill style={{ objectFit: 'cover' }} sizes="(max-width:800px) 100vw, 800px" />
        </div>
        {block.caption && (
          <figcaption style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8 }}>
            {block.caption}
          </figcaption>
        )}
      </figure>
    )
  }
  if (block._type !== 'block') return null

  const text = block.children?.map((child, i) => {
    if (child._type !== 'span') return null
    let content = child.text
    const marks = child.marks || []
    if (marks.includes('strong')) content = <strong key={i}>{content}</strong>
    else if (marks.includes('em')) content = <em key={i}>{content}</em>
    else if (marks.includes('code')) content = <code key={i} style={{ background: '#f0f0ee', padding: '2px 6px', fontSize: '0.9em' }}>{content}</code>
    return content
  })

  switch (block.style) {
    case 'h2': return <h2 key={index} style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(24px,3vw,34px)', fontWeight: 800, letterSpacing: -1, margin: '48px 0 16px', lineHeight: 1.15 }}>{text}</h2>
    case 'h3': return <h3 key={index} style={{ fontSize: 20, fontWeight: 700, margin: '36px 0 12px' }}>{text}</h3>
    case 'h4': return <h4 key={index} style={{ fontSize: 17, fontWeight: 700, margin: '28px 0 10px' }}>{text}</h4>
    case 'blockquote': return (
      <blockquote key={index} style={{ borderLeft: '3px solid #01aeff', paddingLeft: 24, margin: '32px 0', fontStyle: 'italic', color: '#555', fontSize: 18 }}>
        {text}
      </blockquote>
    )
    default: return <p key={index} style={{ marginBottom: 24, lineHeight: 1.8, fontSize: 17, color: '#333' }}>{text}</p>
  }
}

const CATEGORY_LABELS = {
  'branding': 'Branding', 'identidade-visual': 'Identidade Visual',
  'design-digital': 'Design Digital', 'social-media': 'Social Media',
  'processo-criativo': 'Processo Criativo', 'negocios': 'Negócios',
  'tendencias': 'Tendências',
}

export default async function PostPage({ params }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  const coverSrc = post.coverImage?.asset
    ? urlFor(post.coverImage).width(1200).height(600).url()
    : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');
        .post-page * { box-sizing:border-box; margin:0; padding:0; }
        .post-page { background:#f8f8f6; color:#0a0a0a; font-family:'Inter',sans-serif; min-height:100vh; }
        .post-nav { position:sticky;top:0;z-index:100;background:rgba(248,248,246,.94);backdrop-filter:blur(18px);border-bottom:1px solid #e8e8e8;height:68px;display:flex;align-items:center;padding:0 60px;justify-content:space-between; }
        .post-nav-logo { font-weight:900;font-size:18px;letter-spacing:-.5px;color:#0a0a0a;text-decoration:none; }
        .post-nav-logo span { color:#01aeff; }
        .post-nav-back { font-size:13px;font-weight:600;color:#888;text-decoration:none;display:flex;align-items:center;gap:6px;transition:color .2s; }
        .post-nav-back:hover { color:#0a0a0a; }
        .post-cover { position:relative;height:460px;overflow:hidden;background:#e8e8e8; }
        .post-header { max-width:760px;margin:0 auto;padding:64px 40px 0; }
        .post-cats { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px; }
        .post-cat-pill { font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#01aeff;background:rgba(1,174,255,.08);padding:4px 10px; }
        .post-title { font-family:'Playfair Display',serif;font-size:clamp(32px,5vw,58px);font-weight:800;line-height:1.05;letter-spacing:-1.5px;margin-bottom:20px; }
        .post-meta { font-size:13px;color:#888;display:flex;align-items:center;gap:16px;padding-bottom:40px;border-bottom:1px solid #e8e8e8; }
        .post-meta-sep { width:1px;height:12px;background:#e8e8e8; }
        .post-body { max-width:760px;margin:0 auto;padding:48px 40px 100px; }
        .post-footer { max-width:760px;margin:0 auto;padding:0 40px 80px;border-top:1px solid #e8e8e8;padding-top:40px; }
        .post-back-btn { display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#0a0a0a;text-decoration:none;border:1.5px solid rgba(10,10,10,.2);padding:12px 24px;transition:all .2s; }
        .post-back-btn:hover { border-color:#0a0a0a;background:rgba(10,10,10,.04); }
        @media(max-width:600px) {
          .post-nav,.post-header,.post-body,.post-footer { padding-left:20px;padding-right:20px; }
          .post-cover { height:260px; }
        }
      `}</style>

      <div className="post-page">
        <nav className="post-nav">
          <a href="/" className="post-nav-logo">BRUNO<span>.</span>CHAVES</a>
          <a href="/blog" className="post-nav-back">← Todos os posts</a>
        </nav>

        {coverSrc && (
          <div className="post-cover">
            <Image
              src={coverSrc}
              alt={post.coverImage?.alt || post.title}
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="100vw"
            />
          </div>
        )}

        <header className="post-header">
          {post.categories?.length > 0 && (
            <div className="post-cats">
              {post.categories.map(cat => (
                <span key={cat} className="post-cat-pill">
                  {CATEGORY_LABELS[cat] || cat}
                </span>
              ))}
            </div>
          )}
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <span>{formatDate(post.publishedAt)}</span>
            <span className="post-meta-sep" />
            <span>Bruno Chaves</span>
          </div>
        </header>

        <article className="post-body">
          {post.body?.map((block, i) => renderBlock(block, i))}
        </article>

        <footer className="post-footer">
          <a href="/blog" className="post-back-btn">← Ver todos os posts</a>
        </footer>
      </div>
    </>
  )
}
