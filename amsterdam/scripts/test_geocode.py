"""Testes do geocode.py com respostas simuladas (sem rede).

  python3 -m unittest scripts/test_geocode.py
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geocode as g  # noqa: E402


def res(name, lat=52.37, lng=4.89, category="amenity", addresstype="amenity", display=None):
    return {"lat": lat, "lng": lng, "name": name, "display_name": display or name,
            "category": category, "type": "", "addresstype": addresstype, "osm": "node/1"}


class FakeNominatim(g.Nominatim):
    def __init__(self, respostas):
        super().__init__(cache={})
        self.respostas = respostas
        self.consultas = []

    def _fetch(self, query):
        self.consultas.append(query)
        return self.respostas.get(query, [])


def row(nome, endereco, tema="Bares"):
    return {"id": "x", "nome": nome, "endereco_busca": endereco, "tema": tema}


class TestNomes(unittest.TestCase):
    def test_acentos_e_apostrofos(self):
        self.assertTrue(g.names_match("Café 't Smalle", "Cafe 't Smalle"))
        self.assertTrue(g.names_match("Gollem's Proeflokaal", "Gollem’s Proeflokaal"))

    def test_rua_nao_e_estabelecimento(self):
        self.assertFalse(g.names_match("Vleminckx Sausmeesters", "Voetboogstraat"))

    def test_palavra_generica_nao_basta(self):
        self.assertFalse(g.names_match("Café Hoppe", "Café Luxembourg"))

    def test_consultas(self):
        q = g.build_queries(row("Vleminckx", "Vleminckx Sausmeesters, Voetboogstraat, Amsterdam"))
        self.assertEqual(q, ["Vleminckx Sausmeesters, Voetboogstraat, Amsterdam",
                             "Vleminckx Sausmeesters, Amsterdam", "Vleminckx, Amsterdam"])
        q = g.build_queries(row("Stadshart", "Stadshart Amstelveen"))
        self.assertEqual(q, ["Stadshart Amstelveen", "Stadshart, Amsterdam"])


class TestGeocode(unittest.TestCase):
    def test_ok_direto(self):
        r = row("Café Hoppe", "Café Hoppe, Spui, Amsterdam")
        nom = FakeNominatim({r["endereco_busca"]: [res("Café Hoppe")]})
        out = g.geocode_row(r, nom)
        self.assertEqual(out["status"], "ok")
        self.assertEqual(len(nom.consultas), 1)

    def test_rua_generica_tenta_fallback(self):
        r = row("Vleminckx", "Vleminckx Sausmeesters, Voetboogstraat, Amsterdam")
        nom = FakeNominatim({
            r["endereco_busca"]: [res("Voetboogstraat", category="highway", addresstype="road")],
            "Vleminckx Sausmeesters, Amsterdam": [res("Vleminckx de Sausmeester", lat=52.368)],
        })
        out = g.geocode_row(r, nom)
        self.assertEqual(out["status"], "ok")
        self.assertEqual(out["lat"], 52.368)

    def test_rua_generica_sem_alternativa_fica_suspeito(self):
        r = row("Vleminckx", "Vleminckx Sausmeesters, Voetboogstraat, Amsterdam")
        nom = FakeNominatim({r["endereco_busca"]: [res("Voetboogstraat", category="highway",
                                                       addresstype="road")]})
        out = g.geocode_row(r, nom)
        self.assertEqual(out["status"], "suspeito")
        self.assertIn("genérico", out["motivo"])
        self.assertIsNotNone(out["lat"])

    def test_canal_aceita_via(self):
        r = row("Herengracht", "Herengracht, Amsterdam", tema="Canais e pontes")
        nom = FakeNominatim({r["endereco_busca"]: [res("Herengracht", category="waterway",
                                                       addresstype="waterway")]})
        self.assertEqual(g.geocode_row(r, nom)["status"], "ok")

    def test_rua_de_compras_com_mesmo_nome_ok(self):
        r = row("Haarlemmerdijk", "Haarlemmerdijk, Amsterdam", tema="Lojas e design")
        nom = FakeNominatim({r["endereco_busca"]: [res("Haarlemmerdijk", category="highway",
                                                       addresstype="road")]})
        self.assertEqual(g.geocode_row(r, nom)["status"], "ok")

    def test_fora_da_area_vira_falha(self):
        r = row("Paradiso", "Paradiso, Weteringschans, Amsterdam")
        longe = res("Paradiso", lat=51.9, lng=4.4)
        nom = FakeNominatim({q: [longe] for q in g.build_queries(r)})
        out = g.geocode_row(r, nom)
        self.assertEqual(out["status"], "falha")
        self.assertIsNone(out["lat"])
        self.assertIn("fora da área", out["motivo"])

    def test_nao_encontrado(self):
        out = g.geocode_row(row("Nada", "Nada, Amsterdam"), FakeNominatim({}))
        self.assertEqual(out["status"], "falha")
        self.assertIn("não encontrado", out["motivo"])

    def test_cache_evita_repetir(self):
        r = row("Café Hoppe", "Café Hoppe, Spui, Amsterdam")
        nom = FakeNominatim({r["endereco_busca"]: [res("Café Hoppe")]})
        g.geocode_row(r, nom)
        g.geocode_row(r, nom)
        self.assertEqual(len(nom.consultas), 1)

    def test_offline_sem_cache_fica_pendente(self):
        nom = g.Nominatim(cache={}, offline=True)
        out = g.geocode_row(row("Café Hoppe", "Café Hoppe, Spui, Amsterdam"), nom)
        self.assertEqual(out["status"], "pendente")


if __name__ == "__main__":
    unittest.main()
