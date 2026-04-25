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
import { sedesResultado } from "../data/mockData";

const chartData = [
    { dia: "01 May", ingresos: 10, egresos: 6 },
    { dia: "08 May", ingresos: 21, egresos: 12 },
    { dia: "15 May", ingresos: 34, egresos: 22 },
    { dia: "22 May", ingresos: 33, egresos: 23 },
    { dia: "29 May", ingresos: 42, egresos: 30 },
];

const formatMoney = (value) =>
    `$ ${value.toLocaleString("es-AR")}`;

function filterBySede(items, selectedSede) {
    if (!selectedSede || selectedSede === "Todas las sedes") return items;

    return items.filter((item) => item.sede === selectedSede);
}

export default function Dashboard({ selectedSede }) {

    const sedesFiltradas = filterBySede(sedesResultado, selectedSede);

    const rows = sedesFiltradas.map((item) => ({
        sede: item.sede,
        ingresos: formatMoney(item.ingresos),
        egresos: formatMoney(item.egresos),
        resultado: formatMoney(item.resultado),
        rentabilidad: `${Math.round((item.resultado / item.ingresos) * 100)}%`,
    }));

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
                    value="$ 45.230.000"
                    detail="+12.5% vs período anterior"
                    icon={<ArrowDownCircle size={22} />}
                />
                <StatCard
                    title="Egresos del período"
                    value="$ 28.650.000"
                    detail="+8.3% vs período anterior"
                    icon={<ArrowUpCircle size={22} />}
                />
                <StatCard
                    title="Resultado del período"
                    value="$ 16.580.000"
                    detail="+20.1% vs período anterior"
                    icon={<TrendingUp size={22} />}
                />
                <StatCard
                    title="Resultado acumulado"
                    value="$ 78.950.000"
                    detail="+18.7% anual"
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
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="ingresos" stroke="#019cc5" strokeWidth={3} />
                            <Line type="monotone" dataKey="egresos" stroke="#3a73b9" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="panel">
                    <h3>Resultado por sede</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={sedesFiltradas}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="sede" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="resultado" fill="#3eb9b1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="content-grid">
                <div className="panel wide">
                    <h3>Resumen por sede</h3>
                    <DataTable
                        columns={["Sede", "Ingresos", "Egresos", "Resultado", "Rentabilidad"]}
                        rows={rows}
                    />
                </div>

                <div className="panel">
                    <h3>Alertas</h3>

                    <div className="alert-item danger">
                        <strong>5 facturas vencidas</strong>
                        <span>Total: $ 2.650.000</span>
                    </div>

                    <div className="alert-item warning">
                        <strong>3 conciliaciones pendientes</strong>
                        <span>Total: $ 1.120.000</span>
                    </div>

                    <div className="alert-item info">
                        <strong>2 cuentas por cobrar vencidas</strong>
                        <span>Total: $ 980.000</span>
                    </div>
                </div>
            </div>
        </section>
    );
}