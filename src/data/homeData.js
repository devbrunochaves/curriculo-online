// ── Dados do site de serviços ────────────────────────────────────────────────

export const WHATSAPP_URL = 'https://wa.me/5500000000000'
export const EMAIL        = 'brunochaves2102@gmail.com'

export const SERVICES = [
  {
    id:       'identidade',
    icon:     '🎨',
    title:    'Identidade Visual',
    desc:     'Logotipo profissional, paleta de cores, tipografia, papelaria e manual da marca completo. Sua empresa passa credibilidade desde o primeiro olhar.',
    tags:     ['Logotipo', 'Manual da marca', 'Papelaria', 'Cores & Tipografia'],
    featured: true,
    badge:    '+ Pedido',
  },
  {
    id:       'google',
    icon:     '📍',
    title:    'Google Meu Negócio',
    desc:     'Criação e otimização completa do seu perfil no Google. Seja encontrado por clientes locais que estão prontos para comprar.',
    tags:     ['Criação do perfil', 'SEO local', 'Fotos otimizadas'],
    featured: false,
  },
  {
    id:       'sites',
    icon:     '🌐',
    title:    'Sites Profissionais',
    desc:     'Sites modernos, rápidos e responsivos que representam sua marca com excelência e convertem visitantes em clientes.',
    tags:     ['ReactJS', 'Mobile-first', 'SEO', 'Performance'],
    featured: false,
  },
  {
    id:       'landing',
    icon:     '🚀',
    title:    'Landing Pages',
    desc:     'Páginas de alta conversão criadas para campanhas de tráfego pago, lançamentos e captação de leads. Cada elemento pensado para gerar resultado.',
    tags:     ['Alta conversão', 'Tráfego pago', 'A/B test ready'],
    featured: false,
  },
  {
    id:       'social',
    icon:     '📱',
    title:    'Posts para Social Media',
    desc:     'Conteúdo visual profissional para Instagram, Facebook e LinkedIn. Packs mensais com artes que seguem sua identidade de marca.',
    tags:     ['Instagram', 'Feed & Stories', 'Pack mensal', 'Artes editáveis'],
    featured: false,
  },
]

export const STEPS = [
  {
    num:   '1',
    title: 'Briefing',
    desc:  'Você preenche o briefing online com todas as informações sobre seu negócio e objetivos. Gratuito e sem compromisso.',
  },
  {
    num:   '2',
    title: 'Proposta & Alinhamento',
    desc:  'Envio uma proposta personalizada e alinhamos os detalhes pelo WhatsApp antes de começar qualquer trabalho.',
  },
  {
    num:   '3',
    title: 'Criação',
    desc:  'Com o pagamento confirmado, inicio o projeto. Você acompanha o progresso e tem direito a rodadas de revisão.',
  },
  {
    num:   '4',
    title: 'Entrega',
    desc:  'Entrego todos os arquivos organizados, em alta resolução, prontos para usar em qualquer plataforma.',
  },
]

export const STATS = [
  { val: '+20', lbl: 'Anos de experiência' },
  { val: '+80', lbl: 'Projetos entregues'  },
  { val: '100%', lbl: 'Satisfação garantida' },
]

export const PORTFOLIO_ITEMS = [
  { id: 1, label: 'Identidade Visual', name: 'Clínica Médica — Branding completo',      bg: 'linear-gradient(135deg,#e8f4fc,#cce8f7)', icon: '🎨', span: 2 },
  { id: 2, label: 'Site',              name: 'Escritório de Advocacia — Site profissional', bg: 'linear-gradient(135deg,#f0ede5,#e5e0d4)', icon: '🌐', span: 1 },
  { id: 3, label: 'Google Meu Negócio',name: 'Restaurante — SEO local',                 bg: 'linear-gradient(135deg,#f0f5e8,#deeecb)', icon: '📍', span: 1 },
  { id: 4, label: 'Landing Page',      name: 'Curso Online — Alta conversão',            bg: 'linear-gradient(135deg,#f5eaf0,#edd5e4)', icon: '🚀', span: 1 },
]

export const ABOUT_TAGS = ['Adobe Creative Suite', 'Figma', 'ReactJS', 'Branding', 'UI/UX', 'Tráfego Pago']

export const ABOUT_HIGHLIGHTS = [
  { icon: '📅', val: '+20 anos', lbl: 'de experiência'   },
  { icon: '✅', val: '+80',      lbl: 'projetos entregues' },
  { icon: '🌍', val: '2 países', lbl: 'de atuação'        },
  { icon: '⭐', val: '5.0',      lbl: 'avaliação média'    },
]

export const TRUST_PILLS = [
  { icon: '🔒', text: 'Sem compromisso'          },
  { icon: '⚡', text: 'Resposta em até 24h'       },
  { icon: '✅', text: '100% gratuito'             },
  { icon: '🏆', text: '+20 anos de experiência'   },
]

export const MARQUEE_ITEMS = [
  'Identidade Visual', 'Google Meu Negócio', 'Sites Profissionais',
  'Landing Pages', 'Posts para Social Media', 'Logotipos',
  'Branding Completo', 'Design que Converte',
]
