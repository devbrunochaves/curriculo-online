"""
Agente de Prospecção Diária — BBold
Busca leads no Google Places, avalia GMB e site, e insere no CRM (Supabase).
"""

import os
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
MAX_LEADS      = 40  # máximo de leads por execução

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
    if "linktr.ee" in low or "beacons.ai" in low or "bio.link" in low:
        # Linktree e similares: registra como site mesmo, não temos como resolver sem acesso
        return website, None
    return website, None


# ── Google Places ─────────────────────────────────────────────────────────────

def buscar_negocios(nicho: str, page_token: str = None) -> dict:
    """Text Search no Google Places."""
    params = {
        "query":    f"{nicho} em {CIDADE}",
        "key":      GOOGLE_API_KEY,
        "language": "pt-BR",
    }
    if page_token:
        params["pagetoken"] = page_token
        time.sleep(2)  # obrigatório antes de usar pagetoken
    resp = requests.get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
        params=params, timeout=15,
    )
    return resp.json()


def buscar_detalhes(place_id: str) -> dict:
    """Place Details para obter telefone, site, avaliações, etc."""
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
    """Avalia a completude do perfil Google Meu Negócio."""
    rating       = place.get("rating")
    reviews      = place.get("user_ratings_total", 0)
    has_hours    = bool(place.get("opening_hours"))
    has_photos   = bool(place.get("photos"))
    has_website  = bool(place.get("website"))
    has_desc     = bool(place.get("editorial_summary", {}).get("overview"))

    pontos = sum([bool(rating), reviews >= 10, has_hours, has_photos, has_website, has_desc])

    if pontos >= 5:
        qualidade = "bem estruturado ✅"
    elif pontos >= 3:
        qualidade = "parcialmente estruturado ⚠️"
    else:
        qualidade = "pouco estruturado ❌"

    return {
        "rating": rating, "reviews": reviews,
        "has_hours": has_hours, "has_photos": has_photos,
        "has_website": has_website, "has_desc": has_desc,
        "qualidade": qualidade,
    }


# ── Avaliação de Site (Claude) ────────────────────────────────────────────────

def avaliar_site(url: str) -> str:
    """Faz fetch do site e pede ao Claude uma avaliação resumida."""
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        html = resp.text[:4000]
    except Exception as e:
        return f"inacessível ({type(e).__name__})"

    if not claude:
        return "avaliação indisponível (sem chave Anthropic)"

    try:
        msg = claude.messages.create(
            model="claude-haiku-4-5",
            max_tokens=250,
            messages=[{
                "role": "user",
                "content": (
                    f"Analise brevemente o site deste negócio local (máx 2 linhas, em português):\n"
                    f"URL: {url}\nHTML parcial:\n{html}\n\n"
                    "Formato exato: "
                    "\"Design: moderno/desatualizado | Mobile: sim/não | CTA: sim/não | Nota: X/10 | [comentário curto]\""
                ),
            }],
        )
        return msg.content[0].text.strip()
    except Exception as e:
        return f"erro na avaliação ({e})"


# ── Montagem das Notas ────────────────────────────────────────────────────────

def montar_notas(nicho, gmb, avaliacao_site_txt, site, instagram) -> str:
    linhas = [
        f"🔍 Nicho: {nicho.title()} | 📍 {CIDADE} | 📅 {datetime.now().strftime('%d/%m/%Y')}",
        "─" * 40,
    ]

    # GMB
    rating_str  = f"{gmb['rating']} ⭐" if gmb["rating"] else "sem avaliação"
    reviews_str = f"{gmb['reviews']} avaliações"
    linhas.append(f"📊 GMB: {rating_str} · {reviews_str}")
    linhas.append(f"📋 Perfil: {gmb['qualidade']}")

    problemas = []
    if not gmb["has_hours"]:   problemas.append("sem horário")
    if not gmb["has_photos"]:  problemas.append("sem fotos")
    if not gmb["has_desc"]:    problemas.append("sem descrição")
    if problemas:
        linhas.append(f"⚠️  Faltando: {' · '.join(problemas)}")

    linhas.append("─" * 40)

    # Site / Instagram
    if instagram:
        linhas.append(f"📱 Instagram: {instagram}")
    if site:
        linhas.append(f"🌐 Site: {site}")
        if avaliacao_site_txt:
            linhas.append(f"   ↳ {avaliacao_site_txt}")
    elif not instagram:
        linhas.append("🌐 Site: não possui")

    # Oportunidades
    oportunidades = []
    if not site and not instagram:
        oportunidades.append("sem presença digital")
    if problemas:
        oportunidades.append("GMB incompleto")
    if avaliacao_site_txt and "Nota: " in avaliacao_site_txt:
        try:
            nota = float(avaliacao_site_txt.split("Nota: ")[1].split("/")[0])
            if nota < 6:
                oportunidades.append(f"site fraco ({nota}/10)")
        except Exception:
            pass
    if oportunidades:
        linhas.append("─" * 40)
        linhas.append(f"💡 Oportunidade: {' + '.join(oportunidades)}")

    return "\n".join(linhas)


# ── CRM ───────────────────────────────────────────────────────────────────────

def lead_existe(whatsapp: str, nome: str) -> bool:
    """Verifica duplicata por WhatsApp ou nome exato."""
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

    # Duplicata?
    if lead_existe(wpp, nome):
        print(f"    ⏭️  Já existe: {nome}")
        return False

    site, instagram = detectar_instagram(site_r)
    gmb             = avaliar_gmb(place)

    avaliacao_site_txt = None
    if site:
        print(f"    🌐 Avaliando site…")
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
    # Rotaciona nicho pelo dia do ano
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
        resultado = buscar_negocios(nicho, page_token)
        status    = resultado.get("status")

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
