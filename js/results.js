// ===== Resultados desde internet =====
// Los resultados oficiales se obtienen de internet. Se intenta primero un
// endpoint JSON remoto (configurable) y, si no está disponible o requiere
// API key, se usa el respaldo guardado en localStorage (modo administrador).
//
// Formato esperado del endpoint remoto:
//   { "m1": "home", "m2": "draw", "m3": "away", ... }
// donde el valor es quién ganó el partido: "home" | "draw" | "away".

const RESULTS_CONFIG = {
  // football-data.org expone la Copa del Mundo (competición WC). Si tienes
  // una API key gratuita, colócala aquí y los resultados se leerán en vivo.
  footballDataApiKey: "",
  footballDataUrl: "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
  // Alternativa: cualquier URL que devuelva el JSON simple descrito arriba
  // (por ejemplo un gist de GitHub mantenido por el administrador).
  simpleJsonUrl: "",
};

// Normaliza nombres para emparejar la API con nuestros partidos
function normalizeTeam(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\b(fc|cf)\b/g, "")
    .trim();
}

const TEAM_ALIASES = {
  "south africa": "sudafrica", "korea republic": "corea del sur", "south korea": "corea del sur",
  "canada": "canada", "italy": "italia", "switzerland": "suiza", "qatar": "catar",
  "brazil": "brasil", "morocco": "marruecos", "croatia": "croacia", "ghana": "ghana",
  "united states": "estados unidos", "usa": "estados unidos", "paraguay": "paraguay",
  "australia": "australia", "tunisia": "tunez", "germany": "alemania", "curacao": "curazao",
  "ivory coast": "costa de marfil", "cote d'ivoire": "costa de marfil", "ecuador": "ecuador",
  "netherlands": "paises bajos", "japan": "japon", "belgium": "belgica", "egypt": "egipto",
  "spain": "espana", "cape verde": "cabo verde", "france": "francia", "senegal": "senegal",
  "argentina": "argentina", "algeria": "argelia", "england": "inglaterra", "haiti": "haiti",
  "portugal": "portugal", "uzbekistan": "uzbekistan", "colombia": "colombia",
  "norway": "noruega", "mexico": "mexico", "jordan": "jordania",
};

function apiTeamToLocal(apiName) {
  const n = normalizeTeam(apiName);
  return TEAM_ALIASES[n] || n;
}

async function fetchFromFootballData() {
  const res = await fetch(RESULTS_CONFIG.footballDataUrl, {
    headers: { "X-Auth-Token": RESULTS_CONFIG.footballDataApiKey },
  });
  if (!res.ok) throw new Error("football-data.org respondió " + res.status);
  const data = await res.json();
  const results = {};
  for (const apiMatch of data.matches || []) {
    const home = apiTeamToLocal(apiMatch.homeTeam?.name);
    const away = apiTeamToLocal(apiMatch.awayTeam?.name);
    const local = MATCHES.find(
      (m) => normalizeTeam(m.home) === home && normalizeTeam(m.away) === away
    );
    if (!local) continue;
    const w = apiMatch.score?.winner;
    if (w === "HOME_TEAM") results[local.id] = "home";
    else if (w === "AWAY_TEAM") results[local.id] = "away";
    else if (w === "DRAW") results[local.id] = "draw";
  }
  return results;
}

async function fetchFromSimpleJson() {
  const res = await fetch(RESULTS_CONFIG.simpleJsonUrl);
  if (!res.ok) throw new Error("endpoint JSON respondió " + res.status);
  return await res.json();
}

// Devuelve { matchId: "home" | "draw" | "away" } con todos los resultados conocidos
async function fetchResults() {
  // 1) Intento en vivo desde internet
  try {
    if (RESULTS_CONFIG.footballDataApiKey) {
      const r = await fetchFromFootballData();
      localStorage.setItem("qm_results_cache", JSON.stringify(r));
      return r;
    }
    if (RESULTS_CONFIG.simpleJsonUrl) {
      const r = await fetchFromSimpleJson();
      localStorage.setItem("qm_results_cache", JSON.stringify(r));
      return r;
    }
  } catch (err) {
    console.warn("No se pudieron obtener resultados en línea:", err.message);
  }
  // 2) Caché de la última consulta exitosa
  const cached = localStorage.getItem("qm_results_cache");
  if (cached) return JSON.parse(cached);
  // 3) Resultados cargados manualmente por el administrador
  return JSON.parse(localStorage.getItem("qm_results_admin") || "{}");
}

// Modo administrador (desde la consola del navegador):
//   setResult("m1", "home")  → México ganó el partido inaugural
function setResult(matchId, outcome) {
  if (!["home", "draw", "away"].includes(outcome)) {
    console.error('El resultado debe ser "home", "draw" o "away"');
    return;
  }
  const r = JSON.parse(localStorage.getItem("qm_results_admin") || "{}");
  r[matchId] = outcome;
  localStorage.setItem("qm_results_admin", JSON.stringify(r));
  console.log("Resultado guardado:", matchId, "→", outcome);
}
