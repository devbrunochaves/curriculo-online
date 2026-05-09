/**
 * Sanity Studio embutido em /studio
 * Acesse em: brunochavess.com.br/studio
 *
 * IMPORTANTE: Adicione a URL ao CORS no painel do Sanity:
 * manage.sanity.io → projeto → API → CORS origins → + Add
 */
'use client'
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
