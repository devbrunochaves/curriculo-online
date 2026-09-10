import { supabase } from './supabase'

const BKT = 'mei'

/**
 * Faz upload de um arquivo para o bucket privado `mei`.
 * Path: workspaceId/folder/recordId/timestamp_nome.ext
 * Retorna o path armazenado (usado como referência no banco).
 */
export async function uploadMeiFile(workspaceId, folder, recordId, file) {
  const ext  = file.name.split('.').pop().toLowerCase()
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${workspaceId}/${folder}/${recordId}/${Date.now()}_${safe}.${ext}`
  const { error } = await supabase.storage.from(BKT).upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

/**
 * Gera URL temporária assinada (1h) para um arquivo privado.
 * Retorna null se path for nulo/vazio.
 */
export async function getMeiSignedUrl(path) {
  if (!path) return null
  const { data } = await supabase.storage.from(BKT).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

/**
 * Gera URL assinada com flag de download.
 */
export async function getMeiSignedDownload(path) {
  if (!path) return null
  const { data } = await supabase.storage.from(BKT).createSignedUrl(path, 3600, { download: true })
  return data?.signedUrl ?? null
}

/**
 * Remove um arquivo do Storage.
 * Não lança erro se o arquivo não existir.
 */
export async function deleteMeiFile(path) {
  if (!path) return
  await supabase.storage.from(BKT).remove([path])
}
