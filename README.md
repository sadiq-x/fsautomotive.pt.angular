# fsautomotive.pt

Website institucional da **FS Automotive** — oficina automóvel multimarca em Vialonga.

Reconstrução completa do site estático original (HTML/CSS/JS) numa aplicação
Angular com TypeScript estrito e Tailwind CSS.

---

> **Documentação técnica completa:** [`docs/APPLICATION.md`](docs/APPLICATION.md)
> — arquitetura, lógica do código, guia passo a passo, mapa de ficheiros,
> utilização dos scripts e registo de desenvolvimento.

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
npm run install:all # instala dependências da raiz e de server/
npm start           # frontend (4200) + backend (3000)
npm run start:web   # apenas o frontend
npm run start:api   # apenas o backend
npm run build       # build de produção para dist/fsautomotive
npm test            # correr os testes uma vez
npm run test:watch  # testes em modo watch
npm run test:scripts # testes das ferramentas de build (scripts/)
npm run format      # formatar todo o código
npm run verify      # format:check + testes + build (usar antes de fazer push)
npm run audit:responsive  # falha se alguma página deslizar na horizontal (precisa de Chrome)
npm run verify:full # verify + audit responsivo (usar antes de publicar)
npm run deploy      # publica no GitHub Pages
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
    │   ├── config/              # constantes injetadas no build (GA4)
    │   ├── data/                # TODO o conteúdo do site, tipado
    │   └── services/            # Seo, StructuredData, Analytics, Consent
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
| `app-cookie-notice`    | Aviso de privacidade com recusa — instância única no shell             |
| `app-opening-hours`    | Tabela de horário                                                      |
| `app-map-embed`        | Google Maps (lazy)                                                     |
| `app-social-links`     | Facebook / Instagram / e-mail                                          |
| `app-cta-band`         | Faixa final de chamada à ação                                          |
| `app-page-hero`        | Banner escuro de topo das páginas interiores                           |

### Sistema de botões

`app-button` tem cinco variantes, cada uma pensada para uma superfície:

| Variante    | Superfície              | Tratamento                                  |
| ----------- | ----------------------- | ------------------------------------------- |
| `primary`   | qualquer                | Preenchimento vermelho + sombra de contacto |
| `secondary` | fundo claro (bone)      | Branco + aro tingido + sombra               |
| `dark`      | fundo claro             | Tinta quase preta                           |
| `ghost`     | fotografia / faixa dark | Aro gelado, sem preenchimento sólido        |
| `link`      | dentro de texto         | Só texto sublinhado, sem _chrome_           |

Cada variante define **quatro estados** — repouso, `hover`, `active` e
`focus-visible`. O `hover` clareia _e_ eleva: a sombra maior é o que torna um
deslocamento de 2 px percetível, e o `active` volta a assentar o botão, para
que o clique tenha resposta física.

Duas decisões que valem a pena registar:

- **As sombras dos botões não são as dos cartões.** Um cartão flutua sobre a
  página (sombra larga e suave); um botão assenta na superfície (desfoque curto
  - sombra de contacto). Usar a sombra de cartão num botão deixava uma mancha
    difusa no fundo bone. A camada vermelha do `--shadow-brand` é propositadamente
    discreta — com mais opacidade, transformava-se num halo sobre o cabeçalho
    quase preto.
- **A variante `link` não recebe as classes de tamanho do pill.** As dimensões
  são escolhidas em `classes()` conforme a variante, o que dispensa os
  `px-0!`/`py-0!` que antes lutavam contra o `SIZES`.

**O host do `app-button` é uma caixa real.** Era `display: contents`, que não
gera caixa nenhuma: um `class="mt-8"` no host era calculado pelo browser e
depois descartado em silêncio — o botão ficava colado ao elemento acima. Agora
o `display` por omissão vive na _base layer_ (`app-button { display: inline-flex }`),
e não numa classe do host. A distinção importa: uma classe estática no host
empata em especificidade com o `hidden` de quem o usa e a ordem da folha de
estilos decide o vencedor — foi assim que o botão do cabeçalho apareceu no
telemóvel. Um seletor de elemento perde sempre para qualquer utilitário, pelo
que `class="hidden lg:inline-flex"` funciona como seria de esperar.

Superfícies pálidas sobre fundo claro (o disco do acordeão, o botão
`secondary`) usam sempre um aro tingido — `ring-ink-950/8` — em vez de um
cinzento liso: define a forma sem parecer desenhado por cima.

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

## Escala responsiva

O site cobre desde um telemóvel de 320 px até uma televisão 4K. A estratégia
tem três camadas que se complementam em vez de se sobreporem.

### 1. Breakpoints por dispositivo

| Token | Largura | Dispositivo alvo                  |
| ----- | ------- | --------------------------------- |
| `xs`  | 480 px  | Telemóveis grandes                |
| `sm`  | 640 px  | Phablets, tablets pequenos        |
| `md`  | 768 px  | Tablet em retrato                 |
| `lg`  | 1024 px | Tablet em paisagem, portáteis     |
| `xl`  | 1280 px | Portáteis                         |
| `2xl` | 1536 px | Desktop                           |
| `3xl` | 1920 px | Desktop grande, televisão Full HD |
| `4xl` | 2560 px | Ecrãs QHD                         |
| `5xl` | 3840 px | Televisões 4K                     |

Declarados em `rem`: em _media queries_ o `rem` resolve sempre contra o tamanho
de letra inicial do browser, por isso os breakpoints não são afetados pelo
escalamento da raiz e respeitam um tamanho de letra personalizado do visitante.

### 2. Tipografia e espaçamento fluidos

Títulos, texto e ritmo vertical usam `clamp()` — crescem continuamente entre os
375 px e os 1536 px, sem "saltos" nos breakpoints:

```css
--text-h1: clamp(2rem, 1.354rem + 2.76vw, 4rem); /* 32 px → 64 px */
--spacing-section-md: clamp(4rem, 2.87rem + 4.82vw, 7.5rem);
```

Os tokens (`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-lead`,
`text-body`, `text-meta`, `text-eyebrow`) substituem escadas do tipo
`text-3xl sm:text-4xl lg:text-5xl`. O mínimo é 12 px em qualquer ecrã.

### 3. Escalamento da raiz acima dos 1920 px

Onde o `clamp` termina, o tamanho de letra da raiz assume:

| Largura | `font-size` da raiz |
| ------- | ------------------- |
| ≥1920px | 17 px               |
| ≥2560px | 19 px               |
| ≥3840px | 24 px               |

Como todo o espaçamento do Tailwind é baseado em `rem`, isto amplia de uma só
vez tipografia, espaçamentos, ícones e raios de canto — que é exatamente o que
uma distância de visualização de 3 metros exige. A largura máxima do conteúdo
acompanha (80rem → 112rem) para o texto não ficar isolado no meio do ecrã.

### Variantes de capacidade

A largura não descreve tudo. Três variantes próprias cobrem o resto:

| Variante | Media query                                | Uso                                 |
| -------- | ------------------------------------------ | ----------------------------------- |
| `tv:`    | `(≥1920px e pointer: coarse)` ou `≥2560px` | Margem de _overscan_, alvos maiores |
| `touch:` | `(hover: none)`                            | Áreas de toque mais generosas       |
| `short:` | `(altura ≤ 544px e paisagem)`              | Telemóvel deitado                   |

O `hover:` do Tailwind v4 já vem embrulhado em `@media (hover: hover)`, por isso
ecrãs táteis nunca ficam com estados de _hover_ "presos".

### Comportamento por dispositivo

- **Telemóvel (<768px)** — barra de navegação fixa no fundo, com alvos de 64 px;
  o herói ocupa `min(88svh, 50rem)` para preencher o ecrã sem cortar conteúdo.
- **Telemóvel deitado** — `short:` reduz o espaçamento do herói e esconde a
  faixa de estatísticas, para o título e os botões caberem em 375 px de altura.
- **Tablet (≥768px)** — passa a navegação de topo; a barra inferior desaparece.
- **Portátil / desktop (≥1024px)** — número de telefone e botão de orçamento no
  cabeçalho; o gradiente do herói passa a horizontal, deixando a fotografia da
  oficina respirar à direita do título.
- **Televisão (≥1920px com comando)** — escalamento da raiz, `--tv-safe` de
  2.5vw contra o _overscan_, e anel de foco de 4 px com halo para navegação por
  D-pad.

### Garantia contra deslize horizontal

Nenhuma página pode deslizar para os lados. Isso é assegurado em três níveis:

1. **Nada transborda por construção.** Os brilhos decorativos das faixas
   escuras são pintados como `background` (`glow-corner`, `glow-diagonal`) em
   vez de círculos desfocados posicionados fora do contentor. A abordagem
   anterior dependia de `overflow: hidden` para recortar um elemento com
   `blur()` — combinação que escapa ao recorte no iOS Safari quando o
   contentor também tem `border-radius`, alargando a página. Como efeito
   secundário, desapareceu um filtro `blur` caro para GPUs móveis.
2. **Guarda na raiz.** `html, body { overflow-x: clip }`. `clip` e não
   `hidden`: `hidden` transformaria a raiz num contentor de scroll e partiria
   o cabeçalho `sticky`; `clip` apenas recusa o deslize lateral.
   `overscroll-behavior-x: none` impede que um arrasto lateral encadeie no
   gesto de retroceder do browser.
3. **Guarda automatizada.** `npm run audit:responsive` serve o _bundle_ de
   produção, percorre 9 larguras × 5 páginas em Chrome _headless_ e falha se
   algum elemento escapar ao _viewport_. Corre dentro de `npm run verify`.

> O teste ignora deliberadamente o guarda da raiz ao procurar transbordos —
> caso contrário o `overflow-x: clip` mascararia todos os problemas reais e o
> teste passaria sempre.

### Imagens responsivas

As fotografias da oficina são servidas em quatro tamanhos (480 / 768 / 1200 /
1920). O componente `app-responsive-image` deriva o `srcset` do nome do ficheiro
por convenção (`oficina-1.jpg` → `oficina-1-480.jpg`) e cada consumidor declara
o `sizes` da sua grelha. Um telemóvel descarrega ~40 kB por fotografia em vez
dos ~205 kB do original.

---

## Analytics

O Google Analytics 4 está implementado. Para o activar, defina a variável no
ficheiro `.env` (copie de [`.env.example`](.env.example)):

```dotenv
GOOGLE_ANALYTICS_ID=G-ABCD123456
GOOGLE_ANALYTICS_ENABLED=      # opcional: `false` desliga sem apagar o ID
```

| Ficheiro       | Papel                                                     |
| -------------- | --------------------------------------------------------- |
| `.env`         | Valor da equipa. Ignorado pelo git.                       |
| `.env.local`   | Sobrepõe-se ao `.env` — valor pessoal. Ignorado pelo git. |
| `.env.example` | Modelo versionado. Nunca contém um valor real.            |

O site é apenas cliente, por isso não existe processo que leia o `.env` em
tempo de execução: o valor é **compilado no bundle** por
[`scripts/ng-env.mjs`](scripts/ng-env.mjs), que reencaminha as variáveis
autorizadas para a opção `--define` do Angular CLI. Os ficheiros são lidos pelo
próprio Node (`--env-file-if-exists`), sem qualquer dependência adicional.

> Só as variáveis na lista explícita do runner chegam ao browser — um segredo
> colocado por engano no `.env` nunca é exposto. O Measurement ID do GA4 não é
> segredo: está visível no código-fonte de qualquer site com Analytics.

**Um ID malformado falha o build de produção.** Um erro de escrita não dá
qualquer sinal no browser — o site continua a funcionar e não regista nada —
por isso é validado antes de compilar. Em desenvolvimento apenas avisa e
desliga o Analytics.

Sem `GOOGLE_ANALYTICS_ID` definido nada é carregado nem pedido. Com ele:
funciona **sem cookies** (Consent Mode v2 com todas as categorias negadas),
regista visualizações em cada navegação e um evento por cada contacto —
`phone_click`, `email_click` e `directions_click`.

### Aviso de privacidade

Como não há cookies, não é legalmente preciso um banner de consentimento. Ainda
assim o site mostra um **aviso informativo** (`app-cookie-notice`) que explica a
medição anónima e oferece uma recusa a sério:

| Escolha       | Aviso     | Medição                       | Guardado  |
| ------------- | --------- | ----------------------------- | --------- |
| _por decidir_ | visível   | corre — sem cookies           | **nada**  |
| Aceitar       | escondido | corre                         | a escolha |
| Recusar       | escondido | nunca arranca; nada é enviado | a escolha |

Enquanto o visitante não responde **nada é gravado no dispositivo** — que é o
objetivo de correr sem cookies. Só a própria escolha é guardada, e só depois de
ele a fazer. O aviso não é modal: não bloqueia nada, porque não há nada
dependente da resposta.

Detalhes em [`docs/APPLICATION.md`](docs/APPLICATION.md) §2.5.

## Acessibilidade

- Link _"Saltar para o conteúdo"_ visível ao focar.
- Um único `<h1>` por página; hierarquia de títulos sequencial.
- Navegação por teclado em acordeão, carrossel e lightbox (setas, `Escape`).
- `aria-expanded` / `aria-controls` / `aria-current` nos controlos interativos.
- Ícones decorativos com `aria-hidden`; ícones informativos com `role="img"`.
- `prefers-reduced-motion` desliga animações, autoplay e _scroll reveal_.
- Alvos de toque de 44 px+ na barra de navegação móvel; a variante `touch:`
  aumenta os alvos mais compactos onde não existe rato.
- Tamanho de letra mínimo de 12 px em qualquer dispositivo.
- Anel de foco reforçado (4 px + halo) acima dos 1920 px, para navegação por
  comando de televisão.

## SEO

- `<title>`, description, Open Graph, Twitter Card e `<link rel="canonical">`
  por rota, geridos por `SeoService` a partir de `data.meta` no router.
- Dados estruturados `schema.org/AutoRepair` com morada, coordenadas, horário e
  catálogo de serviços (`StructuredDataService`).
- `robots.txt` e `sitemap.xml` em `public/`.
- Redirecionamentos das rotas antigas (`/home`, `/sobrenos`) para as novas.

---

## Deployment

O projeto está configurado para **GitHub Pages** através do `angular-cli-ghpages`:

```bash
npm run deploy              # ng deploy --base-href=/fsautomotive.pt.angular/
./scripts/deploy.ps1        # o mesmo, com verificações antes de publicar
```

O `scripts/deploy.ps1` (PowerShell 5.1+ ou `pwsh` 7+) é a via recomendada:
executa a partir da raiz do repositório independentemente de onde é invocado,
instala dependências em falta, **recusa publicar com alterações por commitar**,
corre o `npm run verify` antes de qualquer publicação e pede confirmação. Como
usa `SupportsShouldProcess`, aceita `-WhatIf` e `-Confirm`:

| Parâmetro     | Efeito                                            |
| ------------- | ------------------------------------------------- |
| `-BaseHref`   | Caminho base; `'/'` quando houver domínio próprio |
| `-SkipVerify` | Salta formatação, testes e build                  |
| `-AllowDirty` | Publica mesmo com a árvore de trabalho suja       |
| `-WhatIf`     | Mostra o que aconteceria, sem publicar            |

```powershell
./scripts/deploy.ps1 -WhatIf            # ensaio, não publica nada
./scripts/deploy.ps1 -BaseHref '/'      # para domínio próprio
```

O `--base-href` é obrigatório porque o site é servido a partir de um
subdiretório (`https://<utilizador>.github.io/fsautomotive.pt.angular/`). Todos
os recursos no `index.html` são referenciados de forma relativa, pelo que
resolvem corretamente contra esse `<base href>`.

O `angular-cli-ghpages` trata automaticamente de dois detalhes do GitHub Pages:

- **`404.html`** — cópia do `index.html`, que dá o _fallback_ de SPA. Sem ele,
  abrir `/servicos` diretamente ou recarregar a página devolveria um 404.
- **`.nojekyll`** — impede o Jekyll de processar (e ignorar) ficheiros do build.

Para mudar de anfitrião, o requisito é sempre o mesmo — reencaminhar caminhos
desconhecidos para o `index.html`:

| Anfitrião | Configuração                        |
| --------- | ----------------------------------- |
| Netlify   | `public/_redirects` (já incluído)   |
| Vercel    | `rewrites` para `/index.html`       |
| Apache    | `RewriteRule ^ index.html [L]`      |
| Nginx     | `try_files $uri $uri/ /index.html;` |

Se o site passar a ter domínio próprio, o `--base-href` volta a ser `/` e deve
ser gerado um `CNAME` (`ng deploy --cname=fsautomotive.pt`).

## Área de gestão (privada)

Área reservada em `/gestao`, dentro da mesma aplicação Angular — carregada em
_lazy loading_, por isso um visitante do site público nunca descarrega este
código.

```
/gestao/entrar          início de sessão
/gestao/painel          resumo
/gestao/clientes        lista + detalhe
/gestao/veiculos        lista + detalhe (por matrícula)
/gestao/folhas-de-obra  lista + detalhe
/gestao/marcacoes       lista + detalhe + criação
```

O Angular fala **apenas** com o backend em `server/`; a chave do OfficeGest
nunca sai desse processo.

```
Angular  ──▶  server/  ──▶  api.officegest.com
```

**Autenticação.** O backend ainda não tem endpoints de sessão. O contrato que a
aplicação espera está declarado — e assinalado — em
[`src/app/core/auth/auth.contract.ts`](src/app/core/auth/auth.contract.ts).
Para desenvolver entretanto, ative o stub:

```bash
# .env
DEV_AUTH_STUB=true
```

Qualquer palavra-passe é então aceite em `/gestao/entrar` (use `wrong` para ver
o estado de erro). O `npm run build` de produção **falha** enquanto esta
variável estiver ativa — ver `checkDevAuthStub` em
[`scripts/lib/env.mjs`](scripts/lib/env.mjs).

Documentação completa da arquitetura da área privada:
[`docs/PRIVATE-AREA.md`](docs/PRIVATE-AREA.md).

## Backend (OfficeGest)

O site é estático e não pode guardar segredos: tudo o que é compilado para o
`bundle` é legível por qualquer visitante. A chave da API do OfficeGest dá acesso
ao ERP do cliente, por isso vive num serviço Node separado, em [`server/`](server/).

```
Browser ──▶ server/ ──▶ api.officegest.com
             (guarda a credencial)
```

```bash
cd server
npm install
cp .env.example .env      # preencher OFFICEGEST_BASE_URL e OFFICEGEST_API_KEY
npm run dev               # http://localhost:3000
```

Endpoints em `/api/officegest/…` para clientes, veículos, folhas de obra e
marcações. A documentação completa — arquitetura, autenticação, variáveis de
ambiente, tratamento de erros e testes — está em
[`server/README.md`](server/README.md).

> A credencial deve ficar em `server/.env`, **não** no `.env` da raiz: esse é
> lido pelo `scripts/ng-env.mjs` e alimenta o `bundle` do browser.

## Assets

As imagens em `public/` vêm dos originais da FS Automotive, reorganizadas:

```
public/
├── icons/            # favicons e ícones da app (gerados a partir do logótipo)
└── images/
    ├── brand/        # logótipos
    ├── vehicles/     # ícones dos tipos de veículo
    └── workshop/     # fotografias da oficina (1920px + 480/768/1200)
```
