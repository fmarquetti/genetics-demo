import { useEffect, useMemo, useState } from "react";
import { Upload, GitCompare, Plus, Trash2, CheckCircle } from "lucide-react";
import Modal from "../components/Modal";
import { getSedes } from "../services/sedeService";
import {
  conciliarMovimientoBancario,
  conciliarMovimientosPendientes,
  createMovimientoBancario,
  deleteMovimientoBancario,
  getMovimientosBancarios,
} from "../services/bancoService";

import {
  createCuentaBancaria,
  getCuentasBancarias,
} from "../services/cuentaBancariaService";

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((item) => item.sede === selectedSede || item.sede === "Todas");
}

const formatMoney = (value) => `$ ${Number(value).toLocaleString("es-AR")}`;

const emptyForm = {
  fecha: "",
  sedeId: "",
  cuenta: "",
  tipo: "Ingreso",
  descripcion: "",
  importe: "",
  origen: "Carga manual",
  estado: "Pendiente",
};

export default function Bancos({ selectedSede }) {
  const [movimientos, setMovimientos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cuentas, setCuentas] = useState([]);
  const [cuentaForm, setCuentaForm] = useState({
    nombre: "",
    tipo: "Banco",
    sedeId: "",
  });

  async function loadData() {
    setLoading(true);

    try {
      const [movimientosData, sedesData, cuentasData] = await Promise.all([
        getMovimientosBancarios(),
        getSedes(),
        getCuentasBancarias(),
      ]);

      setMovimientos(movimientosData);
      setSedes(sedesData);
      setCuentas(cuentasData);

      setForm((prev) => ({
        ...prev,
        sedeId: prev.sedeId || sedesData[0]?.id || "",
      }));
    } catch (error) {
      console.error("Error cargando bancos:", error);
      alert(error.message || "No se pudieron cargar los movimientos bancarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const movimientosPorSede = filterBySede(movimientos, selectedSede);

  const movimientosFiltrados = useMemo(() => {
    return movimientosPorSede.filter((mov) => {
      const searchValue = search.toLowerCase();

      const matchSearch =
        mov.cuenta.toLowerCase().includes(searchValue) ||
        mov.descripcion.toLowerCase().includes(searchValue) ||
        mov.origen.toLowerCase().includes(searchValue) ||
        mov.sede.toLowerCase().includes(searchValue);

      const matchEstado = estadoFiltro === "Todos" || mov.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [movimientosPorSede, search, estadoFiltro]);

  const totalIngresos = movimientosPorSede
    .filter((m) => m.tipo === "Ingreso")
    .reduce((acc, m) => acc + Number(m.importe), 0);

  const totalEgresos = movimientosPorSede
    .filter((m) => m.tipo === "Egreso")
    .reduce((acc, m) => acc + Number(m.importe), 0);

  const pendientes = movimientosPorSede.filter(
    (m) => m.estado !== "Conciliado"
  ).length;

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await createMovimientoBancario(form);
      await loadData();

      setForm({
        ...emptyForm,
        sedeId: sedes[0]?.id || "",
      });

      setModal(null);
    } catch (error) {
      console.error("Error creando movimiento:", error);
      alert(error.message || "No se pudo crear el movimiento bancario.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImportarExtracto() {
    alert("Importación de extractos pendiente. Por ahora la carga es manual.");
  }

  async function handleConciliar() {
    const confirmConciliar = window.confirm(
      "¿Marcar todos los movimientos pendientes como conciliados?"
    );

    if (!confirmConciliar) return;

    try {
      await conciliarMovimientosPendientes();
      await loadData();
    } catch (error) {
      console.error("Error conciliando movimientos:", error);
      alert(error.message || "No se pudieron conciliar los movimientos.");
    }
  }

  async function handleConciliarUno(id) {
    try {
      await conciliarMovimientoBancario(id);
      await loadData();
    } catch (error) {
      console.error("Error conciliando movimiento:", error);
      alert(error.message || "No se pudo conciliar el movimiento.");
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("¿Eliminar este movimiento bancario?");
    if (!confirmDelete) return;

    try {
      await deleteMovimientoBancario(id);
      await loadData();
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
      alert(error.message || "No se pudo eliminar el movimiento.");
    }
  }

  async function handleCreateCuenta(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await createCuentaBancaria(cuentaForm);
      const cuentasData = await getCuentasBancarias();
      setCuentas(cuentasData);

      setCuentaForm({
        nombre: "",
        tipo: "Banco",
        sedeId: "",
      });

      setModal(null);
    } catch (error) {
      console.error("Error creando cuenta:", error);
      alert(error.message || "No se pudo crear la cuenta bancaria.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Bancos y conciliación</h2>
          <p>Registro de cuentas, carga de extractos y conciliación de movimientos.</p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={handleImportarExtracto}>
            <Upload size={16} /> Importar extracto
          </button>

          <button className="secondary-button" onClick={handleConciliar}>
            <GitCompare size={16} /> Conciliar
          </button>

          <button className="primary-button" onClick={() => setModal("nuevo")}>
            <Plus size={16} /> Nuevo movimiento
          </button>

          <button className="secondary-button" onClick={() => setModal("nuevaCuenta")}>
            <Plus size={16} /> Nueva cuenta
          </button>
        </div>
      </div>

      <div className="stats-grid small">
        <div className="stat-card">
          <div>
            <span>Ingresos bancarios</span>
            <strong>{formatMoney(totalIngresos)}</strong>
            <small>Movimientos registrados</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Egresos bancarios</span>
            <strong>{formatMoney(totalEgresos)}</strong>
            <small>Pagos y débitos</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Saldo operativo</span>
            <strong>{formatMoney(totalIngresos - totalEgresos)}</strong>
            <small>Según movimientos cargados</small>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span>Pendientes</span>
            <strong>{pendientes}</strong>
            <small>Requieren revisión</small>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por cuenta, descripción, sede u origen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option>Todos</option>
          <option>Conciliado</option>
          <option>Pendiente</option>
          <option>Movimiento sin identificar</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Sede</th>
              <th>Cuenta</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Importe</th>
              <th>Origen</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="9">Cargando movimientos bancarios...</td>
              </tr>
            )}

            {!loading &&
              movimientosFiltrados.map((mov) => (
                <tr key={mov.id}>
                  <td>{mov.fecha}</td>
                  <td>{mov.sede}</td>
                  <td>{mov.cuenta}</td>
                  <td>{mov.tipo}</td>
                  <td>{mov.descripcion}</td>
                  <td>{formatMoney(mov.importe)}</td>
                  <td>{mov.origen}</td>
                  <td>
                    <span
                      className={`status-badge ${mov.estado
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {mov.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {mov.estado !== "Conciliado" && (
                        <button onClick={() => handleConciliarUno(mov.id)}>
                          <CheckCircle size={16} />
                        </button>
                      )}

                      <button onClick={() => handleDelete(mov.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && movimientosFiltrados.length === 0 && (
              <tr>
                <td colSpan="9">No se encontraron movimientos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "nuevo" && (
        <Modal title="Nuevo movimiento bancario" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Fecha
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
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
              Cuenta
              <select
                required
                value={form.cuenta}
                onChange={(e) => setForm({ ...form, cuenta: e.target.value })}
              >
                <option value="">Seleccionar cuenta</option>
                {cuentas
                  .filter((cuenta) => cuenta.activa)
                  .map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.nombre}>
                      {cuenta.nombre}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Tipo
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option>Ingreso</option>
                <option>Egreso</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                <option>Pendiente</option>
                <option>Conciliado</option>
                <option>Movimiento sin identificar</option>
              </select>
            </label>

            <label>
              Importe
              <input
                type="number"
                required
                value={form.importe}
                onChange={(e) => setForm({ ...form, importe: e.target.value })}
              />
            </label>

            <label className="full">
              Descripción
              <input
                required
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Guardando..." : "Guardar movimiento"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {
        modal === "nuevaCuenta" && (
          <Modal title="Nueva cuenta bancaria" onClose={() => setModal(null)}>
            <form className="form-grid" onSubmit={handleCreateCuenta}>
              <label>
                Nombre de cuenta
                <input
                  required
                  placeholder="Ej: Banco Galicia - CC $"
                  value={cuentaForm.nombre}
                  onChange={(e) =>
                    setCuentaForm({ ...cuentaForm, nombre: e.target.value })
                  }
                />
              </label>

              <label>
                Tipo
                <select
                  value={cuentaForm.tipo}
                  onChange={(e) =>
                    setCuentaForm({ ...cuentaForm, tipo: e.target.value })
                  }
                >
                  <option>Banco</option>
                  <option>Billetera virtual</option>
                  <option>Caja</option>
                  <option>Otro</option>
                </select>
              </label>

              <label>
                Sede
                <select
                  value={cuentaForm.sedeId}
                  onChange={(e) =>
                    setCuentaForm({ ...cuentaForm, sedeId: e.target.value })
                  }
                >
                  <option value="">Todas las sedes</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancelar
                </button>

                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Guardando..." : "Crear cuenta"}
                </button>
              </div>
            </form>
          </Modal>
        )
      }
    </section>
  );
}