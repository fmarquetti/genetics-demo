import { supabase } from "../lib/supabaseClient";

function formatFecha(fecha) {
  if (!fecha) return "";
  const [yyyy, mm, dd] = fecha.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function mapMovimiento(row) {
  return {
    id: row.id,
    fecha: formatFecha(row.fecha),
    fechaDb: row.fecha,
    sedeId: row.sede_id,
    sede: row.sedes?.nombre || "Sin sede",
    cuenta: row.cuenta,
    tipo: row.tipo,
    descripcion: row.descripcion,
    importe: Number(row.importe || 0),
    origen: row.origen,
    estado: row.estado,
  };
}

export async function getMovimientosBancarios() {
  const { data, error } = await supabase
    .from("movimientos_bancarios")
    .select(`
      *,
      sedes (
        id,
        nombre
      )
    `)
    .order("fecha", { ascending: false });

  if (error) throw error;

  return data.map(mapMovimiento);
}

export async function createMovimientoBancario(form) {
  const { data, error } = await supabase
    .from("movimientos_bancarios")
    .insert({
      fecha: form.fecha,
      sede_id: form.sedeId,
      cuenta: form.cuenta,
      tipo: form.tipo,
      descripcion: form.descripcion,
      importe: Number(form.importe || 0),
      origen: form.origen || "Carga manual",
      estado: form.estado || "Pendiente",
    })
    .select(`
      *,
      sedes (
        id,
        nombre
      )
    `)
    .single();

  if (error) throw error;

  return mapMovimiento(data);
}

export async function deleteMovimientoBancario(id) {
  const { error } = await supabase
    .from("movimientos_bancarios")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function conciliarMovimientoBancario(id) {
  const { error } = await supabase
    .from("movimientos_bancarios")
    .update({
      estado: "Conciliado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function conciliarMovimientosPendientes() {
  const { error } = await supabase
    .from("movimientos_bancarios")
    .update({
      estado: "Conciliado",
      updated_at: new Date().toISOString(),
    })
    .eq("estado", "Pendiente");

  if (error) throw error;
}