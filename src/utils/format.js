export const formatMoney = (value = 0) =>
  `$ ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDate = (fecha) => {
  if (!fecha) return "-";
  const clean = String(fecha).includes("T") ? fecha.split("T")[0] : fecha;
  if (clean.includes("/")) return clean;
  const [year, month, day] = clean.split("-");
  if (!year || !month || !day) return clean;
  return `${day}/${month}/${year}`;
};

export const toDate = (fecha) => {
  if (!fecha) return null;
  const clean = String(fecha).includes("T") ? fecha.split("T")[0] : fecha;
  if (clean.includes("/")) {
    const [day, month, year] = clean.split("/");
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
  return new Date(`${clean}T00:00:00`);
};
