export const POSTS = [

  /* ─────────────────────────── SEMANA 1 ─────────────────────────── */

  {
    id: 1,
    week: 1,
    day: 'Terça-feira',
    format: 'Reel',
    duration: '30–50 seg',
    pillar: 'Conexão',
    title: '"Quem sou eu e por que você deveria me seguir"',
    objective: 'Reapresentação pessoal. Criar o primeiro ponto de conexão com a audiência e comunicar seu diferencial único de designer + desenvolvedor.',

    script: [
      { mark: 'Hook · 0–5s',        text: 'Olha direto pra câmera sem piscar: "Faz 20 anos que eu trabalho com design. E hoje eu finalmente resolvi aparecer aqui."' },
      { mark: 'Apresentação · 5–20s', text: '"Meu nome é Bruno Chaves. Sou designer e desenvolvedor front-end — isso significa que eu crio a identidade visual, o site, e coloco tudo no ar. Em código. De verdade."' },
      { mark: 'Proposta · 20–38s',   text: '"Aqui você vai encontrar tutoriais de design e código, bastidores de projetos reais, e as dicas que 20 anos de mercado me ensinaram. Se você é designer querendo evoluir, ou empresário precisando de resultado digital de verdade — você está no lugar certo."' },
      { mark: 'CTA · 38–48s',        text: '"Segue aqui e ativa o sininho. A gente começa agora." — aponta para o botão de seguir.' },
    ],

    caption: `20 anos de design. Um primeiro post. 🎨

Meu nome é Bruno Chaves.
Sou designer e desenvolvedor front-end — e faço as duas coisas.

Enquanto a maioria dos designers entrega o arquivo, eu entrego o site funcionando, rodando e convertendo clientes.

Aqui você vai encontrar:
→ Tutoriais de design e código
→ Bastidores de projetos reais
→ Dicas de quem viveu o mercado por 20 anos

Se você quer evoluir no design, ou precisa de alguém que entrega o digital completo — segue aqui.

Vamos construir algo juntos. 🚀`,

    hashtags: '#designer #webdesign #designerbrasileiro #figma #frontend #desenvolvimentoweb #brunodesigner',

    tips: [
      'Grave em ambiente bem iluminado — luz natural na frente do rosto, não atrás',
      'Câmera na altura dos olhos (não abaixo do queixo)',
      'Fundo limpo: parede neutra ou seu setup de trabalho',
      'Não decore o roteiro — use os blocos como guia e fale natural',
      'Escolha um áudio trending no Instagram, volume bem baixo',
      'Primeiro quadro (thumbnail): seu rosto com expressão confiante, não sorrindo forçado',
    ],
  },

  {
    id: 2,
    week: 1,
    day: 'Quinta-feira',
    format: 'Carrossel',
    slides: 7,
    pillar: 'Educação',
    title: '"5 erros de design que vi repetir nos últimos 20 anos"',
    objective: 'Conteúdo educacional de alto valor para designers. Alta taxa de salvamento e compartilhamento — ideal para crescimento de audiência.',

    script: [
      { mark: 'Slide 1 · Capa',   text: 'TÍTULO GRANDE: "5 erros de design que vi repetir nos últimos 20 anos"\nSubtítulo menor: "(e como evitar cada um)"\nSua assinatura: @obrunochaves · visual limpo, fundo sólido' },
      { mark: 'Slide 2',          text: 'Erro 1: HIERARQUIA VISUAL INEXISTENTE\n"Quando tudo grita, nada comunica. Use tamanho, peso e cor para guiar o olho do início ao fim. O elemento mais importante deve saltar na página — os outros devem apoiar, não competir."' },
      { mark: 'Slide 3',          text: 'Erro 2: ESPAÇAMENTO INCONSISTENTE\n"Espaço em branco não é espaço perdido — é respiração. Layouts apertados cansam e confundem. Use um sistema fixo: 8 / 16 / 24 / 32px. Consistência é profissionalismo."' },
      { mark: 'Slide 4',          text: 'Erro 3: TIPOGRAFIA SEM SISTEMA\n"4 fontes diferentes não é criatividade — é ruído visual. Escolha 1 ou 2 famílias tipográficas e explore os pesos (light, regular, bold, black). Variedade dentro do sistema."' },
      { mark: 'Slide 5',          text: 'Erro 4: CORES SEM PROPÓSITO\n"Toda cor deve ter uma função: chamar atenção, indicar ação, criar hierarquia ou comunicar emoção. Cor aleatória não enriquece — confunde. Paleta com intenção."' },
      { mark: 'Slide 6',          text: 'Erro 5: ESQUECER O USUÁRIO\n"Design que parece bonito mas ninguém consegue usar não é design — é decoração. Sempre pergunte: quem vai usar isso? Como? Em qual dispositivo? Em qual contexto?"' },
      { mark: 'Slide 7 · CTA',    text: 'Fundo de destaque (cor da sua identidade visual):\n"Salva esse post para consultar na próxima revisão de projeto. 📌 E me segue — toda semana tem conteúdo assim."\n+ @obrunochaves' },
    ],

    caption: `Depois de 20 anos atendendo clientes e avaliando trabalhos, esses são os 5 erros que eu mais vejo repetir — inclusive em designers experientes. 👆 Desliza para ver cada um.

O bom: todos são fáceis de corrigir quando você aprende a identificar.

Qual desses você já cometeu? Me conta nos comentários. 👇

📌 Salva para consultar quando for revisar um projeto.`,

    hashtags: '#design #designgráfico #uiux #figma #designerbrasileiro #tipografia #webdesign #dicas',

    tips: [
      'Use seu template de carrossel do Figma — mantenha identidade visual consistente',
      'Slide 1 (capa) é o que aparece no feed — capriche no gancho do título',
      'Limite de texto por slide: 3 linhas no máximo. Respire. Use hierarquia.',
      'Adicione um exemplo visual simples (exemplo certo vs errado) em cada slide se possível',
      'No Figma: 1080×1080px para posts, ou 1080×1350px (4:5) para maior alcance no feed',
    ],
  },

  {
    id: 3,
    week: 1,
    day: 'Sábado',
    format: 'Arte / Foto',
    slides: 2,
    pillar: 'Autoridade',
    title: '"Antes e depois: projeto real"',
    objective: 'Mostrar resultado concreto de um projeto. Prova visual de competência. Gera credibilidade imediata tanto com designers quanto com possíveis clientes.',

    script: [
      { mark: 'Imagem / Arte',   text: 'Formato lado a lado (ou swipe antes/depois): estado inicial do projeto (logo simples, identidade fraca) à esquerda — resultado final à direita. Use tipografia "ANTES" e "DEPOIS" com contraste claro. Adicione o nome do projeto ou segmento (ex: "Identidade Visual · Escritório de Advocacia").' },
      { mark: 'Contexto opcional', text: 'Se for Reel curto (15–20s): comece mostrando o "antes" por 3 segundos, corte seco para o "depois" com música que dê impacto. Sem falar nada — o visual é a mensagem.' },
    ],

    caption: `Esse foi o briefing: "Quero algo profissional, moderno, que passe confiança."

Esse foi o resultado. 👆

O processo por trás:
→ Entendi o mercado e o público do cliente
→ Pesquisei referências visuais do segmento
→ Apresentei 3 conceitos — evoluímos o melhor
→ Entregamos brand guide completo + todos os arquivos

Design não é arte pela arte.
É comunicação estratégica com intenção.

Quer ver mais cases assim? Comenta CASE aqui embaixo. 👇`,

    hashtags: '#identidadevisual #branding #designgráfico #logotipo #designerbrasileiro #antesedepois #branddesign',

    tips: [
      'Use um projeto real do seu portfólio — mesmo que antigo, se for bom',
      'Se não tiver "antes" real, recrie como era o estado inicial do cliente (comum fazer isso)',
      'Peça autorização ao cliente antes de publicar (ou use projeto fictício / pessoal)',
      'Quanto mais dramática a transformação visual, melhor o engajamento',
      'Adicione uma moldura discreta com sua logo ou @obrunochaves no canto',
    ],
  },

  /* ─────────────────────────── SEMANA 2 ─────────────────────────── */

  {
    id: 4,
    week: 2,
    day: 'Terça-feira',
    format: 'Reel',
    duration: '45–60 seg',
    pillar: 'Educação',
    title: '"Como criar um botão de CTA que converte em 60 segundos"',
    objective: 'Tutorial rápido e visual. Conteúdo técnico de alto valor. Prova sua competência tanto em design quanto em conhecimento de UX/conversão.',

    script: [
      { mark: 'Hook · 0–4s',         text: 'Tela do Figma em foco. Voz em off ou texto na tela: "Esse botão está afastando clientes. Vou te mostrar como consertar em 60 segundos."' },
      { mark: 'Problema · 4–15s',    text: 'Mostra um botão genérico, sem destaque, cor fraca, texto vago ("Clique aqui"). "Esse é o botão que a maioria coloca. Ele não converte porque não grita ação."' },
      { mark: 'Solução · 15–45s',    text: 'No Figma ao vivo: (1) Cor vibrante de alto contraste com o fundo. (2) Texto de ação específico: não "Enviar" — "Quero meu orçamento grátis". (3) Padding correto: 14px vertical / 28px horizontal. (4) Border-radius: 8px — não quadrado demais, não circular demais. (5) Estado hover com sombra e leve escurecimento.' },
      { mark: 'Resultado · 45–55s',  text: 'Mostra os dois botões lado a lado: "Mesmo produto. Botão diferente. Conversão completamente diferente."' },
      { mark: 'CTA · 55–60s',        text: '"Salva esse vídeo. Vai precisar." Aponta para baixo indicando "salvar".' },
    ],

    caption: `Esse botão está afastando clientes do seu site. 🔴

A maioria erra nas mesmas coisas:
→ Cor fraca que se perde no fundo
→ Texto genérico ("Enviar", "Clique aqui")
→ Tamanho pequeno demais pro dedo tocar no mobile
→ Sem estado de hover (parece que não é clicável)

Um bom CTA tem: cor de ação contrastante + texto específico + tamanho correto + feedback visual.

Salva esse vídeo para consultar antes do próximo projeto. 📌

Qual é o erro que você mais vê nos sites que você acessa? Comenta abaixo 👇`,

    hashtags: '#ux #uiux #webdesign #figma #cta #designdeinteface #conversao #landingpage #designerbrasileiro',

    tips: [
      'Grave a tela do Figma com QuickTime (Mac) ou OBS (Windows/Mac)',
      'Mostre o processo em tempo real — não edite demais, o "ao vivo" passa autoridade',
      'Use fonte grande na gravação de tela para ficar legível no mobile',
      'Adicione texto na tela (CapCut ou Premiere) reforçando os pontos principais',
      'Música: relaxada, instrumental, não compete com a narração',
      'Resolução de export: 1080×1920px (vertical para Reels)',
    ],
  },

  {
    id: 5,
    week: 2,
    day: 'Quarta-feira',
    format: 'Carrossel',
    slides: 8,
    pillar: 'Conversão',
    title: '"Designer ou desenvolvedor? Por que você precisa dos dois — e como eu faço os dois sozinho"',
    objective: 'Posicionamento do diferencial único. Educa o empresário sobre o custo real de contratar separado vs contratar você. Converte audiência em cliente.',

    script: [
      { mark: 'Slide 1 · Capa',   text: '"Designer ou desenvolvedor?\nPor que você precisa dos dois — e como eu entrego os dois sozinho."\n@obrunochaves' },
      { mark: 'Slide 2',          text: 'O PROBLEMA COMUM:\n"A maioria das empresas contrata um designer para criar o visual e um desenvolvedor para colocar no ar. O resultado: 2 profissionais, 2 briefings, 2 prazos, 2 orçamentos. E ainda assim o site sai diferente do design aprovado."' },
      { mark: 'Slide 3',          text: 'O CUSTO REAL DE CONTRATAR SEPARADO:\n→ Designer freelancer: R$ 800 – 2.500\n→ Desenvolvedor freelancer: R$ 1.500 – 5.000\n→ Horas de alinhamento entre os dois: incalculável\n→ Retrabalho quando o dev "não consegue fazer exatamente assim": frequente' },
      { mark: 'Slide 4',          text: 'O QUE ACONTECE NA PRÁTICA:\n"O designer não sabe o que é possível no código. O dev não entende as decisões visuais. O cliente fica no meio tentando traduzir um para o outro. Resultado: projeto atrasado, resultado mediano, cliente insatisfeito."' },
      { mark: 'Slide 5',          text: 'COMO EU TRABALHO:\n"Eu faço o design no Figma pensando já em como vou codar. Quando aprovo o layout, eu mesmo transformo em React. Pixel perfect. Sem ruído de comunicação. Sem retrabalho."' },
      { mark: 'Slide 6',          text: 'O QUE ISSO SIGNIFICA PARA VOCÊ:\n→ Um único briefing\n→ Um único responsável\n→ Prazo menor\n→ Resultado fiel ao aprovado\n→ Investimento menor que contratar dois' },
      { mark: 'Slide 7',          text: '"Em 20 anos de mercado, vi de perto o que acontece quando design e desenvolvimento caminham separados. Decidi ser a solução que eu sempre quis ter do outro lado."' },
      { mark: 'Slide 8 · CTA',    text: 'Fundo de destaque:\n"Quer um site que parece exatamente o que você aprovou?\nLink na bio para conversar. 📩"\n@obrunochaves' },
    ],

    caption: `A maior dor de quem já contratou design e desenvolvimento separado:

O site nunca sai igual ao design aprovado.

Não é culpa do designer. Não é culpa do dev.
É a falta de um profissional que fale os dois idiomas.

Eu faço design no Figma com mentalidade de desenvolvedor.
E codifico com sensibilidade de designer.

O resultado? Um produto digital coerente, no prazo, e com um único responsável.

👆 Desliza para entender por que isso importa — e quanto você economiza.

📩 Link na bio para orçamento.`,

    hashtags: '#webdesign #desenvolvimentoweb #react #figma #siteresponsivo #landingpage #identidadevisual #designer',

    tips: [
      'Esse carrossel pode (e deve) virar CTA direto no último slide para WhatsApp ou e-mail',
      'Use dados reais se tiver: "economizei X horas de cliente" ou "projeto entregue em Y dias"',
      'Slide 3 com os valores causa impacto — seja honesto mas escolha valores que seu mercado conhece',
      'Adicione o link do seu portfólio nos Stories no mesmo dia que esse post for publicado',
    ],
  },

  {
    id: 6,
    week: 2,
    day: 'Sexta-feira',
    format: 'Reel',
    duration: '30–45 seg',
    pillar: 'Autoridade',
    title: '"Bastidores: meu processo de criação de um site do zero"',
    objective: 'Mostrar o processo real de trabalho. Transparência gera confiança. Designers aprendem sobre workflow. Empresários entendem o valor do que estão comprando.',

    script: [
      { mark: 'Abertura · 0–3s',    text: 'Corte rápido: print do brief em tela / caderno com anotações. Música energética começa.' },
      { mark: 'Etapa 1 · 3–10s',    text: 'Tela: "1. BRIEFING" — mostre uma conversa de e-mail ou formulário de briefing. Texto na tela: "Tudo começa entendendo o negócio, não o design."' },
      { mark: 'Etapa 2 · 10–17s',   text: 'Tela: "2. WIREFRAME" — rabisco no papel ou wireframe low-fi no Figma. Texto: "Estrutura antes de estética. Sempre."' },
      { mark: 'Etapa 3 · 17–25s',   text: 'Tela: "3. DESIGN NO FIGMA" — time-lapse de tela do Figma montando o layout. Texto: "Onde a visão vira algo real."' },
      { mark: 'Etapa 4 · 25–33s',   text: 'Tela: "4. CÓDIGO EM REACT" — VSCode com componentes sendo escritos. Texto: "Do pixel para a tela do cliente."' },
      { mark: 'Entrega · 33–40s',   text: 'Tela: "5. ENTREGA" — site aberto no navegador, responsivo, funcionando. Texto: "Não entrego arquivo. Entrego resultado."' },
      { mark: 'CTA · 40–45s',       text: 'Corte para câmera: "Quer ver mais do processo? Segue aqui."' },
    ],

    caption: `Briefing → Wireframe → Design → Código → Entrega.

Esse é o meu processo para criar um site do zero.

Cada etapa tem um propósito. Nenhuma é pulada.

Muita gente me pergunta: "mas você faz tudo isso sozinho?"

Sim. E é exatamente por isso que o resultado final é coerente — sem ruído de comunicação entre designer e dev.

Curioso sobre alguma etapa específica? Me pergunta nos comentários. 👇

#webdesign #processo #figma #react #desenvolvimentoweb #designerbrasileiro`,

    hashtags: '#webdesign #processo #figma #react #desenvolvimentoweb #designerbrasileiro #bastidores #workflow',

    tips: [
      'Grave cada etapa em um dia diferente e monte o corte depois no CapCut ou Premiere',
      'Time-lapse da tela do Figma tem muito engajamento — grave com OBS ou QuickTime',
      'Se não tiver um projeto novo, use um projeto anterior (em andamento simulado)',
      'Edite no ritmo da música — cada corte pode ser sincronizado com o beat',
      'Texto na tela: fonte bold, curta, direta. Não mais de 5 palavras por texto.',
    ],
  },

  /* ─────────────────────────── SEMANA 3 ─────────────────────────── */

  {
    id: 7,
    week: 3,
    day: 'Segunda-feira',
    format: 'Carrossel',
    slides: 8,
    pillar: 'Conversão',
    title: '"Case completo: como transformamos a marca X em [resultado concreto]"',
    objective: 'Case real ou simulado que mostra resultado tangível. É o conteúdo que mais gera pedido de orçamento diretamente no direct.',

    script: [
      { mark: 'Slide 1 · Capa',   text: '"Como transformamos [nome do negócio ou segmento] em uma marca que [resultado: atrai clientes premium / é reconhecida / aumentou vendas]"\nAviso: use nome real se tiver autorização, ou "Cliente Confidencial — Segmento: [área]"' },
      { mark: 'Slide 2',          text: 'O CLIENTE:\n"[Nome / Segmento]. [Descreva brevemente o negócio em 1–2 linhas]. O problema: [identidade visual amadora / sem presença digital / site que afastava clientes / sem coerência visual]."' },
      { mark: 'Slide 3',          text: 'O DESAFIO:\n"[Detalhe o que precisava ser resolvido]. O cliente precisava de [algo concreto: marca que comunicasse autoridade / site que convertesse / identidade que diferenciasse da concorrência]."' },
      { mark: 'Slide 4',          text: 'O PROCESSO:\n→ Briefing aprofundado (mercado, concorrência, público-alvo)\n→ Pesquisa de referências visuais do segmento\n→ 3 conceitos apresentados\n→ 2 rodadas de revisão\n→ Brand guide completo' },
      { mark: 'Slide 5',          text: 'IDENTIDADE VISUAL:\nMostre o resultado: logo, paleta de cores, tipografia. "Cada decisão visual tem uma razão estratégica por trás."' },
      { mark: 'Slide 6',          text: 'APLICAÇÕES:\nMostre mockups reais: cartão de visita, pasta, site, redes sociais. "Marca não é só logo. É experiência consistente em todos os pontos de contato."' },
      { mark: 'Slide 7',          text: 'O RESULTADO:\n"[Depoimento do cliente ou resultado observado]. [Antes e depois em números se tiver: cliente dobrou os seguidores em 60 dias / fechou 3 contratos na primeira semana com o novo visual]"' },
      { mark: 'Slide 8 · CTA',    text: '"Quer ver mais cases? Acessa o link na bio.\nQuer um projeto assim? Me chama no direct ou pelo link da bio. 📩"\n@obrunochaves' },
    ],

    caption: `Esse projeto me marcou.

Não pelo visual — mas pelo impacto que causou no negócio do cliente.

[Inclua aqui uma frase real do cliente sobre o resultado, ou descreva o impacto em 1–2 linhas]

Quando design e estratégia caminham juntos, o resultado vai além da estética.

👆 Desliza para ver o processo completo.

Tem algum projeto com esse tipo de desafio? Me conta nos comentários — adoro trocar ideias sobre isso. 👇

📩 Link na bio para orçamentos.`,

    hashtags: '#identidadevisual #branding #casestudy #designerbrasileiro #logo #branddesign #webdesign #estrategiacriativa',

    tips: [
      'Se não tiver case com autorização, crie um projeto conceitual para um negócio fictício — é legítimo e comum',
      'Mockups gratuitos: Mockup World, Freepik, Pixeden — coloque seu projeto em ambientes reais',
      'Depoimento do cliente (mesmo que via WhatsApp) aumenta muito a credibilidade',
      'Publique esse post em uma segunda-feira — dias de semana têm mais tráfego B2B',
      'Compartilhe nos Stories no mesmo dia com "novo case no feed — desliza lá"',
    ],
  },

  {
    id: 8,
    week: 3,
    day: 'Quarta-feira',
    format: 'Reel',
    duration: '45–60 seg',
    pillar: 'Conversão',
    title: '"Por que sua landing page não está convertendo (e como consertar)"',
    objective: 'Fala diretamente com empresários que têm site mas não têm resultado. Alta intenção de contato após esse post.',

    script: [
      { mark: 'Hook · 0–5s',        text: 'Câmera no rosto: "Se você tem um site e ele não está trazendo clientes, provavelmente é por um desses 4 motivos."' },
      { mark: 'Erro 1 · 5–17s',     text: 'Corte ou texto na tela — "1. SEM CTA CLARO"\n"Seu visitante não sabe o que fazer depois de ler a página. Não deixe ele adivinhar. Coloque um botão de ação em cada dobra da página: Quero um orçamento / Fale comigo agora / Começa aqui."' },
      { mark: 'Erro 2 · 17–28s',    text: '"2. HIERARQUIA VISUAL BAGUNÇADA"\n"O olho humano precisa de um caminho. Se o design tiver 3 coisas com o mesmo peso visual, o cérebro desiste de processar. Defina o que é mais importante e deixe isso óbvio."' },
      { mark: 'Erro 3 · 28–40s',    text: '"3. SEM PROVA SOCIAL"\n"Depoimento de cliente vale mais do que qualquer texto que você escreva sobre si mesmo. Se você tem resultado, mostra. Se não tem, peça para alguém que você já ajudou te dar um relato honesto."' },
      { mark: 'Erro 4 · 40–50s',    text: '"4. CARREGAMENTO LENTO"\n"Cada segundo a mais de carregamento custa você 20% dos visitantes. Site lento é cliente perdido. Isso é técnico — e é exatamente onde design + dev faz diferença."' },
      { mark: 'CTA · 50–58s',       text: 'Câmera no rosto: "Se o seu site tem algum desses problemas, me manda uma mensagem. A gente conversa sobre o que dá para melhorar. Link na bio." — aponta para cima.' },
    ],

    caption: `Seu site pode estar afastando clientes sem você perceber. 🔴

Os 4 erros mais comuns:

1. Sem CTA claro — o visitante não sabe o que fazer
2. Hierarquia visual confusa — o olho não tem um caminho
3. Sem prova social — você pede confiança sem provar que merece
4. Carregamento lento — cada segundo custa 20% dos visitantes

Qualquer um desses pode ser a razão pelo qual seu site tem visitas mas não tem contatos.

Tem algum desses no seu site agora? Me fala nos comentários. 👇

📩 Se quiser uma avaliação rápida, me chama no direct.`,

    hashtags: '#landingpage #conversionrate #webdesign #ux #uiux #siteresponsivo #marketingdigital #designerbrasileiro',

    tips: [
      'Fale diretamente para o empresário — use "seu site", "seus clientes", "seu negócio"',
      'Esse Reel pode ter CTA direto para WhatsApp — adiciona o link na bio antes de publicar',
      'Versão alternativa: faça screen-recording de um site genérico (sem mostrar marca real) com os erros marcados',
      'Ideal para publicar em quarta ou quinta — mid-week tem alto engajamento B2B',
    ],
  },

  {
    id: 9,
    week: 3,
    day: 'Sábado',
    format: 'Carrossel',
    slides: 9,
    pillar: 'Educação',
    title: '"As 7 fontes que todo designer deveria ter no arsenal"',
    objective: 'Conteúdo leve de alto salvamento. Performa bem nos fins de semana. Educa designers e mostra que você tem curadoria de qualidade.',

    script: [
      { mark: 'Slide 1 · Capa',   text: '"As 7 fontes que todo designer deveria ter no arsenal"\n(todas gratuitas no Google Fonts)\n@obrunochaves' },
      { mark: 'Slide 2',          text: 'Inter\n"A fonte do design de interface. Clean, legível em qualquer tamanho, funciona em body e heading. É a base do meu próprio site." — Uso ideal: sites, apps, dashboards' },
      { mark: 'Slide 3',          text: 'Playfair Display\n"Elegância e autoridade. Perfeita para títulos de marcas premium, editoriais e identidades sofisticadas." — Uso ideal: luxury, moda, gastronomia, advocacia' },
      { mark: 'Slide 4',          text: 'Space Grotesk\n"Moderna, geométrica, com personalidade. Excelente para marcas de tecnologia e startups que querem parecer avançadas." — Uso ideal: tech, SaaS, fintechs' },
      { mark: 'Slide 5',          text: 'Bebas Neue\n"Display all-caps com presença. Alta impacto em títulos, manchetes e peças de comunicação bold." — Uso ideal: esportes, streetwear, comunicação urbana' },
      { mark: 'Slide 6',          text: 'DM Sans\n"O equilíbrio perfeito entre amigável e profissional. Versátil, vai bem com quase qualquer outra fonte como par." — Uso ideal: saúde, educação, serviços' },
      { mark: 'Slide 7',          text: 'Fraunces\n"Serifada orgânica com alma. Para marcas que querem parecer artesanais, autênticas e humanas." — Uso ideal: gastronomia, bem-estar, marcas pessoais' },
      { mark: 'Slide 8',          text: 'Bricolage Grotesque\n"A nova queridinha dos designers. Variável, expressiva, com personalidade forte sem perder a legibilidade." — Uso ideal: portfolios, marcas criativas, agências' },
      { mark: 'Slide 9 · CTA',    text: '"Qual dessas você já usa?\nComenta aqui embaixo. 👇\nSalva esse post para não perder a referência. 📌"\n@obrunochaves' },
    ],

    caption: `Eu poderia cobrar uma consultoria por esse post. Não vou.

7 fontes que uso (e recomendo) para diferentes tipos de projeto — todas gratuitas no Google Fonts.

👆 Desliza para ver cada uma com o contexto de uso.

A fonte certa não é a mais bonita — é a que comunica certo para o público certo.

Qual dessas já está no seu arsenal? 👇

📌 Salva para usar como referência no próximo projeto.`,

    hashtags: '#tipografia #typography #fonts #googlefonts #design #designgráfico #figma #designerbrasileiro #ui',

    tips: [
      'Mostre a fonte em uso real em cada slide — não só o nome. Ex: título de um site fictício usando aquela fonte',
      'Use fundo escuro para metade dos slides e claro para outra metade — contraste visual gera mais salvamento',
      'Adicione o link direto do Google Fonts na legenda (stories no mesmo dia)',
      'Esse tipo de conteúdo tem vida longa — pode ser republicado em 6 meses',
    ],
  },

  /* ─────────────────────────── SEMANA 4 ─────────────────────────── */

  {
    id: 10,
    week: 4,
    day: 'Terça-feira',
    format: 'Reel',
    duration: '40–55 seg',
    pillar: 'Autoridade',
    title: '"Uma coisa que o mercado de design erra que ninguém fala"',
    objective: 'Conteúdo de opinião forte. Gera debate genuíno nos comentários. Posiciona você como alguém que pensa diferente — essencial para autoridade.',

    script: [
      { mark: 'Hook · 0–5s',        text: 'Câmera no rosto, tom direto: "Tem uma coisa que o mercado de design erra sistematicamente, e todo mundo finge que não vê."' },
      { mark: 'Desenvolvimento · 5–35s', text: '"A maioria dos designers vende estética. O cliente pede algo bonito, o designer entrega algo bonito, e ninguém pergunta: bonito para quem? Bonito com qual objetivo?\n\nDesign não é sobre o gosto do designer. Não é sobre o gosto do cliente. É sobre o que o público-alvo precisa sentir para tomar a ação que o negócio precisa.\n\nQuando você pensa assim, a conversa muda. Você não defende: eu acho que essa cor fica melhor. Você explica: essa cor gera confiança com o perfil de cliente que você quer atrair.\n\nIsso é o que separa um designer estratégico de um executor de arquivo."' },
      { mark: 'CTA · 35–45s',       text: '"Concorda? Discorda? Me conta nos comentários. Adoro um debate de ideias."' },
    ],

    caption: `O mercado de design tem um problema sério: vende estética quando devia vender estratégia.

O cliente pede "algo bonito".
O designer entrega "algo bonito".
Ninguém pergunta: bonito para quem? Com qual objetivo?

Design não é sobre o gosto do designer.
Não é sobre o gosto do cliente.
É sobre o que o público-alvo precisa sentir para tomar a ação certa.

Quando você entende isso, a conversa com o cliente muda.
Você para de defender escolhas de gosto.
Começa a defender escolhas estratégicas.

E aí você para de ser executor — e começa a ser sócio do resultado.

Concorda? Discorda? 👇`,

    hashtags: '#design #branding #estrategia #designgráfico #designerbrasileiro #marketing #ux #negociodigital',

    tips: [
      'Tom: confiante, sem arrogância. Você está compartilhando uma visão, não atacando ninguém',
      'Não edite demais — uma take direta e natural tem mais impacto que produção excessiva',
      'Se gerar comentários negativos, responda com calma e argumento. Debate = alcance',
      'Variação: faça em formato de texto no carrossel se preferir não aparecer em vídeo nessa semana',
    ],
  },

  {
    id: 11,
    week: 4,
    day: 'Quinta-feira',
    format: 'Carrossel',
    slides: 10,
    pillar: 'Autoridade',
    title: '"O que aprendi em 20 anos de design que ninguém te conta no começo"',
    objective: 'Post de autoridade pura. Alta taxa de salvamento. Conecta com designers em qualquer fase de carreira. Pode viralizar dentro da comunidade.',

    script: [
      { mark: 'Slide 1 · Capa',   text: '"O que aprendi em 20 anos de design\nque ninguém te conta no começo"\n@obrunochaves · Designer & Dev desde [ano]' },
      { mark: 'Slide 2',          text: '1. O CLIENTE NEM SEMPRE SABE O QUE QUER\n"Ele sabe o que sente falta. Cabe a você traduzir isso em solução visual. Fazer as perguntas certas vale mais do que executar rápido o pedido errado."' },
      { mark: 'Slide 3',          text: '2. PORTFÓLIO É CONSEQUÊNCIA, NÃO OBJETIVO\n"Pare de esperar o projeto perfeito para montar seu portfólio. O portfólio que atrai bons clientes é feito de projetos que você executou com intenção — não com sorte."' },
      { mark: 'Slide 4',          text: '3. VOCÊ VAI SER COMPARADO COM O CANVA\n"E tudo bem. Sua resposta não é \"sou melhor que o Canva\". É: o Canva cria layouts, eu crio estratégia visual com resultado mensurável. Quem quer resultado vai te contratar."' },
      { mark: 'Slide 5',          text: '4. COBRAR MAIS ATRAI CLIENTES MELHORES\n"Soa contra-intuitivo. Mas cliente que não valoriza design sempre negocia preço, pede desconto e não implementa suas sugestões. Eleve seu preço e filtre quem realmente quer o que você oferece."' },
      { mark: 'Slide 6',          text: '5. COMUNICAÇÃO É TÃO IMPORTANTE QUANTO DESIGN\n"O cliente que te recomenda não descreve sua paleta de cores. Descreve como você o fez sentir durante o projeto. Prazo, clareza, updates regulares — esses são seus superpoderes invisíveis."' },
      { mark: 'Slide 7',          text: '6. APRENDA UMA HABILIDADE ADJACENTE\n"Coding, copywriting, SEO, gestão de projeto. A combinação de design + qualquer outra coisa te coloca em uma categoria de um. Eu escolhi desenvolvimento — foi o que multiplicou meu valor."' },
      { mark: 'Slide 8',          text: '7. NÃO EXISTE PROJETO PEQUENO DEMAIS\n"O cliente que você trata bem hoje com um projeto de R$ 500 pode te indicar o cliente de R$ 15.000 amanhã. Excelência não é opcional."' },
      { mark: 'Slide 9',          text: '8. CRITIQUE SEU TRABALHO DE ONTEM\n"Se você olha para algo que fez há 2 anos e não sente vergonha, você parou de evoluir. A evolução constante é o único plano de carreira que funciona em design."' },
      { mark: 'Slide 10 · CTA',   text: '"Qual desses você precisava ouvir?\nComenta aqui. Tenho curiosidade. 👇\nSalva esse post — releia quando estiver em dúvida sobre sua carreira. 📌"\n@obrunochaves' },
    ],

    caption: `20 anos de mercado. Muitos erros. Muitos acertos. 8 aprendizados.

Esse post é o que eu gostaria de ter lido quando estava começando.

Não é receita. É perspectiva.

Qual desses você mais precisava ouvir hoje? 👇

📌 Salva e manda para um designer que precisa ver isso.`,

    hashtags: '#design #carreira #designerbrasileiro #dicas #carreiraemdesign #aprendizado #mercadocriativo #freelancer',

    tips: [
      'Use seu template de carrossel com tipografia grande e limpa — esse post deve ser fácil de ler rapidamente',
      'Cada slide = uma ideia. Não tente colocar duas ideias no mesmo slide',
      'Adicione um ícone ou número grande em cada slide para criar ritmo visual',
      'Compartilhe nos Stories e peça para as pessoas enviarem para um designer que precisam ver isso (aumenta alcance)',
      'Esse é um dos posts com mais potencial de salvamento da série inteira',
    ],
  },

  {
    id: 12,
    week: 4,
    day: 'Sábado',
    format: 'Reel',
    duration: '45–60 seg',
    pillar: 'Conexão',
    title: '"Meu setup de trabalho atual — tudo que uso para criar sites e designs"',
    objective: 'Conteúdo de conexão com toque de autoridade. Humaniza você, gera curiosidade e é naturalmente compartilhável. Designers adoram ver setup de outros criadores.',

    script: [
      { mark: 'Abertura · 0–5s',    text: 'Câmera apontada para o setup — panorâmica lenta. Música calma e moderna começa. Texto na tela: "Meu setup atual."' },
      { mark: 'Hardware · 5–20s',   text: 'Mostre e nomeie rapidamente (texto na tela ou voz em off):\n→ Monitor / notebook que você usa\n→ Mouse / teclado / tablet (se tiver)\n→ Headphone\n→ Iluminação (se tiver ring light ou softbox)' },
      { mark: 'Software · 20–40s',  text: 'Screen-recording rápido ou mockup:\n→ Figma — "onde tudo começa: wireframe, design, prototipação"\n→ VS Code — "onde o design vira realidade"\n→ React / Next.js — "o framework de escolha"\n→ Adobe (Photoshop / Illustrator) — "ainda uso para ilustração e imagens"\n→ CapCut / Premiere — "para editar os conteúdos aqui"' },
      { mark: 'Encerramento · 40–55s', text: 'Câmera no rosto ou texto final:\n"Esse é o meu arsenal. Não precisa de tudo isso para começar — mas é bom saber onde você quer chegar."\nCTA: "Me conta nos comentários: qual é a ferramenta que você não abre mão?"' },
    ],

    caption: `Setup revelado. 👇

Hardware:
→ [Seu monitor / notebook]
→ [Mouse / teclado]
→ [Acessórios que você usa]

Software:
→ Figma — design e prototipação
→ VS Code — desenvolvimento
→ React / Next.js — front-end
→ Adobe Suite — ilustração e imagem
→ CapCut — edição de conteúdo

Você não precisa de tudo isso pra começar.
Mas é bom saber para onde está caminhando.

Qual ferramenta você não abre mão? Me conta aqui embaixo. 👇`,

    hashtags: '#setup #homeoffice #designer #desenvolvedor #figma #vscode #react #designerbrasileiro #setupdodesigner',

    tips: [
      'Grave em boa iluminação — setup bagunçado ou escuro passa mensagem errada',
      'Não precisa de equipamento caro — um setup organizado e funcional é mais inspirador que um cheio de gadgets',
      'Adicione texto na tela com o nome de cada ferramenta enquanto aparece na câmera',
      'Música: lo-fi ou synthwave combinam bem com esse tipo de conteúdo',
      'Stories complementar: enquete — "qual ferramenta você usa mais: Figma ou Adobe?"',
    ],
  },
]
