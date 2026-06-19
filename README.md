# Bruno Chaves — Portfólio

Portfólio pessoal desenvolvido do zero, sem templates. Apresenta minha trajetória como designer e desenvolvedor, com dark mode nativo e design totalmente customizado.

<!-- Substitua a linha abaixo pelo link gerado após fazer upload da imagem no GitHub -->
![Preview do portfólio](docs/preview.png)

## Acesse

🔗 [brunochavess.com.br](https://brunochavess.com.br)

## Stack

| Tecnologia | Uso |
|---|---|
| **Next.js 15** | Framework principal — App Router, SSR, build otimizado |
| **React 18** | UI e gerenciamento de estado via Context API |
| **CSS customizado** | Estilização completa sem framework de UI |
| **Vercel** | Deploy contínuo com preview por branch |

## Funcionalidades

- **Dark / Light mode** — alternância de tema implementada do zero com Context API, sem biblioteca externa
- **Design responsivo** — adaptado para mobile, tablet e desktop
- **Seções** — Hero, Sobre, Habilidades, Experiência, Formação e Contato
- **Performance** — otimizado com Next.js Image e fontes carregadas via `next/font`

## Estrutura

```
src/
├── app/
│   └── page.jsx          # Entrada da aplicação
├── components/
│   ├── Navbar.jsx
│   ├── Hero.jsx
│   ├── About.jsx
│   ├── Skills.jsx
│   ├── Experience.jsx
│   ├── Education.jsx
│   ├── Contact.jsx
│   └── Footer.jsx
└── context/
    └── AppContext.jsx     # Tema dark/light global
```

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Autor

**Bruno Chaves** — Designer & Desenvolvedor Frontend

[![LinkedIn](https://img.shields.io/badge/LinkedIn-brunochaves-blue?style=flat&logo=linkedin)](https://linkedin.com/in/brunochaves)
