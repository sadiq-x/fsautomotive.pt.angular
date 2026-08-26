# fsautomotive.pt

Website institucional da **FS Automotive** — oficina automóvel multimarca em Vialonga.

Reconstrução completa do site estático original (HTML/CSS/JS) numa aplicação
Angular com TypeScript estrito e Tailwind CSS.

---

## Stack

| Camada     | Tecnologia                                                     |
| ---------- | -------------------------------------------------------------- |
| Framework  | Angular 21 — standalone, _zoneless_, signals                   |
| Linguagem  | TypeScript 5.9 (`strict` + `strictTemplates`)                  |
| Estilos    | Tailwind CSS v4 (tokens em `@theme`, sem `tailwind.config.js`) |
| Build      | `@angular/build:application` (esbuild/Vite)                    |
| Testes     | Vitest via `@angular/build:unit-test`                          |
| Formatação | Prettier + `prettier-plugin-tailwindcss`                       |

**Node.js `^20.19` ou `^22.12` ou `>=24`.** Versões inferiores não conseguem
executar o Angular CLI 21.

---

## Comandos

```bash
npm install         # instalar dependências
npm start           # servidor de desenvolvimento em http://localhost:4200
npm run build       # build de produção para dist/fsautomotive
npm test            # correr os testes uma vez
npm run test:watch  # testes em modo watch
npm run format      # formatar todo o código
npm run verify      # format:check + test + build (usar antes de fazer push)
```

---

## Arquitetura

O projeto segue a divisão **`core` / `shared` / `layout` / `features`**, a
convenção padrão para aplicações Angular standalone. Cada pasta tem uma
responsabilidade única e as dependências apontam sempre para dentro:

```
features ──▶ shared ──▶ core
layout   ──▶ shared ──▶ core
```

`core` nunca importa de `shared`, e `shared` nunca importa de `features`.

```
src/
├── index.html                   # <head>, fontes, favicons, manifest
├── styles.css                   # Tailwind + design tokens + camada base
└── app/
    ├── app.ts / app.html        # shell: header + router-outlet + footer + tab bar
    ├── app.config.ts            # providers (router, zoneless, view transitions)
    ├── app.routes.ts            # rotas com lazy loading + metadados de SEO
    │
    ├── core/                    # sem UI — modelos, conteúdo e serviços singleton
    │   ├── models/              # interfaces do domínio (+ barrel `index.ts`)
    │   ├── data/                # TODO o conteúdo do site, tipado
    │   └── services/            # SeoService, StructuredDataService
    │
    ├── shared/                  # componentes reutilizáveis, sem regras de negócio
    │   ├── components/
    │   └── directives/
    │
    ├── layout/                  # header, footer, navegação móvel
    │
    └── features/                # uma pasta por página (lazy loaded)
        ├── home/ about/ services/ contact/ not-found/
```

### Conteúdo como dados

Não existe texto de negócio escrito à mão dentro dos templates. Morada,
telefone, horário, serviços, tipos de veículo e fotografias vivem em
`core/data/` como constantes tipadas:

```ts
// core/data/site.data.ts — a única fonte de verdade da empresa
export const SITE: SiteConfig = { … };
```

Mudar o número de telefone significa editar **uma linha**; o header, o footer, a
página de contactos, os botões de chamada e os dados estruturados
`schema.org` atualizam-se todos.

O mesmo princípio garante que o horário legível por humanos e o
`OpeningHoursSpecification` para os motores de busca não podem divergir — são
gerados a partir do mesmo array em `core/data/opening-hours.data.ts`.

### Componentes partilhados

Cada padrão visual existe exatamente uma vez:

| Componente             | Função                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `app-icon`             | Todos os SVG, com nomes tipados (`IconName`) — impossível escrever mal |
| `app-button`           | O único botão: renderiza `routerLink`, `href` ou `<button>`            |
| `app-page-section`     | Ritmo vertical — fundo, espaçamento e _gutter_ consistentes            |
| `app-section-heading`  | Eyebrow + título + traço vermelho + lead                               |
| `app-feature-card`     | Ícone + título + texto (valores, comodidades, história)                |
| `app-accordion(-item)` | Divulgação progressiva acessível (`aria-expanded`/`controls`)          |
| `app-carousel`         | Carrossel do hero, com autoplay pausável                               |
| `app-lightbox`         | Visualizador de imagens — instância única no shell                     |
| `app-gallery-grid`     | Grelha de fotografias que abre o lightbox                              |
| `app-vehicle-card`     | Tipo de veículo aceite                                                 |
| `app-contact-channels` | Telefone / e-mail / morada                                             |
| `app-opening-hours`    | Tabela de horário                                                      |
| `app-map-embed`        | Google Maps (lazy)                                                     |
| `app-social-links`     | Facebook / Instagram / e-mail                                          |
| `app-cta-band`         | Faixa final de chamada à ação                                          |
| `app-page-hero`        | Banner escuro de topo das páginas interiores                           |

### Convenções

- **Nomes de ficheiro sem sufixo** (`header.ts` → `class Header`), conforme o
  guia de estilo oficial do Angular 20+.
- **`ChangeDetectionStrategy.OnPush`** em todos os componentes; a app corre
  _zoneless_, com estado em signals.
- **`input()` / `computed()`**, nunca `@Input()` nem getters no template.
- **Classes Tailwind calculadas em `computed()`** quando dependem de estado —
  evita `[class.x]` com caracteres especiais (`/`, `!`, `:`) na chave.
- **Barrels** (`core/models/index.ts`, `shared/index.ts`) para imports curtos.

---

## Acessibilidade

- Link _"Saltar para o conteúdo"_ visível ao focar.
- Um único `<h1>` por página; hierarquia de títulos sequencial.
- Navegação por teclado em acordeão, carrossel e lightbox (setas, `Escape`).
- `aria-expanded` / `aria-controls` / `aria-current` nos controlos interativos.
- Ícones decorativos com `aria-hidden`; ícones informativos com `role="img"`.
- `prefers-reduced-motion` desliga animações, autoplay e _scroll reveal_.
- Alvos de toque de 44 px+ na barra de navegação móvel.

## SEO

- `<title>`, description, Open Graph, Twitter Card e `<link rel="canonical">`
  por rota, geridos por `SeoService` a partir de `data.meta` no router.
- Dados estruturados `schema.org/AutoRepair` com morada, coordenadas, horário e
  catálogo de serviços (`StructuredDataService`).
- `robots.txt` e `sitemap.xml` em `public/`.
- Redirecionamentos das rotas antigas (`/home`, `/sobrenos`) para as novas.

---

## Deployment

`npm run build` produz uma aplicação estática em `dist/fsautomotive/browser/`.

Por ser uma SPA, o servidor tem de reencaminhar todos os caminhos para
`index.html` (fallback de SPA):

- **Netlify** — `_redirects` com `/* /index.html 200`
- **Vercel** — `rewrites` para `/index.html`
- **Apache** — `RewriteRule ^ index.html [L]`
- **Nginx** — `try_files $uri $uri/ /index.html;`

Sem esse fallback, um acesso direto a `/servicos` devolve 404.

---

## Assets

As imagens em `public/` vêm dos originais da FS Automotive, reorganizadas:

```
public/
├── icons/            # favicons e ícones da app (gerados a partir do logótipo)
└── images/
    ├── brand/        # logótipos
    ├── vehicles/     # ícones dos tipos de veículo
    └── workshop/     # fotografias da oficina
```
