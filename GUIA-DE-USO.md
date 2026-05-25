# Guia de uso

Guia prático para rodar o Open Design localmente, **exportar designs para o Figma** e **buscar/filtrar arquivos** dentro de um projeto.

> Os recursos descritos aqui foram adicionados no commit `feat(web): export designs to Figma + Design Files search/type filter`.

---

## 1. Iniciar o servidor local

### Opção A — clicar duas vezes (Windows)

Dê dois cliques em **`iniciar.bat`** na raiz do projeto. Ele:

1. encerra qualquer instância anterior;
2. libera as portas `17456` (daemon) e `17573` (web) caso tenham ficado presas;
3. sobe **daemon + web**;
4. tenta de novo automaticamente se o primeiro start lento estourar o tempo;
5. abre o navegador assim que a web responde.

Para parar: feche a janela do `.bat` ou pressione `Ctrl + C`.

### Opção B — linha de comando

```bash
pnpm tools-dev run web --daemon-port 17456 --web-port 17573
```

Acesse **http://127.0.0.1:17573**. Para parar: `Ctrl + C` ou `pnpm tools-dev stop`.

---

## 2. Exportar um design para o Figma

O fluxo tem dois lados: o **Open Design** gera um arquivo `.odfig.json`, e um **plugin do Figma** reconstrói esse arquivo como camadas nativas (frames com auto-layout, texto, imagens, gradientes).

> Não é gerado um arquivo `.fig` — esse formato é fechado. O plugin usa a Plugin API do Figma, que é a forma suportada de criar conteúdo editável programaticamente.

### Passo 1 — Compilar o plugin (só na primeira vez ou após atualizações)

```bash
pnpm --filter @open-design/figma-plugin build
```

Isso gera `packages/figma-plugin/dist/code.js`.

### Passo 2 — Carregar o plugin no Figma (só na primeira vez)

No app **Figma desktop**:

1. Menu **Plugins → Development → Import plugin from manifest…**
2. Selecione `packages/figma-plugin/manifest.json`.
3. O plugin passa a aparecer em **Plugins → Development → Open Design → Figma**.

> Em plugins de desenvolvimento, o Figma recarrega o `dist/code.js` a cada execução — depois de recompilar, basta rodar o plugin de novo (não precisa reimportar o manifest).

### Passo 3 — Exportar do Open Design

1. Abra um design no Open Design.
2. Clique em **Share** (canto superior direito).
3. Escolha **Exportar para o Figma**.
4. Um arquivo `<nome>.odfig.json` é baixado.

> O item **Exportar para o Figma** aparece no menu Share do preview HTML (protótipos, decks, páginas, posts). Funciona tanto em preview de arquivo único quanto em designs multi-arquivo.

### Passo 4 — Importar no Figma

1. No Figma, rode **Open Design → Figma** (em Plugins → Development).
2. Na janela do plugin, clique em **"Click to choose a .odfig.json file"**.
3. Selecione o `.odfig.json` baixado.

As camadas aparecem na página atual, já selecionadas e com zoom aplicado.

---

## 3. Buscar e filtrar arquivos do projeto

No painel **Design Files**, acima da lista, há uma barra com:

- **Busca por nome** — filtra por trecho do nome do arquivo (não diferencia maiúsculas). Pressione `Esc` para limpar.
- **Filtro por tipo** — dropdown que lista apenas os tipos presentes no projeto (HTML, Imagem, Código, Sketch, PDF, etc.), mais "Todos".

Os dois combinam entre si e funcionam junto com a ordenação, o agrupamento e a paginação já existentes. Quando nada corresponde, aparece **"Nenhum arquivo corresponde à sua busca."**

---

## 4. Limitações conhecidas (export para Figma)

- **Fidelidade muito boa, não pixel-perfect.** Layout, texto, cores sólidas, gradientes (linear/radial) e flexbox → auto-layout mapeiam bem.
- **Imagens:** apenas `data:` URI entram de verdade; imagens por URL remota viram um retângulo placeholder para você substituir.
- **Texto com conteúdo misto** (ex.: `<p>Olá <b>mundo</b></p>`) preserva os trechos filhos, mas perde o texto solto do pai.
- **Gradientes:** o ângulo é aproximado (rotação em torno do centro); radial usa um transform centralizado padrão; fundos com várias camadas usam apenas a primeira.
- **CSS não mapeado ainda:** `grid`, sombras, `transform` e imagens de fundo.

---

## 5. Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `daemon 502: connect ECONNREFUSED 127.0.0.1:17456` | o daemon caiu | `pnpm tools-dev start daemon --daemon-port 17456` (ou reinicie pelo `iniciar.bat`) |
| `web did not expose status in time` | cold start lento no disco estourou o tempo | rode de novo; o `iniciar.bat` já tenta automaticamente |
| **"Exportar para o Figma" não aparece** | navegador com JS em cache | `Ctrl + Shift + R` (hard refresh) |
| A janela do Figma é outra (ex.: "Figbridge") | plugin errado | use **Open Design → Figma**, importado via `manifest.json` |
| Cores faltando no Figma | `.odfig.json` antigo, sem gradientes | re-exporte o design e importe o novo arquivo |

---

## Referências no código

- Contrato do cenário exportado: `packages/contracts/src/api/figma-scene.ts`
- Extração no preview (bridge): `apps/web/src/runtime/srcdoc.ts`
- Ações do menu Share: `apps/web/src/runtime/exports.ts`
- Plugin do Figma: `packages/figma-plugin/` (ver `packages/figma-plugin/README.md`)
- Busca/filtro de arquivos: `apps/web/src/components/DesignFilesPanel.tsx`
