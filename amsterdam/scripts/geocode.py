#!/usr/bin/env python3
"""Geocodifica data/lugares.csv via Nominatim (OpenStreetMap).

Saídas:
  data/lugares.json         todos os lugares, com lat/lng (null quando falhou)
  data/geocode_falhas.csv   não encontrados ou suspeitos, com o motivo
  data/geocode_cache.json   respostas do Nominatim, para não repetir consultas

Correções manuais em data/overrides.csv (id,lat,lng) têm prioridade.

Uso:
  python3 scripts/geocode.py              # consulta o que faltar no cache
  python3 scripts/geocode.py --offline    # só usa cache + overrides
  python3 scripts/geocode.py --refresh    # ignora o cache e consulta tudo de novo

Política do Nominatim: no máximo 1 req/s, User-Agent próprio, cache local.
https://operations.osmfoundation.org/policies/nominatim/
Só usa a biblioteca padrão do Python (3.9+).
"""

import argparse
import csv
import datetime as dt
import difflib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
CSV_IN = os.path.join(DATA, "lugares.csv")
OVERRIDES = os.path.join(DATA, "overrides.csv")
CACHE = os.path.join(DATA, "geocode_cache.json")
JSON_OUT = os.path.join(DATA, "lugares.json")
FALHAS_OUT = os.path.join(DATA, "geocode_falhas.csv")

ENDPOINT = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "mapa-amsterdam/1.0 (site pessoal; +https://github.com/leoforgerini13/personal)"
MIN_INTERVAL = 1.1  # segundos entre requisições (limite é 1/s)

# Amsterdam + Amstelveen (inclui Amsterdamse Bos, Zuidoost e Noord).
BBOX = {"west": 4.72, "south": 52.26, "east": 5.08, "north": 52.43}

# Resultados que indicam "caiu numa via ou área genérica".
GENERIC_CATEGORIES = {"highway", "boundary", "place", "landuse"}
GENERIC_ADDRESSTYPES = {
    "road", "street", "suburb", "neighbourhood", "quarter", "city_district",
    "city", "town", "village", "municipality", "borough", "postcode",
}

# Palavras que não ajudam a comparar nomes.
STOPWORDS = {
    "de", "het", "t", "the", "en", "van", "aan", "op", "a", "e", "and",
    "cafe", "restaurant", "bar", "coffeeshop", "museum", "markt", "amsterdam",
    "amstelveen",
}

TEMAS_VIA = {"Canais e pontes"}


# ---------------------------------------------------------------- utilidades

def normalize(text):
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(c for c in text if not unicodedata.combining(c)).lower()
    text = text.replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def tokens(text):
    return {t for t in normalize(text).split() if t not in STOPWORDS and len(t) > 1}


def names_match(expected, found):
    """True se o nome encontrado parece o mesmo lugar que o esperado."""
    a, b = normalize(expected), normalize(found)
    if not a or not b:
        return False
    if a in b or b in a:
        return True
    ta, tb = tokens(expected), tokens(found)
    if ta and tb and ta & tb:
        return True
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.8


def cidade(row):
    return "Amstelveen" if "amstelveen" in normalize(row["endereco_busca"]) else "Amsterdam"


def in_bbox(lat, lng):
    return BBOX["south"] <= lat <= BBOX["north"] and BBOX["west"] <= lng <= BBOX["east"]


def osm_link(lat, lng):
    return f"https://www.openstreetmap.org/?mlat={lat:.6f}&mlon={lng:.6f}#map=18/{lat:.6f}/{lng:.6f}"


def build_queries(row):
    """Consultas em ordem: endereço completo, depois variações mais curtas."""
    q = row["endereco_busca"].strip()
    parts = [p.strip() for p in q.split(",") if p.strip()]
    cidade = parts[-1] if len(parts) > 1 else "Amsterdam"
    out = [q]
    if len(parts) >= 3:
        out.append(f"{parts[0]}, {cidade}")
    out.append(f"{row['nome'].strip()}, {cidade}")
    seen, uniq = set(), []
    for item in out:
        key = normalize(item)
        if key not in seen:
            seen.add(key)
            uniq.append(item)
    return uniq


# ---------------------------------------------------------------- Nominatim

class Nominatim:
    def __init__(self, cache, offline=False, refresh=False, email=None):
        self.cache = cache
        self.offline = offline
        self.refresh = refresh
        self.email = email
        self.last_request = 0.0
        self.requests = 0
        self.refreshed = set()

    def params(self, query):
        p = {
            "q": query,
            "format": "jsonv2",
            "limit": "5",
            "addressdetails": "1",
            "countrycodes": "nl",
            "viewbox": f"{BBOX['west']},{BBOX['north']},{BBOX['east']},{BBOX['south']}",
            "bounded": "1",
            "accept-language": "nl",
        }
        if self.email:
            p["email"] = self.email
        return p

    def search(self, query):
        """Lista de resultados (possivelmente vazia) ou None se offline sem cache."""
        key = query
        if key in self.cache and not (self.refresh and key not in self.refreshed):
            return self.cache[key]["results"]
        if self.offline:
            return None
        results = self._fetch(query)
        self.cache[key] = {
            "results": results,
            "consultado_em": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        }
        self.refreshed.add(key)
        return results

    def _fetch(self, query):
        url = ENDPOINT + "?" + urllib.parse.urlencode(self.params(query))
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        delay = 5
        for attempt in range(4):
            wait = MIN_INTERVAL - (time.monotonic() - self.last_request)
            if wait > 0:
                time.sleep(wait)
            self.last_request = time.monotonic()
            self.requests += 1
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    raw = json.load(resp)
                return [slim(r) for r in raw]
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504) and attempt < 3:
                    print(f"  HTTP {e.code}, tentando de novo em {delay}s", file=sys.stderr)
                    time.sleep(delay)
                    delay *= 2
                    continue
                raise
            except urllib.error.URLError:
                if attempt < 3:
                    time.sleep(delay)
                    delay *= 2
                    continue
                raise
        raise RuntimeError("inalcançável")


def slim(r):
    """Guarda só o que interessa da resposta, para o cache ficar legível."""
    return {
        "lat": float(r["lat"]),
        "lng": float(r["lon"]),
        "name": r.get("name") or "",
        "display_name": r.get("display_name") or "",
        "category": r.get("category") or r.get("class") or "",
        "type": r.get("type") or "",
        "addresstype": r.get("addresstype") or "",
        "osm": f"{r.get('osm_type', '')}/{r.get('osm_id', '')}",
    }


# ---------------------------------------------------------------- avaliação

def is_generic(result):
    return result["category"] in GENERIC_CATEGORIES or result["addresstype"] in GENERIC_ADDRESSTYPES


def assess(row, query, result):
    """Retorna None se o resultado é confiável, ou o motivo da suspeita."""
    if not in_bbox(result["lat"], result["lng"]):
        return "fora da área de Amsterdam/Amstelveen"
    alvo = query.split(",")[0]
    nome_ok = names_match(alvo, result["name"]) or names_match(row["nome"], result["name"])
    if nome_ok:
        return None
    if row["tema"] in TEMAS_VIA:
        return None  # canal ou rua: qualquer ponto da via serve
    if is_generic(result):
        via = result["name"] or result["addresstype"]
        return f"resultado genérico ({via}) para o nome de um estabelecimento"
    return f"nome do resultado diferente ('{result['name'] or '?'}')"


def pick(row, query, results):
    """Escolhe o melhor resultado de uma consulta: (resultado, motivo_suspeita)."""
    if not results:
        return None, None
    avaliados = [(r, assess(row, query, r)) for r in results]
    for r, motivo in avaliados:
        if motivo is None:
            return r, None
    # nenhum confiável: devolve o primeiro dentro da área (ou o primeiro de todos)
    for r, motivo in avaliados:
        if in_bbox(r["lat"], r["lng"]):
            return r, motivo
    return avaliados[0]


def geocode_row(row, nominatim):
    """Retorna dict com lat, lng, status, motivo, consulta, resultado."""
    suspeito = None
    pendente = False
    for query in build_queries(row):
        results = nominatim.search(query)
        if results is None:
            pendente = True
            break
        r, motivo = pick(row, query, results)
        if r is None:
            continue
        if motivo is None:
            return {"lat": r["lat"], "lng": r["lng"], "status": "ok", "motivo": "",
                    "consulta": query, "resultado": r}
        if suspeito is None or not in_bbox(suspeito["lat"], suspeito["lng"]):
            suspeito = {"lat": r["lat"], "lng": r["lng"], "status": "suspeito",
                        "motivo": motivo, "consulta": query, "resultado": r}
    if suspeito:
        if not in_bbox(suspeito["lat"], suspeito["lng"]):
            suspeito.update(lat=None, lng=None, status="falha")
        return suspeito
    if pendente:
        return {"lat": None, "lng": None, "status": "pendente",
                "motivo": "sem cache (rode sem --offline)", "consulta": "", "resultado": None}
    return {"lat": None, "lng": None, "status": "falha",
            "motivo": "não encontrado no Nominatim", "consulta": "", "resultado": None}


# ---------------------------------------------------------------- arquivos

def read_csv(path):
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def read_overrides(path, ids):
    out = {}
    if not os.path.exists(path):
        return out
    for i, row in enumerate(read_csv(path), start=2):
        oid = (row.get("id") or "").strip()
        if not oid or oid.startswith("#"):
            continue
        if oid not in ids:
            print(f"aviso: overrides.csv linha {i}: id desconhecido '{oid}'", file=sys.stderr)
            continue
        try:
            lat, lng = float(row["lat"]), float(row["lng"])
        except (TypeError, ValueError):
            print(f"aviso: overrides.csv linha {i}: lat/lng inválidos", file=sys.stderr)
            continue
        if not in_bbox(lat, lng):
            print(f"aviso: overrides.csv linha {i}: '{oid}' fora da área", file=sys.stderr)
        out[oid] = (lat, lng)
    return out


def load_cache():
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    tmp = CACHE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(cache.items())), f, ensure_ascii=False, indent=1)
        f.write("\n")
    os.replace(tmp, CACHE)


def write_outputs(rows, geo):
    lugares = []
    for row in rows:
        g = geo[row["id"]]
        lugares.append({
            "id": row["id"],
            "nome": row["nome"],
            "bairro": row["bairro"],
            "tema": row["tema"],
            "preco": row["preco"],
            "descricao": row["descricao"],
            "cidade": cidade(row),
            "lat": round(g["lat"], 6) if g["lat"] is not None else None,
            "lng": round(g["lng"], 6) if g["lng"] is not None else None,
            "geo": g["status"],
        })
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump({
            "gerado_em": dt.date.today().isoformat(),
            "fonte": "© OpenStreetMap contributors (Nominatim), ODbL",
            "lugares": lugares,
        }, f, ensure_ascii=False, indent=1)
        f.write("\n")

    campos = ["id", "nome", "endereco_busca", "status", "motivo", "consulta",
              "resultado_nominatim", "lat", "lng", "ver_no_mapa"]
    with open(FALHAS_OUT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        for row in rows:
            g = geo[row["id"]]
            if g["status"] in ("ok", "override"):
                continue
            r = g["resultado"] or {}
            w.writerow({
                "id": row["id"],
                "nome": row["nome"],
                "endereco_busca": row["endereco_busca"],
                "status": g["status"],
                "motivo": g["motivo"],
                "consulta": g["consulta"],
                "resultado_nominatim": r.get("display_name", ""),
                "lat": f"{r['lat']:.6f}" if r else "",
                "lng": f"{r['lng']:.6f}" if r else "",
                "ver_no_mapa": osm_link(r["lat"], r["lng"]) if r else "",
            })


# ---------------------------------------------------------------- main

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--offline", action="store_true", help="não consulta a rede; usa só cache e overrides")
    ap.add_argument("--refresh", action="store_true", help="ignora o cache e consulta tudo de novo")
    ap.add_argument("--email", default=os.environ.get("NOMINATIM_EMAIL"),
                    help="e-mail de contato enviado ao Nominatim (opcional; ou NOMINATIM_EMAIL)")
    args = ap.parse_args(argv)

    rows = read_csv(CSV_IN)
    ids = {r["id"] for r in rows}
    overrides = read_overrides(OVERRIDES, ids)
    cache = load_cache()
    nom = Nominatim(cache, offline=args.offline, refresh=args.refresh, email=args.email)

    geo = {}
    try:
        for i, row in enumerate(rows, start=1):
            if row["id"] in overrides:
                lat, lng = overrides[row["id"]]
                geo[row["id"]] = {"lat": lat, "lng": lng, "status": "override", "motivo": "",
                                  "consulta": "", "resultado": None}
            else:
                geo[row["id"]] = geocode_row(row, nom)
            g = geo[row["id"]]
            if g["status"] != "ok":
                print(f"[{i:3}/{len(rows)}] {g['status']:9} {row['id']}  {g['motivo']}")
    except (urllib.error.URLError, OSError) as e:
        save_cache(cache)
        print(f"\nerro de rede: {e}\ncache salvo; rode de novo para continuar.", file=sys.stderr)
        return 2
    finally:
        if nom.requests:
            save_cache(cache)

    write_outputs(rows, geo)

    contagem = {}
    for g in geo.values():
        contagem[g["status"]] = contagem.get(g["status"], 0) + 1
    no_mapa = sum(1 for g in geo.values() if g["lat"] is not None)
    print(f"\n{len(rows)} lugares: " + ", ".join(f"{k} {v}" for k, v in sorted(contagem.items())))
    print(f"{no_mapa} com coordenadas, {nom.requests} requisições ao Nominatim")
    print(f"-> {os.path.relpath(JSON_OUT, ROOT)}, {os.path.relpath(FALHAS_OUT, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
