import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Eye, CheckCircle, AlertTriangle } from "lucide-react";
import Modal from "../components/Modal";
import { getSedes } from "../services/sedeService";
import {
  createCuentaCorriente,
  deleteCuentaCorriente,
  getCuentasCorrientes,
  marcarCuentaAplicada,
} from "../services/cuentaCorrienteService";

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

const formatMoney = (value) =>
  `$ ${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

const formatDate = (isoString) => {
  if (!isoString) return "-";
  const [year, month, day] = isoString.split("-");
  return `${day}/${month}/${year}`;
};

const emptyForm = {
  fecha: new Date().toISOString().split("T")[0],
  entidad: "",
  tipoEntidad: "Obra social",
  sedeId: "",
  comprobante: "Factura A",
  numero: "",
  concepto: "",
  importe: "",
  vencimiento: "",
  estado: "Pendiente",
};

export default function CuentasCorrientes({ selectedSede }) {
  const [movimientos, setMovimientos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [movimientosData, sedesData] = await Promise.all([
        getCuentasCorrientes(),
        getSedes(),
      ]);

      setMovimientos(movimientosData);
      setSedes(sedesData);

      setForm((prev) => ({
        ...prev,
        sedeId: prev.sedeId || sedesData[0]?.id || "",
      }));
    } catch (error) {
      console.error("Error cargando cuentas corrientes:", error);
      alert(error.message || "No se pudieron cargar las cuentas corrientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const movimientosPorSede = filterBySede(movimientos, selectedSede);

  const getImpactoContable = (tipoEntidad, comprobante, importe) => {
    const esProveedor = tipoEntidad === "Proveedor";
    const esSumaDeuda = [
      "Factura",
      "Factura A",
      "Factura B",
      "Factura C",
      "Nota de Débito",
    ].includes(comprobante);

    let debe = 0;
    let haber = 0;

    if (esProveedor) {
      if (esSumaDeuda) haber = importe;
      else debe = importe;
    } else {
      if (esSumaDeuda) debe = importe;
      else haber = importe;
    }

    return { debe, haber };
  };

  const movimientosFiltrados = useMemo(() => {
    return movimientosPorSede.filter((item) => {
      const matchSearch =
        item.entidad.toLowerCase().includes(search.toLowerCase()) ||
        item.concepto.toLowerCase().includes(search.toLowerCase()) ||
        item.sede.toLowerCase().includes(search.toLowerCase());

      const matchTipo =
        tipoFiltro === "Todos" || item.tipoEntidad === tipoFiltro;

      return matchSearch && matchTipo;
    });
  }, [movimientosPorSede, search, tipoFiltro]);

  const resumenPorEntidad = useMemo(() => {
    const resumen = {};
    const hoy = new Date().toISOString().split("T")[0];

    movimientosPorSede.forEach((mov) => {
      const key = `${mov.entidad}-${mov.tipoEntidad}-${mov.sede}`;

      if (!resumen[key]) {
        resumen[key] = {
          entidad: mov.entidad,
          tipoEntidad: mov.tipoEntidad,
          sede: mov.sede,
          saldoTotal: 0,
          deudaVencida: 0,
        };
      }

      const { debe, haber } = getImpactoContable(
        mov.tipoEntidad,
        mov.comprobante,
        mov.importe
      );

      const impactoSaldo =
        mov.tipoEntidad === "Proveedor" ? haber - debe : debe - haber;

      resumen[key].saldoTotal += impactoSaldo;

      if (mov.estado === "Pendiente" && mov.vencimiento && mov.vencimiento < hoy) {
        resumen[key].deudaVencida += impactoSaldo;
      }
    });

    return Object.values(resumen);
  }, [movimientosPorSede]);

  const totalCuentasACobrar = resumenPorEntidad
    .filter((item) => item.tipoEntidad !== "Proveedor")
    .reduce((acc, item) => acc + Math.max(0, item.saldoTotal), 0);

  const totalCuentasAPagar = resumenPorEntidad
    .filter((item) => item.tipoEntidad === "Proveedor")
    .reduce((acc, item) => acc + Math.max(0, item.saldoTotal), 0);

  const deudaTotalVencida = resumenPorEntidad.reduce(
    (acc, item) => acc + item.deudaVencida,
    0
  );

  const detalleLibroMayor = useMemo(() => {
    if (!selectedEntidad) return [];

    const movimientosEntidad = movimientosPorSede
      .filter((m) => m.entidad === selectedEntidad)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    let saldoAcumulado = 0;

    return movimientosEntidad.map((mov) => {
      const { debe, haber } = getImpactoContable(
        mov.tipoEntidad,
        mov.comprobante,
        mov.importe
      );

      const impacto =
        mov.tipoEntidad === "Proveedor" ? haber - debe : debe - haber;

      saldoAcumulado += impacto;

      return {
        ...mov,
        debe,
        haber,
        saldoAcumulado,
      };
    });
  }, [movimientosPorSede, selectedEntidad]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await createCuentaCorriente(form);
      await loadData();

      setForm({
        ...emptyForm,
        sedeId: sedes[0]?.id || "",
      });

      setModal(null);
    } catch (error) {
      console.error("Error creando cuenta corriente:", error);
      alert(error.message || "No se pudo registrar el comprobante.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("¿Eliminar este comprobante?");
    if (!confirmDelete) return;

    try {
      await deleteCuentaCorriente(id);
      await loadData();
    } catch (error) {
      console.error("Error eliminando cuenta corriente:", error);
      alert(error.message || "No se pudo eliminar el comprobante.");
    }
  }

  async function handleAplicar(id) {
    try {
      await marcarCuentaAplicada(id);
      await loadData();
    } catch (error) {
      console.error("Error aplicando comprobante:", error);
      alert(error.message || "No se pudo marcar como aplicado.");
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Cuentas corrientes</h2>
          <p>Gestión avanzada de saldos y libro mayor por entidad.</p>
        </div>

        <button className="primary-button" onClick={() => setModal("nuevo")}>
          <Plus size={16} /> Registrar Comprobante
        </button>
      </div>

      <div className="stats-grid small">
        <div className="stat-card">
          <div>
            <span>A Cobrar (Obras Sociales/Pacientes)</span>
            <strong>{formatMoney(totalCuentasACobrar)}</strong>
            <small>Activo exigible</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>A Pagar (Proveedores)</span>
            <strong>{formatMoney(totalCuentasAPagar)}</strong>
            <small>Pasivo exigible</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Riesgo / Deuda Vencida Global</span>
            <strong style={{ color: deudaTotalVencida > 0 ? "#ef4444" : "inherit" }}>
              {formatMoney(deudaTotalVencida)}
            </strong>
            <small>Comprobantes fuera de término</small>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por entidad, sede o concepto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>Obra social</option>
          <option>Prepaga</option>
          <option>Proveedor</option>
          <option>Particular</option>
        </select>
      </div>

      <div className="panel">
        <h3>Resumen de Saldos por Entidad</h3>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Entidad</th>
                <th>Tipo</th>
                <th>Sede</th>
                <th>Saldo Total</th>
                <th>Deuda Vencida</th>
                <th>Libro Mayor</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6">Cargando cuentas corrientes...</td>
                </tr>
              )}

              {!loading &&
                resumenPorEntidad.map((item) => (
                  <tr key={`${item.entidad}-${item.tipoEntidad}-${item.sede}`}>
                    <td>
                      <strong>{item.entidad}</strong>
                    </td>
                    <td>{item.tipoEntidad}</td>
                    <td>{item.sede}</td>
                    <td>
                      <strong
                        style={{
                          color:
                            item.tipoEntidad === "Proveedor" && item.saldoTotal > 0
                              ? "#ef4444"
                              : "#10b981",
                        }}
                      >
                        {formatMoney(item.saldoTotal)}
                      </strong>
                    </td>
                    <td>
                      {item.deudaVencida > 0 ? (
                        <span
                          style={{
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <AlertTriangle size={14} />{" "}
                          {formatMoney(item.deudaVencida)}
                        </span>
                      ) : (
                        <span style={{ color: "#6b7280" }}>Al día</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                        onClick={() => {
                          setSelectedEntidad(item.entidad);
                          setModal("mayor");
                        }}
                      >
                        <Eye size={14} style={{ marginRight: 4 }} /> Ver Mayor
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && resumenPorEntidad.length === 0 && (
                <tr>
                  <td colSpan="6">No hay movimientos de cuenta corriente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "nuevo" && (
        <Modal title="Registrar nuevo comprobante" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Fecha de emisión
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </label>

            <label>
              Entidad
              <input
                required
                placeholder="Ej: OSDE, Edenor..."
                value={form.entidad}
                onChange={(e) => setForm({ ...form, entidad: e.target.value })}
              />
            </label>

            <label>
              Clasificación
              <select
                value={form.tipoEntidad}
                onChange={(e) =>
                  setForm({ ...form, tipoEntidad: e.target.value })
                }
              >
                <option>Obra social</option>
                <option>Prepaga</option>
                <option>Proveedor</option>
                <option>Particular</option>
              </select>
            </label>

            <label>
              Sede
              <select
                value={form.sedeId}
                onChange={(e) => setForm({ ...form, sedeId: e.target.value })}
                required
              >
                {sedes.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tipo de Comprobante
              <select
                value={form.comprobante}
                onChange={(e) =>
                  setForm({ ...form, comprobante: e.target.value })
                }
              >
                <option>Factura A</option>
                <option>Factura B</option>
                <option>Factura C</option>
                <option>Recibo</option>
                <option>Nota de Crédito</option>
                <option>Nota de Débito</option>
              </select>
            </label>

            <label>
              Número de Comprobante
              <input
                placeholder="Ej: 0001-00004562"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </label>

            <label>
              Importe Total
              <input
                type="number"
                step="0.01"
                required
                value={form.importe}
                onChange={(e) => setForm({ ...form, importe: e.target.value })}
              />
            </label>

            <label>
              Fecha de Vencimiento
              <input
                type="date"
                value={form.vencimiento}
                onChange={(e) =>
                  setForm({ ...form, vencimiento: e.target.value })
                }
              />
            </label>

            <label className="full">
              Concepto / Detalle
              <input
                required
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              />
            </label>

            <div className="modal-actions" style={{ gridColumn: "1 / -1" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Registrando..." : "Registrar en Cuenta"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "mayor" && (
        <Modal title={`Libro Mayor: ${selectedEntidad}`} onClose={() => setModal(null)}>
          <div
            className="table-card"
            style={{ overflowX: "auto", margin: "0 -10px", padding: "0 10px" }}
          >
            <table style={{ minWidth: "850px", width: "100%" }}>
              <thead style={{ backgroundColor: "#f3f4f6" }}>
                <tr>
                  <th>Fecha</th>
                  <th>Comprobante</th>
                  <th>Concepto</th>
                  <th>Vencimiento</th>
                  <th style={{ textAlign: "right" }}>Debe</th>
                  <th style={{ textAlign: "right" }}>Haber</th>
                  <th style={{ textAlign: "right", borderLeft: "2px solid #e5e7eb" }}>
                    Saldo Acum.
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {detalleLibroMayor.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(item.fecha)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <strong>{item.comprobante}</strong>
                      <br />
                      <small style={{ color: "#6b7280" }}>{item.numero}</small>
                    </td>
                    <td>{item.concepto}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {item.estado === "Pendiente" &&
                      item.vencimiento &&
                      item.vencimiento < new Date().toISOString().split("T")[0] ? (
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                          {formatDate(item.vencimiento)} (Vencido)
                        </span>
                      ) : (
                        formatDate(item.vencimiento)
                      )}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {item.debe > 0 ? formatMoney(item.debe) : "-"}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {item.haber > 0 ? formatMoney(item.haber) : "-"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        borderLeft: "2px solid #e5e7eb",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatMoney(item.saldoAcumulado)}
                    </td>
                    <td>
                      <div className="table-actions">
                        {item.estado === "Pendiente" && (
                          <button onClick={() => handleAplicar(item.id)}>
                            <CheckCircle size={16} />
                          </button>
                        )}

                        <button onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {detalleLibroMayor.length === 0 && (
                  <tr>
                    <td colSpan="8">No hay movimientos para esta entidad.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </section>
  );
}