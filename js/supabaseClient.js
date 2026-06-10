// ===== Conexión con Supabase =====
// 1. Crea un proyecto gratuito en https://supabase.com
// 2. Ve a Project Settings → API y copia "Project URL" y "anon public key"
// 3. Pégalos aquí abajo.
// 4. Ejecuta el script supabase/schema.sql en el SQL Editor de tu proyecto
//    para crear las tablas, políticas y el bucket de fotos de perfil.

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-SUPABASE-ANON-KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
