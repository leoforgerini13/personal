# Mapa de Amsterdam — briefing do projeto

## Objetivo
Um site pessoal, navegável e bonito, para explorar Amsterdam depois da mudança: mapa real com lugares curados por tema e bairro, marcação de visitados e favoritos, e tempo de bike a partir de casa. Uso pessoal, publicável como site estático para abrir no celular.

## Decisões já tomadas
- **Base de mapa:** OpenStreetMap via Leaflet, sem chave de API. Pode usar tiles CARTO (Positron/Voyager) se combinarem melhor com o visual, mantendo a atribuição exigida.
- **Sem backend, sem login.** Site estático. Deploy em GitHub Pages ou Vercel.
- **Idioma da interface:** português do Brasil.
- **Estilo visual:** em aberto. Proponha 2 ou 3 direções antes de implementar (ver Fase 5).

## Dados
- `data/lugares.csv`: 147 lugares, colunas `id, nome, endereco_busca, bairro, tema, preco, descricao, lat, lng`.
- `lat` e `lng` estão vazios. A Fase 1 preenche.
- **Temas (10):** Gastronomia e cafés, Parques e dog-friendly, Esporte, Lojas e design, Feiras de rua, Bares, Baladas e shows, Coffeeshops, Museus, Canais e pontes.
- **Bairros (12):** Centrum, Jordaan, Westerpark, Oud-West, De Pijp, Oud-Zuid, Oost, Oostelijke Eilanden, Noord, Nieuw-West, Zuidas / Amstelveen, Zuidoost.
- **Preço:** `grátis`, `€` (até ~€15/pessoa), `€€` (~€15–35), `€€€` (acima de ~€35).
- A curadoria é inicial. Alguns lugares podem ter fechado, e isso será revisado manualmente. Não invente nem adicione lugares.

## Fases

### Fase 1 — Geocodificação (script, roda uma vez)
- Criar `scripts/geocode` que lê o CSV e consulta o Nominatim (OSM) por `endereco_busca`.
- Respeitar a política de uso: no máximo 1 requisição por segundo, `User-Agent` próprio e cache local para não repetir consultas.
- Restringir a busca à área de Amsterdam e Amstelveen (viewbox ou bounded).
- Saídas:
  - `data/lugares.json`, com coordenadas e pronto para o site;
  - `data/geocode_falhas.csv`, com os não encontrados ou suspeitos (fora da área, ou resultado genérico de rua quando o nome é de um estabelecimento).
- Suportar `data/overrides.csv` (`id, lat, lng`) para correções manuais, que têm prioridade sobre o Nominatim.
- Canais e ruas podem cair num ponto qualquer da via. Isso é aceitável.

### Fase 2 — Mapa e filtros
- Mapa em tela cheia, centrado em Amsterdam, com clustering de marcadores (Leaflet.markercluster).
- Marcador com cor e ícone por tema, e legenda.
- **Filtros combináveis:** tema (multi), bairro (multi), preço (multi) e busca textual por nome ou descrição, tolerante a acentos.
- Lista lateral (painel inferior no celular) sincronizada com o mapa. Clicar na lista centraliza o pin, e clicar no pin destaca o item na lista.
- **Card do lugar:** nome, bairro, tema, preço, descrição, "Abrir no Google Maps" (link de busca por nome + cidade) e os botões da Fase 3.
- Estado dos filtros refletido na URL, para dar para compartilhar uma visão filtrada.

### Fase 3 — Visitados e favoritos
- Botões "Visitei" e "Favorito" no card e na lista.
- Persistência em `localStorage`, com fallback silencioso se estiver indisponível.
- Filtros "só favoritos", "esconder visitados" e "só visitados". Pin visitado com aparência esmaecida ou com check.
- Contador de progresso por tema e por bairro (ex.: "Museus 3/17").
- Exportar e importar um JSON com visitados e favoritos, para backup e para passar de um aparelho para outro.

### Fase 4 — Casa e tempo de bike
- Definir "casa" buscando um endereço (Nominatim) ou clicando no mapa. Salvar em `localStorage` e mostrar um marcador próprio.
- Para cada lugar: distância e tempo estimado de bike, calculados offline (distância em linha reta × 1,3, a 15 km/h). Deixe claro na interface que é uma estimativa.
- Ordenar a lista por proximidade de casa e filtrar por raio de minutos (ex.: até 10, 20 ou 30 min).
- Botão "Rota de bike" abrindo o Google Maps com `travelmode=bicycling` (deep link, sem API).

### Fase 5 — Visual e acabamento
- Antes de estilizar, proponha 2 ou 3 direções visuais (paleta, tipografia, tratamento do mapa, ícones), cada uma com uma tela de referência simples. Espere a escolha.
- Mobile first: o uso principal é no celular, na rua.
- Contraste acessível, alvos de toque de pelo menos 44 px, e cor nunca como único código (cor + ícone).
- Tela vazia amigável quando os filtros não retornam nada.

### Fase 6 — Deploy
- Build estático com instruções no README para publicar no GitHub Pages ou na Vercel.

## Fora de escopo (por agora)
Backend, contas de usuário, sincronização automática entre aparelhos, avaliações ou fotos de APIs de terceiros, e polígonos de bairros. Estes últimos podem entrar depois, com os dados abertos da prefeitura (data.amsterdam.nl).

## Critérios de pronto
- Todos os 147 lugares aparecem no mapa, ou constam em `geocode_falhas.csv` com o motivo.
- Filtros, busca, visitados, favoritos e casa funcionam no celular e sobrevivem a um recarregamento da página.
- Nenhuma chave de API no código.
- Atribuição do OpenStreetMap (e da CARTO, se usada) visível no mapa.

## Forma de trabalho
- Uma fase por vez. Ao fim de cada uma, mostre o resultado e o que ficou pendente.
- Pergunte antes de decisões de produto não cobertas aqui. Decisões técnicas pequenas, resolva e registre no README.
