import { useMemo, useRef, useState } from "react";
import {
    HelpCircle,
    MessageCircle,
    Send,
    X,
    ArrowRight,
    RotateCcw,
} from "lucide-react";
import "./HelpAssistant.css";

const helpTopics = [
    {
        id: "pacientes",
        page: "pacientes",
        label: "Pacientes y estudios",
        title: "Cargar un nuevo paciente",
        keywords: [
            "paciente",
            "pacientes",
            "nuevo paciente",
            "cargar paciente",
            "alta paciente",
            "estudio",
            "estudios",
            "muestra",
            "muestras",
            "orden",
            "analisis",
            "análisis",
        ],
        answer:
            "Para cargar un nuevo paciente, ingresá a “Pacientes y estudios”. Desde esa pantalla podés registrar pacientes, cargar estudios, definir prioridad, actualizar estados y consultar el avance de cada muestra.",
        steps: [
            "Abrí el menú lateral.",
            "Entrá en “Pacientes y estudios”.",
            "Usá el botón de carga o alta disponible en la pantalla.",
            "Completá los datos del paciente, estudio, sede, prioridad y estado.",
            "Guardá el registro.",
        ],
    },
    {
        id: "ingresos",
        page: "ingresos",
        label: "Ingresos",
        title: "Registrar un ingreso",
        keywords: [
            "ingreso",
            "ingresos",
            "cobro",
            "cobros",
            "pago",
            "pagos",
            "factura",
            "facturas",
            "recibo",
            "comprobante",
            "venta",
        ],
        answer:
            "Para registrar un ingreso, ingresá a “Ingresos”. Ahí podés cargar cobros, comprobantes, fecha, sede, concepto, medio de pago e importe.",
        steps: [
            "Entrá en “Ingresos”.",
            "Presioná el botón para agregar un nuevo ingreso.",
            "Completá fecha, sede, concepto, medio de pago e importe.",
            "Adjuntá o vinculá el comprobante si corresponde.",
            "Guardá el movimiento.",
        ],
    },
    {
        id: "egresos",
        page: "egresos",
        label: "Egresos",
        title: "Registrar un egreso",
        keywords: [
            "egreso",
            "egresos",
            "gasto",
            "gastos",
            "proveedor",
            "proveedores",
            "compra",
            "compras",
            "pagar",
            "pago proveedor",
            "factura proveedor",
        ],
        answer:
            "Para registrar un egreso, ingresá a “Egresos”. Desde ahí podés cargar gastos del laboratorio, proveedores, comprobantes, sede asociada, concepto e importe.",
        steps: [
            "Entrá en “Egresos”.",
            "Presioná el botón para agregar un nuevo egreso.",
            "Seleccioná sede, proveedor, fecha y concepto.",
            "Cargá el importe y el estado del comprobante.",
            "Guardá el egreso.",
        ],
    },
    {
        id: "bancos",
        page: "bancos",
        label: "Bancos",
        title: "Consultar bancos y movimientos",
        keywords: [
            "banco",
            "bancos",
            "cuenta bancaria",
            "cuentas bancarias",
            "galicia",
            "nacion",
            "nación",
            "mercado pago",
            "mercadopago",
            "caja diaria",
            "conciliar",
            "conciliacion",
            "conciliación",
        ],
        answer:
            "Para revisar cuentas bancarias o movimientos, ingresá a “Bancos”. Desde esa pantalla podés visualizar cuentas, saldos, movimientos y estados de conciliación.",
        steps: [
            "Entrá en “Bancos”.",
            "Revisá las cuentas disponibles.",
            "Filtrá por sede o cuenta si corresponde.",
            "Controlá movimientos pendientes o conciliados.",
        ],
    },
    {
        id: "cuentas",
        page: "cuentas",
        label: "Cuentas corrientes",
        title: "Consultar cuentas corrientes",
        keywords: [
            "cuenta corriente",
            "cuentas corrientes",
            "saldo",
            "saldos",
            "deuda",
            "deudas",
            "cliente debe",
            "proveedor debe",
            "pendiente de cobro",
            "pendiente de pago",
        ],
        answer:
            "Para revisar saldos o movimientos pendientes, ingresá a “Cuentas corrientes”. Ahí podés consultar el estado financiero asociado a clientes o proveedores.",
        steps: [
            "Entrá en “Cuentas corrientes”.",
            "Buscá el cliente o proveedor.",
            "Revisá saldo, movimientos y estado.",
            "Usá los filtros para acotar la información.",
        ],
    },
    {
        id: "reportes",
        page: "reportes",
        label: "Reportes",
        title: "Generar reportes",
        keywords: [
            "reporte",
            "reportes",
            "informe",
            "informes",
            "excel",
            "pdf",
            "exportar",
            "contabilidad",
            "periodo",
            "período",
            "resumen",
        ],
        answer:
            "Para generar reportes, ingresá a “Reportes”. Podés filtrar por sede, período y tipo de información para exportar datos administrativos o contables.",
        steps: [
            "Entrá en “Reportes”.",
            "Seleccioná sede, fechas y tipo de reporte.",
            "Revisá los datos generados.",
            "Exportá en el formato disponible.",
        ],
    },
    {
        id: "documentos",
        page: "documentos",
        label: "Documentos",
        title: "Gestionar documentos",
        keywords: [
            "documento",
            "documentos",
            "pdf",
            "comprobante",
            "comprobantes",
            "afip",
            "factura afip",
            "importar",
            "validar",
            "archivo",
            "adjuntar",
        ],
        answer:
            "Para cargar o revisar comprobantes, ingresá a “Documentos”. Desde ahí podés importar archivos, revisar información detectada y validar los datos antes de cargarlos al sistema.",
        steps: [
            "Entrá en “Documentos”.",
            "Importá o seleccioná el comprobante.",
            "Revisá los datos detectados.",
            "Validá o corregí manualmente la información.",
            "Confirmá la carga.",
        ],
    },
    {
        id: "sedes",
        page: "sedes",
        label: "Sedes",
        title: "Administrar sedes",
        keywords: [
            "sede",
            "sedes",
            "sucursal",
            "sucursales",
            "centro",
            "norte",
            "sur",
            "pilar",
            "oeste",
            "alta sede",
            "editar sede",
        ],
        answer:
            "Para administrar sedes, ingresá a “Sedes”. Esta sección permite revisar, crear o modificar las sedes operativas del laboratorio.",
        steps: [
            "Entrá en “Sedes”.",
            "Revisá el listado de sedes.",
            "Agregá o editá una sede según corresponda.",
            "Guardá los cambios.",
        ],
    },
    {
        id: "usuarios",
        page: "usuarios",
        label: "Usuarios",
        title: "Crear o administrar usuarios",
        keywords: [
            "usuario",
            "usuarios",
            "crear usuario",
            "nuevo usuario",
            "permisos",
            "rol",
            "roles",
            "administrador",
            "operador",
            "contraseña",
            "acceso",
            "suspendido",
        ],
        answer:
            "Para administrar usuarios, ingresá a “Usuarios”. Desde ahí el administrador puede crear usuarios, asignar rol, definir acceso por sede y controlar permisos.",
        steps: [
            "Entrá en “Usuarios”.",
            "Presioná el botón para agregar un usuario.",
            "Completá nombre, email, rol y estado.",
            "Asigná acceso a una sede o a todas las sedes.",
            "Guardá el usuario.",
        ],
    },
    {
        id: "configuracion",
        page: "configuracion",
        label: "Configuración",
        title: "Configurar el sistema",
        keywords: [
            "configuracion",
            "configuración",
            "ajuste",
            "ajustes",
            "parametro",
            "parámetro",
            "preferencia",
            "sistema",
            "general",
        ],
        answer:
            "Para modificar parámetros generales del sistema, ingresá a “Configuración”. Esta sección concentra ajustes administrativos y preferencias operativas.",
        steps: [
            "Entrá en “Configuración”.",
            "Revisá los parámetros disponibles.",
            "Modificá el valor necesario.",
            "Guardá los cambios.",
        ],
    },
    {
        id: "filtro-sede",
        page: "dashboard",
        label: "Filtro por sede",
        title: "Usar el filtro de sedes",
        keywords: [
            "filtro sede",
            "filtrar sede",
            "todas las sedes",
            "cambiar sede",
            "ver sede",
            "sede seleccionada",
            "administrador sede",
            "acceso sede",
        ],
        answer:
            "El filtro de sedes permite ver información de una sede específica o de todas las sedes. Los administradores pueden alternar entre sedes; los usuarios con acceso limitado solo ven la sede asignada.",
        steps: [
            "Buscá el selector de sede en el encabezado superior.",
            "Seleccioná “Todas las sedes” o una sede específica.",
            "El sistema actualizará los datos visibles según esa selección.",
        ],
    },
    {
        id: "dashboard",
        page: "dashboard",
        label: "Dashboard",
        title: "Usar el panel principal",
        keywords: [
            "dashboard",
            "panel",
            "inicio",
            "indicadores",
            "kpi",
            "graficos",
            "gráficos",
            "resumen",
            "principal",
        ],
        answer:
            "El Dashboard muestra un resumen general del laboratorio: indicadores, movimientos, actividad reciente y métricas principales. También respeta el filtro de sede seleccionado.",
        steps: [
            "Entrá en “Dashboard”.",
            "Revisá los indicadores principales.",
            "Usá el filtro de sede para acotar la información.",
            "Consultá gráficos o alertas si están disponibles.",
        ],
    },
];

const quickActions = [
    "Cargar paciente",
    "Registrar ingreso",
    "Registrar egreso",
    "Crear usuario",
    "Ver reportes",
];

const normalizeText = (text) =>
    text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

const findBestTopic = (question) => {
    const normalizedQuestion = normalizeText(question);

    let bestTopic = null;
    let bestScore = 0;

    helpTopics.forEach((topic) => {
        let score = 0;

        topic.keywords.forEach((keyword) => {
            const normalizedKeyword = normalizeText(keyword);

            if (normalizedQuestion.includes(normalizedKeyword)) {
                score += normalizedKeyword.length > 10 ? 3 : 2;
            } else {
                const keywordParts = normalizedKeyword.split(" ");

                keywordParts.forEach((part) => {
                    if (part.length > 3 && normalizedQuestion.includes(part)) {
                        score += 1;
                    }
                });
            }
        });

        if (score > bestScore) {
            bestScore = score;
            bestTopic = topic;
        }
    });

    return bestScore > 0 ? bestTopic : null;
};

const createBotMessage = (topic) => ({
    id: crypto.randomUUID(),
    sender: "bot",
    topic,
    text: topic
        ? topic.answer
        : "No encontré una respuesta exacta. Probá consultando por: cargar paciente, registrar ingreso, registrar egreso, crear usuario, cambiar sede, documentos o reportes.",
});

export default function HelpAssistant({ activePage, setActivePage }) {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([
        {
            id: crypto.randomUUID(),
            sender: "bot",
            text: "Hola. Soy Tecnew Bot, tu asistente operativo dentro del sistema. Puedo guiarte para cargar pacientes, registrar ingresos o egresos, usar reportes, administrar usuarios y más.",
        },
    ]);

    const inputRef = useRef(null);

    const currentTopic = useMemo(
        () => helpTopics.find((topic) => topic.page === activePage),
        [activePage]
    );

    const sendQuestion = (value = question) => {
        const cleanQuestion = value.trim();

        if (!cleanQuestion) return;

        const topic = findBestTopic(cleanQuestion);

        const userMessage = {
            id: crypto.randomUUID(),
            sender: "user",
            text: cleanQuestion,
        };

        const botMessage = createBotMessage(topic);

        setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
        setQuestion("");

        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        sendQuestion();
    };

    const resetChat = () => {
        setMessages([
            {
                id: crypto.randomUUID(),
                sender: "bot",
                text: "Chat reiniciado. Escribí qué necesitás hacer dentro del sistema y te guío paso a paso.",
            },
        ]);
    };

    const goToPage = (page) => {
        if (!page || !setActivePage) return;
        setActivePage(page);
        setIsOpen(false);
    };

    return (
        <>
            <button
                type="button"
                className="help-bot-button"
                onClick={() => setIsOpen(true)}
                aria-label="Abrir asistente de ayuda"
                title="Asistente Tecnew"
            >
                <span className="help-bot-tooltip">¿Necesitás ayuda?</span>

                <span className="tecnew-bot">
                    <svg
                        viewBox="0 0 120 120"
                        role="img"
                        aria-hidden="true"
                        className="tecnew-bot-svg"
                    >
                        <defs>
                            <linearGradient id="botBodyGradient" x1="20" y1="10" x2="100" y2="110">
                                <stop offset="0%" stopColor="#3eb9b1" />
                                <stop offset="55%" stopColor="#028baf" />
                                <stop offset="100%" stopColor="#3a73b9" />
                            </linearGradient>

                            <linearGradient id="botFaceGradient" x1="30" y1="20" x2="90" y2="90">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#eef7fb" />
                            </linearGradient>
                        </defs>

                        {/* Antena */}
                        <line
                            x1="60"
                            y1="20"
                            x2="60"
                            y2="10"
                            stroke="#071426"
                            strokeWidth="5"
                            strokeLinecap="round"
                        />
                        <circle cx="60" cy="7" r="5" fill="#3eb9b1" />

                        {/* Orejas */}
                        <rect x="16" y="44" width="16" height="28" rx="8" fill="#071426" />
                        <rect x="88" y="44" width="16" height="28" rx="8" fill="#071426" />

                        {/* Cabeza */}
                        <rect
                            x="26"
                            y="24"
                            width="68"
                            height="62"
                            rx="24"
                            fill="url(#botBodyGradient)"
                        />

                        {/* Cara */}
                        <rect
                            x="36"
                            y="36"
                            width="48"
                            height="36"
                            rx="17"
                            fill="url(#botFaceGradient)"
                        />

                        {/* Ojos */}
                        <circle cx="51" cy="54" r="5" fill="#071426" />
                        <circle cx="69" cy="54" r="5" fill="#071426" />

                        {/* Brillo de ojos */}
                        <circle cx="49" cy="52" r="1.5" fill="#ffffff" />
                        <circle cx="67" cy="52" r="1.5" fill="#ffffff" />

                        {/* Sonrisa */}
                        <path
                            d="M52 63 C56 68, 64 68, 68 63"
                            fill="none"
                            stroke="#028baf"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />

                        {/* Cuerpo */}
                        <rect
                            x="34"
                            y="82"
                            width="52"
                            height="28"
                            rx="14"
                            fill="#071426"
                        />

                        {/* Detalle pecho */}
                        <circle cx="60" cy="96" r="6" fill="#3eb9b1" />
                        <path
                            d="M55 96 H65"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />

                        {/* Brazos */}
                        <path
                            d="M34 91 C24 91, 21 84, 21 78"
                            fill="none"
                            stroke="#071426"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        <path
                            d="M86 91 C96 91, 99 84, 99 78"
                            fill="none"
                            stroke="#071426"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <section className="help-assistant">
                    <div className="help-assistant-header">
                        <div className="help-assistant-title">
                            <div className="help-assistant-icon">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <strong>Tecnew Bot</strong>
                                <span>Asistencia operativa dentro del sistema</span>
                            </div>
                        </div>

                        <div className="help-assistant-actions">
                            <button
                                type="button"
                                onClick={resetChat}
                                aria-label="Reiniciar chat"
                                title="Reiniciar chat"
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Cerrar asistente"
                                title="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="help-assistant-body">
                        {currentTopic && (
                            <div className="help-context-card">
                                <span>Estás en</span>
                                <strong>{currentTopic.label}</strong>
                                <small>
                                    Podés preguntar cómo usar esta pantalla o elegir una acción
                                    frecuente.
                                </small>
                            </div>
                        )}

                        <div className="help-quick-actions">
                            {quickActions.map((action) => (
                                <button
                                    type="button"
                                    key={action}
                                    onClick={() => sendQuestion(action)}
                                >
                                    {action}
                                </button>
                            ))}
                        </div>

                        <div className="help-messages">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`help-message ${message.sender}`}
                                >
                                    <p>{message.text}</p>

                                    {message.topic?.steps?.length > 0 && (
                                        <ol>
                                            {message.topic.steps.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                    )}

                                    {message.topic?.page && (
                                        <button
                                            type="button"
                                            className="help-go-button"
                                            onClick={() => goToPage(message.topic.page)}
                                        >
                                            Ir a {message.topic.label}
                                            <ArrowRight size={15} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form className="help-assistant-input" onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder="Ej: ¿Cómo cargo un nuevo paciente?"
                        />
                        <button type="submit" aria-label="Enviar consulta">
                            <Send size={17} />
                        </button>
                    </form>
                </section>
            )}
        </>
    );
}