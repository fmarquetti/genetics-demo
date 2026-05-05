// ─── Formateo de moneda ────────────────────────────────────────────────────
export const formatMoney = (value = 0) =>
  `$ ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── Formateo de fechas ────────────────────────────────────────────────────

/** DD/MM/YYYY → devuelve "-" si no hay valor */
export const formatDate = (fecha) => {
  if (!fecha) return "-";
  const clean = String(fecha).includes("T") ? fecha.split("T")[0] : fecha;
  if (clean.includes("/")) return clean;
  const [year, month, day] = clean.split("-");
  if (!year || !month || !day) return clean;
  return `${day}/${month}/${year}`;
};

/** Convierte string de fecha (DD/MM/YYYY o YYYY-MM-DD) a objeto Date */
export const toDate = (fecha) => {
  if (!fecha) return null;
  const clean = String(fecha).includes("T") ? fecha.split("T")[0] : fecha;
  if (clean.includes("/")) {
    const [day, month, year] = clean.split("/");
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
  return new Date(`${clean}T00:00:00`);
};

/**
 * Para inputs type="date": recibe cualquier formato y devuelve YYYY-MM-DD.
 * Usado en formularios donde el <input type="date"> necesita ese formato.
 */
export const formatFechaInput = (fecha) => {
  if (!fecha) return "";
  const clean = String(fecha).includes("T") ? fecha.split("T")[0] : fecha;
  if (clean.includes("/")) {
    const [day, month, year] = clean.split("/");
    return `${year}-${month}-${day}`;
  }
  return clean;
};

// ─── Helpers de items financieros ─────────────────────────────────────────

/**
 * Devuelve la fecha "real" de un item: prioriza fechaDb (ISO, para ordenar)
 * sobre fecha (formateada DD/MM/YYYY, para mostrar).
 */
export const getFechaReal = (item) => item?.fechaDb || item?.fecha;

// ─── Sanitización de nombres de archivo ───────────────────────────────────

/**
 * Convierte cualquier string en un nombre de archivo seguro:
 * sin tildes, sin espacios, sin caracteres especiales.
 * Ej: "Ingresos Sede Córdoba" → "Ingresos_Sede_Cordoba"
 */
export const safeFileName = (text) =>
  String(text || "reporte")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_");
    // ─── FILTROS ──────────────────────────────────────────────────────────────────
export const filterBySede = (data, selectedSede) => {
  if (!data || !Array.isArray(data)) return [];
  if (
    !selectedSede ||
    !selectedSede.id ||
    selectedSede.id === "todas" ||
    selectedSede.nombre === "Todas las sedes"
  ) {
    return data;
  }
  return data.filter((item) => String(item.sedeId) === String(selectedSede.id));
};