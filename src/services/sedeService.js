import { supabase } from "../lib/supabaseClient";

export async function getSedes() {
  const { data, error } = await supabase
    .from("sedes")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw error;

  return data.map((sede) => ({
    id: sede.id,
    nombre: sede.nombre,
    sede: sede.nombre,
    sociedad: sede.nombre_fantasia,
    cuit: sede.cuit,
    ubicacion: sede.ubicacion,
    direccion: sede.direccion,
    responsable: sede.responsable,
    estado: sede.estado,
  }));
}