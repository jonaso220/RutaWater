// --- MODALS: Todos los modales de la aplicación ---

// --- COMPONENTE DE ALARMA ---
const AlarmModal = ({ isOpen, onClose, onSave, initialValue }) => {
    const [time, setTime] = React.useState(initialValue || '');

    React.useEffect(() => {
        if (isOpen) setTime(initialValue || '');
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 110}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xs w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white">Recordatorio</h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Avísame cuando sean las:
                </p>
                <input
                    type="time"
                    className="w-full p-2 text-2xl font-bold text-center border rounded-xl mb-6 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none block"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
                <div className="flex gap-3">
                     <Button variant="secondary" onClick={() => onSave('')} className="flex-1">Borrar</Button>
                     <Button onClick={() => onSave(time)} className="flex-1">Guardar</Button>
                </div>
            </div>
        </div>
    );
};

const AlarmBanner = ({ data, onClose }) => {
    if (!data) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative border-t-8 border-yellow-400">
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 p-4 rounded-full shadow-lg bell-ring">
                    <Icons.Bell size={32} className="text-white" />
                 </div>
                 <div className="mt-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{data.time}</h2>
                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-4 uppercase tracking-wider">Recordatorio de Visita</p>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{data.name}</h3>
                        <p className="text-gray-500 dark:text-gray-300 text-sm flex items-center justify-center gap-1">
                            <Icons.MapPin size={14}/> {data.address}
                        </p>
                    </div>

                    <Button onClick={onClose} className="w-full py-4 text-lg shadow-lg bg-yellow-400 hover:bg-yellow-500 text-white border-none">
                        ¡Entendido!
                    </Button>
                 </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MODAL BUSCAR CLIENTE PARA DEUDA ---
const ClientSearchModal = ({ isOpen, clients, onClose, onSelect }) => {
    const [search, setSearch] = React.useState('');

    React.useEffect(() => {
        if (isOpen) setSearch('');
    }, [isOpen]);

    if (!isOpen) return null;

    const filtered = clients.filter(c => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (c.name || '').toLowerCase().includes(term) ||
               (c.address || '').toLowerCase().includes(term) ||
               (c.phone || '').includes(term);
    }).slice(0, 50);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{zIndex: 110}}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg"><Icons.DollarSign size={18} /></div>
                            Añadir Deuda
                        </h3>
                        <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                            autoFocus
                        />
                        <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500"><Icons.Search size={18} /></div>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                    {filtered.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">No se encontraron clientes</p>
                    ) : (
                        filtered.map(client => (
                            <button
                                key={client.id}
                                onClick={() => onSelect(client)}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                            >
                                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                                    {(client.name || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{(client.name || '').toUpperCase()}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{client.address || 'Sin dirección'}</p>
                                </div>
                                {client.hasDebt && (
                                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Debe</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE MODAL DE DEUDA ---
const DebtModal = ({ isOpen, client, onClose, onSave }) => {
    const [amount, setAmount] = React.useState('');

    React.useEffect(() => {
        if (isOpen) setAmount('');
    }, [isOpen]);

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 110}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xs w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg"><Icons.DollarSign size={18} /></div>
                        Registrar Deuda
                    </h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                    <p className="font-bold text-gray-800 dark:text-white text-sm">{(client.name || '').toUpperCase()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{client.address}</p>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Cuánto debe?</label>
                <div className="relative mb-4">
                    <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 text-lg font-bold">$</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        className="w-full p-3 pl-8 text-2xl font-bold text-center border rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-red-500 outline-none"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        autoFocus
                    />
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button variant="danger" onClick={() => onSave(client, amount)} className="flex-1 !bg-red-600 !text-white !hover:bg-red-700">
                        <Icons.DollarSign size={16}/> Añadir Deuda
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MODAL EDITAR DEUDA ---
const EditDebtModal = ({ isOpen, debt, onClose, onSave }) => {
    const [amount, setAmount] = React.useState('');

    React.useEffect(() => {
        if (debt) setAmount(String(debt.amount || ''));
    }, [debt]);

    if (!isOpen || !debt) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 110}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xs w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><Icons.Edit size={18} /></div>
                        Editar Deuda
                    </h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                    <p className="font-bold text-gray-800 dark:text-white text-sm">{(debt.clientName || '').toUpperCase()}</p>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nuevo monto</label>
                <div className="relative mb-4">
                    <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 text-lg font-bold">$</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        className="w-full p-3 pl-8 text-2xl font-bold text-center border rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button onClick={() => { onSave(debt, amount); onClose(); }} className="flex-1">
                        <Icons.Save size={16}/> Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MODAL VER DEUDAS DE CLIENTE ---
const ViewDebtModal = ({ isOpen, client, debts, onClose, onPaid, onEdit, onAddMore, onSendDebtTotal }) => {
    if (!isOpen || !client) return null;
    const clientDebts = debts.filter(d => d.clientId === client.id);
    const total = clientDebts.reduce((sum, d) => sum + (d.amount || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 110}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg"><Icons.DollarSign size={18} /></div>
                        Deudas
                    </h3>
                    <div className="flex items-center gap-2">
                        {clientDebts.length === 1 && (
                            <button
                                onClick={() => onPaid(clientDebts[0])}
                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-600 transition-colors"
                            >
                                <Icons.CheckCircle size={14} /> Pagada
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                    <p className="font-bold text-gray-800 dark:text-white text-sm">{(client.name || '').toUpperCase()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{client.address}</p>
                </div>

                {clientDebts.length === 0 ? (
                    <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">No hay deudas registradas</p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                        {clientDebts.map(debt => (
                            <div key={debt.id} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-black text-red-600 dark:text-red-400">${debt.amount?.toLocaleString()}</p>
                                    {debt.createdAt && (
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            {new Date(debt.createdAt.seconds ? debt.createdAt.seconds * 1000 : debt.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => { onClose(); onEdit(debt); }}
                                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        title="Editar"
                                    >
                                        <Icons.Edit size={15} />
                                    </button>
                                    {clientDebts.length > 1 && (
                                        <button
                                            onClick={() => onPaid(debt)}
                                            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                            title="Pagó"
                                        >
                                            <Icons.CheckCircle size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {clientDebts.length > 1 && (
                    <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-2 mb-3 text-center">
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">Total: ${total.toLocaleString()}</span>
                    </div>
                )}

                {clientDebts.length > 0 && client.phone && (
                    <button
                        onClick={() => onSendDebtTotal(client.phone, total)}
                        className="w-full mb-2 py-2.5 px-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        <Icons.MessageCircle size={16} /> Enviar deuda por WhatsApp
                    </button>
                )}

                <Button variant="danger" onClick={() => { onClose(); onAddMore(client); }} className="w-full text-sm !bg-red-600 !text-white">
                    <Icons.Plus size={15} /> Agregar otra deuda
                </Button>
            </div>
        </div>
    );
};

const ScheduleModal = ({ isOpen, client, onClose, onSave }) => {
    const [localDays, setLocalDays] = React.useState(['Lunes']); // Array de días
    const [localFreq, setLocalFreq] = React.useState('once');
    const [localDate, setLocalDate] = React.useState('');
    const [localNotes, setLocalNotes] = React.useState('');
    const [localProducts, setLocalProducts] = React.useState({});

    const ALL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    React.useEffect(() => {
        if (client) {
            setLocalNotes(client.notes || '');
            setLocalFreq(client.freq === 'on_demand' ? 'once' : (client.freq || 'once'));
            setLocalDate(client.specificDate || '');
            setLocalProducts(client.products || { b20: '', b12: '', b6: '', soda: '', bombita: '', disp_elec_new: '', disp_elec_chg: '', disp_nat: '' });
            // Si ya tiene días asignados, cargarlos
            if (client.visitDays && client.visitDays.length > 0) {
                setLocalDays(client.visitDays);
            } else if (client.visitDay && client.visitDay !== 'Sin Asignar') {
                setLocalDays([client.visitDay]);
            }
        }
    }, [client]);

    if (!isOpen || !client) return null;
    const handleProductChange = (prodId, val) => {
        setLocalProducts(prev => ({
            ...prev,
            [prodId]: val
        }));
    };

    const toggleDay = (day) => {
        setLocalDays(prev => {
            if (prev.includes(day)) {
                // No permitir quitar el último día
                if (prev.length === 1) return prev;
                return prev.filter(d => d !== day);
            } else {
                return [...prev, day];
            }
        });
    };

    const handleSubmit = () => {
        if (localFreq === 'once' && !localDate) {
            alert('Por favor, selecciona una fecha de entrega.');
            return;
        }
        if (localFreq !== 'once' && localDays.length === 0) {
            alert('Por favor, selecciona al menos un día.');
            return;
        }
        onSave(client, localDays, localFreq, localDate, localNotes, localProducts);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 100}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white">Agendar Visita</h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Programar a <strong>{client.name}</strong> para:</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo de Pedido</label>
                        <div className="grid grid-cols-3 gap-2">
                            <label className={`border dark:border-gray-600 p-2 rounded cursor-pointer text-center text-sm ${localFreq === 'once' ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'dark:text-gray-300'}`}>
                                <input type="radio" name="schFreq" value="once" checked={localFreq === 'once'} onChange={() => setLocalFreq('once')} className="hidden" />
                                Una Vez
                            </label>
                            <label className={`border dark:border-gray-600 p-2 rounded cursor-pointer text-center text-sm ${localFreq === 'weekly' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`}>
                                <input type="radio" name="schFreq" value="weekly" checked={localFreq === 'weekly'} onChange={() => setLocalFreq('weekly')} className="hidden" />
                                Semanal
                            </label>
                            <label className={`border dark:border-gray-600 p-2 rounded cursor-pointer text-center text-sm ${localFreq === 'biweekly' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`}>
                                <input type="radio" name="schFreq" value="biweekly" checked={localFreq === 'biweekly'} onChange={() => setLocalFreq('biweekly')} className="hidden" />
                                Cada 2 Sem.
                            </label>
                            <label className={`border dark:border-gray-600 p-2 rounded cursor-pointer text-center text-sm ${localFreq === 'triweekly' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`}>
                                <input type="radio" name="schFreq" value="triweekly" checked={localFreq === 'triweekly'} onChange={() => setLocalFreq('triweekly')} className="hidden" />
                                Cada 3 Sem.
                            </label>
                            <label className={`border dark:border-gray-600 p-2 rounded cursor-pointer text-center text-sm ${localFreq === 'monthly' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`}>
                                <input type="radio" name="schFreq" value="monthly" checked={localFreq === 'monthly'} onChange={() => setLocalFreq('monthly')} className="hidden" />
                                Mensual
                            </label>
                        </div>
                    </div>

                    {localFreq === 'once' ? (
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha de Entrega</label>
                            <input
                                type="date"
                                value={localDate}
                                onChange={(e) => setLocalDate(e.target.value)}
                                className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Se agendará automáticamente para el día correspondiente.</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Días de Visita <span className="text-xs text-gray-400">(puede elegir varios)</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                {ALL_DAYS.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`p-2 rounded-lg text-xs font-medium transition-all ${
                                            localDays.includes(day)
                                                ? 'bg-blue-500 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                            {localDays.length > 1 && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">📅 {localDays.length} días seleccionados</p>
                            )}
                        </div>
                    )}

                    {/* SECCIÓN PRODUCTOS EN MODAL */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">📦 Productos</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PRODUCTS.map(prod => (
                                <div key={prod.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-600">
                                    <span className="text-[10px] font-medium flex items-center gap-1 dark:text-gray-300">{prod.icon} {prod.short}</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={localProducts[prod.id] || ''}
                                        onChange={(e) => handleProductChange(prod.id, e.target.value)}
                                        className="w-8 p-0.5 text-center border rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Notas del Pedido</label>
                        <textarea
                            value={localNotes}
                            onChange={(e) => setLocalNotes(e.target.value)}
                            className="w-full p-3 border rounded-lg bg-gray-50 h-20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Ej: Pedido especial..."
                        />
                    </div>

                    <Button onClick={handleSubmit} className="w-full mt-2">Confirmar</Button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MODAL AÑADIR/EDITAR NOTA ---
const NoteModal = ({ isOpen, onClose, onSave, editNote }) => {
    const [noteText, setNoteText] = React.useState('');
    const [noteDate, setNoteDate] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            if (editNote) {
                setNoteText(editNote.notes || '');
                setNoteDate(editNote.specificDate || new Date().toISOString().split('T')[0]);
            } else {
                setNoteText('');
                setNoteDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isEditing = !!editNote;

    const handleSubmit = () => {
        if (!noteText.trim()) {
            alert('Escribe una nota.');
            return;
        }
        if (!noteDate) {
            alert('Selecciona una fecha.');
            return;
        }
        onSave(noteText.trim(), noteDate);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 110}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 p-1.5 rounded-lg"><Icons.FileText size={18} /></div>
                        {isEditing ? 'Editar Nota' : 'Añadir Nota'}
                    </h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-gray-50 h-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
                    placeholder="Escribe tu nota aquí... Las URLs serán detectadas automáticamente."
                    autoFocus
                />
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha</label>
                <input
                    type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
                />
                <Button onClick={handleSubmit} className="w-full !bg-yellow-500 hover:!bg-yellow-600 !text-white">
                    <Icons.FileText size={16} /> {isEditing ? 'Guardar Cambios' : 'Añadir Nota'}
                </Button>
            </div>
        </div>
    );
};

const PasteContactModal = ({ isOpen, onClose, onPaste }) => {
     const [text, setText] = React.useState('');

     if (!isOpen) return null;

     const handleConfirm = () => {
         onPaste(text);
         setText('');
     };

     return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 100}}>
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 dark:bg-gray-800">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white">Importar Texto</h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                     Pegá el texto del pedido tal cual te lo envían. Se detectarán automáticamente: nombre, dirección, esquina, teléfono, link de Maps, productos y notas.
                </p>
                <textarea
                    className="w-full border rounded p-3 h-40 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={"Pedido de cliente:\nNombre: JACKELIN\nDirección: LOS EUCALIPTUS M.20\nEsquina: BELEN Y LOS PINOS\nDetalle: LAGOMAR\nhttps://maps.app.goo.gl/...\nTeléfono: 093900109\nBidon: 12Lts 1\nSoda: 0"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <Button onClick={handleConfirm} className="w-full mt-3">Procesar y Agregar</Button>
            </div>
        </div>
     );
};

// --- COMPONENTE MODAL GRUPO FAMILIAR ---
const GroupModal = ({ isOpen, onClose, user, groupData, onGroupUpdate }) => {
    const [activeTab, setActiveTab] = React.useState('info'); // 'info', 'create', 'join'
    const [joinCode, setJoinCode] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [members, setMembers] = React.useState([]);

    React.useEffect(() => {
        if (isOpen && groupData?.groupId) {
            // Cargar miembros del grupo
            db.collection('users')
                .where('groupId', '==', groupData.groupId)
                .get()
                .then(snapshot => {
                    const membersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMembers(membersList);
                });
        }
    }, [isOpen, groupData?.groupId]);

    if (!isOpen) return null;

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    };

    const handleCreateGroup = async () => {
        setLoading(true);
        setError('');
        try {
            const code = generateCode();
            const groupId = `group_${user.uid}_${Date.now()}`;

            // Crear documento del grupo
            await db.collection('groups').doc(groupId).set({
                code: code,
                adminId: user.uid,
                adminEmail: user.email,
                adminName: user.displayName || user.email,
                createdAt: new Date()
            });

            // Actualizar usuario como admin del grupo
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || user.email,
                groupId: groupId,
                role: 'admin',
                joinedAt: new Date()
            }, { merge: true });

            // Migrar datos existentes al grupo (en batches de 450 para respetar límite de 500)
            const allDocs = [];

            const clientsSnap = await db.collection('clients').where('userId', '==', user.uid).get();
            clientsSnap.docs.forEach(doc => allDocs.push(doc.ref));

            const debtsSnap = await db.collection('debts').where('userId', '==', user.uid).get();
            debtsSnap.docs.forEach(doc => allDocs.push(doc.ref));

            const transfersSnap = await db.collection('transfers').where('userId', '==', user.uid).get();
            transfersSnap.docs.forEach(doc => allDocs.push(doc.ref));

            for (let i = 0; i < allDocs.length; i += 450) {
                const batch = db.batch();
                allDocs.slice(i, i + 450).forEach(ref => {
                    batch.update(ref, { groupId: groupId });
                });
                await batch.commit();
            }

            onGroupUpdate({ groupId, role: 'admin', code });
            setActiveTab('info');
        } catch(e) {
            console.error(e);
            setError('Error al crear el grupo');
        }
        setLoading(false);
    };

    const handleJoinGroup = async () => {
        if (joinCode.length !== 6) {
            setError('El código debe tener 6 caracteres');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Buscar grupo por código
            const groupSnap = await db.collection('groups').where('code', '==', joinCode.toUpperCase()).get();

            if (groupSnap.empty) {
                setError('Código no válido');
                setLoading(false);
                return;
            }

            const groupDoc = groupSnap.docs[0];
            const groupId = groupDoc.id;

            // Verificar que no esté ya en un grupo
            if (groupData?.groupId) {
                setError('Ya perteneces a un grupo');
                setLoading(false);
                return;
            }

            // Unirse al grupo como miembro
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || user.email,
                groupId: groupId,
                role: 'member',
                joinedAt: new Date()
            }, { merge: true });

            onGroupUpdate({ groupId, role: 'member' });
            setActiveTab('info');
            setJoinCode('');
        } catch(e) {
            console.error(e);
            setError('Error al unirse al grupo');
        }
        setLoading(false);
    };

    const handleLeaveGroup = async () => {
        setLoading(true);
        try {
            await db.collection('users').doc(user.uid).update({
                groupId: null,
                role: null
            });
            onGroupUpdate(null);
            onClose();
        } catch(e) {
            console.error(e);
            setError('Error al salir del grupo');
        }
        setLoading(false);
    };

    const handleRemoveMember = async (memberId) => {
        if (memberId === user.uid) return;
        setLoading(true);
        try {
            await db.collection('users').doc(memberId).update({
                groupId: null,
                role: null
            });
            setMembers(prev => prev.filter(m => m.id !== memberId));
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleDissolveGroup = async () => {
        if (!window.confirm('¿Estás seguro de disolver el grupo? Todos los miembros serán removidos y los datos volverán a ser solo tuyos.')) return;
        setLoading(true);
        try {
            const groupId = groupData.groupId;

            // Recopilar todos los documentos a actualizar
            const updates = []; // { ref, data }

            const membersSnap = await db.collection('users').where('groupId', '==', groupId).get();
            membersSnap.docs.forEach(doc => updates.push({ ref: doc.ref, data: { groupId: null, role: null } }));

            const clientsSnap = await db.collection('clients').where('groupId', '==', groupId).get();
            clientsSnap.docs.forEach(doc => updates.push({ ref: doc.ref, data: { groupId: null } }));

            const debtsSnap = await db.collection('debts').where('groupId', '==', groupId).get();
            debtsSnap.docs.forEach(doc => updates.push({ ref: doc.ref, data: { groupId: null } }));

            const transfersSnap = await db.collection('transfers').where('groupId', '==', groupId).get();
            transfersSnap.docs.forEach(doc => updates.push({ ref: doc.ref, data: { groupId: null } }));

            // Ejecutar en batches de 450 para respetar límite de 500
            for (let i = 0; i < updates.length; i += 450) {
                const batch = db.batch();
                updates.slice(i, i + 450).forEach(({ ref, data }) => batch.update(ref, data));
                await batch.commit();
            }

            // Eliminar el grupo
            await db.collection('groups').doc(groupId).delete();

            onGroupUpdate(null);
            onClose();
        } catch(e) {
            console.error(e);
            setError('Error al disolver el grupo');
        }
        setLoading(false);
    };

    const isAdmin = groupData?.role === 'admin';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{zIndex: 120}}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg"><Icons.Users size={18} /></div>
                        Grupo Familiar
                    </h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* SIN GRUPO */}
                {!groupData?.groupId ? (
                    <div>
                        {activeTab === 'info' && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Crea un grupo para compartir tu cartera de clientes con tu equipo, o únete a uno existente.
                                </p>
                                <Button onClick={() => setActiveTab('create')} className="w-full">
                                    <Icons.Plus size={16} /> Crear Grupo
                                </Button>
                                <Button variant="secondary" onClick={() => setActiveTab('join')} className="w-full">
                                    Tengo un código
                                </Button>
                            </div>
                        )}

                        {activeTab === 'create' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Al crear un grupo serás el <strong>administrador</strong>. Podrás invitar a otros con un código y ellos tendrán permisos limitados.
                                </p>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-xs text-yellow-700 dark:text-yellow-300">
                                    <strong>Permisos de miembros:</strong> Ver clientes, marcar completados, agregar deudas/transferencias. NO pueden eliminar ni editar clientes.
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setActiveTab('info')} className="flex-1" disabled={loading}>Cancelar</Button>
                                    <Button onClick={handleCreateGroup} className="flex-1 !bg-purple-600" disabled={loading}>
                                        {loading ? 'Creando...' : 'Crear Grupo'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'join' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ingresa el código de 6 caracteres que te compartió el administrador del grupo.
                                </p>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="CÓDIGO"
                                    className="w-full p-4 text-2xl font-bold text-center tracking-[0.5em] border-2 rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                                />
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => { setActiveTab('info'); setJoinCode(''); setError(''); }} className="flex-1" disabled={loading}>Cancelar</Button>
                                    <Button onClick={handleJoinGroup} className="flex-1 !bg-purple-600" disabled={loading || joinCode.length !== 6}>
                                        {loading ? 'Uniendo...' : 'Unirme'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* CON GRUPO */
                    <div className="space-y-4">
                        {/* Info del grupo */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase">
                                        {isAdmin ? '👑 Administrador' : '👤 Miembro'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
                                </div>
                                {isAdmin && groupData.code && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Código</p>
                                        <p className="text-lg font-black text-purple-600 dark:text-purple-400 tracking-wider">{groupData.code}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lista de miembros (solo admin) */}
                        {isAdmin && members.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Miembros ({members.length})</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{member.role === 'admin' ? '👑' : '👤'}</span>
                                                <div>
                                                    <p className="text-sm font-medium dark:text-white">{member.displayName || member.email}</p>
                                                    <p className="text-[10px] text-gray-400">{member.role === 'admin' ? 'Admin' : 'Miembro'}</p>
                                                </div>
                                            </div>
                                            {member.id !== user.uid && member.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"
                                                    disabled={loading}
                                                >
                                                    <Icons.X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Permisos info para miembros */}
                        {!isAdmin && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                                <strong>Tus permisos:</strong> Ver clientes, marcar completados, agregar deudas y transferencias.
                            </div>
                        )}

                        {/* Botón salir (miembros) */}
                        {!isAdmin && (
                            <Button variant="danger" onClick={handleLeaveGroup} className="w-full" disabled={loading}>
                                {loading ? 'Saliendo...' : 'Salir del Grupo'}
                            </Button>
                        )}

                        {/* Botón disolver grupo (admin) */}
                        {isAdmin && (
                            <Button variant="danger" onClick={handleDissolveGroup} className="w-full mt-3" disabled={loading}>
                                {loading ? 'Disolviendo...' : 'Disolver Grupo'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
