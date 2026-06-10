// ===== Quiniela Mundial 2026 — lógica principal =====
// Base de datos: localStorage del navegador.
//   qm_users   → { username: { pass, photo, votes:{matchId:outcome}, awarded:[matchId] } }
//   qm_session → username con sesión activa

const DB = {
  getUsers: () => JSON.parse(localStorage.getItem("qm_users") || "{}"),
  saveUsers: (u) => localStorage.setItem("qm_users", JSON.stringify(u)),
  getSession: () => localStorage.getItem("qm_session"),
  setSession: (u) => localStorage.setItem("qm_session", u),
  clearSession: () => localStorage.removeItem("qm_session"),
};

let currentUser = null;   // username
let latestResults = {};   // { matchId: "home"|"draw"|"away" }

const $ = (id) => document.getElementById(id);

// ---------- Utilidades ----------
function hash(str) {
  // hash simple (no criptográfico) para no guardar la contraseña en claro
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return String(h);
}

function userPoints(user) {
  let pts = 0;
  for (const [mid, vote] of Object.entries(user.votes || {})) {
    if (latestResults[mid] && latestResults[mid] === vote) pts++;
  }
  return pts;
}

function outcomeLabel(match, outcome) {
  if (outcome === "home") return `Gana ${match.home}`;
  if (outcome === "away") return `Gana ${match.away}`;
  return "Empate";
}

function formatKickoff(iso) {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------- Navegación ----------
function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $("view-" + name).classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === name)
  );
  if (name === "matches") renderMatches();
  if (name === "myvotes") renderMyVotes();
  if (name === "ranking") renderRanking();
}

function updateNav() {
  const logged = !!currentUser;
  $("nav-links").classList.toggle("hidden", !logged);
  $("nav-user").classList.toggle("hidden", !logged);
  if (logged) {
    const u = DB.getUsers()[currentUser];
    $("nav-avatar").src = u.photo;
    $("nav-username").textContent = currentUser;
    $("nav-points").textContent = userPoints(u) + " pts";
  }
}

// ---------- Registro / Login ----------
let photoData = null;

function registrationOpen() {
  return Date.now() < REGISTRATION_DEADLINE.getTime();
}

function setupAuth() {
  $("tab-login").onclick = () => switchTab(true);
  $("tab-register").onclick = () => switchTab(false);

  function switchTab(login) {
    $("tab-login").classList.toggle("active", login);
    $("tab-register").classList.toggle("active", !login);
    $("form-login").classList.toggle("hidden", !login);
    $("form-register").classList.toggle("hidden", login);
  }

  // Aviso del cierre de registro (2 h antes del partido inaugural)
  $("register-deadline").textContent = registrationOpen()
    ? "⏳ El registro cierra el " + REGISTRATION_DEADLINE.toLocaleString("es-MX") +
      " (2 horas antes del partido inaugural)."
    : "🚫 El registro está cerrado: el Mundial ya comenzó.";

  $("reg-photo").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      photoData = reader.result;
      $("photo-preview").src = photoData;
      $("photo-preview").classList.remove("hidden");
      $("photo-text").textContent = "✅ Foto cargada (toca para cambiar)";
    };
    reader.readAsDataURL(file);
  };

  $("form-register").onsubmit = (e) => {
    e.preventDefault();
    const err = $("register-error");
    err.textContent = "";
    if (!registrationOpen()) {
      err.textContent = "El registro cerró 2 horas antes del partido inaugural.";
      return;
    }
    const user = $("reg-user").value.trim();
    const pass = $("reg-pass").value;
    if (!photoData) {
      err.textContent = "La foto de perfil es obligatoria. 📷";
      return;
    }
    const users = DB.getUsers();
    if (users[user]) {
      err.textContent = "Ese usuario ya existe.";
      return;
    }
    users[user] = { pass: hash(pass), photo: photoData, votes: {}, awarded: [] };
    DB.saveUsers(users);
    DB.setSession(user);
    currentUser = user;
    enterApp();
  };

  $("form-login").onsubmit = (e) => {
    e.preventDefault();
    const err = $("login-error");
    err.textContent = "";
    const user = $("login-user").value.trim();
    const pass = $("login-pass").value;
    const users = DB.getUsers();
    if (!users[user] || users[user].pass !== hash(pass)) {
      err.textContent = "Usuario o contraseña incorrectos.";
      return;
    }
    DB.setSession(user);
    currentUser = user;
    enterApp();
  };

  $("btn-logout").onclick = () => {
    DB.clearSession();
    currentUser = null;
    updateNav();
    $("view-matches").classList.add("hidden");
    $("view-myvotes").classList.add("hidden");
    $("view-ranking").classList.add("hidden");
    $("view-auth").classList.remove("hidden");
  };

  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.onclick = () => showView(b.dataset.view);
  });
}

// ---------- Partidos y votos ----------
function matchCard(match, { interactive }) {
  const users = DB.getUsers();
  const u = users[currentUser];
  const vote = u.votes[match.id];
  const result = latestResults[match.id];
  const started = Date.now() >= new Date(match.kickoff).getTime();

  const card = document.createElement("div");
  card.className = "match-card";
  if (vote) card.classList.add("voted");
  if (vote && result && vote === result) card.classList.add("correct");

  card.innerHTML = `
    <div class="match-meta">
      <span>Grupo ${match.group}</span>
      <span>${formatKickoff(match.kickoff)}</span>
    </div>
    <div class="match-teams">
      <div class="team"><span class="flag">${match.hf}</span>${match.home}</div>
      <span class="vs">${result ? "" : "VS"}</span>
      <div class="team"><span class="flag">${match.af}</span>${match.away}</div>
    </div>
    <div class="match-meta"><span>🏟️ ${match.stadium}</span></div>
  `;

  if (result) {
    const res = document.createElement("p");
    res.className = "vote-status";
    res.innerHTML = `Resultado oficial: <strong class="score-final">${outcomeLabel(match, result)}</strong>`;
    card.appendChild(res);
  }

  const status = document.createElement("p");
  status.className = "vote-status";

  if (vote) {
    // Voto ya enviado: solo lectura
    status.textContent = "Tu voto: " + outcomeLabel(match, vote);
    if (result) {
      if (vote === result) {
        status.classList.add("hit");
        status.textContent += " — ¡Acertaste! +1 ⚽";
      } else {
        status.classList.add("miss");
        status.textContent += " — Fallaste 😞";
      }
    } else {
      status.classList.add("ok");
      status.textContent += " 🔒";
    }
    card.appendChild(status);
  } else if (interactive && !started && !result) {
    const opts = document.createElement("div");
    opts.className = "vote-options";
    [
      ["home", "Gana " + match.home],
      ["draw", "Empate"],
      ["away", "Gana " + match.away],
    ].forEach(([outcome, label]) => {
      const btn = document.createElement("button");
      btn.className = "vote-btn";
      btn.textContent = label;
      btn.onclick = () => {
        if (!confirm(`¿Confirmas tu voto "${label}"? No podrás cambiarlo.`)) return;
        const all = DB.getUsers();
        all[currentUser].votes[match.id] = outcome;
        DB.saveUsers(all);
        renderMatches();
      };
      opts.appendChild(btn);
    });
    card.appendChild(opts);
  } else {
    status.textContent = started ? "El partido ya comenzó: votación cerrada." : "Sin voto registrado.";
    card.appendChild(status);
  }

  return card;
}

function renderMatches() {
  const list = $("matches-list");
  list.innerHTML = "";
  MATCHES.forEach((m) => list.appendChild(matchCard(m, { interactive: true })));
}

function renderMyVotes() {
  const list = $("myvotes-list");
  list.innerHTML = "";
  const u = DB.getUsers()[currentUser];
  const voted = MATCHES.filter((m) => u.votes[m.id]);
  if (!voted.length) {
    list.innerHTML = '<p class="view-sub">Aún no has votado ningún partido.</p>';
    return;
  }
  voted.forEach((m) => list.appendChild(matchCard(m, { interactive: false })));
}

// ---------- Ranking ----------
function renderRanking() {
  const list = $("ranking-list");
  list.innerHTML = "";
  const users = DB.getUsers();
  const ranked = Object.entries(users)
    .map(([name, u]) => ({ name, photo: u.photo, points: userPoints(u) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  ranked.forEach((r, i) => {
    const li = document.createElement("li");
    li.className = "rank-item" + (r.name === currentUser ? " me" : "");
    const medal = ["🥇", "🥈", "🥉"][i] || i + 1;
    li.innerHTML = `
      <span class="rank-pos ${i === 0 ? "gold" : ""}">${medal}</span>
      <img class="avatar avatar-md" src="${r.photo}" alt="${r.name}" />
      <span class="rank-name">${r.name}</span>
      <span class="rank-points">${r.points} pts</span>
    `;
    list.appendChild(li);
  });
}

// ---------- Animación de gol al iniciar sesión ----------
function checkNewHits() {
  const users = DB.getUsers();
  const u = users[currentUser];
  const newHits = [];
  for (const [mid, vote] of Object.entries(u.votes || {})) {
    if (latestResults[mid] === vote && !(u.awarded || []).includes(mid)) {
      newHits.push(mid);
    }
  }
  if (!newHits.length) return;

  u.awarded = (u.awarded || []).concat(newHits);
  DB.saveUsers(users);

  $("goal-points").textContent = newHits.length;
  const names = newHits
    .map((mid) => { const m = MATCHES.find((x) => x.id === mid); return `${m.home} vs ${m.away}`; })
    .join(" · ");
  $("goal-detail").textContent = "Acertaste: " + names;
  $("goal-overlay").classList.remove("hidden");
}

// ---------- Animación de campeón con fuegos artificiales ----------
function checkChampion() {
  if (Date.now() < WORLD_CUP_END.getTime()) return;
  const users = DB.getUsers();
  const ranked = Object.entries(users)
    .map(([name, u]) => ({ name, points: userPoints(u) }))
    .sort((a, b) => b.points - a.points);
  if (!ranked.length || ranked[0].name !== currentUser || ranked[0].points === 0) return;
  if (ranked.length > 1 && ranked[1].points === ranked[0].points) return; // empate en la cima

  $("champion-name").textContent = currentUser;
  $("champion-overlay").classList.remove("hidden");
  startFireworks();
}

let fwAnimation = null;
function startFireworks() {
  const canvas = $("fireworks");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let particles = [];

  function explode() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.6;
    const hue = Math.random() * 360;
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: `hsl(${hue}, 100%, 60%)`,
      });
    }
  }

  function frame() {
    ctx.fillStyle = "rgba(5, 12, 22, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (Math.random() < 0.06) explode();
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04; // gravedad
      p.life -= 0.012;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    fwAnimation = requestAnimationFrame(frame);
  }
  explode();
  frame();
}

function stopFireworks() {
  if (fwAnimation) cancelAnimationFrame(fwAnimation);
  fwAnimation = null;
}

// ---------- Flujo principal ----------
async function enterApp() {
  $("view-auth").classList.add("hidden");
  latestResults = await fetchResults();
  updateNav();
  showView("matches");
  checkNewHits();
  checkChampion();
}

function init() {
  setupAuth();
  $("goal-close").onclick = () => $("goal-overlay").classList.add("hidden");
  $("champion-close").onclick = () => {
    $("champion-overlay").classList.add("hidden");
    stopFireworks();
  };

  const session = DB.getSession();
  if (session && DB.getUsers()[session]) {
    currentUser = session;
    enterApp();
  }
}

document.addEventListener("DOMContentLoaded", init);
