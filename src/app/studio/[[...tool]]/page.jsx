/**
 * Sanity Studio embutido em /studio
 * Acesse em: brunochavess.com.br/studio
 *
 * IMPORTANTE: Adicione a URL ao CORS no painel do Sanity:
 * manage.sanity.io → projeto → API → CORS origins → + Add
 */
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export const dynamic = 'force-static'

export default function StudioPage() {
  return <NextStudio config={config} />
}
