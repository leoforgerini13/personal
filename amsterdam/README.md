# Mapa de Amsterdam

Site estático pessoal para explorar Amsterdam: 147 lugares curados por tema e bairro, com visitados, favoritos e tempo de bike a partir de casa. O briefing completo está em [`CLAUDE.md`](CLAUDE.md).

## Estado

| Fase | Status |
|---|---|
| 1. Geocodificação | Script pronto e testado; **falta rodar** (ver abaixo) |
| 2. Mapa e filtros | Pronto |
| 3. Visitados e favoritos | Pronto |
| 4. Casa e tempo de bike | Pronto |
| 5. Visual e acabamento | Pronto: direção "Delft" |
| 6. Deploy | Pronto: falta ativar o Pages ou a Vercel (depende da Fase 1) |

## Rodar localmente

O site é estático, sem build. Os módulos JavaScript exigem um servidor HTTP (abrir o `index.html` direto com `file://` não funciona):

```sh
cd amsterdam
python3 -m http.server 8000
# abra http://localhost:8000
```

Sem `data/lugares.json` (antes de rodar a Fase 1), o site abre e mostra um aviso explicando o que fazer.

## Publicar

O site só precisa de `data/lugares.json`. Então, **antes de publicar, rode a Fase 1 e faça commit do JSON**. `sh scripts/build.sh` monta `_site/` só com o que o navegador usa (sem CSV, scripts nem cache) e falha com uma mensagem clara se o JSON não existir.

### GitHub Pages (recomendado)

O workflow `.github/workflows/amsterdam-pages.yml` (na raiz do repositório) roda os testes, monta o site e publica.

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Faça merge desta branch na branch padrão do repositório. O workflow roda sozinho a cada push que mexa em `amsterdam/`, e também pode ser disparado à mão em **Actions → Mapa de Amsterdam → Run workflow**.
3. O endereço será `https://<usuário>.github.io/<repositório>/`.

O workflow só roda na branch padrão. Se o Pages deste repositório já publica outra coisa (por exemplo o `dashboard.html` da raiz), trocar a fonte para "GitHub Actions" substitui essa publicação. Nesse caso, prefira a Vercel ou mova o mapa para um repositório próprio.

### Vercel

1. **Add New → Project** e importe o repositório.
2. Em **Root Directory**, escolha `amsterdam`. Framework: **Other**.
3. O `vercel.json` já define `sh scripts/build.sh` como build e `_site` como saída. É só dar Deploy.

### No celular

Abra o endereço e use **Compartilhar → Adicionar à Tela de Início** (iPhone) ou **⋮ → Adicionar à tela inicial** (Android). O manifest dá nome e ícone próprios.

## Visual (Fase 5)

Foram propostas três direções (Delft, Gráfico e Noite); a escolhida foi **Delft**:

- **Paleta:** papel quente `#f5f1e8`/`#fffcf6`, texto azul-marinho `#1b2447`, acento azul de Delft `#2448a8` (favoritos, progresso), laranja `#c2410c` para foco de teclado e marcador de casa.
- **Tipografia:** Fraunces (serifa, nomes de lugares e títulos) + Inter (interface), hospedadas em `vendor/fonts` (licença OFL), sem Google Fonts.
- **Mapa:** CARTO Voyager, com cores suaves, água e parques bem visíveis e boa leitura no sol.
- **Ícones:** Lucide. Cada tema tem cor **e** ícone; visitado = esmaecido **e** selo ✓; favorito = selo ♥.
- **Acessibilidade:** alvos de toque de pelo menos 44 px (chips com área estendida), foco visível, contraste AA no texto (texto secundário 5,3:1 ou mais; o texto das etiquetas usa a cor principal, e a cor do tema vai só para a borda e o ícone, porque algumas cores de tema ficam abaixo de 4,5:1). Ícones brancos sobre as cores dos temas passam de 3:1.

## Estrutura

```
index.html             página única
css/app.css            estilos (mobile first, tokens de cor em :root)
js/
  main.js              liga tudo: lista, cards, diálogos, eventos
  mapa.js              Leaflet: pins, clusters, legenda, casa
  painel.js            painel inferior arrastável (celular)
  filtros.js           estado dos filtros, aplicação e URL
  store.js             visitados, favoritos e casa (localStorage)
  geo.js               distância, tempo de bike e links do Google Maps
  data.js              temas, bairros, preços e carregamento do JSON
  icons.js             ícones Lucide (gerado)
vendor/                Leaflet 1.9.4, Leaflet.markercluster 1.5.3 e fontes, com licenças
scripts/build.sh       monta _site/ para publicar
vercel.json            config da Vercel (Root Directory: amsterdam)
manifest.webmanifest   nome e ícone para "Adicionar à tela inicial"
data/
  lugares.csv          fonte (curadoria manual)
  overrides.csv        correções manuais de coordenadas (id,lat,lng)
  lugares.json         gerado: pronto para o site
  geocode_falhas.csv   gerado: não encontrados e suspeitos, com motivo
  geocode_cache.json   gerado: respostas do Nominatim (versionado, evita repetir consultas)
scripts/
  geocode.py           Fase 1
  test_geocode.py      testes do geocode (sem rede)
```

## Fase 1 — Geocodificação

Requer só Python 3.9+ (biblioteca padrão).

```sh
python3 scripts/geocode.py                  # consulta o que faltar no cache (~1 req/s)
python3 scripts/geocode.py --offline        # regenera as saídas só com cache + overrides
python3 scripts/geocode.py --refresh        # ignora o cache
NOMINATIM_EMAIL=voce@exemplo.com python3 scripts/geocode.py   # opcional: contato para o Nominatim
python3 -m unittest scripts/test_geocode.py # testes
```

A primeira execução faz no máximo 3 consultas por lugar (em geral 1), ou seja, cerca de 2 a 5 minutos. Se a rede cair no meio, o cache é salvo e basta rodar de novo.

### Fluxo de revisão

1. Rode o script.
2. Abra `data/geocode_falhas.csv`. Cada linha traz o motivo e um link `ver_no_mapa` para conferir no OpenStreetMap.
3. Para corrigir, adicione a linha em `data/overrides.csv` (dá para pegar lat/lng clicando com o botão direito no Google Maps ou no OSM).
4. Rode `python3 scripts/geocode.py --offline` para regenerar sem consultar a rede.

### Status de cada lugar (`geo` no JSON)

- `ok`: o nome do resultado bate com o lugar, ou é um canal/rua em que qualquer ponto da via serve.
- `override`: veio de `overrides.csv`.
- `suspeito`: tem coordenada e aparece no mapa, mas está listado em `geocode_falhas.csv` para revisão.
- `falha`: sem coordenada (não encontrado, ou só encontrado fora da área). Não aparece no mapa.
- `pendente`: só no modo `--offline`, quando falta cache.

## Como o site funciona

- **Mapa:** clusters que se desfazem no zoom 17; pins com cor e ícone por tema (cor nunca sozinha). Visitado fica esmaecido e com selo de check; favorito ganha selo de coração. A legenda também filtra: tocar num tema liga ou desliga o filtro.
- **Lista:** no celular, painel inferior com três alturas (recolhido, meio, alto): arraste ou toque no cabeçalho. No desktop, coluna lateral. Tocar num item abre o card dentro da própria lista e centraliza o pin; tocar num pin abre e rola até o item.
- **Card:** tema, bairro, preço com a faixa, descrição, tempo de bike (se houver casa), Visitei, Favorito, Abrir no Google Maps e Rota de bike.
- **Filtros:** tema, bairro e preço (múltiplos), busca por nome ou descrição sem ligar para acentos, visitas (todos / não visitados / só visitados), só favoritos e raio de bike (10, 20 ou 30 min). Tudo vai para a URL, junto com o lugar aberto. Exemplo: `?tema=museus,bares&bairro=jordaan&lugar=rijksmuseum-museus`.
- **Progresso:** os chips de tema e bairro mostram visitados/total (ex.: "Museus 3/17"), e o menu ⋮ tem barras por tema e por bairro.
- **Backup:** menu ⋮ → Exportar/Importar JSON.
- **Casa:** botão da casinha → buscar endereço (Nominatim, só ao tocar em Buscar, conforme a política de uso) ou escolher no mapa. O marcador pode ser arrastado para ajustar.

## Decisões técnicas

- **Pasta `amsterdam/`**: o repositório `personal` já tem outro projeto (`dashboard.html`) na raiz, então o mapa fica isolado nesta pasta.
- **Python só com biblioteca padrão**, para não precisar instalar nada.
- **Área de busca:** `viewbox` 4.72,52.26 – 5.08,52.43 com `bounded=1` e `countrycodes=nl`. Cobre Amsterdam inteira, Amstelveen e o Amsterdamse Bos.
- **Consultas em cascata:** primeiro o `endereco_busca` completo; se o resultado for genérico ou tiver outro nome, tenta `primeiro trecho, cidade` e depois `nome, cidade`. Fica com o primeiro resultado confiável; se nenhum for, fica com o primeiro suspeito dentro da área.
- **Critério de suspeita:** o nome do resultado é comparado com o do lugar (sem acentos, ignorando palavras como "café", "de", "museum"). Se não bater e o resultado for uma rua, bairro ou cidade, o motivo é "resultado genérico"; se for outro estabelecimento, o motivo é "nome diferente". Temas "Canais e pontes" e ruas de compras cujo nome é a própria rua (ex.: Haarlemmerdijk) são aceitos como via.
- **Lugares que compartilham o mesmo endereço** (ex.: Vondelpark como parque e como volta de corrida) recebem a mesma coordenada; o cache faz uma consulta só.
- **`lugares.json` inclui os 147 lugares**, com `lat`/`lng` nulos nas falhas, para o site poder contar e listar o que ficou de fora.
- **User-Agent** `mapa-amsterdam/1.0 (+URL do repositório)`; o e-mail de contato é opcional, via `NOMINATIM_EMAIL`, para não ficar no código.
- **Atribuição:** os dados de coordenadas vêm do OpenStreetMap (ODbL); o JSON registra a fonte.
- **Sem build e sem CDN:** HTML, CSS e módulos ES puros; Leaflet e markercluster copiados em `vendor/` (via `npm pack`). O site funciona igual em qualquer hospedagem estática e não depende de CDN de terceiros.
- **Tiles:** CARTO Voyager (uso gratuito não comercial; atribuição obrigatória). A atribuição fica no canto inferior direito no desktop e no superior direito no celular, onde o painel não a cobre.
- **Card dentro da lista** (acordeão), em vez de popup no mapa: no celular, popups do Leaflet ficam apertados, e assim "clicar no pin destaca o item na lista" e "card do lugar" viram a mesma coisa.
- **Filtros de visita:** "esconder visitados" e "só visitados" viraram uma escolha única (Todos / Não visitados / Só visitados), porque os dois juntos se anulariam. "Só favoritos" é independente.
- **Ao definir a casa pela primeira vez**, a lista passa a ordenar por proximidade (dá para voltar para A–Z).
- **Lugares sem coordenada** (falhas da Fase 1) continuam na lista, marcados como "sem localização", com o link do Google Maps. Eles não entram no filtro de raio.
- **Importar junta, não substitui:** une visitados e favoritos; a casa do backup só é usada se o aparelho ainda não tiver uma.
- **Dados salvos** na chave `mapa-amsterdam:v1` do localStorage. Sem localStorage (aba anônima ou bloqueio), tudo funciona em memória, sem aviso.
- **Tempo de bike:** distância em linha reta (haversine) × 1,3, a 15 km/h. O card e os filtros dizem que é uma estimativa.
- **Rota de bike:** `google.com/maps/dir/?api=1&origin=lat,lng&destination=nome, cidade&travelmode=bicycling`. O destino é por nome, como no link de busca, para o Google achar o estabelecimento mesmo se a coordenada do OSM estiver um pouco deslocada.
