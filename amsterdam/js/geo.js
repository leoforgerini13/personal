// Distância e tempo de bike estimados offline, e links do Google Maps.

export const FATOR_ROTA = 1.3; // linha reta → caminho real (aprox.)
export const VELOCIDADE_KMH = 15;
export const NOTA_ESTIMATIVA = "Estimativa: distância em linha reta × 1,3, a 15 km/h.";

export function distanciaKm(a, b) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** { km, min } de bike entre casa e lugar, ou null se faltar coordenada. */
export function bike(casa, lugar) {
  if (!casa || !lugar.temCoord) return null;
  const km = distanciaKm(casa, lugar) * FATOR_ROTA;
  return { km, min: (km / VELOCIDADE_KMH) * 60 };
}

const fmt1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function formatarKm(km) {
  return km < 1 ? `${Math.round(km * 100) * 10} m` : `${fmt1.format(km)} km`;
}

export function formatarMin(min) {
  const m = Math.max(1, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function linkGoogleMaps(lugar) {
  const q = `${lugar.nome}, ${lugar.cidade}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function linkRotaBike(casa, lugar) {
  const origem = `${casa.lat.toFixed(6)},${casa.lng.toFixed(6)}`;
  const destino = `${lugar.nome}, ${lugar.cidade}`;
  return (
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${encodeURIComponent(origem)}` +
    `&destination=${encodeURIComponent(destino)}` +
    "&travelmode=bicycling"
  );
}
