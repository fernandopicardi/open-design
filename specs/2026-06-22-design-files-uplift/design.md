# Design: Aprimoramento da tela de arquivos de design (UI/UX + reconhecimento + previews)

Status: aprovado (brainstorming), aguardando implementação na próxima sessão.
Data: 2026-06-22.
Abordagem escolhida: A (polir e enriquecer as telas atuais, em fases). Office adiado.

## Contexto

O app (fork open-design, em `C:\dev\open-design`) é usado no dia a dia para criar
e organizar design systems de clientes (ex.: "Aya Design System"). A inspiração é o
oficial Claude Design, que mostra cards com miniatura, seções semânticas
(Brand/Colors/Components) e view/edit por item. A tela equivalente no fork é o painel
"Arquivos de design" (`DesignFilesPanel`), hoje uma tabela plana e com defeitos.

Tela alvo confirmada rodando o app (web em 127.0.0.1:17573, projeto Aya em
`/projects/2ce75a6f-9b1a-4b20-9cba-f4216854af33`): aba "Arquivos de design" dentro de
`FileWorkspace` > `ProjectView`.

## Diagnóstico (ground truth, observado no app rodando)

1. Barra de filtro de tipo renderiza quebrada: o `<select>` (`.df-kind-filter`) aparece
   esticado em largura total e o chevron customizado se repete (tiling) ao longo da
   barra; a caixa de busca ("Buscar arquivos…") fica invisível ao lado. Causa provável:
   falta de `background-repeat: no-repeat` e de limite de largura no `.df-kind-filter`,
   mais cor/estilo do input de busca que some no fundo escuro.
2. Arquivos `.jsx` aparecem como "Binário" (ex.: `naiara-redesign/components/Convite.jsx`,
   `Ecos.jsx`, `HeroEssencia.jsx`, `Trajetoria.jsx`). Causa: `kindFor` em
   `apps/daemon/src/projects.ts` não cobre `.jsx` (nem `.vue`, `.mdx`, `.scss`, etc.).
3. Lista plana com caminhos longos, sem agrupar por pasta, sem miniaturas. Só há
   agrupamento por Tipo/Modificado.
4. Sem preview para código/jsx/pdf/office; só imagem/html/vídeo/áudio/sketch têm preview
   (`DfPreview` em `DesignFilesPanel.tsx`).
5. Home (`EntryView`) funcional mas mais crua que o "Recent" oficial.

## Mapa de código relevante

- Home/dashboard: `apps/web/src/components/EntryView.tsx` (abas Designs/Modelos/Sistemas
  de design); `DesignsTab.tsx`, `DesignSystemsTab.tsx`, `NewProjectPanel.tsx`.
- Painel de arquivos do projeto: `apps/web/src/components/DesignFilesPanel.tsx`
  (busca `query`, filtro `kindFilter`, group por `kind`/`modified`, paginação; preview em
  `DfPreview` ~linhas 1012-1094; toolbar busca/filtro ~linhas 663-697).
- Viewer ao abrir arquivo numa aba: `apps/web/src/components/FileViewer.tsx`.
- Reconhecimento de tipo: `apps/daemon/src/projects.ts` > `kindFor` (~linha 1180),
  `mimeFor` (~linha 1046).
- Contrato de tipos: `packages/contracts/src/api/files.ts` (`ProjectFileKind` já inclui
  `html | image | video | audio | sketch | text | code | pdf | document | presentation |
  spreadsheet | binary`). Nenhuma mudança de contrato necessária.
- CSS: `apps/web/src/index.css` (classes `df-*`).

## Escopo aprovado

### Fase 1 — Correções de base (bug-fix, red spec primeiro)

1a. Estender `kindFor` para mapear extensões de código hoje classificadas como `binary`:
   `.jsx`, `.vue`, `.svelte`, `.scss`, `.less`, `.sass`, `.yaml`, `.yml`, `.xml`, `.sql`,
   `.sh`, `.toml` para `code`; `.mdx` para `text`. Manter consistência com `mimeFor`
   onde fizer sentido.
   - Red spec: teste daemon afirmando `kindFor('Convite.jsx') === 'code'` (hoje `binary`),
     vermelho no `main`, verde no branch.

1b. Corrigir CSS de `.df-search` / `.df-kind-filter`: chevron único
   (`background-repeat: no-repeat`, largura compacta), input de busca visível no tema
   escuro.
   - Critério verificável: screenshot do painel com uma única caixa de busca e um único
     dropdown de tipo.

### Fase 2 — Previews novos (PDF + código)

Em `DesignFilesPanel.tsx` (`DfPreview`) e `FileViewer.tsx`:
- PDF: `<iframe>` apontando para o arquivo servido pelo daemon (viewer nativo do browser,
  sem dependência nova).
- Código (`code` kind, inclui `.jsx`): render com realce, reaproveitando o highlighter já
  presente (verificar `DesignSpecView`/`FileViewer`; se não houver lib no bundle, usar
  `<pre>` estilizado leve). Vale no preview e ao abrir em aba.

### Fase 3 — Redesenho UI/UX do painel + home

`DesignFilesPanel.tsx` + `index.css`:
- Novo modo "Agrupar por: Pasta" (além de Tipo/Modificado), derivado do prefixo do caminho
  (`carousels/`, `naiara-redesign/components/...`), recriando a sensação de seções do
  oficial a partir das pastas reais.
- Miniaturas nas linhas para imagem/html (hoje só ícone); opção de cards com preview.
- View vs Edit explícito por item para kinds editáveis (html/sketch/code).
- Toolbar de busca/filtro limpa e visível.

`EntryView.tsx` (home): polir "Recentes" para aproximar do "Make something new" + lista
limpa do oficial (espaçamento, tipografia, cards). Escopo contido, sem reescrever a
estrutura.

## Fora de escopo (agora)

- Preview de Office (docx/pptx/xlsx): adiado para fase posterior (decisão entre lib no
  cliente vs conversão via LibreOffice fica para depois).
- Mudanças em `packages/contracts` (não necessárias).
- Preview de Markdown formatado (não solicitado nesta rodada).

## Validação

- `pnpm guard` e `pnpm typecheck`.
- Testes daemon (`kindFor`) e web (`DesignFilesPanel`) nos diretórios `tests/` siblings.
- Verificação visual no app rodando (`pnpm tools-dev`), incluindo screenshot antes/depois
  da Fase 1b e 3.

## Notas operacionais para a próxima sessão

- Ao subir o dev, se `/` der 404 sem fase `generate-params` no log, limpar
  `apps/web/.next` e reiniciar (resíduo de cache da migração de disco E: para C:).
- Comando de dev usado: `pnpm tools-dev start web --daemon-port 17456 --web-port 17573`.
