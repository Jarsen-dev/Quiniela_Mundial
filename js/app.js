// ===== Quiniela Mundial 2026 — lógica principal =====
// Base de datos: Supabase (PostgreSQL + Auth + Storage).
//   - auth.users / public.profiles → cuentas y fotos de perfil
//   - public.votes                  → pronósticos (insert-only, no editables)
//   - storage bucket "avatars"      → fotos de perfil

let currentUser = null;     // { id, username, photo_url, awarded_goals }
let allProfiles = [];       // [{ id, username, photo_url, awarded_goals }]
let allVotes = [];          // [{ user_id, match_id, choice }]
let myVotes = {};           // { matchId: choice } del usuario actual
let latestResults = {};     // { matchId: "home"|"draw"|"away" }

const $ = (id) => document.getElementById(id);

// ---------- Utilidades ----------
function userPointsFromVotes(userId) {
  let pts = 0;
  for (const v of allVotes) {
    if (v.user_id === userId && latestResults[v.match_id] === v.choice) pts++;
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

// Supabase Auth requiere un correo: lo generamos a partir del usuario,
// ya que la app solo pide nombre de usuario y contraseña.
function usernameToEmail(username) {
  return `${username.toLowerCase()}@quiniela-mundial.local`;
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
    $("nav-avatar").src = currentUser.photo_url;
    $("nav-username").textContent = currentUser.username;
    $("nav-points").textContent = userPointsFromVotes(currentUser.id) + " pts";
  }
}

// ---------- Registro / Login ----------
let photoFile = null;

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
    photoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      $("photo-preview").src = reader.result;
      $("photo-preview").classList.remove("hidden");
      $("photo-text").textContent = "✅ Foto cargada (toca para cambiar)";
    };
    reader.readAsDataURL(file);
  };

  $("form-register").onsubmit = async (e) => {
    e.preventDefault();
    const err = $("register-error");
    err.textContent = "";

    if (!registrationOpen()) {
      err.textContent = "El registro cerró 2 horas antes del partido inaugural.";
      return;
    }
    const username = $("reg-user").value.trim();
    const email = usernameToEmail(username);
    const pass = $("reg-pass").value;
    if (!photoFile) {
      err.textContent = "La foto de perfil es obligatoria. 📷";
      return;
    }

    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      // 1) Verificar que el nombre de usuario no esté en uso
      const { data: existing } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) {
        err.textContent = "Ese nombre de usuario ya existe.";
        return;
      }

      // 2) Crear la cuenta en Supabase Auth
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email, password: pass,
      });
      if (signUpError) { err.textContent = signUpError.message; return; }

      const user = signUpData.user;
      if (!user) {
        err.textContent = "No se pudo crear la cuenta. Intenta de nuevo.";
        return;
      }

      // 3) Subir la foto de perfil al bucket "avatars"
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabaseClient.storage
        .from("avatars")
        .upload(path, photoFile, { upsert: true });
      if (uploadError) { err.textContent = "Error al subir la foto: " + uploadError.message; return; }

      const { data: pub } = supabaseClient.storage.from("avatars").getPublicUrl(path);

      // 4) Crear el perfil
      const { error: profileError } = await supabaseClient.from("profiles").insert({
        id: user.id, username, photo_url: pub.publicUrl,
      });
      if (profileError) { err.textContent = profileError.message; return; }

      // 5) Iniciar sesión (si "Confirm email" está activo en Supabase, no
      //    habrá sesión todavía: pedimos al usuario iniciar sesión manualmente)
      if (signUpData.session) {
        await loadCurrentUser();
        enterApp();
      } else {
        err.style.color = "var(--accent)";
        err.textContent = "Cuenta creada. Ahora inicia sesión con tu usuario y contraseña.";
      }
    } finally {
      submitBtn.disabled = false;
    }
  };

  $("form-login").onsubmit = async (e) => {
    e.preventDefault();
    const err = $("login-error");
    err.textContent = "";
    const username = $("login-user").value.trim();
    const pass = $("login-pass").value;
    const email = usernameToEmail(username);

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (error) { err.textContent = "Usuario o contraseña incorrectos."; return; }

    await loadCurrentUser();
    enterApp();
  };

  $("btn-logout").onclick = async () => {
    await supabaseClient.auth.signOut();
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

// ---------- Carga de datos desde Supabase ----------
async function loadCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { currentUser = null; return; }
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("id, username, photo_url, awarded_goals")
    .eq("id", user.id)
    .single();
  currentUser = profile;
}

async function loadProfiles() {
  const { data } = await supabaseClient
    .from("profiles")
    .select("id, username, photo_url, awarded_goals");
  allProfiles = data || [];
}

async function loadVotes() {
  const { data } = await supabaseClient
    .from("votes")
    .select("user_id, match_id, choice");
  allVotes = data || [];
  myVotes = {};
  for (const v of allVotes) {
    if (v.user_id === currentUser.id) myVotes[v.match_id] = v.choice;
  }
}

// ---------- Partidos y votos ----------
function matchCard(match, { interactive }) {
  const vote = myVotes[match.id];
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
    // Voto ya enviado: solo lectura (la base de datos no permite editarlo)
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
      btn.onclick = async () => {
        if (!confirm(`¿Confirmas tu voto "${label}"? No podrás cambiarlo.`)) return;
        opts.querySelectorAll("button").forEach((b) => (b.disabled = true));
        const { error } = await supabaseClient.from("votes").insert({
          user_id: currentUser.id, match_id: match.id, choice: outcome,
        });
        if (error) {
          alert("No se pudo registrar tu voto: " + error.message);
          opts.querySelectorAll("button").forEach((b) => (b.disabled = false));
          return;
        }
        myVotes[match.id] = outcome;
        allVotes.push({ user_id: currentUser.id, match_id: match.id, choice: outcome });
        renderMatches();
        updateNav();
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
  const voted = MATCHES.filter((m) => myVotes[m.id]);
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
  const ranked = allProfiles
    .map((p) => ({ id: p.id, name: p.username, photo: p.photo_url, points: userPointsFromVotes(p.id) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  ranked.forEach((r, i) => {
    const li = document.createElement("li");
    li.className = "rank-item" + (r.id === currentUser.id ? " me" : "");
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
async function checkNewHits() {
  const awarded = currentUser.awarded_goals || [];
  const newHits = [];
  for (const v of allVotes) {
    if (v.user_id !== currentUser.id) continue;
    if (latestResults[v.match_id] === v.choice && !awarded.includes(v.match_id)) {
      newHits.push(v.match_id);
    }
  }
  if (!newHits.length) return;

  const updatedAwarded = awarded.concat(newHits);
  await supabaseClient
    .from("profiles")
    .update({ awarded_goals: updatedAwarded })
    .eq("id", currentUser.id);
  currentUser.awarded_goals = updatedAwarded;

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
  const ranked = allProfiles
    .map((p) => ({ id: p.id, name: p.username, points: userPointsFromVotes(p.id) }))
    .sort((a, b) => b.points - a.points);
  if (!ranked.length || ranked[0].id !== currentUser.id || ranked[0].points === 0) return;
  if (ranked.length > 1 && ranked[1].points === ranked[0].points) return; // empate en la cima

  $("champion-name").textContent = currentUser.username;
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
  await loadProfiles();
  await loadVotes();
  updateNav();
  showView("matches");
  await checkNewHits();
  checkChampion();
}

async function init() {
  setupAuth();
  $("goal-close").onclick = () => $("goal-overlay").classList.add("hidden");
  $("champion-close").onclick = () => {
    $("champion-overlay").classList.add("hidden");
    stopFireworks();
  };

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    await loadCurrentUser();
    if (currentUser) enterApp();
  }
}

document.addEventListener("DOMContentLoaded", init);
