// ===== Datos del Mundial 2026 =====
// Partido inaugural: 11 de junio de 2026, Estadio Azteca, Ciudad de México.
// kickoff en ISO con zona horaria de CDMX (UTC-6).

const INAUGURAL_KICKOFF = new Date("2026-06-11T20:00:00-06:00");
// El registro se cierra 2 horas antes del partido inaugural
const REGISTRATION_DEADLINE = new Date(INAUGURAL_KICKOFF.getTime() - 2 * 60 * 60 * 1000);
// Final del Mundial: 19 de julio de 2026, MetLife Stadium, Nueva Jersey
const WORLD_CUP_END = new Date("2026-07-19T18:00:00-04:00");

const MATCHES = [
  { id: "m1",  group: "A", home: "México",         away: "Sudáfrica",      hf: "🇲🇽", af: "🇿🇦", stadium: "Estadio Azteca, CDMX",           kickoff: "2026-06-11T20:00:00-06:00" },
  { id: "m2",  group: "A", home: "Corea del Sur",  away: "Jordania",       hf: "🇰🇷", af: "🇯🇴", stadium: "Estadio Akron, Guadalajara",      kickoff: "2026-06-11T17:00:00-06:00" },
  { id: "m3",  group: "B", home: "Canadá",         away: "Italia",         hf: "🇨🇦", af: "🇮🇹", stadium: "BMO Field, Toronto",              kickoff: "2026-06-12T15:00:00-04:00" },
  { id: "m4",  group: "B", away: "Catar",          home: "Suiza",          hf: "🇨🇭", af: "🇶🇦", stadium: "SoFi Stadium, Los Ángeles",       kickoff: "2026-06-12T18:00:00-07:00" },
  { id: "m5",  group: "C", home: "Brasil",         away: "Marruecos",      hf: "🇧🇷", af: "🇲🇦", stadium: "MetLife Stadium, Nueva Jersey",   kickoff: "2026-06-13T15:00:00-04:00" },
  { id: "m6",  group: "C", home: "Croacia",        away: "Ghana",          hf: "🇭🇷", af: "🇬🇭", stadium: "Gillette Stadium, Boston",        kickoff: "2026-06-13T18:00:00-04:00" },
  { id: "m7",  group: "D", home: "Estados Unidos", away: "Paraguay",       hf: "🇺🇸", af: "🇵🇾", stadium: "SoFi Stadium, Los Ángeles",       kickoff: "2026-06-12T21:00:00-07:00" },
  { id: "m8",  group: "D", home: "Australia",      away: "Túnez",          hf: "🇦🇺", af: "🇹🇳", stadium: "Levi's Stadium, San Francisco",   kickoff: "2026-06-13T13:00:00-07:00" },
  { id: "m9",  group: "E", home: "Alemania",       away: "Curazao",        hf: "🇩🇪", af: "🇨🇼", stadium: "NRG Stadium, Houston",            kickoff: "2026-06-14T13:00:00-05:00" },
  { id: "m10", group: "E", home: "Costa de Marfil",away: "Ecuador",        hf: "🇨🇮", af: "🇪🇨", stadium: "Arrowhead Stadium, Kansas City",  kickoff: "2026-06-14T16:00:00-05:00" },
  { id: "m11", group: "F", home: "Países Bajos",   away: "Japón",          hf: "🇳🇱", af: "🇯🇵", stadium: "AT&T Stadium, Dallas",            kickoff: "2026-06-14T19:00:00-05:00" },
  { id: "m12", group: "G", home: "Bélgica",        away: "Egipto",         hf: "🇧🇪", af: "🇪🇬", stadium: "Lumen Field, Seattle",            kickoff: "2026-06-15T13:00:00-07:00" },
  { id: "m13", group: "H", home: "España",         away: "Cabo Verde",     hf: "🇪🇸", af: "🇨🇻", stadium: "Hard Rock Stadium, Miami",        kickoff: "2026-06-15T15:00:00-04:00" },
  { id: "m14", group: "I", home: "Francia",        away: "Senegal",        hf: "🇫🇷", af: "🇸🇳", stadium: "Lincoln Financial Field, Filadelfia", kickoff: "2026-06-16T15:00:00-04:00" },
  { id: "m15", group: "J", home: "Argentina",      away: "Argelia",        hf: "🇦🇷", af: "🇩🇿", stadium: "MetLife Stadium, Nueva Jersey",   kickoff: "2026-06-16T18:00:00-04:00" },
  { id: "m16", group: "K", home: "Inglaterra",     away: "Haití",          hf: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", af: "🇭🇹", stadium: "Mercedes-Benz Stadium, Atlanta", kickoff: "2026-06-17T15:00:00-04:00" },
  { id: "m17", group: "L", home: "Portugal",       away: "Uzbekistán",     hf: "🇵🇹", af: "🇺🇿", stadium: "Estadio BBVA, Monterrey",         kickoff: "2026-06-17T19:00:00-06:00" },
  { id: "m18", group: "L", home: "Colombia",       away: "Noruega",        hf: "🇨🇴", af: "🇳🇴", stadium: "Estadio Azteca, CDMX",            kickoff: "2026-06-18T17:00:00-06:00" },
];
