"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft, ArrowDownToLine, ArrowLeftRight, ArrowRight, ArrowUpRight,
  Bell, Building2, Check, CheckCheck, ChevronDown, CircleHelp, Clock3, Filter,
  Eye, LayoutDashboard, LogOut, MoreHorizontal, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal,
  RefreshCw, Sparkles, WalletCards,
} from "lucide-react";

type Status = "matched" | "pending" | "review";
type DemoRole = "ADMIN" | "ANALYST" | "VIEWER";
type DemoUser = { name: string; initials: string; role: DemoRole; roleLabel: string; description: string };
type Transaction = {
  id: number; date: string; daysAgo: number; name: string; detail: string; initials: string;
  color: string; amount: number; status: Status; category: string;
};

const initialTransactions: Omit<Transaction, "date">[] = [
  { id: 1, daysAgo: 0, name: "Nómina del mes", detail: "NÓMINAS ACME LTDA. · 883104", initials: "NA", color: "mint", amount: 4850000, status: "matched", category: "Personal" },
  { id: 2, daysAgo: 0, name: "Stripe · liquidación", detail: "STRIPE PAYMENTS · ST-92381", initials: "S", color: "lilac", amount: 2184600, status: "matched", category: "Ventas" },
  { id: 3, daysAgo: 1, name: "Arriendo oficina", detail: "INMOBILIARIA NORTE · 004817", initials: "IN", color: "peach", amount: -1280000, status: "pending", category: "Arriendo" },
  { id: 4, daysAgo: 1, name: "Google Workspace", detail: "GOOGLE IRELAND · G-774109", initials: "G", color: "sky", amount: -48400, status: "review", category: "Software" },
  { id: 5, daysAgo: 2, name: "Transferencia recibida", detail: "ESTUDIO LUMEN LTDA. · TR-008821", initials: "EL", color: "yellow", amount: 960000, status: "matched", category: "Ventas" },
  { id: 6, daysAgo: 2, name: "Enel", detail: "ENEL CLIENTES · REC-58021", initials: "E", color: "mint", amount: -186320, status: "pending", category: "Suministros" },
  { id: 7, daysAgo: 3, name: "Amazon Business", detail: "AMAZON EU SARL · 407-29183", initials: "a", color: "peach", amount: -73950, status: "matched", category: "Material" },
  { id: 8, daysAgo: 3, name: "Comisión transferencia", detail: "BANCO DE CHILE · COM-00047", initials: "BC", color: "sky", amount: -3500, status: "review", category: "Comisiones" },
];

const statusLabel: Record<Status, string> = { matched: "Conciliado", pending: "Sin conciliar", review: "Revisar" };
const formatAmount = (amount: number) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(Math.abs(amount));
const chileDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago", year: "numeric", month: "numeric", day: "numeric",
});
const chileShortDateFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago", day: "numeric", month: "short", year: "numeric",
});
const chileLongDateFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago", day: "numeric", month: "long", year: "numeric",
});
const chileMonthYearFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago", month: "long", year: "numeric",
});
const chileMonthFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago", month: "long",
});
const chileTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function formatTransactionDate(now: Date, daysAgo: number) {
  const dateParts = chileDatePartsFormatter.formatToParts(now);
  const year = Number(dateParts.find((part) => part.type === "year")?.value);
  const month = Number(dateParts.find((part) => part.type === "month")?.value);
  const day = Number(dateParts.find((part) => part.type === "day")?.value);
  const date = new Date(Date.UTC(year, month - 1, day - daysAgo, 12));
  return chileShortDateFormatter.format(date).replaceAll(".", "");
}
const helpArticles = [
  { id: "reconcile", title: "Conciliar movimientos", description: "Marca los movimientos que ya coinciden con tus registros.", steps: ["Abre Conciliación desde el menú lateral.", "Revisa los movimientos sin conciliar o por revisar.", "Pulsa Conciliar cuando el importe y la referencia coincidan."], action: "Ir a conciliación" },
  { id: "import", title: "Importar un extracto", description: "Carga un archivo del banco para revisar nuevos movimientos.", steps: ["Abre Conciliación.", "Selecciona Importar extracto.", "Elige un archivo CSV, XLSX, XLS, OFX o PDF."], action: "Seleccionar archivo" },
  { id: "difference", title: "Revisar diferencias", description: "Entiende por qué el saldo bancario puede diferir del contable.", steps: ["Filtra los movimientos marcados como Revisar.", "Comprueba comisiones, fechas e importes.", "Concílialos cuando confirmes su correspondencia."], action: "Ver movimientos por revisar" },
  { id: "account", title: "Consultar la cuenta", description: "Revisa el saldo y el estado de sincronización bancaria.", steps: ["Abre Cuentas desde el menú lateral.", "Consulta la cuenta conectada y su última sincronización."], action: "Ver cuenta" },
];

const demoUsers: DemoUser[] = [
  { name: "María García", initials: "MG", role: "ADMIN", roleLabel: "Administradora", description: "Administra cuentas, conexiones y preferencias." },
  { name: "Camila Rojas", initials: "CR", role: "ANALYST", roleLabel: "Analista", description: "Importa extractos y ejecuta conciliaciones." },
  { name: "Diego Soto", initials: "DS", role: "VIEWER", roleLabel: "Solo lectura", description: "Consulta el resumen, movimientos, cuentas e informes." },
];

const rolePermissions: Record<DemoRole, {
  manageAccounts: boolean;
  manageSettings: boolean;
  importMovements: boolean;
  reconcile: boolean;
  exportData: boolean;
}> = {
  ADMIN: { manageAccounts: true, manageSettings: true, importMovements: false, reconcile: false, exportData: true },
  ANALYST: { manageAccounts: false, manageSettings: false, importMovements: true, reconcile: true, exportData: true },
  VIEWER: { manageAccounts: false, manageSettings: false, importMovements: false, reconcile: false, exportData: false },
};

function LoginScreen({ onLogin }: { onLogin: (user: DemoUser) => void }) {
  return (
    <main className="login-shell">
      <section className="login-aside">
        <a className="login-brand" href="#inicio" aria-label="ConB">
          <span className="brand-mark"><ArrowLeftRight size={18} strokeWidth={2.4} /></span>
          <span>Con<span className="brand-period">B</span></span>
        </a>
        <div className="login-aside-copy">
          <span className="login-kicker">CONCILIACIÓN BANCARIA</span>
          <h1>Las cuentas claras empiezan aquí.</h1>
          <p>Un espacio para revisar, ordenar y conciliar los movimientos de tu negocio.</p>
        </div>
        <span className="login-aside-footer">CONB · FINANZAS PARA NEGOCIOS</span>
      </section>
      <section className="login-main">
        <div className="login-card">
          <span className="login-eyebrow"><span /> PROTOTIPO INTERACTIVO</span>
          <h2>Explora ConB</h2>
          <p className="login-description">Selecciona un perfil para ver sus permisos y acceso.</p>
          <div className="demo-role-list" aria-label="Perfiles de demostración">
            {demoUsers.map((user) => {
              const Icon = user.role === "ADMIN" ? ShieldCheck : user.role === "ANALYST" ? Building2 : Eye;
              return (
                <button className="demo-role-option" key={user.role} onClick={() => onLogin(user)}>
                  <span className={`demo-role-icon ${user.role.toLowerCase()}`}><Icon size={17} /></span>
                  <span className="demo-role-copy"><strong>{user.name}</strong><small>{user.roleLabel} · {user.description}</small></span>
                  <span className="demo-role-arrow"><ArrowRight size={16} /></span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [sessionUser, setSessionUser] = useState<DemoUser | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [transactions, setTransactions] = useState<Transaction[]>(() => initialTransactions.map((transaction) => ({
    ...transaction,
    date: formatTransactionDate(new Date(), transaction.daysAgo),
  })));
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState("Conciliación");
  const [notice, setNotice] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpArticleId, setHelpArticleId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notifyPending, setNotifyPending] = useState(true);
  const [suggestMatches, setSuggestMatches] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const permissions = sessionUser ? rolePermissions[sessionUser.role] : null;
  const canManageAccounts = permissions?.manageAccounts ?? false;
  const canManageSettings = permissions?.manageSettings ?? false;
  const canImport = permissions?.importMovements ?? false;
  const canReconcile = permissions?.reconcile ?? false;
  const canExport = permissions?.exportData ?? false;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentDate = new Date();
      setNow(currentDate);
      setTransactions((current) => current.map((transaction) => ({
        ...transaction,
        date: formatTransactionDate(currentDate, transaction.daysAgo),
      })));
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const visibleTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return transactions.filter((transaction) => {
      const matchesFilter = filter === "all" || transaction.status === filter;
      const matchesQuery = `${transaction.name} ${transaction.detail} ${transaction.category}`
        .toLocaleLowerCase("es").includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, transactions]);
  const matchedCount = transactions.filter((transaction) => transaction.status === "matched").length;
  const openCount = transactions.length - matchedCount;
  const notifications = transactions.filter((transaction) => transaction.status !== "matched");
  const categoryTotals = Array.from(new Set(transactions.map((transaction) => transaction.category))).map((category) => {
    const entries = transactions.filter((transaction) => transaction.category === category);
    return {
      category,
      count: entries.length,
      total: entries.reduce((sum, transaction) => sum + transaction.amount, 0),
      matched: entries.filter((transaction) => transaction.status === "matched").length,
    };
  });
  const largestCategory = Math.max(...categoryTotals.map((category) => Math.abs(category.total)), 1);
  const currentMonthName = chileMonthFormatter.format(now);
  const currentMonthYear = chileMonthYearFormatter.format(now);
  const currentMonthYearUpper = currentMonthYear.toLocaleUpperCase("es-CL");
  const currentDateText = chileLongDateFormatter.format(now);
  const currentShortDate = chileShortDateFormatter.format(now).replaceAll(".", "");
  const currentTime = chileTimeFormatter.format(now);
  const activeHelpArticle = helpArticles.find((article) => article.id === helpArticleId);

  function reconcileTransaction(id: number) {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;
    setTransactions((current) => current.map((item) => item.id === id ? { ...item, status: "matched" } : item));
    setNotice(`${transaction.name} conciliado correctamente`);
  }

  function exportCsv() {
    const rows = [
      ["Fecha", "Movimiento", "Referencia", "Categoría", "Importe CLP", "Estado"],
      ...visibleTransactions.map((transaction) => [transaction.date, transaction.name, transaction.detail,
        transaction.category, transaction.amount.toFixed(0), statusLabel[transaction.status]]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `conciliacion-${currentMonthYear.toLocaleLowerCase("es-CL").replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Extracto exportado en formato CSV");
  }

  function renderSecondaryView() {
    const descriptions: Record<string, string> = {
      Resumen: "El estado de tus finanzas, de un vistazo.",
      Movimientos: "Consulta y gestiona todos los movimientos de la cuenta.",
      Cuentas: "Saldos y conexiones bancarias de tu negocio.",
      Informes: "Una lectura clara de la actividad de este periodo.",
      Ajustes: "Preferencias de conciliación y notificaciones.",
    };

    return (
      <>
        <section className="page-heading section-page-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> FINANZAS · {currentMonthYearUpper}</div><h1>{activeNav}</h1><p className="heading-copy">{descriptions[activeNav]}</p></div>
          {(activeNav === "Movimientos" || activeNav === "Informes") && canExport && <button className="button-secondary" onClick={exportCsv}><ArrowDownToLine size={16} /> Exportar CSV</button>}
        </section>

        {activeNav === "Resumen" && (
          <>
            <section className="summary-grid" aria-label="Resumen financiero">
              <article className="summary-card"><div className="summary-top"><span>Saldo disponible</span><span className="summary-icon bank-icon"><Building2 size={16} /></span></div><strong className="summary-value">$18.420.800 <small>CLP</small></strong><div className="summary-foot"><span>Banco de Chile · ···· 4821</span></div></article>
              <article className="summary-card"><div className="summary-top"><span>Movimientos del mes</span><span className="summary-icon ledger-icon"><WalletCards size={16} /></span></div><strong className="summary-value">{transactions.length}</strong><div className="summary-foot"><span>Actividad registrada en {currentMonthName}</span></div></article>
              <article className="summary-card difference-card"><div className="summary-top"><span>Por atender</span><span className="difference-dot" /></div><strong className="summary-value">{openCount}</strong><div className="summary-foot"><span className="difference-foot">Pendientes de conciliación</span></div></article>
              <article className="summary-card progress-card"><div className="summary-top"><span>Conciliación completada</span><span className="summary-icon check-icon"><CheckCheck size={16} /></span></div><strong className="summary-value">{Math.round((matchedCount / transactions.length) * 100)}<small>%</small></strong><div className="progress-track"><span style={{ width: `${(matchedCount / transactions.length) * 100}%` }} /></div><div className="summary-foot"><span>{matchedCount} de {transactions.length} movimientos</span></div></article>
            </section>
            <div className="workspace-columns">
              <section className="workspace-panel">
                <div className="section-heading"><div><h2>Necesitan tu atención</h2><p>Movimientos aún no conciliados.</p></div><button className="view-all-button" onClick={() => setActiveNav("Conciliación")}>Ir a conciliación <ArrowRight size={14} /></button></div>
                <div className="overview-alert-list">
                  {notifications.slice(0, 4).map((transaction) => <button className="overview-alert" key={transaction.id} onClick={() => { setActiveNav("Conciliación"); setFilter(transaction.status); }}>
                    <span className={`notification-symbol ${transaction.status}`}><Clock3 size={14} /></span><span className="overview-alert-copy"><strong>{transaction.name}</strong><small>{transaction.status === "review" ? "Necesita revisión" : "Sin conciliar"} · {transaction.date}</small></span><strong className="overview-alert-amount">{transaction.amount > 0 ? "+" : "−"}{formatAmount(transaction.amount)}</strong><ArrowRight size={14} />
                  </button>)}
                  {notifications.length === 0 && <p className="notification-empty">Todo está conciliado.</p>}
                </div>
              </section>
              <section className="workspace-panel account-overview-panel"><div className="section-heading"><div><h2>Cuenta principal</h2><p>Sincronizada hoy a las {currentTime}.</p></div></div><div className="account-overview"><span className="bank-mark">B</span><div><strong>Banco de Chile</strong><small>Cuenta empresa · ···· 4821</small></div></div><div className="account-overview-balance"><small>Saldo bancario</small><strong>$18.420.800 <span>CLP</span></strong></div><button className="view-all-button" onClick={() => setActiveNav("Cuentas")}>Ver cuenta <ArrowRight size={14} /></button></section>
            </div>
          </>
        )}

        {activeNav === "Movimientos" && (
          <section className="workspace-panel movement-view">
            <div className="table-toolbar movement-toolbar"><div className="section-heading"><div><h2>Todos los movimientos</h2><p>{visibleTransactions.length} registros en el periodo.</p></div></div><label className="search-field"><Search size={15} /><input aria-label="Buscar movimiento" placeholder="Buscar movimiento..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
            <div className="table-scroll"><table className="transactions-table"><thead><tr><th>FECHA</th><th>MOVIMIENTO</th><th>CATEGORÍA</th><th>IMPORTE</th><th>ESTADO</th><th><span className="visually-hidden">Acción</span></th></tr></thead><tbody>
              {visibleTransactions.map((transaction) => <tr key={transaction.id}><td className="date-cell">{transaction.date}</td><td><div className="transaction-name-cell"><span className={`merchant-avatar ${transaction.color}`}>{transaction.initials}</span><span className="transaction-copy"><strong>{transaction.name}</strong><small>{transaction.detail}</small></span></div></td><td><span className="category-label">{transaction.category}</span></td><td className={`amount-cell ${transaction.amount > 0 ? "credit" : ""}`}>{transaction.amount > 0 ? "+" : "−"}{formatAmount(transaction.amount)}</td><td><span className={`status-pill ${transaction.status}`}><span />{statusLabel[transaction.status]}</span></td><td className="action-cell">{transaction.status !== "matched" && canReconcile ? <button className="row-action" onClick={() => reconcileTransaction(transaction.id)}>Conciliar<ArrowRight size={13} /></button> : transaction.status === "matched" ? <span className="matched-check"><Check size={15} /></span> : <span className="read-only-label">Solo lectura</span>}</td></tr>)}
              {visibleTransactions.length === 0 && <tr><td className="empty-state" colSpan={6}>No hay movimientos que coincidan con la búsqueda.</td></tr>}
            </tbody></table></div>
          </section>
        )}

        {activeNav === "Cuentas" && (
          <>
            <section className="account-detail-card"><div className="account-detail-top"><div className="account-overview"><span className="bank-mark">B</span><div><strong>Banco de Chile</strong><small>Cuenta corriente empresa · ···· 4821</small></div></div><span className="connected-status"><span /> Conectada</span></div><div className="account-detail-balance"><small>Saldo disponible</small><strong>$18.420.800 <span>CLP</span></strong></div><div className="account-detail-meta"><div><small>TIPO DE CUENTA</small><strong>Cuenta corriente</strong></div><div><small>MONEDA</small><strong>Peso chileno (CLP)</strong></div><div><small>ÚLTIMA SINCRONIZACIÓN</small><strong>Hoy, {currentTime}</strong></div></div>{canManageAccounts && <button className="button-secondary" onClick={() => setNotice("La cuenta ya está sincronizada")}>Actualizar conexión</button>}</section>
            <div className="section-heading account-transactions-heading"><div><h2>Actividad reciente</h2><p>Movimientos asociados a esta cuenta.</p></div><button className="view-all-button" onClick={() => setActiveNav("Movimientos")}>Ver movimientos <ArrowRight size={14} /></button></div>
            <section className="workspace-panel account-recent-list">{transactions.slice(0, 4).map((transaction) => <div className="account-recent-row" key={transaction.id}><span className={`merchant-avatar ${transaction.color}`}>{transaction.initials}</span><span className="transaction-copy"><strong>{transaction.name}</strong><small>{transaction.date}</small></span><strong className={`amount-cell ${transaction.amount > 0 ? "credit" : ""}`}>{transaction.amount > 0 ? "+" : "−"}{formatAmount(transaction.amount)}</strong></div>)}</section>
          </>
        )}

        {activeNav === "Informes" && (
          <>
            <section className="summary-grid report-summary-grid"><article className="summary-card"><div className="summary-top"><span>Ingresos del periodo</span><span className="summary-icon check-icon"><ArrowDownLeft size={16} /></span></div><strong className="summary-value">{formatAmount(transactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0))}</strong><div className="summary-foot"><span>Abonos registrados</span></div></article><article className="summary-card"><div className="summary-top"><span>Gastos del periodo</span><span className="summary-icon ledger-icon"><ArrowUpRight size={16} /></span></div><strong className="summary-value">{formatAmount(transactions.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0))}</strong><div className="summary-foot"><span>Cargos registrados</span></div></article><article className="summary-card"><div className="summary-top"><span>Balance neto</span><span className="summary-icon bank-icon"><ArrowLeftRight size={16} /></span></div><strong className="summary-value">{formatAmount(transactions.reduce((sum, transaction) => sum + transaction.amount, 0))}</strong><div className="summary-foot"><span>Ingresos menos gastos</span></div></article><article className="summary-card"><div className="summary-top"><span>Conciliados</span><span className="summary-icon check-icon"><CheckCheck size={16} /></span></div><strong className="summary-value">{matchedCount}<small className="count-total"> / {transactions.length}</small></strong><div className="summary-foot"><span>Movimientos revisados</span></div></article></section>
            <section className="workspace-panel report-panel"><div className="section-heading"><div><h2>Detalle por categoría</h2><p>Importe neto de los movimientos del periodo en CLP.</p></div></div><div className="category-report-list">{categoryTotals.map((category) => <div className="category-report-row" key={category.category}><div className="category-report-heading"><strong>{category.category}</strong><span>{category.count} {category.count === 1 ? "movimiento" : "movimientos"}</span><strong>{category.total >= 0 ? "+" : "−"}{formatAmount(category.total)}</strong></div><div className="category-report-track"><span style={{ width: `${Math.max(4, Math.abs(category.total) / largestCategory * 100)}%` }} /></div><small>{category.matched} de {category.count} conciliados</small></div>)}</div></section>
          </>
        )}

        {activeNav === "Ajustes" && (
          <div className="settings-layout"><section className="workspace-panel settings-panel"><div className="section-heading"><div><h2>Conciliación</h2><p>Configura cómo revisar los movimientos.</p></div></div><label className="setting-row"><span><strong>Sugerir coincidencias automáticas</strong><small>Mostrar coincidencias probables al revisar movimientos.</small></span><input type="checkbox" checked={suggestMatches} onChange={(event) => setSuggestMatches(event.target.checked)} /></label><label className="setting-row"><span><strong>Avisos de movimientos pendientes</strong><small>Mostrar una alerta cuando haya movimientos por conciliar.</small></span><input type="checkbox" checked={notifyPending} onChange={(event) => setNotifyPending(event.target.checked)} /></label></section><section className="workspace-panel settings-panel"><div className="section-heading"><div><h2>Preferencias de cuenta</h2><p>Valores usados en este espacio de trabajo.</p></div></div><div className="setting-info-row"><span>Cuenta predeterminada</span><strong>Banco de Chile ···· 4821</strong></div><div className="setting-info-row"><span>Moneda</span><strong>Peso chileno (CLP)</strong></div><div className="setting-info-row"><span>Periodo activo</span><strong>{currentMonthYear}</strong></div></section></div>
        )}
      </>
    );
  }

  if (!sessionUser) {
    return <LoginScreen onLogin={(user) => {
      setSessionUser(user);
      setActiveNav(user.role === "ADMIN" ? "Ajustes" : user.role === "ANALYST" ? "Conciliación" : "Resumen");
    }} />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="ConB, inicio">
          <span className="brand-mark"><ArrowLeftRight size={18} strokeWidth={2.4} /></span>
          <span>Con<span className="brand-period">B</span></span>
        </a>
        <p className="nav-label">ESPACIO DE TRABAJO</p>
        <nav className="primary-nav" aria-label="Navegación principal">
          {[
            { label: "Resumen", icon: LayoutDashboard }, { label: "Conciliación", icon: ArrowLeftRight },
            { label: "Movimientos", icon: WalletCards }, { label: "Cuentas", icon: Building2 },
          ].map(({ label, icon: Icon }) => (
            <button className={`nav-item ${activeNav === label ? "active" : ""}`} key={label} aria-label={label} title={label} onClick={() => { setActiveNav(label); setFilter("all"); setQuery(""); setNotificationsOpen(false); }}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {label === "Conciliación" && <span className="nav-count">{openCount}</span>}
            </button>
          ))}
        </nav>
        <p className="nav-label nav-label-lower">GESTIÓN</p>
        <nav className="primary-nav" aria-label="Gestión">
          <button className={`nav-item ${activeNav === "Informes" ? "active" : ""}`} onClick={() => { setActiveNav("Informes"); setNotificationsOpen(false); }}><ArrowUpRight size={17} /><span>Informes</span></button>
          {canManageSettings && <button className={`nav-item ${activeNav === "Ajustes" ? "active" : ""}`} onClick={() => { setActiveNav("Ajustes"); setNotificationsOpen(false); }}><Settings2 size={17} /><span>Ajustes</span></button>}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-button"><span className="profile-avatar">{sessionUser.initials}</span>
            <span className="workspace-copy"><strong>{sessionUser.name}</strong><small>{sessionUser.roleLabel}</small></span>
            <button className="profile-logout" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => setSessionUser(null)}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><span>Finanzas</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions"><span className="sync-state"><span className="sync-dot" /> Sincronizado hoy, {currentTime}</span>
            <div className="notification-menu">
              <button
                className="icon-button notification-button"
                aria-label={notificationsOpen ? "Cerrar notificaciones" : `Ver notificaciones${notifications.length ? `, ${notifications.length} pendientes` : ""}`}
                aria-expanded={notificationsOpen}
                aria-controls="notification-popover"
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setNotificationsRead(true);
                }}
              >
                <Bell size={18} />
                {notifications.length > 0 && !notificationsRead && <i />}
              </button>
              {notificationsOpen && (
                <section className="notification-popover" id="notification-popover" aria-label="Notificaciones">
                  <header className="notification-header">
                    <div><strong>Notificaciones</strong><span>{notifications.length} por atender</span></div>
                    <button onClick={() => setNotificationsRead(true)}>Marcar como leídas</button>
                  </header>
                  {notifications.length > 0 ? (
                    <div className="notification-list">
                      {notifications.map((transaction) => (
                        <button
                          className="notification-item"
                          key={transaction.id}
                          onClick={() => {
                            setActiveNav("Conciliación");
                            setFilter(transaction.status);
                            setNotificationsOpen(false);
                          }}
                        >
                          <span className={`notification-symbol ${transaction.status}`}><Clock3 size={14} /></span>
                          <span className="notification-copy">
                            <strong>{transaction.status === "review" ? "Movimiento por revisar" : "Movimiento sin conciliar"}</strong>
                            <span>{transaction.name} · {formatAmount(transaction.amount)}</span>
                            <small>{transaction.date}</small>
                          </span>
                          <span className="notification-arrow"><ArrowRight size={14} /></span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="notification-empty">No tienes movimientos pendientes.</p>
                  )}
                </section>
              )}
            </div>
            <div className="help-menu">
              <button className="help-button" title="Centro de ayuda" aria-expanded={helpOpen} aria-controls="help-popover" onClick={() => { setHelpOpen((open) => !open); setHelpArticleId(null); setNotificationsOpen(false); }}><CircleHelp size={16} /><span>Ayuda</span></button>
              {helpOpen && (
                <section className="help-popover" id="help-popover" aria-label="Centro de ayuda">
                  <div className="help-popover-heading"><div><strong>{activeHelpArticle?.title ?? "¿En qué te ayudamos?"}</strong>{activeHelpArticle && <small>Guía rápida</small>}</div><button className="help-close" aria-label="Cerrar ayuda" onClick={() => setHelpOpen(false)}>×</button></div>
                  {activeHelpArticle ? (
                    <div className="help-article"><button className="help-back" onClick={() => setHelpArticleId(null)}>← Todas las guías</button><p>{activeHelpArticle.description}</p><ol>{activeHelpArticle.steps.map((step) => <li key={step}>{step}</li>)}</ol><button className="button-primary help-action" onClick={() => {
                      if (activeHelpArticle.id === "import") {
                        setActiveNav("Conciliación");
                        setHelpOpen(false);
                        fileInput.current?.click();
                      } else {
                        setActiveNav(activeHelpArticle.id === "account" ? "Cuentas" : "Conciliación");
                        if (activeHelpArticle.id === "difference") setFilter("review");
                        if (activeHelpArticle.id === "reconcile") setFilter("pending");
                        setHelpOpen(false);
                      }
                    }}>{activeHelpArticle.action}<ArrowRight size={14} /></button></div>
                  ) : (
                    <div className="help-results">{helpArticles.filter((article) => canImport || article.id !== "import").map((article) => <button className="help-result" key={article.id} onClick={() => setHelpArticleId(article.id)}><span><strong>{article.title}</strong><small>{article.description}</small></span><ArrowRight size={14} /></button>)}</div>
                  )}
                </section>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeNav === "Conciliación" ? (
            <>
          <section className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> CIERRE MENSUAL · {currentMonthYearUpper}</div>
              <h1>Conciliación <span>bancaria</span></h1><p className="heading-copy">Cada movimiento en su sitio.</p>
            </div>
            <div className="heading-actions">
              {canExport && <button className="button-secondary" onClick={exportCsv}><ArrowDownToLine size={16} /> Exportar</button>}
              {canImport && <button className="button-primary" onClick={() => fileInput.current?.click()}><Plus size={17} /> Importar extracto</button>}
              <input ref={fileInput} className="visually-hidden" type="file" accept=".csv,.xlsx,.xls,.ofx,.pdf" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setNotice(`${file.name} listo para importar`);
              }} />
            </div>
          </section>

          <section className="account-strip" aria-label="Cuenta bancaria seleccionada">
            <div className="account-leading"><span className="bank-mark">B</span><span><strong>Banco de Chile</strong><small>Cuenta empresa · ···· 4821</small></span></div>
            <div className="account-divider" /><div className="account-period"><small>PERIODO</small><strong>1 — {currentShortDate} <ChevronDown size={14} /></strong></div>
            <div className="account-updated"><Clock3 size={14} /><span>Actualizado hoy, {currentTime}</span></div>
            <div className="account-actions">
              {canManageAccounts && <button className="icon-button account-menu" aria-label="Opciones de cuenta" aria-haspopup="menu" aria-expanded={accountMenuOpen} aria-controls="account-menu-popover" onClick={() => setAccountMenuOpen((open) => !open)}><MoreHorizontal size={19} /></button>}
              {accountMenuOpen && canManageAccounts && <div className="account-menu-popover" id="account-menu-popover" role="menu">
                <button role="menuitem" onClick={() => { setActiveNav("Cuentas"); setAccountMenuOpen(false); }}><Building2 size={15} /> Ver cuenta bancaria</button>
                <button role="menuitem" onClick={() => { setNotice(`Datos de demostración actualizados a las ${currentTime}`); setAccountMenuOpen(false); }}><RefreshCw size={15} /> Actualizar datos</button>
                <button role="menuitem" onClick={() => { setAccountMenuOpen(false); exportCsv(); }}><ArrowDownToLine size={15} /> Exportar movimientos</button>
              </div>}
            </div>
          </section>

          <section className="summary-grid" aria-label="Resumen de conciliación">
            <article className="summary-card balance-card"><div className="summary-top"><span>Saldo bancario</span><span className="summary-icon bank-icon"><Building2 size={16} /></span></div>
              <strong className="summary-value">$18.420.800 <small>CLP</small></strong><div className="summary-foot"><span className="trend-positive"><ArrowDownLeft size={13} /> 2,4%</span><span>vs. mes anterior</span></div>
            </article>
            <article className="summary-card"><div className="summary-top"><span>Saldo en libros</span><span className="summary-icon ledger-icon"><WalletCards size={16} /></span></div>
              <strong className="summary-value">$18.167.300 <small>CLP</small></strong><div className="summary-foot"><span>Según tu contabilidad</span></div>
            </article>
            <article className="summary-card difference-card"><div className="summary-top"><span>Diferencia por revisar</span><span className="difference-dot" /></div>
              <strong className="summary-value">$253.500 <small>CLP</small></strong><div className="summary-foot"><span className="difference-foot"><span /> {openCount} movimientos pendientes</span></div>
            </article>
            <article className="summary-card progress-card"><div className="summary-top"><span>Movimientos conciliados</span><span className="summary-icon check-icon"><CheckCheck size={16} /></span></div>
              <strong className="summary-value">{matchedCount}<small className="count-total"> / {transactions.length}</small></strong>
              <div className="progress-track"><span style={{ width: `${(matchedCount / transactions.length) * 100}%` }} /></div>
              <div className="summary-foot"><span>{Math.round((matchedCount / transactions.length) * 100)}% del periodo completado</span></div>
            </article>
          </section>

          <section className="reconcile-section">
            <div className="section-heading"><div><h2>Movimientos del periodo</h2><p>Compara el extracto bancario con tus registros contables.</p></div>
              {canReconcile && <button className="auto-match-button" onClick={() => {
                setTransactions((current) => current.map((transaction) => transaction.status === "pending" ? { ...transaction, status: "matched" } : transaction));
                setNotice("Coincidencias automáticas aplicadas");
              }}><Sparkles size={20} /> Conciliar automáticamente</button>}
            </div>
            <div className="table-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filtrar movimientos">
                {[
                  { key: "all", label: "Todos", count: transactions.length },
                  { key: "pending", label: "Sin conciliar", count: transactions.filter((item) => item.status === "pending").length },
                  { key: "review", label: "Revisar", count: transactions.filter((item) => item.status === "review").length },
                  { key: "matched", label: "Conciliados", count: matchedCount },
                ].map((tab) => <button key={tab.key} role="tab" aria-selected={filter === tab.key} className={`filter-tab ${filter === tab.key ? "selected" : ""}`} onClick={() => setFilter(tab.key as typeof filter)}>{tab.label}<span>{tab.count}</span></button>)}
              </div>
              <div className="table-tools"><label className="search-field"><Search size={15} /><input aria-label="Buscar movimiento" placeholder="Buscar movimiento..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label>
                <button className="icon-button filter-button" aria-label="Más filtros"><SlidersHorizontal size={16} /></button><button className="icon-button filter-button" aria-label="Filtrar columnas"><Filter size={16} /></button>
              </div>
            </div>
            <div className="table-scroll"><table className="transactions-table">
              <thead><tr><th className="date-column">FECHA</th><th>MOVIMIENTO</th><th>CATEGORÍA</th><th>IMPORTE</th><th>ESTADO</th><th><span className="visually-hidden">Acción</span></th></tr></thead>
              <tbody>{visibleTransactions.map((transaction) => <tr key={transaction.id}>
                <td className="date-cell">{transaction.date}</td>
                <td><div className="transaction-name-cell"><span className={`merchant-avatar ${transaction.color}`}>{transaction.initials}</span><span className="transaction-copy"><strong>{transaction.name}</strong><small>{transaction.detail}</small></span></div></td>
                <td><span className="category-label">{transaction.category}</span></td>
                <td className={`amount-cell ${transaction.amount > 0 ? "credit" : ""}`}>{transaction.amount > 0 ? "+" : "−"}{formatAmount(transaction.amount)}</td>
                <td><span className={`status-pill ${transaction.status}`}><span />{statusLabel[transaction.status]}</span></td>
                <td className="action-cell">{transaction.status !== "matched" && canReconcile ? <button className={`row-action ${transaction.status === "review" ? "review-action" : ""}`} onClick={() => reconcileTransaction(transaction.id)}>{transaction.status === "review" ? "Revisar" : "Conciliar"}<ArrowRight size={13} /></button> : transaction.status === "matched" ? <span className="matched-check" aria-label="Conciliado"><Check size={15} /></span> : <span className="read-only-label">Solo lectura</span>}</td>
              </tr>)}
                {visibleTransactions.length === 0 && <tr><td className="empty-state" colSpan={6}>No hay movimientos que coincidan con la búsqueda.</td></tr>}
              </tbody>
            </table></div>
            <footer className="table-footer"><span>Mostrando <strong>{visibleTransactions.length}</strong> de <strong>{transactions.length}</strong> movimientos</span><button className="view-all-button" onClick={() => { setFilter("all"); setQuery(""); }}>Ver todos los movimientos <ArrowRight size={14} /></button></footer>
          </section>

          <section className="insight-banner"><span className="insight-icon"><Sparkles size={17} /></span>
            <div><strong>Un pequeño descuadre, una solución sencilla.</strong><p>Hay {openCount} movimientos que necesitan tu atención para cerrar el mes.</p></div>
            <button onClick={() => setFilter("review")}>Revisar ahora <ArrowRight size={14} /></button>
          </section>
          <div className="page-bottom"><span>Fecha actual: {currentDateText}, {currentTime}</span><span>{canManageAccounts && <button onClick={() => setNotice("No hay novedades desde la última sincronización")}>Actualizar datos</button>}{canManageAccounts && <span className="bottom-dot">·</span>} Datos sincronizados con Banco de Chile</span></div>
            </>
          ) : renderSecondaryView()}
        </div>
      </section>
      {notice && <div className="toast" role="status"><Check size={16} />{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice("")}>×</button></div>}
    </main>
  );
}