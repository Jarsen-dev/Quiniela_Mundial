# ⚽ Quiniela Mundial 2026

Quiniela del Mundial 2026 hecha 100% con **HTML, CSS y JavaScript** (sin frameworks ni servidor).

## Cómo usarla

Abre `index.html` en el navegador, o sírvela localmente:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Funcionalidades

- **Cuentas**: registro con **foto de perfil obligatoria**, log in y log out.
- **Cierre de registro**: la creación de cuentas se detiene automáticamente **2 horas antes del partido inaugural** (11 de junio de 2026, 20:00 CDMX, Estadio Azteca).
- **Votación**: cada usuario pronostica el resultado de cada partido (local / empate / visita). Una vez enviado, el voto **no se puede editar** y queda visible en "Mis Votos".
- **Resultados desde internet**: se consultan vía [football-data.org](https://www.football-data.org/) (pon tu API key gratuita en `js/results.js` → `RESULTS_CONFIG.footballDataApiKey`) o desde cualquier URL JSON simple (`simpleJsonUrl`). Como respaldo hay un modo administrador desde la consola: `setResult("m1", "home")`.
- **Puntos**: cada acierto vale **1 punto**.
- **Animación de gol**: al hacer log in, si acertaste resultados nuevos aparece una animación de ¡GOOOOL! con el **+N** de puntos ganados.
- **Ranking**: tabla de todos los usuarios con su foto de perfil, ordenada por puntos.
- **Campeón**: al terminar el Mundial (19 de julio de 2026), el usuario con más puntos ve una **copa del mundo con fuegos artificiales** y "¡Felicidades + su nombre!".
- **Responsivo**: funciona en móvil, tablet y escritorio.

## Base de datos

Se usa `localStorage` del navegador (`qm_users`, `qm_session`, `qm_results_*`): es la opción más simple para un sitio puramente estático. Las contraseñas se guardan con un hash simple y las fotos como base64.
