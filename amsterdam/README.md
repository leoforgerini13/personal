# Mapa de Amsterdam

Site estático pessoal para explorar Amsterdam: 147 lugares curados por tema e bairro, com visitados, favoritos e tempo de bike a partir de casa. O briefing completo está em [`CLAUDE.md`](CLAUDE.md).

## Estado

| Fase | Status |
|---|---|
| 1. Geocodificação | Script pronto e testado; **falta rodar** (ver abaixo) |
| 2. Mapa e filtros | — |
| 3. Visitados e favoritos | — |
| 4. Casa e tempo de bike | — |
| 5. Visual e acabamento | — |
| 6. Deploy | — |

## Estrutura

```
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
