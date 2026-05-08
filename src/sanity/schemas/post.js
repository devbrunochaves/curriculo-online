import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumo (aparece na listagem)',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.max(200),
    }),
    defineField({
      name: 'coverImage',
      title: 'Imagem de capa',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Data de publicação',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'categories',
      title: 'Categorias',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Branding', value: 'branding' },
          { title: 'Identidade Visual', value: 'identidade-visual' },
          { title: 'Design Digital', value: 'design-digital' },
          { title: 'Social Media', value: 'social-media' },
          { title: 'Processo Criativo', value: 'processo-criativo' },
          { title: 'Negócios', value: 'negocios' },
          { title: 'Tendências', value: 'tendencias' },
        ],
      },
    }),
    defineField({
      name: 'body',
      title: 'Conteúdo',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Texto alternativo', type: 'string' }),
            defineField({ name: 'caption', title: 'Legenda', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO — Título (opcional)',
      description: 'Deixe vazio para usar o título do post',
      type: 'string',
      validation: Rule => Rule.max(60),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO — Descrição (opcional)',
      description: 'Deixe vazio para usar o resumo',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.max(160),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'coverImage',
      date: 'publishedAt',
    },
    prepare({ title, media, date }) {
      return {
        title,
        media,
        subtitle: date ? new Date(date).toLocaleDateString('pt-BR') : 'Sem data',
      }
    },
  },
  orderings: [
    {
      title: 'Data de publicação (mais recente)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
