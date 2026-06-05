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
                     <Button onClick={() => {
                        if (time && 'Notification' in window && Notification.permission === 'default') {
                            Notification.requestPermission().then(() => onSave(time));
                        } else {
                            onSave(time);
                        }
                     }} className="flex-1">Guardar</Button>
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

    const matchClient = fuzzyMatch(search);
    const filtered = clients.filter(c => matchClient(c.name || '', c.address || '', c.phone || '')).slice(0, 50);

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
                    <Button variant="danger" onClick={() => onSave(client, amount)} className="flex-1 !bg-red-600 !text-white hover:!bg-red-700">
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
                    <Button onClick={async () => { await onSave(debt, amount); onClose(); }} className="flex-1">
                        <Icons.Save size={16}/> Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MODAL VER DEUDAS DE CLIENTE ---
const ViewDebtModal = ({ isOpen, client, debts, onClose, onPaid, onEdit, onAddMore, onSendDebtTotal, onSendReminder }) => {
    if (!isOpen || !client) return null;
    const clientIds = client._mergedIds || [client.id];
    const clientDebts = debts.filter(d => clientIds.indexOf(d.clientId) > -1);
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
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
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
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => onSendDebtTotal(client.phone, total)}
                            className="flex-1 py-2.5 px-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 text-sm transition-colors"
                        >
                            <Icons.MessageCircle size={16} /> Enviar deuda
                        </button>
                        {onSendReminder && (
                            <button
                                onClick={() => onSendReminder(client.phone)}
                                title="Enviar recordatorio amable de saldo pendiente"
                                className="py-2.5 px-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800 font-bold rounded-lg flex items-center justify-center gap-1.5 text-sm transition-colors whitespace-nowrap"
                            >
                                🔔 Recordatorio
                            </button>
                        )}
                    </div>
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
            // Cargar días asignados, o resetear al default
            if (client.visitDays && client.visitDays.length > 0) {
                setLocalDays(client.visitDays);
            } else if (client.visitDay && client.visitDay !== 'Sin Asignar') {
                setLocalDays([client.visitDay]);
            } else {
                setLocalDays(['Lunes']);
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
                            {getPickerProducts(client && client.products).map(prod => (
                                <div key={prod.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-600">
                                    <span className="text-[11px] font-medium flex items-center gap-1 dark:text-gray-300"><ProductGlyph product={prod} size={14} /> {prod.short}</span>
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
    }, [isOpen, editNote]);

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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-5 max-h-[92vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        📝 {isEditing ? 'Editar Nota' : 'Añadir Nota'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500">✕</button>
                </div>
                <div className="min-w-0">
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full p-3 border rounded-lg bg-gray-50 h-56 sm:h-80 resize-y leading-relaxed dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
                        placeholder="Escribe tu nota aquí... Las URLs serán detectadas automáticamente."
                        autoFocus
                    />
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha</label>
                    <input
                        type="date"
                        value={noteDate}
                        onChange={(e) => setNoteDate(e.target.value)}
                        className="w-full min-w-0 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
                        style={{maxWidth: '100%'}}
                    />
                    <Button onClick={handleSubmit} className="w-full !bg-yellow-500 hover:!bg-yellow-600 !text-white">
                        📝 {isEditing ? 'Guardar Cambios' : 'Añadir Nota'}
                    </Button>
                </div>
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

// --- COMPONENTE MODAL EDITAR CLIENTE RÁPIDO (Directorio) ---
const EditClientQuickModal = ({ isOpen, client, onClose, onSave, showClientInfo, inline }) => {
    const [name, setName] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [mapsLink, setMapsLink] = React.useState('');
    const [products, setProducts] = React.useState({});
    const [notes, setNotes] = React.useState('');
    const [freq, setFreq] = React.useState('weekly');
    const [startDate, setStartDate] = React.useState('');
    // Sección "Datos del cliente": colapsada por defecto (como la app nativa).
    // infoOpen = visible ahora; infoTouched = se abrió alguna vez (para saber si guardar esos campos).
    const [infoOpen, setInfoOpen] = React.useState(!!showClientInfo);
    const [infoTouched, setInfoTouched] = React.useState(!!showClientInfo);

    const FREQ_OPTIONS = [
        { key: 'weekly', label: 'Semanal' },
        { key: 'biweekly', label: 'Quincenal' },
        { key: 'triweekly', label: 'Cada 3 sem' },
        { key: 'monthly', label: 'Mensual' },
        { key: 'once', label: 'Una vez' },
        { key: 'on_demand', label: 'Solo Directorio' },
    ];

    const needsStartDate = freq === 'weekly' || freq === 'biweekly' || freq === 'triweekly' || freq === 'monthly';
    const needsSpecificDate = freq === 'once';

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T12:00:00');
        if (isNaN(d.getTime())) return dateStr;
        var dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return dayNames[d.getDay()] + ' ' + d.getDate() + ' de ' + monthNames[d.getMonth()];
    };

    React.useEffect(() => {
        if (client) {
            setName(client.name || '');
            setAddress(client.address || '');
            setPhone(client.phone || '');
            setMapsLink(client.mapsLink || '');
            setNotes(client.notes || '');
            setFreq(client.freq || 'weekly');
            setStartDate(client.specificDate || '');
            var prods = {};
            PRODUCTS.forEach(function(p) {
                prods[p.id] = parseInt(client.products?.[p.id] || 0, 10);
            });
            setProducts(prods);
            setInfoOpen(!!showClientInfo);
            setInfoTouched(!!showClientInfo);
        }
    }, [client, showClientInfo]);

    if (!isOpen || !client) return null;

    const adjustQty = (productId, delta) => {
        setProducts(prev => ({
            ...prev,
            [productId]: Math.max(0, (prev[productId] || 0) + delta)
        }));
    };

    const handleSave = () => {
        if (needsSpecificDate && !startDate) return;
        var cleanProducts = {};
        Object.entries(products).forEach(function([key, val]) {
            if (val > 0) cleanProducts[key] = val;
        });
        var data = {
            products: cleanProducts,
            notes: notes,
            freq: freq,
        };
        if (needsStartDate && startDate) {
            data.specificDate = startDate;
        } else if (needsSpecificDate && startDate) {
            data.specificDate = startDate;
        } else if (!needsStartDate && !needsSpecificDate) {
            data.specificDate = '';
        }
        if (infoTouched) {
            data.name = name.trim();
            data.address = address.trim();
            data.phone = phone.trim();
            data.mapsLink = mapsLink.trim();
        }
        onSave(client.id, data);
        onClose();
    };

    const panelInner = (
        <div className={inline
            ? "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-full flex flex-col max-h-[calc(100vh-7rem)]"
            : "bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col"}>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold dark:text-white">
                        {infoOpen ? 'Editar Cliente' : (client.name || '').toUpperCase()}
                    </h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-5">
                    {!infoOpen ? (
                        <button
                            type="button"
                            onClick={() => { setInfoOpen(true); setInfoTouched(true); }}
                            className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                            <span className="text-lg" aria-hidden="true">👤</span>
                            <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200">Editar datos del cliente</span>
                            <span className="text-gray-400 dark:text-gray-500 text-lg leading-none">›</span>
                        </button>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Datos del cliente</p>
                                <button type="button" onClick={() => setInfoOpen(false)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Ocultar</button>
                            </div>
                            <div className="space-y-2">
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                                <input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="URL Google Maps" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" autoCapitalize="off" />
                            </div>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Productos</p>
                        <div className="space-y-1">
                            {getPickerProducts(client && client.products).map(p => (
                                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><ProductGlyph product={p} size={20} /> {p.label}</span>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => adjustQty(p.id, -1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">−</button>
                                        <span className="text-base font-bold text-gray-900 dark:text-white w-6 text-center">{products[p.id] || 0}</span>
                                        <button type="button" onClick={() => adjustQty(p.id, 1)} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-lg font-bold text-white hover:bg-blue-700">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Notas</p>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas del cliente..." className="w-full p-3 border rounded-lg bg-gray-50 h-20 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Frecuencia</p>
                        <div className="flex flex-wrap gap-2">
                            {FREQ_OPTIONS.map(f => (
                                <button key={f.key} type="button" onClick={() => setFreq(f.key)} className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${freq === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {needsStartDate && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Fecha de inicio</p>
                            {startDate ? (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-2">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{formatDisplayDate(startDate)}</span>
                                    <button type="button" onClick={() => setStartDate('')} className="text-xs font-semibold text-red-500 hover:text-red-600">Quitar</button>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Selecciona desde cuándo inicia la frecuencia</p>
                            )}
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    )}
                    {needsSpecificDate && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Fecha del pedido</p>
                            {startDate ? (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-2">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{formatDisplayDate(startDate)}</span>
                                    <button type="button" onClick={() => setStartDate('')} className="text-xs font-semibold text-red-500 hover:text-red-600">Quitar</button>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Selecciona la fecha para este pedido</p>
                            )}
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <Button onClick={handleSave} className={`w-full ${needsSpecificDate && !startDate ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Icons.Save size={16} /> Guardar
                    </Button>
                </div>
        </div>
    );

    if (inline) return panelInner;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{zIndex: 110}}>
            {panelInner}
        </div>
    );
};


// --- COMPONENTE MODAL RELACIONES FAMILIARES ---
const RelationshipsModal = ({ isOpen, client, allClients, onClose, onAdd, onRemove }) => {
    const [search, setSearch] = React.useState('');
    const [picking, setPicking] = React.useState(null);

    React.useEffect(() => { if (isOpen) { setSearch(''); setPicking(null); } }, [isOpen, client]);

    if (!isOpen || !client) return null;

    const rels = client.relationships || {};
    const relIds = Object.keys(rels);
    const related = relIds
        .map(id => ({ id: id, type: rels[id], c: (allClients || []).find(x => x.id === id) }))
        .filter(r => r.c);

    let candidates = [];
    if (search.trim()) {
        const m = fuzzyMatch(search);
        candidates = (allClients || [])
            .filter(c => !c.isNote && c.id !== client.id && relIds.indexOf(c.id) === -1 && m(c.name || '', c.address || '', c.phone || ''))
            .slice(0, 8);
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ zIndex: 110 }}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">👨‍👩‍👧 Familia · {(client.name || '').toUpperCase()}</h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {/* Relaciones actuales */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Vínculos ({related.length})</p>
                        {related.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">Sin familiares vinculados todavía.</p>}
                        <div className="space-y-1.5">
                            {related.map(r => (
                                <div key={r.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{(r.c.name || '').toUpperCase()}</p>
                                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{RELATIONSHIP_LABELS[r.type] || r.type}</p>
                                    </div>
                                    <button onClick={() => onRemove(client.id, r.id)} className="text-xs font-bold text-red-500 hover:text-red-600 flex-shrink-0 ml-2">Quitar</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Agregar vínculo */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Agregar familiar</p>
                        {!picking ? (
                            <div>
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente por nombre, dirección o teléfono..." className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                <div className="mt-2 space-y-1">
                                    {candidates.map(c => (
                                        <button key={c.id} onClick={() => setPicking(c)} className="w-full text-left bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 hover:border-blue-300 dark:hover:border-blue-600">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{(c.name || '').toUpperCase()}</p>
                                            {c.address && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{c.address}</p>}
                                        </button>
                                    ))}
                                    {search.trim() && candidates.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 px-1">Sin resultados.</p>}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Vincular a <span className="font-bold">{(picking.name || '').toUpperCase()}</span> como:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {RELATIONSHIP_TYPES.map(t => (
                                        <button key={t} onClick={() => { onAdd(client.id, picking.id, t); setPicking(null); setSearch(''); }} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600">
                                            {RELATIONSHIP_LABELS[t]}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setPicking(null)} className="mt-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">← Elegir otro cliente</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE MODAL PEDIDO CON IA ---
const SmartOrderModal = ({ isOpen, onClose, onInterpret, onConfirm }) => {
    const [text, setText] = React.useState('');
    const [result, setResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');

    React.useEffect(() => { if (isOpen) { setText(''); setResult(null); setError(''); setLoading(false); setSaving(false); } }, [isOpen]);
    if (!isOpen) return null;

    const prodStr = (obj) => {
        if (!obj) return '';
        return Object.keys(obj).filter(k => obj[k] > 0).map(k => { const p = PRODUCTS.find(x => x.id === k); return obj[k] + 'x ' + (p ? p.short : k); }).join(', ');
    };

    const interpret = async () => {
        if (!text.trim() || loading) return;
        setLoading(true); setError(''); setResult(null);
        try { const r = await onInterpret(text.trim()); if (r && r.tool) setResult(r); else setError('No se pudo interpretar el texto.'); }
        catch (e) { setError((e && e.message) || 'Error al interpretar.'); }
        finally { setLoading(false); }
    };
    const confirm = async () => {
        if (!result || saving) return;
        setSaving(true); setError('');
        try { await onConfirm(result); onClose(); }
        catch (e) { setError((e && e.message) || 'Error al guardar.'); setSaving(false); }
    };

    const i = result ? (result.input || {}) : {};
    const canConfirm = result && result.tool !== 'report_not_found';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ zIndex: 110 }}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[88vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">✨ Pedido con IA</h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Escribí o pegá el pedido en lenguaje natural. Ej: <span className="italic">"Juan García, Belgrano 432, los lunes 2 bidones de 20L y un sifón"</span>.</p>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Pegá el pedido acá..." className="w-full h-28 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <button onClick={interpret} disabled={loading || !text.trim()} className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${loading || !text.trim() ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>{loading ? 'Interpretando…' : '✨ Interpretar'}</button>

                    {error && <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">{error}</div>}

                    {result && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30 text-sm space-y-1">
                            {result.tool === 'report_not_found' && <p className="text-amber-700 dark:text-amber-300">No encontré el cliente <b>{i.mentioned_name}</b>.{i.reason ? ' ' + i.reason : ''}</p>}
                            {result.tool === 'create_new_client' && (<>
                                <p className="font-bold text-green-700 dark:text-green-400">Crear cliente nuevo</p>
                                <p className="dark:text-gray-200"><b>{(i.name || '').toUpperCase()}</b>{i.phone ? ' · ' + i.phone : ''}</p>
                                {i.address && <p className="text-gray-500 dark:text-gray-400">📍 {i.address}</p>}
                                <p className="text-gray-600 dark:text-gray-300">{[i.freq, i.visitDay, i.specificDate].filter(Boolean).join(' · ')}</p>
                                {prodStr(i.products) && <p className="text-gray-600 dark:text-gray-300">📦 {prodStr(i.products)}</p>}
                            </>)}
                            {result.tool === 'schedule_existing_client' && (<>
                                <p className="font-bold text-blue-700 dark:text-blue-400">Agendar pedido</p>
                                <p className="dark:text-gray-200"><b>{(i.matched_client_name || '').toUpperCase()}</b></p>
                                <p className="text-gray-600 dark:text-gray-300">{[i.freq, i.visitDay, i.specificDate].filter(Boolean).join(' · ')}</p>
                                {prodStr(i.products) && <p className="text-gray-600 dark:text-gray-300">📦 {prodStr(i.products)}</p>}
                                {prodStr(i.add_products) && <p className="text-green-600 dark:text-green-400">+ {prodStr(i.add_products)}</p>}
                                {prodStr(i.remove_products) && <p className="text-red-600 dark:text-red-400">− {prodStr(i.remove_products)}</p>}
                            </>)}
                            {result.tool === 'merge_products_into_order' && (<>
                                <p className="font-bold text-blue-700 dark:text-blue-400">Modificar pedido</p>
                                <p className="dark:text-gray-200"><b>{(i.matched_client_name || '').toUpperCase()}</b></p>
                                {prodStr(i.add_products) && <p className="text-green-600 dark:text-green-400">+ {prodStr(i.add_products)}</p>}
                                {prodStr(i.remove_products) && <p className="text-red-600 dark:text-red-400">− {prodStr(i.remove_products)}</p>}
                            </>)}
                            {result.tool === 'update_client_data' && (<>
                                <p className="font-bold text-blue-700 dark:text-blue-400">Actualizar datos</p>
                                <p className="dark:text-gray-200"><b>{(i.matched_client_name || '').toUpperCase()}</b></p>
                                {i.address && <p className="text-gray-500 dark:text-gray-400">📍 {i.address}</p>}
                                {i.phone && <p className="text-gray-500 dark:text-gray-400">📞 {i.phone}</p>}
                                {i.mapsLink && <p className="text-gray-500 dark:text-gray-400 truncate">🗺️ {i.mapsLink}</p>}
                            </>)}
                            {result.tool === 'add_standalone_note' && (<>
                                <p className="font-bold text-amber-700 dark:text-amber-400">Nota suelta</p>
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">📝 {i.notes}</p>
                                {i.specificDate && <p className="text-gray-500 dark:text-gray-400">📆 {i.specificDate}</p>}
                            </>)}
                        </div>
                    )}
                </div>
                {canConfirm && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                        <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold">Cancelar</button>
                        <button onClick={confirm} disabled={saving} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold disabled:opacity-50">{saving ? 'Guardando…' : '✓ Confirmar'}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

