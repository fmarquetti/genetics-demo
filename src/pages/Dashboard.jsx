import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Banknote,
  Activity,
} from "lucide-react";

import { getIngresos } from "../services/ingresoService";
import { getEgresos } from "../services/egresoService";
import { getMovimientosBancarios } from "../services/bancoService";
import { getCuentasCorrientes } from "../services/cuentaCorrienteService";

const formatMoney = (value = 0) =>
  `$ ${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
  })}`;

function filterBySede(items, selectedSede) {
  if (!selectedSede || selectedSede === "Todas las sedes") return items;
  return items.filter((i) => i.sede === selectedSede || i.sede === "Todas");
}

function isPendiente(estado) {
  const v = String(estado || "").toLowerCase();
  return !["cobrado", "pagado", "conciliado", "aplicado"].includes(v);
}

export default function Dashboard({ selectedSede }) {
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [i, e, b, c] = await Promise.all([
        getIngresos(),
        getEgresos(),
        getMovimientosBancarios(),
        getCuentasCorrientes(),
      ]);

      setIngresos(i || []);
      setEgresos(e || []);
      setBancos(b || []);
      setCuentas(c || []);
    } catch (err) {
      console.error(err);
      alert("Error cargando dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const ingresosFiltrados = useMemo(
    () => filterBySede(ingresos, selectedSede),
    [ingresos, selectedSede]
  );

  const egresosFiltrados = useMemo(
    () => filterBySede(egresos, selectedSede),
    [egresos, selectedSede]
  );

  const bancosFiltrados = useMemo(
    () => filterBySede(bancos, selectedSede),
    [bancos, selectedSede]
  );

  const cuentasFiltradas = useMemo(
    () => filterBySede(cuentas, selectedSede),
    [cuentas, selectedSede]
  );

  // ================= KPIs =================

  const totalIngresos = ingresosFiltrados.reduce(
    (acc, i) => acc + Number(i.importe || 0),
    0
  );

  const totalEgresos = egresosFiltrados.reduce(
    (acc, e) => acc + Number(e.importe || 0),
    0
  );

  const resultado = totalIngresos - totalEgresos;

  const caja = bancosFiltrados.reduce((acc, m) => {
    return m.tipo === "Ingreso"
      ? acc + m.importe
      : acc - m.importe;
  }, 0);

  const aCobrar = cuentasFiltradas
    .filter((c) => c.tipoEntidad !== "Proveedor")
    .reduce((acc, c) => acc + c.importe, 0);

  const aPagar = cuentasFiltradas
    .filter((c) => c.tipoEntidad === "Proveedor")
    .reduce((acc, c) => acc + c.importe, 0);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const deudaVencida = cuentasFiltradas
    .filter((c) => {
      if (!c.vencimiento) return false;
      const v = new Date(c.vencimiento);
      return v < hoy && isPendiente(c.estado);
    })
    .reduce((acc, c) => acc + c.importe, 0);

  // ================= ALERTAS =================

  const alertas = [];

  const pendientesBanco = bancosFiltrados.filter(
    (m) => m.estado !== "Conciliado"
  ).length;

  if (pendientesBanco > 0) {
    alertas.push(`${pendientesBanco} movimientos sin conciliar`);
  }

  if (deudaVencida > 0) {
    alertas.push("Existen deudas vencidas");
  }

  if (resultado < 0) {
    alertas.push("Resultado negativo en el período");
  }

  // ================= RESULTADO POR SEDE =================

  const resultadoSedes = useMemo(() => {
    const map = {};

    ingresos.forEach((i) => {
      const sede = i.sede || "Sin sede";
      if (!map[sede]) map[sede] = { sede, ingresos: 0, egresos: 0 };
      map[sede].ingresos += i.importe;
    });

    egresos.forEach((e) => {
      const sede = e.sede || "Sin sede";
      if (!map[sede]) map[sede] = { sede, ingresos: 0, egresos: 0 };
      map[sede].egresos += e.importe;
    });

    return Object.values(map).map((s) => ({
      ...s,
      resultado: s.ingresos - s.egresos,
    }));
  }, [ingresos, egresos]);

  // ================= UI =================

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen financiero general del sistema</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Resultado</span>
          <strong>{formatMoney(resultado)}</strong>
          <TrendingUp size={20} />
        </div>

        <div className="stat-card">
          <span>Caja</span>
          <strong>{formatMoney(caja)}</strong>
          <Wallet size={20} />
        </div>

        <div className="stat-card">
          <span>A cobrar</span>
          <strong>{formatMoney(aCobrar)}</strong>
          <Banknote size={20} />
        </div>

        <div className="stat-card">
          <span>A pagar</span>
          <strong>{formatMoney(aPagar)}</strong>
          <Banknote size={20} />
        </div>

        <div className="stat-card">
          <span>Deuda vencida</span>
          <strong>{formatMoney(deudaVencida)}</strong>
          <AlertTriangle size={20} />
        </div>
      </div>

      {/* ALERTAS */}
      <div className="panel" style={{ marginTop: 20 }}>
        <h3>Alertas</h3>

        {alertas.length === 0 && (
          <p style={{ color: "#6b7280" }}>Sin alertas</p>
        )}

        {alertas.map((a, i) => (
          <div key={i} className="alert-item warning">
            <Activity size={16} /> {a}
          </div>
        ))}
      </div>

      {/* RESULTADO POR SEDE */}
      <div className="panel" style={{ marginTop: 20 }}>
        <h3>Resultado por sede</h3>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Sede</th>
                <th>Ingresos</th>
                <th>Egresos</th>
                <th>Resultado</th>
              </tr>
            </thead>

            <tbody>
              {resultadoSedes.map((s) => (
                <tr key={s.sede}>
                  <td>{s.sede}</td>
                  <td>{formatMoney(s.ingresos)}</td>
                  <td>{formatMoney(s.egresos)}</td>
                  <td>
                    <strong>{formatMoney(s.resultado)}</strong>
                  </td>
                </tr>
              ))}

              {resultadoSedes.length === 0 && (
                <tr>
                  <td colSpan="4">Sin datos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}