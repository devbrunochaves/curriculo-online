// ── Traduções completas PT / EN / ES ─────────────────────────────────────────

const pt = {
  nav: {
    about:      'Sobre',
    skills:     'Habilidades',
    experience: 'Experiência',
    education:  'Formação',
    contact:    'Contato',
    briefing:   'Briefing',
  },

  hero: {
    available: 'Disponível para oportunidades',
    roles: ['Designer Gráfico', 'Desenvolvedor Fullstack', 'UI Designer', 'Especialista em Branding'],
    tagline: '+20 anos transformando ideias em experiências visuais impactantes. Do pixel ao código — design, desenvolvimento web e performance em um só profissional.',
    emailBtn: '✉ Enviar e-mail',
    stats: [
      { val: '+20', lbl: 'Anos de experiência' },
      { val: '+8',  lbl: 'Empresas atendidas'  },
      { val: '2',   lbl: 'Países de atuação'   },
    ],
  },

  about: {
    label:    'Sobre mim',
    heading1: 'Design & Código,',
    heading2: 'juntos.',
    p1: 'Sou designer gráfico com mais de 20 anos de experiência, especializado em criar soluções visuais impactantes com Adobe Creative Suite, CorelDRAW e Figma. Nos últimos anos, ampliei minha atuação para o desenvolvimento front-end, dominando ReactJS e Tailwind.',
    p2: 'Combino design e programação para entregar projetos que unem estética refinada, código limpo e alta performance. Minha paixão está em integrar o design visual à excelência técnica.',
    tags: ['Design Thinking', 'Branding', 'UI/UX', 'Front-end', 'Performance', 'Tráfego Pago'],
    highlights: [
      { icon: '✦',  title: 'Design Gráfico',    desc: '15+ anos criando identidades visuais e materiais de alto impacto para marcas e clubes.' },
      { icon: '</>', title: 'Front-end Dev',     desc: 'ReactJS, NextJS e Tailwind para interfaces modernas, responsivas e de alta performance.' },
      { icon: '◈',  title: 'UI/UX Design',      desc: 'Interfaces centradas no usuário com foco em conversão, usabilidade e experiência.' },
      { icon: '▲',  title: 'Marketing Digital', desc: 'Criativos otimizados para Meta Ads, Google Ads e campanhas de tráfego pago.' },
    ],
  },

  skills: {
    label:    'Habilidades',
    heading1: 'Stack',
    heading2: 'completa',
    categories: [
      { cat: 'Design',                    icon: '✦',   color: '#2563eb', bg: 'rgba(37,99,235,0.07)',   border: 'rgba(37,99,235,0.2)',   items: ['Adobe Photoshop', 'Illustrator', 'InDesign', 'CorelDraw', 'Figma', 'UI/UX Design'] },
      { cat: 'Desenvolvimento',           icon: '</>',  color: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.18)', items: ['HTML5', 'CSS3', 'JavaScript', 'ReactJS', 'NextJS', 'Tailwind CSS', 'Git / GitHub', 'PHP', 'Laravel', 'Java'] },
      { cat: 'Marketing & E-commerce',   icon: '▲',   color: '#059669', bg: 'rgba(5,150,105,0.07)',   border: 'rgba(5,150,105,0.18)',  items: ['RD Station', 'Meta Business Suite', 'Google Ads', 'Tray E-commerce', 'WordPress / Elementor'] },
      { cat: 'Inteligência Artificial',  icon: '◈',   color: '#db2777', bg: 'rgba(219,39,119,0.07)',  border: 'rgba(219,39,119,0.18)', items: ['Google AI Studio', 'Generative AI (Freepik)', 'Nano Banana', 'Claude Code'] },
    ],
  },

  experience: {
    label:     'Trajetória',
    heading1:  'Experiência',
    heading2:  'Profissional',
    intlBadge: '🌍 Internacional',
    experiences: [
      {
        company: 'Brands Comércio e Distribuição', badge: 'Grupo 5S',
        role: 'Designer Gráfico — UI & Front-end', location: 'Serra, ES', period: 'Nov 2024 – Jan 2026', color: '#2563eb',
        items: [
          'Atuação híbrida entre Design e Desenvolvimento, criando landing pages responsivas e otimizadas com ReactJS.',
          'Desenvolvimento de materiais visuais estratégicos para identidade de marca, incluindo embalagens e rótulos para produtos alimentícios.',
          'Criação de campanhas de comunicação integradas para canais B2B (franqueadas) e B2C (consumidor final).',
          'Produção de catálogos de produtos e materiais visuais para campanhas de vendas pontuais.',
          'Edição de vídeos promocionais e criação de peças estáticas para divulgação em canais digitais.',
        ],
      },
      {
        company: 'Aprymore Desenvolvimento Pessoal', badge: 'Remoto · MG',
        role: 'Designer Gráfico Pleno', location: 'Caratinga, MG', period: 'Jul 2022 – Ago 2024', color: '#7c3aed',
        items: [
          'Desenvolvimento de interfaces de usuário (UI) para aplicativos e plataformas online da empresa.',
          'Gestão completa da identidade visual e produção de criativos para redes sociais e lançamentos digitais.',
          'Criação de materiais promocionais de alto impacto para campanhas de marketing.',
        ],
      },
      {
        company: 'Cesconetto Atacado', badge: 'Freelancer',
        role: 'Designer Gráfico', location: 'Serra, ES', period: 'Mar 2024 – Nov 2024', color: '#0891b2',
        items: [
          'Produção de catálogos de produtos e materiais visuais para campanhas de vendas.',
          'Edição de vídeos promocionais e peças estáticas para canais digitais.',
          'Desenvolvimento de criativos focados em varejo e atacado para impulsionar a comunicação da marca.',
        ],
      },
      {
        company: 'Agência Scale Company', badge: 'Agência',
        role: 'Designer Gráfico', location: 'Vila Velha, ES', period: '', color: '#059669',
        items: [
          'Criação de criativos de alto volume para campanhas de tráfego pago (Meta Ads e Google Ads).',
          'Desenvolvimento de landing pages focadas em conversão com atenção à hierarquia de informação e UX.',
          'Adaptação de criativos em diferentes formatos e variações para testes A/B.',
        ],
      },
      {
        company: 'BlackBox — Hub de Bets', badge: 'Sports & Bets',
        role: 'Designer Gráfico', location: 'Vitória, ES', period: '', color: '#d97706',
        items: [
          'Criação de peças gráficas para conteúdo esportivo digital: thumbnails YouTube, cards de resultado, artes de pré-jogo e transmissão ao vivo.',
          'Manutenção de identidade visual consistente para múltiplas marcas parceiras.',
          'Produção em alta frequência para atender ao calendário esportivo com prazos curtos.',
        ],
      },
      {
        company: 'Serra Futebol Clube', badge: 'Futebol',
        role: 'Designer Responsável pelo Marketing', location: 'Serra, ES', period: 'Dez 2009 – Mar 2020', color: '#db2777',
        items: [
          'Responsável único por todo o ecossistema de marketing e comunicação do clube.',
          'Gerenciamento completo da identidade visual e presença digital em redes sociais.',
          'Desenvolvimento de estratégias de comunicação para engajamento da torcida e divulgação de eventos.',
          'Desenvolvimento de ações sociais com o mascote do clube.',
        ],
      },
      {
        company: 'Agência Somma360', badge: 'Agência',
        role: 'Designer Gráfico', location: 'Vitória, ES', period: '', color: '#2563eb',
        items: [
          'Desenvolvimento de criativos publicitários em alto volume para campanhas de tráfego pago.',
          'Criação de peças visuais estratégicas para redes sociais — posts, banners e materiais de conversão.',
          'Organização e padronização de layouts para garantir agilidade e consistência entre clientes.',
        ],
      },
      {
        company: 'Copiadora Caldeira', badge: 'Gráfica',
        role: 'Designer Gráfico', location: 'Vitória, ES', period: '', color: '#64748b',
        items: [
          'Desenvolvimento de artes para materiais impressos: banners, adesivos, cartões de visita, panfletos e faixas.',
          'Preparação e finalização de arquivos para produção gráfica e impressão com fidelidade de cores.',
          'Ajustes técnicos para pré-impressão (prepress): sangria, margens de segurança e resolução adequada.',
        ],
      },
    ],
    intlExp: {
      company: 'Restaurante Bar Douro', role: 'Chef de Partida',
      location: 'Londres, Reino Unido', period: '2018 – 2020',
      description: 'Vivência internacional e prática do idioma Inglês em ambiente profissional.',
    },
  },

  education: {
    label:      'Formação',
    heading1:   'Educação &',
    heading2:   'Cursos',
    langHeading: 'Idiomas',
    items: [
      { degree: 'Análise e Desenvolvimento de Sistemas',       inst: 'UNOPAR',      type: 'Tecnólogo', year: '2023' },
      { degree: 'Design Gráfico',                              inst: 'Data Point',  type: 'Técnico',   year: '2014' },
      { degree: 'Gestor de Tráfego Pago e Mídia Performance',  inst: 'Udemy',       type: 'Curso',     year: '2025' },
      { degree: 'Front-end — ReactJS, Bootstrap, Git',         inst: 'Alura',       type: 'Curso',     year: '2024' },
    ],
    languages: [
      { lang: 'Português', flag: '🇧🇷', level: 'Nativo',        pct: 100 },
      { lang: 'Inglês',    flag: '🇬🇧', level: 'Intermediário', pct: 60  },
      { lang: 'Espanhol',  flag: '🇪🇸', level: 'Intermediário', pct: 55  },
    ],
  },

  contact: {
    label:    'Contato',
    heading1: 'Vamos trabalhar',
    heading2: 'juntos?',
    text:     'Estou disponível para oportunidades CLT, PJ e freelas. Manda uma mensagem!',
    button:   '✉ Enviar mensagem',
    contacts: [
      { icon: '✉',  label: 'E-mail',   val: 'brunochavesuk@icloud.com',    href: 'mailto:brunochavesuk@icloud.com'       },
      { icon: '💼', label: 'LinkedIn', val: 'linkedin.com/in/brunochavess', href: 'https://linkedin.com/in/brunochavess' },
      { icon: '🎨', label: 'Behance',  val: 'behance.net/brunochavesdsg',  href: 'https://behance.net/brunochavesdsg'   },
      { icon: '📞', label: 'Telefone', val: '(27) 9 9734-1557',            href: 'tel:+5527997341557'                   },
    ],
  },

  footer: { copy: '© 2025 · Bruno Chaves dos Santos · Serra, ES ·' },
}

// ─────────────────────────────────────────────────────────────────────────────

const en = {
  nav: {
    about:      'About',
    skills:     'Skills',
    experience: 'Experience',
    education:  'Education',
    contact:    'Contact',
    briefing:   'Briefing',
  },

  hero: {
    available: 'Available for opportunities',
    roles: ['Graphic Designer', 'Fullstack Developer', 'UI Designer', 'Branding Specialist'],
    tagline: '+20 years transforming ideas into impactful visual experiences. From pixel to code — design, web development and performance in one professional.',
    emailBtn: '✉ Send e-mail',
    stats: [
      { val: '+20', lbl: 'Years of experience'    },
      { val: '+8',  lbl: 'Companies served'       },
      { val: '2',   lbl: 'Countries of operation' },
    ],
  },

  about: {
    label:    'About me',
    heading1: 'Design & Code,',
    heading2: 'together.',
    p1: 'I am a graphic designer with over 20 years of experience, specialized in creating impactful visual solutions with Adobe Creative Suite, CorelDRAW and Figma. In recent years, I expanded my work to front-end development, mastering ReactJS and Tailwind.',
    p2: 'I combine design and programming to deliver projects that unite refined aesthetics, clean code and high performance. My passion is integrating visual design with technical excellence.',
    tags: ['Design Thinking', 'Branding', 'UI/UX', 'Front-end', 'Performance', 'Paid Traffic'],
    highlights: [
      { icon: '✦',  title: 'Graphic Design',    desc: '15+ years creating visual identities and high-impact materials for brands and clubs.' },
      { icon: '</>', title: 'Front-end Dev',     desc: 'ReactJS, NextJS and Tailwind for modern, responsive and high-performance interfaces.' },
      { icon: '◈',  title: 'UI/UX Design',      desc: 'User-centered interfaces focused on conversion, usability and experience.' },
      { icon: '▲',  title: 'Digital Marketing', desc: 'Optimized creatives for Meta Ads, Google Ads and paid traffic campaigns.' },
    ],
  },

  skills: {
    label:    'Skills',
    heading1: 'Full',
    heading2: 'stack',
    categories: [
      { cat: 'Design',                  icon: '✦',   color: '#2563eb', bg: 'rgba(37,99,235,0.07)',   border: 'rgba(37,99,235,0.2)',   items: ['Adobe Photoshop', 'Illustrator', 'InDesign', 'CorelDraw', 'Figma', 'UI/UX Design'] },
      { cat: 'Development',             icon: '</>',  color: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.18)', items: ['HTML5', 'CSS3', 'JavaScript', 'ReactJS', 'NextJS', 'Tailwind CSS', 'Git / GitHub', 'PHP', 'Laravel', 'Java'] },
      { cat: 'Marketing & E-commerce',  icon: '▲',   color: '#059669', bg: 'rgba(5,150,105,0.07)',   border: 'rgba(5,150,105,0.18)',  items: ['RD Station', 'Meta Business Suite', 'Google Ads', 'Tray E-commerce', 'WordPress / Elementor'] },
      { cat: 'Artificial Intelligence', icon: '◈',   color: '#db2777', bg: 'rgba(219,39,119,0.07)',  border: 'rgba(219,39,119,0.18)', items: ['Google AI Studio', 'Generative AI (Freepik)', 'Nano Banana', 'Claude Code'] },
    ],
  },

  experience: {
    label:     'Career',
    heading1:  'Professional',
    heading2:  'Experience',
    intlBadge: '🌍 International',
    experiences: [
      {
        company: 'Brands Comércio e Distribuição', badge: 'Grupo 5S',
        role: 'Graphic Designer — UI & Front-end', location: 'Serra, ES', period: 'Nov 2024 – Jan 2026', color: '#2563eb',
        items: [
          'Hybrid role between Design and Development, creating responsive and optimized landing pages with ReactJS.',
          'Development of strategic visual materials for brand identity, including packaging and labels for food products.',
          'Creation of integrated communication campaigns for B2B (franchisees) and B2C (end consumer) channels.',
          'Production of product catalogs and visual materials for targeted sales campaigns.',
          'Editing of promotional videos and creation of static pieces for digital channels.',
        ],
      },
      {
        company: 'Aprymore Desenvolvimento Pessoal', badge: 'Remote · MG',
        role: 'Mid-Level Graphic Designer', location: 'Caratinga, MG', period: 'Jul 2022 – Aug 2024', color: '#7c3aed',
        items: [
          'Development of user interfaces (UI) for the company\'s applications and online platforms.',
          'Full management of visual identity and content creation for social media and digital launches.',
          'Creation of high-impact promotional materials for marketing campaigns.',
        ],
      },
      {
        company: 'Cesconetto Atacado', badge: 'Freelancer',
        role: 'Graphic Designer', location: 'Serra, ES', period: 'Mar 2024 – Nov 2024', color: '#0891b2',
        items: [
          'Production of product catalogs and visual materials for sales campaigns.',
          'Editing of promotional videos and static pieces for digital channels.',
          'Development of retail and wholesale-focused creatives to boost brand communication.',
        ],
      },
      {
        company: 'Agência Scale Company', badge: 'Agency',
        role: 'Graphic Designer', location: 'Vila Velha, ES', period: '', color: '#059669',
        items: [
          'Creation of high-volume creatives for paid traffic campaigns (Meta Ads and Google Ads).',
          'Development of conversion-focused landing pages with attention to information hierarchy and UX.',
          'Adaptation of creatives in different formats and variations for A/B testing.',
        ],
      },
      {
        company: 'BlackBox — Hub de Bets', badge: 'Sports & Bets',
        role: 'Graphic Designer', location: 'Vitória, ES', period: '', color: '#d97706',
        items: [
          'Creation of graphic pieces for digital sports content: YouTube thumbnails, result cards, pre-game art and live broadcast.',
          'Maintenance of consistent visual identity for multiple partner brands.',
          'High-frequency production to meet the sports calendar with tight deadlines.',
        ],
      },
      {
        company: 'Serra Futebol Clube', badge: 'Football',
        role: 'Marketing Designer', location: 'Serra, ES', period: 'Dec 2009 – Mar 2020', color: '#db2777',
        items: [
          'Solely responsible for the entire marketing and communication ecosystem of the club.',
          'Full management of visual identity and digital presence on social media.',
          'Development of communication strategies for fan engagement and event promotion.',
          'Development of social actions with the club\'s mascot.',
        ],
      },
      {
        company: 'Agência Somma360', badge: 'Agency',
        role: 'Graphic Designer', location: 'Vitória, ES', period: '', color: '#2563eb',
        items: [
          'Development of high-volume advertising creatives for paid traffic campaigns.',
          'Creation of strategic visual pieces for social media — posts, banners and conversion materials.',
          'Organization and standardization of layouts to ensure agility and consistency between clients.',
        ],
      },
      {
        company: 'Copiadora Caldeira', badge: 'Print Shop',
        role: 'Graphic Designer', location: 'Vitória, ES', period: '', color: '#64748b',
        items: [
          'Development of artworks for printed materials: banners, stickers, business cards, flyers and signs.',
          'Preparation and finalization of files for graphic production and printing with color fidelity.',
          'Technical adjustments for pre-press: bleed, safety margins and adequate resolution.',
        ],
      },
    ],
    intlExp: {
      company: 'Restaurante Bar Douro', role: 'Chef de Partie',
      location: 'London, United Kingdom', period: '2018 – 2020',
      description: 'International experience and practice of the English language in a professional environment.',
    },
  },

  education: {
    label:       'Education',
    heading1:    'Education &',
    heading2:    'Courses',
    langHeading: 'Languages',
    items: [
      { degree: 'Systems Analysis and Development',          inst: 'UNOPAR',     type: 'Technology Degree', year: '2023' },
      { degree: 'Graphic Design',                            inst: 'Data Point', type: 'Technical',         year: '2014' },
      { degree: 'Paid Traffic Manager & Media Performance',  inst: 'Udemy',      type: 'Course',            year: '2025' },
      { degree: 'Front-end — ReactJS, Bootstrap, Git',       inst: 'Alura',      type: 'Course',            year: '2024' },
    ],
    languages: [
      { lang: 'Portuguese', flag: '🇧🇷', level: 'Native',       pct: 100 },
      { lang: 'English',    flag: '🇬🇧', level: 'Intermediate', pct: 60  },
      { lang: 'Spanish',    flag: '🇪🇸', level: 'Intermediate', pct: 55  },
    ],
  },

  contact: {
    label:    'Contact',
    heading1: 'Let\'s work',
    heading2: 'together?',
    text:     'Available for full-time, freelance and contract opportunities. Send a message!',
    button:   '✉ Send message',
    contacts: [
      { icon: '✉',  label: 'E-mail',   val: 'brunochavesuk@icloud.com',    href: 'mailto:brunochavesuk@icloud.com'       },
      { icon: '💼', label: 'LinkedIn', val: 'linkedin.com/in/brunochavess', href: 'https://linkedin.com/in/brunochavess' },
      { icon: '🎨', label: 'Behance',  val: 'behance.net/brunochavesdsg',  href: 'https://behance.net/brunochavesdsg'   },
      { icon: '📞', label: 'Phone',    val: '(27) 9 9734-1557',            href: 'tel:+5527997341557'                   },
    ],
  },

  footer: { copy: '© 2025 · Bruno Chaves dos Santos · Serra, ES ·' },
}

// ─────────────────────────────────────────────────────────────────────────────

const es = {
  nav: {
    about:      'Sobre',
    skills:     'Habilidades',
    experience: 'Experiencia',
    education:  'Formación',
    contact:    'Contacto',
    briefing:   'Briefing',
  },

  hero: {
    available: 'Disponible para oportunidades',
    roles: ['Diseñador Gráfico', 'Desarrollador Fullstack', 'UI Designer', 'Especialista en Branding'],
    tagline: '+20 años transformando ideas en experiencias visuales impactantes. Del píxel al código — diseño, desarrollo web y performance en un solo profesional.',
    emailBtn: '✉ Enviar correo',
    stats: [
      { val: '+20', lbl: 'Años de experiencia' },
      { val: '+8',  lbl: 'Empresas atendidas'  },
      { val: '2',   lbl: 'Países de operación' },
    ],
  },

  about: {
    label:    'Sobre mí',
    heading1: 'Diseño & Código,',
    heading2: 'juntos.',
    p1: 'Soy diseñador gráfico con más de 20 años de experiencia, especializado en crear soluciones visuales impactantes con Adobe Creative Suite, CorelDRAW y Figma. En los últimos años, amplié mi trabajo al desarrollo front-end, dominando ReactJS y Tailwind.',
    p2: 'Combino diseño y programación para entregar proyectos que unen estética refinada, código limpio y alto rendimiento. Mi pasión está en integrar el diseño visual con la excelencia técnica.',
    tags: ['Design Thinking', 'Branding', 'UI/UX', 'Front-end', 'Performance', 'Tráfico Pagado'],
    highlights: [
      { icon: '✦',  title: 'Diseño Gráfico',    desc: '+15 años creando identidades visuales y materiales de alto impacto para marcas y clubes.' },
      { icon: '</>', title: 'Front-end Dev',     desc: 'ReactJS, NextJS y Tailwind para interfaces modernas, responsivas y de alto rendimiento.' },
      { icon: '◈',  title: 'UI/UX Design',      desc: 'Interfaces centradas en el usuario enfocadas en conversión, usabilidad y experiencia.' },
      { icon: '▲',  title: 'Marketing Digital', desc: 'Creativos optimizados para Meta Ads, Google Ads y campañas de tráfico pagado.' },
    ],
  },

  skills: {
    label:    'Habilidades',
    heading1: 'Stack',
    heading2: 'completo',
    categories: [
      { cat: 'Diseño',                  icon: '✦',   color: '#2563eb', bg: 'rgba(37,99,235,0.07)',   border: 'rgba(37,99,235,0.2)',   items: ['Adobe Photoshop', 'Illustrator', 'InDesign', 'CorelDraw', 'Figma', 'UI/UX Design'] },
      { cat: 'Desarrollo',              icon: '</>',  color: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.18)', items: ['HTML5', 'CSS3', 'JavaScript', 'ReactJS', 'NextJS', 'Tailwind CSS', 'Git / GitHub', 'PHP', 'Laravel', 'Java'] },
      { cat: 'Marketing & E-commerce',  icon: '▲',   color: '#059669', bg: 'rgba(5,150,105,0.07)',   border: 'rgba(5,150,105,0.18)',  items: ['RD Station', 'Meta Business Suite', 'Google Ads', 'Tray E-commerce', 'WordPress / Elementor'] },
      { cat: 'Inteligencia Artificial', icon: '◈',   color: '#db2777', bg: 'rgba(219,39,119,0.07)',  border: 'rgba(219,39,119,0.18)', items: ['Google AI Studio', 'Generative AI (Freepik)', 'Nano Banana', 'Claude Code'] },
    ],
  },

  experience: {
    label:     'Trayectoria',
    heading1:  'Experiencia',
    heading2:  'Profesional',
    intlBadge: '🌍 Internacional',
    experiences: [
      {
        company: 'Brands Comércio e Distribuição', badge: 'Grupo 5S',
        role: 'Diseñador Gráfico — UI & Front-end', location: 'Serra, ES', period: 'Nov 2024 – Ene 2026', color: '#2563eb',
        items: [
          'Rol híbrido entre Diseño y Desarrollo, creando landing pages responsivas y optimizadas con ReactJS.',
          'Desarrollo de materiales visuales estratégicos para identidad de marca, incluyendo empaques y etiquetas para productos alimenticios.',
          'Creación de campañas de comunicación integradas para canales B2B (franquiciados) y B2C (consumidor final).',
          'Producción de catálogos de productos y materiales visuales para campañas de ventas puntuales.',
          'Edición de videos promocionales y creación de piezas estáticas para difusión en canales digitales.',
        ],
      },
      {
        company: 'Aprymore Desenvolvimento Pessoal', badge: 'Remoto · MG',
        role: 'Diseñador Gráfico Pleno', location: 'Caratinga, MG', period: 'Jul 2022 – Ago 2024', color: '#7c3aed',
        items: [
          'Desarrollo de interfaces de usuario (UI) para aplicaciones y plataformas en línea de la empresa.',
          'Gestión completa de la identidad visual y producción de creativos para redes sociales y lanzamientos digitales.',
          'Creación de materiales promocionales de alto impacto para campañas de marketing.',
        ],
      },
      {
        company: 'Cesconetto Atacado', badge: 'Freelancer',
        role: 'Diseñador Gráfico', location: 'Serra, ES', period: 'Mar 2024 – Nov 2024', color: '#0891b2',
        items: [
          'Producción de catálogos de productos y materiales visuales para campañas de ventas.',
          'Edición de videos promocionales y piezas estáticas para canales digitales.',
          'Desarrollo de creativos enfocados en minoristas y mayoristas para impulsar la comunicación de la marca.',
        ],
      },
      {
        company: 'Agência Scale Company', badge: 'Agencia',
        role: 'Diseñador Gráfico', location: 'Vila Velha, ES', period: '', color: '#059669',
        items: [
          'Creación de creativos de alto volumen para campañas de tráfico pagado (Meta Ads y Google Ads).',
          'Desarrollo de landing pages enfocadas en conversión con atención a la jerarquía de información y UX.',
          'Adaptación de creativos en diferentes formatos y variaciones para pruebas A/B.',
        ],
      },
      {
        company: 'BlackBox — Hub de Bets', badge: 'Sports & Bets',
        role: 'Diseñador Gráfico', location: 'Vitória, ES', period: '', color: '#d97706',
        items: [
          'Creación de piezas gráficas para contenido deportivo digital: miniaturas YouTube, tarjetas de resultado, artes de pre-partido y transmisión en vivo.',
          'Mantenimiento de identidad visual consistente para múltiples marcas asociadas.',
          'Producción de alta frecuencia para cumplir con el calendario deportivo con plazos cortos.',
        ],
      },
      {
        company: 'Serra Futebol Clube', badge: 'Fútbol',
        role: 'Diseñador Responsable de Marketing', location: 'Serra, ES', period: 'Dic 2009 – Mar 2020', color: '#db2777',
        items: [
          'Único responsable de todo el ecosistema de marketing y comunicación del club.',
          'Gestión completa de la identidad visual y presencia digital en redes sociales.',
          'Desarrollo de estrategias de comunicación para el compromiso de los aficionados y difusión de eventos.',
          'Desarrollo de acciones sociales con la mascota del club.',
        ],
      },
      {
        company: 'Agência Somma360', badge: 'Agencia',
        role: 'Diseñador Gráfico', location: 'Vitória, ES', period: '', color: '#2563eb',
        items: [
          'Desarrollo de creativos publicitarios de alto volumen para campañas de tráfico pagado.',
          'Creación de piezas visuales estratégicas para redes sociales — publicaciones, banners y materiales de conversión.',
          'Organización y estandarización de diseños para garantizar agilidad y consistencia entre clientes.',
        ],
      },
      {
        company: 'Copiadora Caldeira', badge: 'Imprenta',
        role: 'Diseñador Gráfico', location: 'Vitória, ES', period: '', color: '#64748b',
        items: [
          'Desarrollo de artes para materiales impresos: banners, adhesivos, tarjetas de visita, folletos y carteles.',
          'Preparación y finalización de archivos para producción gráfica e impresión con fidelidad de colores.',
          'Ajustes técnicos para preimpresión: sangrado, márgenes de seguridad y resolución adecuada.',
        ],
      },
    ],
    intlExp: {
      company: 'Restaurante Bar Douro', role: 'Chef de Partida',
      location: 'Londres, Reino Unido', period: '2018 – 2020',
      description: 'Experiencia internacional y práctica del idioma inglés en entorno profesional.',
    },
  },

  education: {
    label:       'Formación',
    heading1:    'Educación &',
    heading2:    'Cursos',
    langHeading: 'Idiomas',
    items: [
      { degree: 'Análisis y Desarrollo de Sistemas',              inst: 'UNOPAR',     type: 'Técnico Superior', year: '2023' },
      { degree: 'Diseño Gráfico',                                 inst: 'Data Point', type: 'Técnico',          year: '2014' },
      { degree: 'Gestor de Tráfico Pagado y Rendimiento de Medios', inst: 'Udemy',    type: 'Curso',            year: '2025' },
      { degree: 'Front-end — ReactJS, Bootstrap, Git',            inst: 'Alura',      type: 'Curso',            year: '2024' },
    ],
    languages: [
      { lang: 'Portugués', flag: '🇧🇷', level: 'Nativo',    pct: 100 },
      { lang: 'Inglés',    flag: '🇬🇧', level: 'Intermedio', pct: 60 },
      { lang: 'Español',   flag: '🇪🇸', level: 'Intermedio', pct: 55 },
    ],
  },

  contact: {
    label:    'Contacto',
    heading1: '¿Trabajamos',
    heading2: 'juntos?',
    text:     'Disponible para oportunidades de tiempo completo, freelance y contrato. ¡Envía un mensaje!',
    button:   '✉ Enviar mensaje',
    contacts: [
      { icon: '✉',  label: 'E-mail',   val: 'brunochavesuk@icloud.com',    href: 'mailto:brunochavesuk@icloud.com'       },
      { icon: '💼', label: 'LinkedIn', val: 'linkedin.com/in/brunochavess', href: 'https://linkedin.com/in/brunochavess' },
      { icon: '🎨', label: 'Behance',  val: 'behance.net/brunochavesdsg',  href: 'https://behance.net/brunochavesdsg'   },
      { icon: '📞', label: 'Teléfono', val: '(27) 9 9734-1557',            href: 'tel:+5527997341557'                   },
    ],
  },

  footer: { copy: '© 2025 · Bruno Chaves dos Santos · Serra, ES ·' },
}

// ── Export ────────────────────────────────────────────────────────────────────
const dict = { pt, en, es }
export const getTranslations = (lang) => dict[lang] ?? dict.pt
