// ===== Conexión con Supabase =====
// 1. Crea un proyecto gratuito en https://supabase.com
// 2. Ve a Project Settings → API y copia "Project URL" y "anon public key"
// 3. Pégalos aquí abajo.
// 4. Ejecuta el script supabase/schema.sql en el SQL Editor de tu proyecto
//    para crear las tablas, políticas y el bucket de fotos de perfil.

const SUPABASE_URL = "https://mpnkijcanhlfdsroohlu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbmtpamNhbmhsZmRzcm9vaGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTM0MjUsImV4cCI6MjA5NjY2OTQyNX0.hKdUWo0AXVpfVebQL6aYtmau73-2abhNk8cvbJzU2eo";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
