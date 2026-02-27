// --- COMPONENTS: Componentes UI reutilizables ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", type = "button", disabled = false }) => {
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-700",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
        success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700",
        whatsapp: "bg-green-500 text-white hover:bg-green-600 dark:bg-green-600",
        google: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600"
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            {children}
        </button>
    );
};

const Badge = ({ children, type, date }) => {
    let colors = '';
    let label = '';
    switch(type) {
        case 'weekly': colors = 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'; label = 'Semanal'; break;
        case 'biweekly': colors = 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'; label = 'Cada 2 Sem'; break;
        case 'triweekly': colors = 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200'; label = 'Cada 3 Sem'; break;
        case 'monthly': colors = 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'; label = 'Cada 4 Sem'; break;
        case 'once':
            colors = 'bg-orange-100 text-orange-800 dark:bg-gray-800 dark:text-orange-300 dark:border dark:border-orange-500';
            label = date ? `Una vez: ${date.split('-').reverse().join('/')}` : 'Una vez';
            break;
        case 'on_demand': colors = 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'; label = 'Archivado'; break;
        default: colors = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; label = type;
    }
    return <span className={`text-xs px-2 py-1 rounded-full font-bold ${colors}`}>{label}</span>;
};

const LoadInput = ({ label, value, onChange }) => (
    <div className="flex flex-col">
        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 text-center">{label}</label>
        <input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="0"
            className="w-full p-1 text-center border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-base font-semibold text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 h-8"
        />
    </div>
);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Eliminar", cancelText = "Cancelar", isDanger = true }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" style={{zIndex: 100}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xs w-full p-6">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`${isDanger ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'} p-3 rounded-full mb-4`}>
                        <Icons.AlertTriangle />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onCancel} className="flex-1 text-sm">{cancelText}</Button>
                    <Button variant={isDanger ? "danger" : "primary"} onClick={onConfirm} className="flex-1 text-sm">{confirmText}</Button>
                </div>
            </div>
        </div>
    );
};

const Toast = ({ message, onUndo, hasUndo, type = 'info' }) => {
    const bgColors = {
        info: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
    };
    return (
        <div className={`fixed bottom-20 left-4 right-4 ${bgColors[type] || bgColors.info} p-4 rounded-lg shadow-lg flex justify-between items-center z-50 toast-animate`}>
            <span>{message}</span>
            {hasUndo && <button onClick={onUndo} className="text-blue-300 font-bold ml-4">DESHACER</button>}
        </div>
    );
};

const OrderInput = ({ value, onChange }) => {
    const [showModal, setShowModal] = React.useState(false);
    const [modalValue, setModalValue] = React.useState('');
    const inputRef = React.useRef(null);

    const handleOpen = () => {
        setModalValue('');
        setShowModal(true);
    };

    React.useEffect(() => {
        if (showModal && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showModal]);

    const handleConfirm = () => {
        if (modalValue !== '' && Number(modalValue) !== value) {
            onChange(Number(modalValue));
        }
        setShowModal(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') setShowModal(false);
    };

    return (
        <React.Fragment>
            <button
                type="button"
                className="order-input"
                onClick={handleOpen}
            >
                {value}
            </button>
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 w-56" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">Nueva posición</p>
                        <input
                            ref={inputRef}
                            type="number"
                            inputMode="numeric"
                            className="w-full p-3 text-2xl font-bold text-center border-2 border-blue-300 dark:border-blue-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={modalValue}
                            onChange={e => setModalValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={String(value)}
                        />
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">Cancelar</button>
                            <button onClick={handleConfirm} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">Mover</button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

// --- HOOK: DEBOUNCE PARA BÚSQUEDAS ---
const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

// --- HELPER: Renderizar texto con URLs clickeables ---
var renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            // Limpiar trailing punctuation
            let url = part;
            let trailing = '';
            const lastChar = url.slice(-1);
            if (['.', ',', ')', ']', '!', '?'].includes(lastChar)) {
                trailing = lastChar;
                url = url.slice(0, -1);
            }
            return React.createElement(React.Fragment, { key: i },
                React.createElement('a', {
                    href: url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'text-blue-600 dark:text-blue-400 underline break-all inline-flex items-center gap-0.5'
                }, React.createElement(Icons.ExternalLink, { size: 12 }), ' ', url.length > 40 ? url.slice(0, 40) + '...' : url),
                trailing
            );
        }
        return part;
    });
};

// --- COMPONENTE MEMOIZADO: TARJETA DE CLIENTE ---
const ClientCard = React.memo(({ client, trueIndex, isAdmin, onToggleStar, onDebtClick, onAddTransfer, onSetAlarm, onEdit, onEditNote, onDelete, onOpenMaps, onSendPhoto, onSendWhatsApp, onMarkDone, onChangePosition }) => {
    const prodSummary = React.useMemo(() => {
        if (!client.products) return '';
        return Object.keys(client.products)
            .filter(k => parseInt(client.products[k] || 0) > 0)
            .map(k => {
                const p = PRODUCTS.find(prod => prod.id === k);
                return `${client.products[k]}x ${p ? p.short : k}`;
            }).join(', ');
    }, [client.products]);

    // --- TARJETA DE NOTA ---
    if (client.isNote) {
        return (
            <Card className="flex flex-row overflow-hidden border-l-4 border-l-yellow-400 dark:border-l-yellow-500 bg-yellow-50 dark:bg-gray-800">
                <div className="w-10 bg-yellow-100/50 dark:bg-gray-700/50 flex flex-col justify-center items-center border-r border-yellow-200 dark:border-gray-700 p-0.5 drag-handle" data-id={client.id}>
                    <OrderInput
                        value={trueIndex + 1}
                        onChange={(newPos) => onChangePosition(client.id, newPos)}
                    />
                    <Icons.Drag size={14} className="text-yellow-400 dark:text-gray-500 mt-1 opacity-60" />
                </div>
                <div className="flex-1 min-w-0 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icons.FileText size={16} className="text-yellow-600 dark:text-yellow-400" />
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase">Nota</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => onEditNote(client)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"><Icons.Edit size={15} /></button>
                            <button onClick={() => onDelete(client.id)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Icons.Trash2 size={15} /></button>
                        </div>
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                        {renderTextWithLinks(client.notes || '')}
                    </div>
                    <div className="flex gap-1.5 mt-1 pt-2 border-t border-yellow-200 dark:border-gray-700 items-center">
                        <Badge type={client.freq} date={client.specificDate} />
                        <div className="flex-1" />
                        <button onClick={() => onMarkDone(client)} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2 px-3 rounded-lg shadow-sm flex items-center justify-center gap-1 text-sm transition-colors whitespace-nowrap shrink-0">
                            <Icons.CheckCircle size={17} />
                            <span>Listo</span>
                        </button>
                    </div>
                </div>
            </Card>
        );
    }

    // --- TARJETA DE CLIENTE NORMAL ---
    return (
        <Card className={`flex flex-row overflow-hidden ${(client.freq === 'once' || client.isStarred) ? 'border-l-4 border-l-orange-500 dark:border-l-orange-600 bg-orange-50 dark:bg-gray-800' : ''}`}>
            {/* ORDER INPUT BADGE + DRAG HANDLE */}
            <div className="w-10 bg-gray-50 dark:bg-gray-700/50 flex flex-col justify-center items-center border-r border-gray-100 dark:border-gray-700 p-0.5 drag-handle" data-id={client.id}>
                 <OrderInput
                    value={trueIndex + 1}
                    onChange={(newPos) => onChangePosition(client.id, newPos)}
                 />
                 <Icons.Drag size={14} className="text-gray-300 dark:text-gray-500 mt-1 opacity-60" />
            </div>

            {/* CARD CONTENT */}
            <div className="flex-1 min-w-0 p-3 flex flex-col gap-2">
                {/* Botones de herramientas */}
                <div className="flex items-center justify-end gap-1 flex-wrap text-sm">
                    <button onClick={() => onToggleStar(client)} className={`p-1.5 rounded-md transition-all ${client.isStarred ? 'bg-orange-50 dark:bg-orange-900/20' : 'opacity-40 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>⭐</button>
                    <button onClick={() => onDebtClick(client)} className={`p-1.5 rounded-md transition-all ${client.hasDebt ? 'bg-red-50 dark:bg-red-900/20' : 'opacity-40 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{client.hasDebt ? '🔴' : '💰'}</button>
                    <button onClick={() => onAddTransfer(client)} className={`p-1.5 rounded-md transition-all ${client.hasPendingTransfer ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'opacity-40 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>💳</button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-0.5"></div>
                    <button onClick={() => onSetAlarm(client)} className={`p-1.5 rounded-md transition-all ${client.alarm ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'opacity-40 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{client.alarm ? '🔔' : '🔕'}</button>
                    <button onClick={() => onEdit(client)} className="p-1.5 rounded-md opacity-40 hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">✏️</button>
                    <button onClick={() => onDelete(client.id)} className="p-1.5 rounded-md opacity-40 hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">🗑️</button>
                </div>

                {/* Nombre y dirección */}
                <div className="-mt-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white break-words">{(client.name || '').toUpperCase()}</h3>
                    <div onClick={() => onOpenMaps(client.lat, client.lng, client.mapsLink)} className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 mt-0.5 hover:underline min-w-0">
                        <span className="shrink-0">📍</span> <span className="break-words">{client.address}</span>
                    </div>
                </div>

                {/* Info Block */}
                <div className="flex flex-wrap gap-2 items-center">
                    {prodSummary && <span className="text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">📦 {prodSummary}</span>}
                    <Badge type={client.freq} date={client.specificDate} />
                    {client.visitDays && client.visitDays.length > 1 && (
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                            📅 {client.visitDays.map(d => d.slice(0,3)).join(', ')}
                        </span>
                    )}
                </div>
                {client.notes && (
                    <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-2 rounded border border-yellow-100 dark:border-yellow-900/30 flex gap-1 items-start min-w-0 overflow-hidden">
                        <span className="shrink-0">📝</span>
                        <span className="break-words min-w-0">{client.notes}</span>
                    </div>
                )}

                {/* Action Bar */}
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 items-center">
                    {client.phone ? (
                        <a href={`tel:${client.phone}`} className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 w-9 shrink-0">📞</a>
                    ) : (
                        <span className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-not-allowed w-9 shrink-0 opacity-30">📞</span>
                    )}
                    {client.phone ? (
                        <button onClick={() => onSendPhoto(client.phone)} className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 w-9 shrink-0">📷</button>
                    ) : (
                        <span className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-not-allowed w-9 shrink-0 opacity-30">📷</span>
                    )}
                    {client.phone ? (
                        <button onClick={() => onSendWhatsApp(client.phone)} className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-2 px-2 rounded-lg shadow-sm flex items-center justify-center gap-1 text-sm transition-colors whitespace-nowrap">
                            <span>💬</span>
                            <span>En camino</span>
                        </button>
                    ) : (
                        <span className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-sm cursor-not-allowed whitespace-nowrap">
                            <span>💬</span>
                            <span>Sin tel.</span>
                        </span>
                    )}
                    <button onClick={() => onMarkDone(client)} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2 px-3 rounded-lg shadow-sm flex items-center justify-center gap-1 text-sm transition-colors whitespace-nowrap shrink-0">
                        <span>✅</span>
                        <span>Listo</span>
                    </button>
                </div>
            </div>
        </Card>
    );
}, (prevProps, nextProps) => {
    if (prevProps.trueIndex !== nextProps.trueIndex || prevProps.isAdmin !== nextProps.isAdmin) return false;
    const pc = prevProps.client, nc = nextProps.client;
    return pc.id === nc.id && pc.name === nc.name && pc.address === nc.address &&
           pc.phone === nc.phone && pc.freq === nc.freq && pc.isStarred === nc.isStarred &&
           pc.hasDebt === nc.hasDebt && pc.hasPendingTransfer === nc.hasPendingTransfer &&
           pc.alarm === nc.alarm && pc.notes === nc.notes && pc.specificDate === nc.specificDate &&
           pc.isNote === nc.isNote && pc.isCompleted === nc.isCompleted &&
           (pc.lastVisited?.seconds || 0) === (nc.lastVisited?.seconds || 0) &&
           JSON.stringify(pc.products) === JSON.stringify(nc.products) &&
           JSON.stringify(pc.visitDays) === JSON.stringify(nc.visitDays);
});

// --- SKELETON LOADER ---
const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-row">
        <div className="w-10 bg-gray-50 dark:bg-gray-700/50 border-r border-gray-100 dark:border-gray-700" />
        <div className="flex-1 p-3 space-y-3 animate-pulse">
            <div className="flex justify-end gap-1">
                {[1,2,3,4].map(i => <div key={i} className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-md" />)}
            </div>
            <div className="space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-1/2" />
            </div>
            <div className="flex gap-2">
                <div className="h-6 bg-gray-100 dark:bg-gray-700/60 rounded-full w-24" />
                <div className="h-6 bg-gray-100 dark:bg-gray-700/60 rounded-full w-16" />
            </div>
            <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="w-16 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
        </div>
    </div>
);

// --- CONTADOR DE PRODUCTOS ---
const ProductCounter = ({ clients, label }) => {
    const totals = clients.reduce((acc, client) => {
        if (!client.products) return acc;
        Object.keys(client.products).forEach(key => {
            const qty = parseInt(client.products[key] || 0);
            if (qty > 0) {
                acc[key] = (acc[key] || 0) + qty;
            }
        });
        return acc;
    }, {});

    const activeProducts = Object.keys(totals).filter(k => totals[k] > 0);

    if (clients.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-gray-700 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <Icons.Package size={14} /> {label ? `${label} — ` : ''}Total Carga ({clients.length})
                </h3>
             </div>
            {activeProducts.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                    {activeProducts.map(key => {
                        const prod = PRODUCTS.find(p => p.id === key);
                        return (
                            <div key={key} className="bg-blue-50 dark:bg-gray-700 rounded-lg p-2 flex flex-col items-center justify-center border border-blue-100 dark:border-gray-600">
                                <span className="text-xl font-black text-blue-600 dark:text-blue-300">{totals[key]}</span>
                                <span className="text-[10px] text-blue-400 dark:text-blue-200 font-medium uppercase">{prod ? prod.short : key}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <p className="text-xs text-gray-400 italic">No hay productos asignados para esta lista.</p>
            )}
        </div>
    );
};

// --- PANTALLA DE LOGIN ---
const LoginScreen = ({ onLogin }) => (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full">
            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icons.Truck />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">RutaWater</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">Gestiona tus clientes y rutas de reparto de forma inteligente.</p>

            <Button variant="google" onClick={onLogin} className="w-full shadow-sm py-4">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="G" />
                <span className="text-base">Continuar con Google</span>
            </Button>
            <p className="mt-6 text-xs text-gray-400">Tus datos se guardarán seguros en la nube.</p>
        </div>
    </div>
);

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full">
                        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center text-red-600 dark:text-red-400">
                            <Icons.AlertTriangle size={40} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Algo salió mal</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{this.state.error?.message || 'Error inesperado'}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                            Recargar App
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}