// ── Dados centrais da nova home (marca/portfólio) ──────────────────────────
// Fonte da verdade para projetos, serviços, processo, ferramentas, contato.
// Nenhum número/estatística é inventado — reaproveita src/data/resume.js e
// src/data/translations.js.

export const CONTACT = {
  whatsapp: 'https://wa.me/5527997341557',
  email: 'brunochavesuk@icloud.com',
  linkedin: 'https://linkedin.com/in/brunochavess',
  behance: 'https://behance.net/brunochavesdsg',
}

// Apenas links reais e confirmados. Instagram e GitHub ainda não têm perfil
// oficial confirmado — omitidos da UI até existir um link real.
// TODO: adicionar link real do Instagram/GitHub quando disponível
export const SOCIALS = [
  { label: 'LinkedIn', href: CONTACT.linkedin, icon: 'linkedin' },
  { label: 'Behance', href: CONTACT.behance, icon: 'behance' },
]

// Números reais — ver src/data/translations.js (hero.stats) e src/data/resume.js
export const STATS = [
  { val: '+20', lbl: { pt: 'anos de experiência', en: 'years of experience', es: 'años de experiencia' } },
  { val: '+8', lbl: { pt: 'empresas atendidas', en: 'companies served', es: 'empresas atendidas' } },
  { val: '2', lbl: { pt: 'países de atuação', en: 'countries of work', es: 'países de actuación' } },
]

// Placeholders explícitos — não existe case-study real no repositório ainda.
export const PROJECTS = [
  {
    slug: 'projeto-01',
    title: 'Projeto 01',
    category: 'Branding',
    summary: 'Identidade visual e sistema de marca para um cliente do setor de varejo.',
    problem: 'A marca não tinha consistência visual entre pontos de venda e redes sociais.',
    context: 'Cliente do segmento de varejo/franquias, com múltiplos canais de comunicação.',
    strategy: 'Criação de um sistema de identidade flexível, aplicável a mídia impressa e digital.',
    process: 'Pesquisa de marca, moodboard, exploração de logotipo, aplicação em materiais reais.',
    solution: 'Manual de marca simplificado e peças-piloto para redes sociais e ponto de venda.',
    gallery: [],
    tools: ['Figma', 'Illustrator', 'Photoshop'],
    result: null,
  },
  {
    slug: 'projeto-02',
    title: 'Projeto 02',
    category: 'Web',
    summary: 'Landing page responsiva construída com React e Tailwind CSS.',
    problem: 'Necessidade de uma página de captura rápida e otimizada para conversão.',
    context: 'Projeto web para divulgação de um produto/serviço digital.',
    strategy: 'Hierarquia de informação clara, foco em performance e CTA único.',
    process: 'Wireframe, protótipo em Figma, implementação com Next.js e Tailwind CSS.',
    solution: 'Landing page responsiva, com componentes reutilizáveis e carregamento rápido.',
    gallery: [],
    tools: ['Figma', 'ReactJS', 'NextJS', 'Tailwind CSS'],
    result: null,
  },
  {
    slug: 'projeto-03',
    title: 'Projeto 03',
    category: 'Conteúdo',
    summary: 'Peças gráficas e criativos para campanhas de tráfego pago.',
    problem: 'Volume alto de criativos com necessidade de manter consistência de marca.',
    context: 'Campanhas de mídia paga em Meta Ads e Google Ads para múltiplos clientes.',
    strategy: 'Sistema modular de templates para agilizar produção sem perder qualidade.',
    process: 'Definição de grade e templates, produção em lote, testes A/B de variações.',
    solution: 'Biblioteca de templates reutilizáveis para criativos de tráfego pago.',
    gallery: [],
    tools: ['Photoshop', 'Illustrator', 'Meta Business Suite', 'Google Ads'],
    result: null,
  },
]

export const PROJECT_CATEGORIES = ['Todos', 'Branding', 'Web', 'Produto', 'Conteúdo']

export const SERVICES = [
  {
    icon: '◆',
    title: { pt: 'Identidade Visual', en: 'Visual Identity', es: 'Identidad Visual' },
    desc: {
      pt: 'Logotipo, sistema de marca e aplicação consistente em todos os pontos de contato.',
      en: 'Logo, brand system and consistent application across every touchpoint.',
      es: 'Logotipo, sistema de marca y aplicación consistente en todos los puntos de contacto.',
    },
  },
  {
    icon: '◧',
    title: { pt: 'Sites & Landing Pages', en: 'Websites & Landing Pages', es: 'Sitios & Landing Pages' },
    desc: {
      pt: 'Design e desenvolvimento com ReactJS/NextJS, do wireframe ao código em produção.',
      en: 'Design and development with ReactJS/NextJS, from wireframe to production code.',
      es: 'Diseño y desarrollo con ReactJS/NextJS, del wireframe al código en producción.',
    },
  },
  {
    icon: '▣',
    title: { pt: 'Design de Produto & UI', en: 'Product & UI Design', es: 'Diseño de Producto & UI' },
    desc: {
      pt: 'Interfaces digitais pensadas para uso real, com foco em clareza e conversão.',
      en: 'Digital interfaces designed for real use, focused on clarity and conversion.',
      es: 'Interfaces digitales pensadas para uso real, con foco en claridad y conversión.',
    },
  },
  {
    icon: '✎',
    title: { pt: 'Criativos & Conteúdo', en: 'Creative & Content', es: 'Creativos & Contenido' },
    desc: {
      pt: 'Peças para campanhas de tráfego pago e redes sociais, com sistema visual consistente.',
      en: 'Assets for paid media campaigns and social media, with a consistent visual system.',
      es: 'Piezas para campañas de tráfico pago y redes sociales, con sistema visual consistente.',
    },
  },
]

export const PROCESS_STEPS = [
  {
    n: '01',
    title: { pt: 'Descoberta', en: 'Discovery', es: 'Descubrimiento' },
    desc: {
      pt: 'Entendimento do negócio, público e objetivos antes de qualquer traço.',
      en: 'Understanding the business, audience and goals before any sketch.',
      es: 'Entendimiento del negocio, público y objetivos antes de cualquier trazo.',
    },
  },
  {
    n: '02',
    title: { pt: 'Estratégia', en: 'Strategy', es: 'Estrategia' },
    desc: {
      pt: 'Definição de direção visual e técnica, com foco no resultado esperado.',
      en: 'Defining visual and technical direction, focused on the expected outcome.',
      es: 'Definición de dirección visual y técnica, con foco en el resultado esperado.',
    },
  },
  {
    n: '03',
    title: { pt: 'Produção', en: 'Production', es: 'Producción' },
    desc: {
      pt: 'Design e/ou desenvolvimento, com validações em pontos-chave do processo.',
      en: 'Design and/or development, with checkpoints at key stages.',
      es: 'Diseño y/o desarrollo, con validaciones en puntos clave del proceso.',
    },
  },
  {
    n: '04',
    title: { pt: 'Entrega', en: 'Delivery', es: 'Entrega' },
    desc: {
      pt: 'Refinamento final, ajustes e entrega dos arquivos/código prontos para uso.',
      en: 'Final refinement, adjustments and delivery of files/code ready to use.',
      es: 'Refinamiento final, ajustes y entrega de archivos/código listos para usar.',
    },
  },
]

// Grupos de ferramentas — apenas itens reais confirmados em src/data/resume.js
export const TOOLS = [
  { group: 'Design', items: ['Figma', 'Photoshop', 'Illustrator', 'InDesign', 'CorelDraw'] },
  { group: 'Front-end', items: ['HTML5', 'CSS3', 'JavaScript', 'ReactJS', 'NextJS', 'Tailwind CSS', 'Git/GitHub'] },
  { group: 'Back-end', items: ['PHP', 'Laravel', 'Java'] },
  { group: 'IA', items: ['Google AI Studio', 'Generative AI', 'Claude Code'] },
  { group: 'Plataformas', items: ['RD Station', 'Google Ads', 'Meta Business Suite', 'WordPress/Elementor'] },
]
