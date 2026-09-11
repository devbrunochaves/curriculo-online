import { supabase } from './supabase'

// ── Workspace ──────────────────────────────────────────────────────────────

/**
 * Retorna o workspace_id do usuário (primeiro encontrado).
 * Retorna null se o usuário não pertencer a nenhum workspace.
 */
export async function getMyWorkspaceId() {
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .limit(1)
  return data?.[0]?.workspace_id ?? null
}

/**
 * Cria um novo workspace e adiciona o usuário como owner.
 * Usado no fluxo de configuração do MEI quando o usuário não tem workspace.
 */
export async function createWorkspace(name) {
  const { data: wsId, error } = await supabase.rpc('create_my_workspace', { p_name: name })
  if (error) throw error
  return wsId
}

// ── MEI Profile ────────────────────────────────────────────────────────────

export async function getMeiProfile() {
  const { data, error } = await supabase
    .from('mei_profiles')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createMeiProfile(workspaceId, fields) {
  const { data, error } = await supabase
    .from('mei_profiles')
    .insert({ workspace_id: workspaceId, ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMeiProfile(id, fields) {
  const { data, error } = await supabase
    .from('mei_profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Limites ────────────────────────────────────────────────────────────────

export async function getMeiLimite(ano) {
  const { data } = await supabase
    .from('mei_limites')
    .select('limite')
    .eq('ano', ano)
    .maybeSingle()
  return data?.limite ?? 81000
}

// ── Notas ─────────────────────────────────────────────────────────────────

export async function getMeiNotas(meiId, ano) {
  const from = `${ano}-01`
  const to   = `${ano}-12`
  const { data, error } = await supabase
    .from('mei_notas')
    .select('*')
    .eq('mei_id', meiId)
    .gte('competencia', from)
    .lte('competencia', to)
    .order('data_emissao', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createMeiNota(workspaceId, meiId, fields) {
  const { data, error } = await supabase
    .from('mei_notas')
    .insert({ workspace_id: workspaceId, mei_id: meiId, ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMeiNota(id, fields) {
  const { data, error } = await supabase
    .from('mei_notas')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMeiNota(id) {
  const { error } = await supabase.from('mei_notas').delete().eq('id', id)
  if (error) throw error
}

// ── DAS ───────────────────────────────────────────────────────────────────

export async function getMeiDas(meiId, ano) {
  const from = `${ano}-01`
  const to   = `${ano}-12`
  const { data, error } = await supabase
    .from('mei_das')
    .select('*')
    .eq('mei_id', meiId)
    .gte('competencia', from)
    .lte('competencia', to)
    .order('competencia', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createMeiDas(workspaceId, meiId, fields) {
  const { data, error } = await supabase
    .from('mei_das')
    .insert({ workspace_id: workspaceId, mei_id: meiId, ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMeiDas(id, fields) {
  const { data, error } = await supabase
    .from('mei_das')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMeiDas(id) {
  const { error } = await supabase.from('mei_das').delete().eq('id', id)
  if (error) throw error
}

// ── Declarações ────────────────────────────────────────────────────────────

export async function getMeiDeclaracaoByAno(meiId, ano) {
  const { data, error } = await supabase
    .from('mei_declaracoes')
    .select('*')
    .eq('mei_id', meiId)
    .eq('ano', ano)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertMeiDeclaracao(workspaceId, meiId, ano, fields) {
  const total = (Number(fields.receita_servicos) || 0) + (Number(fields.receita_comercio) || 0)
  const payload = {
    workspace_id: workspaceId,
    mei_id: meiId,
    ano,
    ...fields,
    receita_total: total,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('mei_declaracoes')
    .upsert(payload, { onConflict: 'mei_id,ano' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Documentos ────────────────────────────────────────────────────────────

export async function getMeiDocumentos(meiId) {
  const { data, error } = await supabase
    .from('mei_documentos')
    .select('*')
    .eq('mei_id', meiId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createMeiDocumento(workspaceId, meiId, fields) {
  const { data, error } = await supabase
    .from('mei_documentos')
    .insert({ workspace_id: workspaceId, mei_id: meiId, ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMeiDocumento(id, fields) {
  const { data, error } = await supabase
    .from('mei_documentos')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMeiDocumento(id) {
  const { error } = await supabase.from('mei_documentos').delete().eq('id', id)
  if (error) throw error
}
