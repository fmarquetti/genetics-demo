import { supabase } from "../lib/supabaseClient";

function formatFecha(fecha) {
  if (!fecha) return "";
  const [yyyy, mm, dd] = fecha.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function mapIngreso(row) {
  return {
    id: row.id,
    fecha: formatFecha(row.fecha),
    fechaDb: row.fecha,
    concepto: row.concepto,
    sociedad: row.sociedad,
    sedeId: row.sede_id,
    sede: row.sedes?.nombre || "Sin sede",
    origen: row.origen,
    importe: Number(row.importe || 0),
    cobro: row.cobro,
    estado: row.estado,
    archivo: row.archivo,
    comprobante: row.comprobante,
    datosFiscales: row.datos_fiscales,
  };
}

export async function getIngresos() {
  const { data, error } = await supabase
    .from("ingresos")
    .select(`
      *,
      sedes (
        id,
        nombre
      )
    `)
    .order("fecha", { ascending: false });

  if (error) throw error;

  return data.map(mapIngreso);
}

export async function createIngreso(form) {
  const { data, error } = await supabase
    .from("ingresos")
    .insert({
      fecha: form.fecha,
      concepto: form.concepto,
      sociedad: form.sociedad,
      sede_id: form.sedeId,
      origen: form.origen,
      importe: Number(form.importe || 0),
      cobro: form.cobro,
      estado: form.estado || "Pendiente",
      archivo: form.archivo || null,
      comprobante: form.comprobante || null,
      datos_fiscales: form.datosFiscales || null,
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

  return mapIngreso(data);
}

export async function deleteIngreso(id) {
  const { error } = await supabase.from("ingresos").delete().eq("id", id);

  if (error) throw error;
}

export async function marcarIngresoCobrado(id) {
  const { error } = await supabase
    .from("ingresos")
    .update({
      estado: "Cobrado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}