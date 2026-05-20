"""
Agente de Prospecção Diária — BBold
Busca leads no Google Places, avalia GMB e site, e insere no CRM (Supabase).
"""

import os
import re
import sys
import time
import requests
from datetime import datetime

# ── Anthropic (opcional — avaliação de site via Claude) ──────────────────────
try:
    import anthropic
    ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
    claude = anthropic.Anthropic(api_key=ANTHROPIC_KEY) if ANTHROPIC_KEY else None
except ImportError:
    claude = None

# ── Supabase ─────────────────────────────────────────────────────────────────
from supabase import create_client

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

# ── Configurações ─────────────────────────────────────────────────────────────
GOOGLE_API_KEY = os.environ["GOOGLE_PLACES_API_KEY"]
CIDADE         = "Serra ES"
MAX_LEADS      = 40

NICHOS = [
    "salão de beleza",
    "barbearia",
    "clínica estética",
    "academia de ginástica",
    "personal trainer",
    "nutricionista",
    "pet shop",
    "ótica",
    "clínica médica",
    "clínica odontológica",
    "psicólogo",
    "fisioterapeuta",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def formatar_whatsapp(phone: str) -> str:
    """Formata número para padrão WhatsApp (55 + DDD + número)."""
    if not phone:
        return ""
    digits = "".join(filter(str.isdigit, phone))
    if not digits.startswith("55"):
        digits = "55" + digits
    return digits


def detectar_instagram(website: str):
    """
    Separa site real de Instagram.
    Retorna (site, instagram_handle).
    """
    if not website:
        return None, None
    low = website.lower()
    if "instagram.com" in low:
        handle = website.rstrip("/").split("/")[-1]
        handle = handle if handle.startswith("@") else f"@{handle}"
        return None, handle
    return website, None


def buscar_instagram_no_site(url: str) -> str | None:
    """
    Faz scraping do site do negócio procurando links do Instagram.
    Retorna o @handle se encontrar, None caso contrário.
    """
    if not url:
        return None
    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
        html = resp.text

        # Busca qualquer menção a instagram.com/handle no HTML
        matches = re.findall(r'instagram\.com/([a-zA-Z0-9._]{2,40})/?', html)

        # Remove caminhos que não são perfis reais
        excluir = {
            'p', 'reel', 'reels', 'stories', 'explore', 'accounts',
            'sharer', 'share', 'tv', 'ar', 'web', 'static', 'oauth',
        }
        handles = [
            m for m in matches
            if m.lower() not in excluir
            and not m.startswith('p/')
            and '.' not in m  # evita coisas como "media.js"
        ]

        if handles:
            handle = handles[0]
            return handle if handle.startswith("@") else f"@{handle}"
    except Exception:
        pass
    return None


# ── Google Places ─────────────────────────────────────────────────────────────

def buscar_negocios(nicho: str, page_token: str = None) -> dict:
    params = {
        "query":    f"{nicho} em {CIDADE}",
        "key":      GOOGLE_API_KEY,
        "language": "pt-BR",
    }
    if page_token:
        params["pagetoken"] = page_token
        time.sleep(2)
    resp = requests.get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
        params=params, timeout=15,
    )
    return resp.json()


def buscar_detalhes(place_id: str) -> dict:
    fields = ",".join([
        "name", "formatted_phone_number", "international_phone_number",
        "website", "rating", "user_ratings_total",
        "opening_hours", "photos", "business_status", "editorial_summary",
    ])
    resp = requests.get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        params={"place_id": place_id, "fields": fields,
                "key": GOOGLE_API_KEY, "language": "pt-BR"},
        timeout=15,
    )
    return resp.json().get("result", {})


# ── Avaliação GMB ─────────────────────────────────────────────────────────────

def avaliar_gmb(place: dict) -> dict:
    rating       = place.get("rating")
    reviews      = place.get("user_ratings_total", 0)
    has_hours    = bool(place.get("opening_hours"))
    has_photos   = bool(place.get("photos"))
    has_website  = bool(place.get("website"))
    has_desc     = bool(place.get("editorial_summary", {}).get("overview"))

    pontos = sum([bool(rating), reviews >= 10, has_hours, has_photos, has_website, has_desc])

    if pontos >= 5:
        qualidade = "Bem estruturado"
    elif pontos >= 3:
        qualidade = "Parcialmente estruturado"
    else:
        qualidade = "Pouco estruturado"

    return {
        "rating": rating, "reviews": reviews,
        "has_hours": has_hours, "has_photos": has_photos,
        "has_website": has_website, "has_desc": has_desc,
        "qualidade": qualidade,
    }


# ── Avaliação de Site (Claude) ────────────────────────────────────────────────

def avaliar_site(url: str) -> str:
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        html = resp.text[:4000]
    except Exception as e:
        return f"Inacessível ({type(e).__name__})"

    if not claude:
        return None

    try:
        msg = claude.messages.create(
            model="claude-haiku-4-5",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": (
                    f"Analise brevemente o site deste negócio local (máx 1 linha, em português):\n"
                    f"URL: {url}\nHTML parcial:\n{html}\n\n"
                    "Formato: \"Nota X/10 — [comentário curto sobre design, mobile e CTA]\""
                ),
            }],
        )
        return msg.content[0].text.strip()
    except Exception:
        return None


# ── Montagem das Notas (formato limpo) ───────────────────────────────────────

def montar_notas(nicho, gmb, avaliacao_site_txt, site, instagram) -> str:
    linhas = []

    # Cabeçalho
    linhas.append(f"📅 {datetime.now().strftime('%d/%m/%Y')}  |  🔍 {nicho.title()}  |  📍 {CIDADE}")
    linhas.append("")

    # GMB
    linhas.append("── Google Meu Negócio ──────────────────")
    rating_str = f"{gmb['rating']} ⭐" if gmb["rating"] else "Sem avaliação"
    linhas.append(f"Estrelas : {rating_str}  ({gmb['reviews']} avaliações)")
    linhas.append(f"Perfil   : {gmb['qualidade']}")

    problemas = []
    if not gmb["has_hours"]:  problemas.append("sem horário")
    if not gmb["has_photos"]: problemas.append("sem fotos")
    if not gmb["has_desc"]:   problemas.append("sem descrição")
    if problemas:
        linhas.append(f"Faltando : {', '.join(problemas)}")
    linhas.append("")

    # Presença Digital
    linhas.append("── Presença Digital ────────────────────")
    linhas.append(f"Instagram: {instagram if instagram else 'Não encontrado'}")
    linhas.append(f"Site     : {site if site else 'Não possui'}")
    if avaliacao_site_txt:
        linhas.append(f"Avaliação: {avaliacao_site_txt}")
    linhas.append("")

    # Oportunidades
    oportunidades = []
    if not site and not instagram:
        oportunidades.append("Sem presença digital")
    elif not site and instagram:
        oportunidades.append("Tem Instagram mas sem site profissional")
    if problemas:
        oportunidades.append("GMB incompleto")
    if avaliacao_site_txt and "Nota " in avaliacao_site_txt:
        try:
            nota = float(avaliacao_site_txt.split("Nota ")[1].split("/")[0])
            if nota < 6:
                oportunidades.append(f"Site fraco (nota {nota}/10)")
        except Exception:
            pass

    if oportunidades:
        linhas.append("── Oportunidades ───────────────────────")
        for op in oportunidades:
            linhas.append(f"• {op}")

    return "\n".join(linhas)


# ── CRM ───────────────────────────────────────────────────────────────────────

def lead_existe(whatsapp: str, nome: str) -> bool:
    if whatsapp:
        r = supabase.table("crm_clientes").select("id").eq("whatsapp", whatsapp).execute()
        if r.data:
            return True
    r = supabase.table("crm_clientes").select("id").eq("nome", nome).execute()
    return bool(r.data)


def inserir_lead(lead: dict):
    try:
        r = supabase.table("crm_clientes").insert(lead).execute()
        return r.data[0] if r.data else None
    except Exception as e:
        print(f"    ❌ Erro ao inserir no CRM: {e}")
        return None


# ── Pipeline principal ────────────────────────────────────────────────────────

def processar(nicho: str, place: dict) -> bool:
    nome   = place.get("name", "Sem nome")
    phone  = place.get("formatted_phone_number") or place.get("international_phone_number", "")
    wpp    = formatar_whatsapp(phone)
    site_r = place.get("website", "")

    if lead_existe(wpp, nome):
        print(f"    ⏭️  Já existe: {nome}")
        return False

    # Detecta Instagram na URL do Google Places
    site, instagram = detectar_instagram(site_r)

    # Se tem site real, tenta encontrar Instagram no HTML do site
    if site and not instagram:
        print(f"    🔍 Buscando Instagram no site...")
        instagram = buscar_instagram_no_site(site)
        if instagram:
            print(f"    📱 Instagram encontrado: {instagram}")

    gmb = avaliar_gmb(place)

    avaliacao_site_txt = None
    if site:
        print(f"    🌐 Avaliando site...")
        avaliacao_site_txt = avaliar_site(site)

    notas = montar_notas(nicho, gmb, avaliacao_site_txt, site, instagram)

    lead = {
        "nome":         nome,
        "empresa":      nome,
        "nicho":        nicho,
        "whatsapp":     wpp or None,
        "instagram":    instagram,
        "status":       "lead",
        "notas":        notas,
        "avatar_color": "#6366f1",
    }

    resultado = inserir_lead(lead)
    if resultado:
        print(f"    ✅ Inserido: {nome}")
        return True
    return False


def main():
    dia   = datetime.now().timetuple().tm_yday
    nicho = NICHOS[dia % len(NICHOS)]

    print(f"\n{'='*50}")
    print(f"🚀 Agente BBold — Prospecção Diária")
    print(f"📍 Cidade : {CIDADE}")
    print(f"🔍 Nicho  : {nicho.title()}")
    print(f"📅 Data   : {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print(f"{'='*50}\n")

    processados = 0
    inseridos   = 0
    page_token  = None

    while processados < MAX_LEADS:
        resultado  = buscar_negocios(nicho, page_token)
        status     = resultado.get("status")

        if status not in ("OK", "ZERO_RESULTS"):
            print(f"❌ Erro na API do Google: {status} — {resultado.get('error_message', '')}")
            sys.exit(1)

        places = resultado.get("results", [])
        if not places:
            print("ℹ️  Nenhum resultado encontrado.")
            break

        for place in places:
            if processados >= MAX_LEADS:
                break
            nome = place.get("name", "")
            print(f"\n🔎 [{processados+1}] {nome}")
            detalhes = buscar_detalhes(place.get("place_id", ""))
            if not detalhes:
                continue
            processados += 1
            if processar(nicho, detalhes):
                inseridos += 1

        page_token = resultado.get("next_page_token")
        if not page_token:
            break

    print(f"\n{'='*50}")
    print(f"📊 Resultado Final")
    print(f"   Processados : {processados}")
    print(f"   Inseridos   : {inseridos}")
    print(f"   Ignorados   : {processados - inseridos} (duplicatas/erros)")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
