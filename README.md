# ⚽ Quiniela Mundial 2026

Quiniela del Mundial 2026 hecha con **HTML, CSS y JavaScript**, usando **Supabase** (PostgreSQL + Auth + Storage) como base de datos.

## Configuración de Supabase

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **Project Settings → API**, copia la **Project URL** y la **anon public key**.
3. Pégalas en `js/supabaseClient.js`:
   ```js
   const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
   const SUPABASE_ANON_KEY = "tu-anon-key";
   ```
4. Abre el **SQL Editor** del proyecto y ejecuta el contenido de `supabase/schema.sql`. Esto crea:
   - `public.profiles` — usuario, foto de perfil y registro de animaciones de gol mostradas.
   - `public.votes` — pronósticos por usuario y partido (solo `INSERT`/`SELECT`, **sin** `UPDATE`/`DELETE`: los votos quedan fijos para siempre).
   - El bucket de Storage `avatars` (público para lectura, cada usuario sube solo en su propia carpeta).
5. (Opcional) En **Authentication → Settings**, desactiva "Confirm email" si quieres que los usuarios entren inmediatamente tras registrarse.

## Cómo usarla

Abre `index.html` en el navegador, o sírvela localmente:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Funcionalidades

- **Cuentas**: registro con correo, contraseña y **foto de perfil obligatoria** (se sube a Supabase Storage). Log in y log out con Supabase Auth.
- **Cierre de registro**: la creación de cuentas se detiene automáticamente **2 horas antes del partido inaugural** (11 de junio de 2026, 20:00 CDMX, Estadio Azteca).
- **Votación**: cada usuario pronostica el resultado de cada partido (local / empate / visita). El voto se guarda en la tabla `votes`, que **no permite UPDATE ni DELETE** — una vez enviado, queda visible en "Mis Votos" sin poder editarse.
- **Resultados desde internet**: se consultan vía [football-data.org](https://www.football-data.org/) (pon tu API key gratuita en `js/results.js` → `RESULTS_CONFIG.footballDataApiKey`) o desde cualquier URL JSON simple (`simpleJsonUrl`).
- **Puntos**: cada acierto vale **1 punto**, calculado comparando `votes` contra los resultados oficiales.
- **Animación de gol**: al hacer log in, si acertaste resultados nuevos aparece una animación de ¡GOOOOL! con el **+N** de puntos ganados (se registra en `profiles.awarded_goals` para no repetirse).
- **Ranking**: tabla de todos los usuarios registrados con su foto de perfil, ordenada por puntos.
- **Campeón**: al terminar el Mundial (19 de julio de 2026), el usuario con más puntos ve una **copa del mundo con fuegos artificiales** y "¡Felicidades + su nombre!".
- **Responsivo**: funciona en móvil, tablet y escritorio.

## Base de datos

Toda la información (cuentas, fotos y votos) se guarda en **Supabase**:
- **Auth**: maneja usuarios, contraseñas (hasheadas) y sesiones.
- **Postgres** (`profiles`, `votes`): perfiles y pronósticos, protegidos con Row Level Security.
- **Storage** (`avatars`): fotos de perfil.

Ya no se usa `localStorage` para datos de usuario.
