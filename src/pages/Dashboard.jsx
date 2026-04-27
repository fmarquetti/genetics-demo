import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingUp,
    Wallet,
} from "lucide-react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    ResponsiveContainer,
} from "recharts";

import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";

import { getIngresos } from "../services/ingresoService";
import { getEgresos } from "../services/egresoService";
import { getMovimientosBancarios } from "../services/bancoService";
import { getCuentasCorrientes } from "../services/cuentaCorrienteService";

const formatMoney = (value = 0) =>
    `$ ${Number(value || 0).toLocaleString("es-AR")}`;

const toNumber = (value) => Number(value || 0);

const getSedeName = (item) => item?.sede || "Sin sede";

const getFechaReal = (item) => item?.fechaDb || item?.fecha;

const isSameSede = (item, selectedSede) => {
    if (!selectedSede || selectedSede === "Todas las sedes") return true;
    return getSedeName(item) === selectedSede;
};

const isCurrentMonth = (item) => {
    const fecha = getFechaReal(item);
    if (!fecha) return false;

    const date = new Date(fecha);
    const now = new Date();

    return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
};

const isPending = (estado) => {
    const value = String(estado || "").toLowerCase();
    return !["cobrado", "pagado", "aplicado", "conciliado"].includes(value);
};

const monthLabel = (date) =>
    date.toLocaleDateString("es-AR", {
        month: "short",
        year: "2-digit",
    });

const buildChartData = (ingresos, egresos) => {
    const now = new Date();

    const months = Array.from({ length: 6 }).map((_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

        return {
            key: `${date.getFullYear()}-${date.getMonth()}`,
            dia: monthLabel(date),
            ingresos: 0,
            egresos: 0,
        };
    });

    const map = Object.fromEntries(months.map((m) => [m.key, m]));

    ingresos.forEach((item) => {
        const fecha = getFechaReal(item);
        if (!fecha) return;

        const date = new Date(fecha);
        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (map[key]) {
            map[key].ingresos += toNumber(item.importe);
        }
    });

    egresos.forEach((item) => {
        const fecha = getFechaReal(item);
        if (!fecha) return;

        const date = new Date(fecha);
        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (map[key]) {
            map[key].egresos += toNumber(item.importe);
        }
    });

    return months;
};

export default function Dashboard({ selectedSede }) {
    const [ingresos, setIngresos] = useState([]);
    const [egresos, setEgresos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cuentasCorrientes, setCuentasCorrientes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError("");

                const [
                    ingresosData,
                    egresosData,
                    movimientosData,
                    cuentasCorrientesData,
                ] = await Promise.all([
                    getIngresos(),
                    getEgresos(),
                    getMovimientosBancarios(),
                    getCuentasCorrientes(),
                ]);

                setIngresos(ingresosData || []);
                setEgresos(egresosData || []);
                setMovimientos(movimientosData || []);
                setCuentasCorrientes(cuentasCorrientesData || []);
            } catch (err) {
                console.error("Error cargando dashboard:", err);
                setError("No se pudo cargar la información del dashboard.");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    const ingresosFiltrados = useMemo(
        () => ingresos.filter((item) => isSameSede(item, selectedSede)),
        [ingresos, selectedSede]
    );

    const egresosFiltrados = useMemo(
        () => egresos.filter((item) => isSameSede(item, selectedSede)),
        [egresos, selectedSede]
    );

    const movimientosFiltrados = useMemo(
        () => movimientos.filter((item) => isSameSede(item, selectedSede)),
        [movimientos, selectedSede]
    );

    const cuentasFiltradas = useMemo(
        () => cuentasCorrientes.filter((item) => isSameSede(item, selectedSede)),
        [cuentasCorrientes, selectedSede]
    );

    const totalIngresosPeriodo = useMemo(
        () =>
            ingresosFiltrados
                .filter((item) => isCurrentMonth(item))
                .reduce((acc, item) => acc + toNumber(item.importe), 0),
        [ingresosFiltrados]
    );

    const totalEgresosPeriodo = useMemo(
        () =>
            egresosFiltrados
                .filter((item) => isCurrentMonth(item))
                .reduce((acc, item) => acc + toNumber(item.importe), 0),
        [egresosFiltrados]
    );

    const resultadoPeriodo = totalIngresosPeriodo - totalEgresosPeriodo;

    const resultadoAcumulado = useMemo(() => {
        const totalIngresos = ingresosFiltrados.reduce(
            (acc, item) => acc + toNumber(item.importe),
            0
        );

        const totalEgresos = egresosFiltrados.reduce(
            (acc, item) => acc + toNumber(item.importe),
            0
        );

        return totalIngresos - totalEgresos;
    }, [ingresosFiltrados, egresosFiltrados]);

    const chartData = useMemo(
        () => buildChartData(ingresosFiltrados, egresosFiltrados),
        [ingresosFiltrados, egresosFiltrados]
    );

    const sedesResumen = useMemo(() => {
        const map = {};

        ingresosFiltrados.forEach((item) => {
            const sede = getSedeName(item);

            if (!map[sede]) {
                map[sede] = {
                    sede,
                    ingresos: 0,
                    egresos: 0,
                    resultado: 0,
                };
            }

            map[sede].ingresos += toNumber(item.importe);
        });

        egresosFiltrados.forEach((item) => {
            const sede = getSedeName(item);

            if (!map[sede]) {
                map[sede] = {
                    sede,
                    ingresos: 0,
                    egresos: 0,
                    resultado: 0,
                };
            }

            map[sede].egresos += toNumber(item.importe);
        });

        return Object.values(map).map((item) => ({
            ...item,
            resultado: item.ingresos - item.egresos,
        }));
    }, [ingresosFiltrados, egresosFiltrados]);

    const rows = sedesResumen.map((item) => ({
        sede: item.sede,
        ingresos: formatMoney(item.ingresos),
        egresos: formatMoney(item.egresos),
        resultado: formatMoney(item.resultado),
        rentabilidad:
            item.ingresos > 0
                ? `${Math.round((item.resultado / item.ingresos) * 100)}%`
                : "0%",
    }));

    const conciliacionesPendientes = movimientosFiltrados.filter((item) =>
        isPending(item.estado)
    );

    const cuentasVencidas = cuentasFiltradas.filter((item) => {
        if (!item.vencimiento) return false;

        return new Date(item.vencimiento) < new Date() && isPending(item.estado);
    });

    const totalConciliacionesPendientes = conciliacionesPendientes.reduce(
        (acc, item) => acc + toNumber(item.importe),
        0
    );

    const totalCuentasVencidas = cuentasVencidas.reduce(
        (acc, item) => acc + toNumber(item.importe),
        0
    );

    if (loading) {
        return (
            <section className="page">
                <div className="page-header">
                    <div>
                        <h2>Dashboard principal</h2>
                        <p>Cargando información financiera...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="page">
                <div className="page-header">
                    <div>
                        <h2>Dashboard principal</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h2>Dashboard principal</h2>
                    <p>Resumen financiero y operativo del laboratorio.</p>
                </div>

                <button className="primary-button">Exportar reporte</button>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Ingresos del período"
                    value={formatMoney(totalIngresosPeriodo)}
                    detail="Mes actual"
                    icon={<ArrowDownCircle size={22} />}
                />

                <StatCard
                    title="Egresos del período"
                    value={formatMoney(totalEgresosPeriodo)}
                    detail="Mes actual"
                    icon={<ArrowUpCircle size={22} />}
                />

                <StatCard
                    title="Resultado del período"
                    value={formatMoney(resultadoPeriodo)}
                    detail={
                        resultadoPeriodo >= 0
                            ? "Resultado positivo"
                            : "Resultado negativo"
                    }
                    icon={<TrendingUp size={22} />}
                />

                <StatCard
                    title="Resultado acumulado"
                    value={formatMoney(resultadoAcumulado)}
                    detail="Total histórico filtrado"
                    icon={<Wallet size={22} />}
                />
            </div>

            <div className="charts-grid">
                <div className="panel">
                    <h3>Ingresos y egresos</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dia" />
                            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip formatter={(value) => formatMoney(value)} />
                            <Line
                                type="monotone"
                                dataKey="ingresos"
                                stroke="#019cc5"
                                strokeWidth={3}
                            />
                            <Line
                                type="monotone"
                                dataKey="egresos"
                                stroke="#3a73b9"
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="panel">
                    <h3>Resultado por sede</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={sedesResumen}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="sede" />
                            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip formatter={(value) => formatMoney(value)} />
                            <Bar
                                dataKey="resultado"
                                fill="#3eb9b1"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="content-grid">
                <div className="panel wide">
                    <h3>Resumen por sede</h3>

                    <DataTable
                        columns={[
                            "Sede",
                            "Ingresos",
                            "Egresos",
                            "Resultado",
                            "Rentabilidad",
                        ]}
                        rows={rows}
                    />
                </div>

                <div className="panel">
                    <h3>Alertas</h3>

                    <div className="alert-item danger">
                        <strong>{cuentasVencidas.length} cuentas vencidas</strong>
                        <span>Total: {formatMoney(totalCuentasVencidas)}</span>
                    </div>

                    <div className="alert-item warning">
                        <strong>
                            {conciliacionesPendientes.length} conciliaciones pendientes
                        </strong>
                        <span>Total: {formatMoney(totalConciliacionesPendientes)}</span>
                    </div>

                    <div className="alert-item info">
                        <strong>
                            {cuentasFiltradas.length} registros en cuentas corrientes
                        </strong>
                        <span>Control operativo general</span>
                    </div>
                </div>
            </div>
        </section>
    );
}