import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7ojpg4pm',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // CDN cache — desative para dados sempre frescos no dev
})

// Helper para gerar URLs de imagem com transformações
const builder = imageUrlBuilder(client)
export function urlFor(source) {
  return builder.image(source)
}

// ── GROQ Queries ──────────────────────────────────────────────────────────

// Todos os posts para listagem (sem body para performance)
export async function getAllPosts() {
  return client.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      categories,
      coverImage { asset, alt, hotspot }
    }
  `)
}

// Um post por slug (com body completo)
export async function getPostBySlug(slug) {
  return client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      categories,
      coverImage { asset, alt, hotspot },
      body,
      seoTitle,
      seoDescription
    }
  `, { slug })
}

// Todos os slugs (para generateStaticParams)
export async function getAllPostSlugs() {
  return client.fetch(`
    *[_type == "post"] { "slug": slug.current }
  `)
}

// Posts por categoria
export async function getPostsByCategory(category) {
  return client.fetch(`
    *[_type == "post" && $category in categories] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      categories,
      coverImage { asset, alt, hotspot }
    }
  `, { category })
}
