// --- APP: Componente principal ---

// Columnas de la vista tabla (registro). Anchos ajustables arrastrando el borde derecho.
const TABLE_COLUMNS = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'phone', label: 'Teléfono', sortable: true },
    { key: 'address', label: 'Dirección', sortable: true },
    { key: 'freq', label: 'Frecuencia', sortable: true },
    { key: 'days', label: 'Días', sortable: false },
    { key: 'debt', label: 'Deuda', sortable: true },
    { key: 'products', label: 'Productos', sortable: false },
    { key: 'actions', label: 'Acciones', sortable: false },
];
const DEFAULT_COL_WIDTHS = { name: 200, phone: 150, address: 380, freq: 120, days: 130, debt: 100, products: 320, actions: 150 };

// Columnas de la tabla de Inicio (día seleccionado). Anchos ajustables igual que el Directorio.
const HOME_TABLE_COLUMNS = [
    { key: 'pos', label: '#' },
    { key: 'name', label: 'Cliente' },
    { key: 'address', label: 'Dirección' },
    { key: 'products', label: 'Productos' },
    { key: 'visit', label: 'Visita' },
    { key: 'debt', label: 'Deuda' },
    { key: 'actions', label: 'Acciones' },
];
const DEFAULT_HOME_COL_WIDTHS = { pos: 48, name: 210, address: 310, products: 230, visit: 120, debt: 100, actions: 210 };

// Etiqueta + color del badge de frecuencia (unifica los switch repetidos del Directorio).
const FREQ_BADGES = {
    weekly: { label: 'Semanal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    biweekly: { label: 'Quincenal', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    triweekly: { label: 'Cada 3 sem', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    monthly: { label: 'Mensual', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    once: { label: 'Una vez', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    on_demand: { label: 'Directorio', color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};
const getFreqBadge = (freq) => FREQ_BADGES[freq] || { label: freq || '', color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' };

// Orden extremo de un día (para insertar al inicio o al final de la lista de ese día).
// mode: 'min' (default 0 si vacío) | 'max' (default -1 si vacío). excludeId omite ese cliente.
// normalize (default true) reemplaza órdenes gigantes (> 100000, timestamps legacy) por 0.
const dayExtremeOrder = (clientsList, day, mode, excludeId, normalize) => {
    if (normalize === undefined) normalize = true;
    const inDay = clientsList.filter(c =>
        (!excludeId || c.id !== excludeId) &&
        c.freq !== 'on_demand' && !c.isCompleted &&
        ((c.visitDays && c.visitDays.includes(day)) || c.visitDay === day)
    );
    if (inDay.length === 0) return mode === 'max' ? -1 : 0;
    const orders = inDay.map(c => {
        const o = c.listOrders?.[day] ?? c.listOrder ?? 0;
        return (normalize && o > 100000) ? 0 : o;
    });
    return mode === 'max' ? Math.max(...orders) : Math.min(...orders);
};

function App() {
    const [view, setView] = React.useState('list');
    // Detecta pantalla ancha (escritorio): Inicio se muestra como tablero semanal de ancho completo.
    const [isWide, setIsWide] = React.useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    React.useEffect(() => {
        const onResize = () => setIsWide(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const [clients, setClients] = React.useState([]);
    // Ref sincrónico: siempre tiene los datos más recientes de clients
    // (incluyendo updates optimistas), evita race conditions en reorder
    const clientsRef = React.useRef(clients);
    clientsRef.current = clients;
    const [editingId, setEditingId] = React.useState(null);
    const [isCloudActive, setIsCloudActive] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [loadingAuth, setLoadingAuth] = React.useState(true);
    const [selectedDay, setSelectedDay] = React.useState('Lunes');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [directoryFilter, setDirectoryFilter] = React.useState('all');
    const [listSearchTerm, setListSearchTerm] = React.useState('');
    const [activeFilters, setActiveFilters] = React.useState([]); // ['once_starred', 'b20', 'b12', etc.]
    const [showFilterMenu, setShowFilterMenu] = React.useState(false);
    const [scheduleClient, setScheduleClient] = React.useState(null);
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, title: '', message: '', action: null, isDanger: true });
    const [formData, setFormData] = React.useState({
        name: '', phone: '', address: '', lat: '', lng: '', freq: 'weekly', visitDay: 'Lunes', visitDays: ['Lunes'], notes: '', locationInput: '', specificDate: '',
        products: { b20: '', b12: '', b6: '', soda: '', bombita: '', disp_elec_new: '', disp_elec_chg: '', disp_nat: '' }
    });
const [toast, setToast] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    const [swUpdate, setSwUpdate] = React.useState(false);
    const [installPrompt, setInstallPrompt] = React.useState(null);
    const [showPasteModal, setShowPasteModal] = React.useState(false);
    
    // --- ESTADO ALARMA ---
    const [alarmModal, setAlarmModal] = React.useState({ isOpen: false, clientId: null, currentVal: '' });
    const [activeAlert, setActiveAlert] = React.useState(null);

    // --- ESTADO MENÚ SECCIONES ---
    const [activeSection, setActiveSection] = React.useState('cartera'); // 'cartera', 'deudas', 'transferencias'
    const [showSectionMenu, setShowSectionMenu] = React.useState(false);


    // --- ESTADO EDICIÓN RÁPIDA CLIENTE ---
    const [quickEditClient, setQuickEditClient] = React.useState(null);
    const [quickEditShowInfo, setQuickEditShowInfo] = React.useState(false);

    // --- ESTADO VISTA TABLA (registro de escritorio) ---
    const [tableSelectedClient, setTableSelectedClient] = React.useState(null);
    const [tableSort, setTableSort] = React.useState({ key: 'name', dir: 'asc' });
    const toggleTableSort = (key) => setTableSort(s => s.key === key ? { key: key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: key, dir: 'asc' });
    const [colWidths, setColWidths] = React.useState(() => {
        try { const s = localStorage.getItem('rw_tableColWidths_v2'); if (s) return { ...DEFAULT_COL_WIDTHS, ...JSON.parse(s) }; } catch (e) {}
        return DEFAULT_COL_WIDTHS;
    });
    React.useEffect(() => {
        try { localStorage.setItem('rw_tableColWidths_v2', JSON.stringify(colWidths)); } catch (e) {}
    }, [colWidths]);
    const tableRef = React.useRef(null);

    // Anchos de la tabla de Inicio (independientes del Directorio).
    const [homeColWidths, setHomeColWidths] = React.useState(() => {
        try { const s = localStorage.getItem('rw_homeColWidths_v1'); if (s) return { ...DEFAULT_HOME_COL_WIDTHS, ...JSON.parse(s) }; } catch (e) {}
        return DEFAULT_HOME_COL_WIDTHS;
    });
    React.useEffect(() => {
        try { localStorage.setItem('rw_homeColWidths_v1', JSON.stringify(homeColWidths)); } catch (e) {}
    }, [homeColWidths]);
    const homeTableRef = React.useRef(null);

    // Redimensionado genérico de columnas: lo que crece una columna lo cede su vecina,
    // así la tabla siempre llena el cuadro. Compartido por Directorio e Inicio.
    const resizeColumn = (key, e, columns, widths, setWidths, tableEl) => {
        e.preventDefault();
        const idx = columns.findIndex(c => c.key === key);
        const nextCol = columns[idx + 1];
        if (!nextCol) return; // última columna: queda fija contra el borde del cuadro
        const nextKey = nextCol.key;
        const totalWeight = columns.reduce((s, c) => s + (widths[c.key] || 100), 0);
        const tableW = (tableEl && tableEl.offsetWidth) || 1200;
        const pxToWeight = totalWeight / tableW; // cuánto "peso" equivale a 1px en pantalla
        const MINW = 45;
        const startX = e.clientX;
        const startW = widths[key] || 100;
        const startNextW = widths[nextKey] || 100;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        const onMove = (ev) => {
            let dW = (ev.clientX - startX) * pxToWeight;
            if (startW + dW < MINW) dW = MINW - startW;
            if (startNextW - dW < MINW) dW = startNextW - MINW;
            setWidths(prev => ({ ...prev, [key]: startW + dW, [nextKey]: startNextW - dW }));
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };
    const startColResize = (key, e) => resizeColumn(key, e, TABLE_COLUMNS, colWidths, setColWidths, tableRef.current);
    const startHomeColResize = (key, e) => resizeColumn(key, e, HOME_TABLE_COLUMNS, homeColWidths, setHomeColWidths, homeTableRef.current);

    // --- VISTA SEMANA (tablero por día con arrastrar para cambiar de día) ---
    const dragInfoRef = React.useRef(null);
    const [dragOverDay, setDragOverDay] = React.useState(null);
    const [weekFilter, setWeekFilter] = React.useState('all');
    const handleMoveClientDay = async (client, fromDay, toDay) => {
        if (!client || fromDay === toDay) return;
        const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const current = (Array.isArray(client.visitDays) && client.visitDays.length > 0) ? client.visitDays.slice() : (client.visitDay ? [client.visitDay] : []);
        let next = current.filter(d => d !== fromDay);
        if (next.indexOf(toDay) === -1) next.push(toDay);
        next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
        try {
            await firestoreRetry(() => db.collection('clients').doc(client.id).update({ visitDays: next, visitDay: next[0] || '', updatedAt: new Date() }));
            showUndoToast(`${client.name || 'Cliente'} → ${toDay}`, async () => {
                try { await db.collection('clients').doc(client.id).update({ visitDays: current, visitDay: current[0] || '', updatedAt: new Date() }); } catch (e) {}
            });
        } catch (e) { showUndoToast(getErrorMessage(e), null); }
    };

    // --- RELACIONES FAMILIARES (bidireccional en batch, como la app nativa) ---
    const [relationshipClient, setRelationshipClient] = React.useState(null);
    const handleAddRelationship = async (clientId, targetId, type) => {
        try {
            const inverse = RELATIONSHIP_INVERSE[type] || 'otro';
            const batch = db.batch();
            batch.update(db.collection('clients').doc(clientId), { ['relationships.' + targetId]: type, updatedAt: new Date() });
            batch.update(db.collection('clients').doc(targetId), { ['relationships.' + clientId]: inverse, updatedAt: new Date() });
            await firestoreRetry(() => batch.commit());
        } catch (e) { showUndoToast(getErrorMessage(e), null); }
    };
    const handleRemoveRelationship = async (clientId, targetId) => {
        try {
            const del = firebase.firestore.FieldValue.delete();
            const batch = db.batch();
            batch.update(db.collection('clients').doc(clientId), { ['relationships.' + targetId]: del });
            batch.update(db.collection('clients').doc(targetId), { ['relationships.' + clientId]: del });
            await firestoreRetry(() => batch.commit());
        } catch (e) { showUndoToast(getErrorMessage(e), null); }
    };

    // --- PEDIDO CON IA (mismo endpoint que la app nativa) ---
    const [smartOrderOpen, setSmartOrderOpen] = React.useState(false);
    const AI_ENDPOINT = 'https://rutawater-api.netlify.app/api/parse-order';

    const aiResolveNotes = (current, newNotes, mode) => {
        current = current || '';
        if (mode === 'clear') return '';
        if (mode === 'replace') return (newNotes || '').trim();
        if (mode === 'append') {
            const add = (newNotes || '').trim();
            if (!add) return undefined;
            return current ? (current + '\n' + add) : add;
        }
        return undefined; // 'keep' o sin modo → no tocar
    };

    const aiParseOrder = async (text) => {
        // Lista de clientes deduplicada (igual que la nativa): agrupa por nombre|teléfono
        // y descarta el on_demand si hay una versión activa.
        const baseList = clients.filter(c => c.name && !c.isNote);
        const groups = {};
        baseList.forEach(c => {
            const key = (c.name || '').toLowerCase().trim() + '|' + (c.phone || '').replace(/\D/g, '');
            (groups[key] = groups[key] || []).push(c);
        });
        const visible = [];
        Object.keys(groups).forEach(k => {
            const g = groups[k];
            const hasActive = g.some(c => c.freq && c.freq !== 'on_demand');
            g.forEach(c => { if (hasActive && c.freq === 'on_demand') return; visible.push(c); });
        });
        const payloadClients = visible.map(c => {
            const products = {};
            if (c.products) Object.keys(c.products).forEach(k => { const n = parseInt(c.products[k] || 0, 10); if (n > 0) products[k] = n; });
            return { id: c.id, name: c.name, address: c.address || '', freq: c.freq || 'on_demand', visitDay: c.visitDay || '', specificDate: c.specificDate || '', products: products, notes: c.notes || '' };
        });
        const todayIso = new Date().toISOString().slice(0, 10);
        const headers = { 'Content-Type': 'application/json' };
        try { const cu = firebase.auth().currentUser; if (cu) { const tk = await cu.getIdToken(); if (tk) headers.Authorization = 'Bearer ' + tk; } } catch (e) {}
        const res = await fetch(AI_ENDPOINT, { method: 'POST', headers: headers, body: JSON.stringify({ text: text, clients: payloadClients, todayIso: todayIso }) });
        if (!res.ok) { let b = {}; try { b = await res.json(); } catch (e) {} throw new Error(b.error || ('HTTP ' + res.status)); }
        return await res.json();
    };

    const handleAiConfirm = async (result) => {
        if (!result || !result.tool) return;
        const i = result.input || {};
        if (result.tool === 'create_new_client') {
            const products = {};
            Object.keys(i.products || {}).forEach(k => { const n = parseInt(i.products[k] || 0, 10); if (n > 0) products[k] = n; });
            const newData = {
                name: sanitizeString(i.name || '', 100), phone: sanitizePhone(i.phone || ''), address: sanitizeString(i.address || '', 200),
                lat: '', lng: '', mapsLink: (i.mapsLink || ''), ...getDataScope(), userId: user.uid,
                freq: i.freq || 'on_demand', visitDay: i.visitDay || (i.freq && i.freq !== 'on_demand' ? '' : 'Sin Asignar'),
                visitDays: i.visitDay ? [i.visitDay] : [], specificDate: i.specificDate || '',
                notes: sanitizeString(i.notes || '', 500), updatedAt: new Date(), startWeek: getWeekNumber(new Date()), listOrder: Date.now(), isPinned: false, products: products
            };
            await firestoreRetry(() => db.collection('clients').add(newData));
            showUndoToast('Cliente "' + (i.name || '') + '" creado.', null);
            return;
        }
        if (result.tool === 'add_standalone_note') {
            if (!i.notes || !i.notes.trim() || !i.specificDate) throw new Error('Falta texto o fecha de la nota.');
            await handleSaveNote(i.notes.trim(), i.specificDate);
            return;
        }
        // Tools que requieren un cliente existente
        const client = clients.find(c => c.id === i.matched_client_id);
        if (!client) throw new Error('No se encontró el cliente en la lista actual.');
        if (result.tool === 'merge_products_into_order') {
            const merged = {};
            if (client.products) Object.keys(client.products).forEach(k => { const n = parseInt(client.products[k] || 0, 10); if (n > 0) merged[k] = n; });
            Object.keys(i.add_products || {}).forEach(k => { if (i.add_products[k] > 0) merged[k] = (merged[k] || 0) + i.add_products[k]; });
            Object.keys(i.remove_products || {}).forEach(k => { if (i.remove_products[k] > 0 && merged[k]) { const nx = merged[k] - i.remove_products[k]; if (nx > 0) merged[k] = nx; else delete merged[k]; } });
            const updates = { products: merged, updatedAt: new Date() };
            const nn = aiResolveNotes(client.notes, i.notes, i.notes_mode);
            if (nn !== undefined) updates.notes = nn;
            await firestoreRetry(() => db.collection('clients').doc(client.id).update(updates));
            showUndoToast('Pedido de ' + (i.matched_client_name || client.name) + ' actualizado.', null);
            return;
        }
        if (result.tool === 'update_client_data') {
            const updates = {};
            if (i.mapsLink) updates.mapsLink = i.mapsLink;
            if (i.address) updates.address = sanitizeString(i.address, 200);
            if (i.phone) updates.phone = sanitizePhone(i.phone);
            const nn = aiResolveNotes(client.notes, i.notes, i.notes_mode);
            if (nn !== undefined) updates.notes = nn;
            if (Object.keys(updates).length === 0) throw new Error('No detecté datos para actualizar.');
            updates.updatedAt = new Date();
            await firestoreRetry(() => db.collection('clients').doc(client.id).update(updates));
            showUndoToast('Datos de ' + (i.matched_client_name || client.name) + ' actualizados.', null);
            return;
        }
        if (result.tool === 'schedule_existing_client') {
            const isCancellation = i.freq === 'on_demand' || (!i.visitDay && !i.specificDate && i.freq !== 'keep');
            if (isCancellation) throw new Error('La IA no puede cancelar pedidos. Usá los botones de la app (Eliminar / Quitar del día).');
            const days = i.visitDay ? [i.visitDay] : ((client.visitDays && client.visitDays.length) ? client.visitDays : (client.visitDay ? [client.visitDay] : []));
            const freq = i.freq === 'keep' ? client.freq : i.freq;
            const resolvedNotes = aiResolveNotes(client.notes, i.notes, i.notes_mode);
            const notesToPass = resolvedNotes !== undefined ? resolvedNotes : (client.notes || '');
            const hasAbsoluteSet = i.products && typeof i.products === 'object' && Object.keys(i.products).length > 0;
            const hasDelta = (i.add_products && Object.keys(i.add_products).length > 0) || (i.remove_products && Object.keys(i.remove_products).length > 0);
            let productsToPass;
            if (hasAbsoluteSet) productsToPass = i.products;
            else if (hasDelta) {
                productsToPass = {};
                if (client.products) Object.keys(client.products).forEach(k => { const n = parseInt(client.products[k] || 0, 10); if (n > 0) productsToPass[k] = n; });
                Object.keys(i.add_products || {}).forEach(k => { if (i.add_products[k] > 0) productsToPass[k] = (productsToPass[k] || 0) + i.add_products[k]; });
                Object.keys(i.remove_products || {}).forEach(k => { if (i.remove_products[k] > 0 && productsToPass[k]) { const nx = productsToPass[k] - i.remove_products[k]; if (nx > 0) productsToPass[k] = nx; else delete productsToPass[k]; } });
            } else productsToPass = client.products || {};
            await handleScheduleFromDirectory(client, days, freq, i.specificDate || '', notesToPass, productsToPass);
            showUndoToast('Pedido de ' + (i.matched_client_name || client.name) + ' actualizado.', null);
            return;
        }
    };

    // --- CATÁLOGO DE PRODUCTOS (editor; escribe en settings como la app nativa) ---
    const [catalogOpen, setCatalogOpen] = React.useState(false);
    const saveCatalogPatch = async (patch) => {
        try { await firestoreRetry(() => db.collection('settings').doc(groupData?.groupId || user.uid).set(patch, { merge: true })); }
        catch (e) { showUndoToast(getErrorMessage(e), null); }
    };
    const catalogRename = (id, label) => saveCatalogPatch({ productNames: { ...(appSettings?.productNames || {}), [id]: label } });
    const catalogSetEmoji = (id, emoji) => saveCatalogPatch({ productEmojis: { ...(appSettings?.productEmojis || {}), [id]: emoji } });
    const catalogToggleHidden = (id) => {
        const cur = Array.isArray(appSettings?.productHidden) ? appSettings.productHidden : [];
        const next = cur.indexOf(id) > -1 ? cur.filter(x => x !== id) : cur.concat([id]);
        saveCatalogPatch({ productHidden: next });
    };
    const catalogAddProduct = (label, emoji, short) => {
        const cur = Array.isArray(appSettings?.customProducts) ? appSettings.customProducts : [];
        const newProd = { id: 'custom_' + Date.now(), label: label, emoji: emoji || '📦', short: short || label.slice(0, 12) };
        saveCatalogPatch({ customProducts: cur.concat([newProd]) });
    };
    const catalogRemoveCustom = (id) => {
        const cur = Array.isArray(appSettings?.customProducts) ? appSettings.customProducts : [];
        saveCatalogPatch({ customProducts: cur.filter(p => p.id !== id) });
    };
    const catalogMove = (id, dir) => {
        const ids = PRODUCTS.map(p => p.id);
        const idx = ids.indexOf(id);
        const swap = idx + dir;
        if (idx < 0 || swap < 0 || swap >= ids.length) return;
        const t = ids[idx]; ids[idx] = ids[swap]; ids[swap] = t;
        saveCatalogPatch({ productOrder: ids });
    };

    // --- CLONAR CLIENTE (duplica datos básicos al directorio, como la app nativa) ---
    const handleCloneClient = async (client) => {
        if (!client) return;
        try {
            const newData = {
                ...getDataScope(), userId: user.uid,
                name: client.name || '', phone: client.phone || '', address: client.address || '',
                lat: client.lat || '', lng: client.lng || '', mapsLink: client.mapsLink || '', notes: client.notes || '',
                freq: 'on_demand', visitDay: 'Sin Asignar', visitDays: [], specificDate: '',
                products: client.products || {}, listOrder: Date.now(), listOrders: {},
                isCompleted: false, isStarred: false, isPinned: false, isNote: false, alarm: '',
                startWeek: getWeekNumber(new Date()), updatedAt: new Date()
            };
            await firestoreRetry(() => db.collection('clients').add(newData));
            showUndoToast('Cliente "' + (client.name || '') + '" clonado al directorio.', null);
        } catch (e) { showUndoToast(getErrorMessage(e), null); }
    };

    // --- TEMA CLARO / OSCURO (toggle manual, persistido) ---
    const [darkOn, setDarkOn] = React.useState(() => { try { return document.documentElement.classList.contains('dark'); } catch (e) { return true; } });
    const toggleTheme = () => {
        const next = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', next);
        try { localStorage.setItem('rw_theme', next ? 'dark' : 'light'); } catch (e) {}
        setDarkOn(next);
    };

    // --- Helpers de deudas (compartidos por tarjetas móviles y tabla de escritorio) ---
    const confirmPayOneDebt = (debt) => setConfirmModal({
        isOpen: true, title: '¿Deuda pagada?', message: `Confirmar que ${debt.clientName} pagó $${debt.amount?.toLocaleString()}`, confirmText: 'Pagada', isDanger: false,
        action: async () => { await handleDebtPaid(debt); setConfirmModal(prev => ({ ...prev, isOpen: false })); }
    });
    const confirmPayAllDebts = (groupDebts, first, clientTotal) => setConfirmModal({
        isOpen: true, title: '¿Todas pagadas?', message: `Confirmar que ${first.clientName} pagó todas sus deudas (${groupDebts.length}) por un total de $${clientTotal.toLocaleString()}`, confirmText: 'Todas pagadas', isDanger: false,
        action: async () => {
            try { const batch = db.batch(); groupDebts.forEach(d => batch.delete(db.collection('debts').doc(d.id))); if (first.clientId) batch.update(db.collection('clients').doc(first.clientId), { hasDebt: false }); await batch.commit(); }
            catch (e) { showUndoToast(getErrorMessage(e), null); }
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    });
    const confirmReviewTransfers = (clientTransfers, first) => setConfirmModal({
        isOpen: true, title: 'Revisar transferencia', message: `¿Confirmar que revisaste la transferencia de ${first.clientName}?`, confirmText: 'Revisada', isDanger: false,
        action: async () => { for (const t of clientTransfers) { await handleTransferReviewed(t); } setConfirmModal(prev => ({ ...prev, isOpen: false })); }
    });

    // --- ESTADO NOTAS ---
    const [noteModal, setNoteModal] = React.useState(false);
    const [editNoteData, setEditNoteData] = React.useState(null);
    const [showFabMenu, setShowFabMenu] = React.useState(false);
    const [showBulkImport, setShowBulkImport] = React.useState(false);

    // --- ESTADO DEUDAS ---
    const [debts, setDebts] = React.useState([]);
    const [debtModal, setDebtModal] = React.useState({ isOpen: false, client: null });
    const [editDebtModal, setEditDebtModal] = React.useState({ isOpen: false, debt: null });
    const [viewDebtModal, setViewDebtModal] = React.useState({ isOpen: false, client: null });
    const [showDebtClientSearch, setShowDebtClientSearch] = React.useState(false);

    // --- ESTADO TRANSFERENCIAS ---
    const [transfers, setTransfers] = React.useState([]);

    // Índice de deudas O(1): total por clientId en una sola pasada, en vez de filtrar+reducir
    // todas las deudas por cada fila en cada render de las tablas (era O(clientes × deudas)).
    const debtTotalByClientId = React.useMemo(() => {
        const m = {};
        debts.forEach(d => { if (d.amount) m[d.clientId] = (m[d.clientId] || 0) + (d.amount || 0); });
        return m;
    }, [debts]);
    const getDebtTotal = React.useCallback((client) => {
        if (!client) return 0;
        const ids = client._mergedIds || [client.id];
        let t = 0;
        for (let i = 0; i < ids.length; i++) t += debtTotalByClientId[ids[i]] || 0;
        return t;
    }, [debtTotalByClientId]);

    // --- ESTADO BÚSQUEDA DEUDAS/TRANSFERENCIAS ---
    const [debtSearchTerm, setDebtSearchTerm] = React.useState('');
    const [transferSearchTerm, setTransferSearchTerm] = React.useState('');
    const [debtSortMode, setDebtSortMode] = React.useState('date'); // 'date' | 'amount'

    // --- ESTADO GRUPO FAMILIAR ---
    const [groupData, setGroupData] = React.useState(null); // { groupId, role, code }
    const [showGroupModal, setShowGroupModal] = React.useState(false);

    // --- ESTADO CONFIGURACIÓN ---
    const [appSettings, setAppSettings] = React.useState(null);
    const [showSettingsModal, setShowSettingsModal] = React.useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = React.useState(false);

    // --- HELPERS DE PERMISOS ---
    const isAdmin = !groupData || groupData.role === 'admin';
    const getDataScope = () => {
        if (groupData?.groupId) {
            return { groupId: groupData.groupId };
        }
        return { userId: user?.uid };
    };

    // --- MENSAJES WHATSAPP ---
    const DEFAULT_WHATSAPP_EN_CAMINO = "Buenas \u{1F69A}. Ya estamos en camino, sos el/la siguiente en la lista de entrega. \u{00A1}Nos vemos en unos minutos!\n\nAquapura";
    const DEFAULT_WHATSAPP_DEUDA = "La deuda es de ${total}. Saludos";
    const DEFAULT_WHATSAPP_RECORDATORIO = "Hola, buenas \nEste es un mensaje automatico para informarle que, segun nuestros registros, quedo pendiente un saldo por regularizar.\nCuando pueda, le agradecemos que nos indique en que fecha podriamos saldarlo. Si necesita nuevamente los datos de la cuenta, con gusto se los enviamos.\nMuchas gracias.";
    const getWhatsAppMessage = (key) => {
        if (appSettings && appSettings[key]) return appSettings[key];
        if (key === 'whatsappEnCamino') return DEFAULT_WHATSAPP_EN_CAMINO;
        if (key === 'whatsappDeuda') return DEFAULT_WHATSAPP_DEUDA;
        if (key === 'whatsappRecordatorio') return DEFAULT_WHATSAPP_RECORDATORIO;
        return '';
    };

    // --- BÚSQUEDAS DEBOUNCED (evitar filtrado en cada tecla) ---
    const debouncedListSearch = useDebounce(listSearchTerm, 300);
    const debouncedSearch = useDebounce(searchTerm, 300);
    const debouncedDebtSearch = useDebounce(debtSearchTerm, 300);
    const debouncedTransferSearch = useDebounce(transferSearchTerm, 300);

    // --- HANDLERS MEMOIZADOS PARA ClientCard ---
    const handleDebtClick = React.useCallback((client) => {
        if (client.hasDebt) {
            setViewDebtModal({ isOpen: true, client });
        } else {
            setDebtModal({ isOpen: true, client });
        }
    }, []);

    const handleSetAlarmForClient = React.useCallback((client) => {
        setAlarmModal({ isOpen: true, clientId: client.id, currentVal: client.alarm || '' });
    }, []);

    const toastTimeout = React.useRef(null);
    const addingTransferFor = React.useRef(null);
    const mergingDuplicates = React.useRef(false);


    // --- USE EFFECTS ---

    // Effect 1: Auth listener (solo se ejecuta una vez)
    React.useEffect(() => {
        // Capturar resultado/error del redirect de Google (móviles)
        auth.getRedirectResult().catch((error) => {
            if (error.code !== 'auth/null-user') {
                showUndoToast("Error al iniciar sesión. Intentá de nuevo.", null);
            }
        });

        const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
            setUser(u);
            setLoadingAuth(false);

            if (u) {
                // Crear documento de usuario si no existe (primer login)
                const userRef = db.collection('users').doc(u.uid);
                let userDoc = await userRef.get();
                if (!userDoc.exists) {
                    await userRef.set({ email: u.email, displayName: u.displayName || '', createdAt: new Date(), role: 'admin' });
                    userDoc = await userRef.get();
                }
                const userData = userDoc.data() || null;

                if (userData?.groupId) {
                    // Usuario en grupo - cargar datos del grupo
                    const groupDoc = await db.collection('groups').doc(userData.groupId).get();
                    const groupInfo = groupDoc.exists ? groupDoc.data() : {};
                    setGroupData({
                        groupId: userData.groupId,
                        role: userData.role,
                        code: groupInfo.code
                    });
                } else {
                    // Usuario individual
                    setGroupData(null);
                }
            } else {
                setClients([]);
                setDebts([]);
                setTransfers([]);
                setGroupData(null);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // Effect 2: Data listeners (se reconfigura cuando cambia user o groupData)
    React.useEffect(() => {
        if (!user) return;

        const queryField = groupData?.groupId ? 'groupId' : 'userId';
        const queryValue = groupData?.groupId || user.uid;

        // --- LISTENER CLIENTES ---
        const unsubClients = db.collection('clients')
            .where(queryField, '==', queryValue)
            .onSnapshot((snapshot) => {
                const loadedClients = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // No ordenar aquí - getVisibleClients ordena por listOrders[day] según el día seleccionado
                setClients(loadedClients);
                setIsCloudActive(true);
            }, (error) => {
                console.error("Error DB:", error);
                setIsCloudActive(false);
            });

        // --- LISTENER DEUDAS ---
        const unsubDebts = db.collection('debts')
            .where(queryField, '==', queryValue)
            .onSnapshot((snapshot) => {
                const loadedDebts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                loadedDebts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setDebts(loadedDebts);
            }, (error) => {
                console.error("Error debts listener:", error);
            });

        // --- LISTENER TRANSFERENCIAS ---
        const unsubTransfers = db.collection('transfers')
            .where(queryField, '==', queryValue)
            .onSnapshot((snapshot) => {
                const loadedTransfers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                loadedTransfers.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setTransfers(loadedTransfers);
            }, (error) => {
                console.error("Error transfers listener:", error);
            });

        return () => {
            unsubClients();
            unsubDebts();
            unsubTransfers();
        };
    }, [user, groupData]);

    // --- AUTO-LIMPIEZA: Completados "una vez" expirados ---
    const cleanupDoneRef = React.useRef(false);
    React.useEffect(() => {
        if (cleanupDoneRef.current) return;
        if (clients.length === 0) return;
        cleanupDoneRef.current = true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiredCompleted = clients.filter(c =>
            c.isCompleted &&
            c.freq === 'once' &&
            c.specificDate &&
            new Date(c.specificDate + 'T12:00:00') < today
        );

        if (expiredCompleted.length === 0) return;

        const batchSize = 450;
        const chunks = [];
        for (let i = 0; i < expiredCompleted.length; i += batchSize) {
            chunks.push(expiredCompleted.slice(i, i + batchSize));
        }

        chunks.forEach(chunk => {
            const batch = db.batch();
            chunk.forEach(c => {
                const ref = db.collection('clients').doc(c.id);
                if (c.isNote) {
                    // Notas: eliminar permanentemente
                    batch.delete(ref);
                } else {
                    // Clientes: mover al directorio
                    batch.update(ref, {
                        freq: 'on_demand',
                        visitDay: 'Sin Asignar',
                        visitDays: [],
                        isCompleted: false,
                        completedAt: null,
                        updatedAt: new Date()
                    });
                }
            });
            batch.commit().catch(err => console.error('Auto-cleanup error:', err));
        });

        console.log(`Auto-limpieza: ${expiredCompleted.length} completados expirados procesados`);
    }, [clients]);

    // --- EFFECT PARA ALARMAS (RESTAURADO Y MEJORADO) ---
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (activeAlert) return; 
            
            const now = new Date();
            // Asegurar formato HH:MM (24h) para coincidir con el input type="time"
            const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).slice(0, 5);
            
            // Obtener el nombre del día actual
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const todayDayName = dayNames[now.getDay()];
            
            const match = clients.find(c => {
                // 1. Coincide la hora?
                if (c.alarm !== currentTime) return false;
                
                // 2. El cliente tiene visita programada para hoy?
                const clientDays = c.visitDays || (c.visitDay ? [c.visitDay] : []);
                if (!clientDays.includes(todayDayName)) return false;
                
                // 3. Coincide la fecha programada para este día?
                const scheduledDate = getNextVisitDate(c, todayDayName);
                if (!scheduledDate) return false;
                
                // Comparar solo día/mes/año
                return scheduledDate.toDateString() === now.toDateString();
            });
            
            if (match) {
                setActiveAlert({ 
                    name: match.name, 
                    address: match.address, 
                    time: currentTime,
                    id: match.id 
                });
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                // Notificación push via Service Worker (funciona con tab en segundo plano)
                if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker?.controller) {
                    navigator.serviceWorker.getRegistration().then(reg => {
                        if (reg) {
                            reg.showNotification('RutaWater - Recordatorio', {
                                body: `${currentTime} - ${match.name}\n${match.address}`,
                                icon: './icon.jpg',
                                badge: './icon.jpg',
                                tag: 'alarm-' + match.id,
                                vibrate: [200, 100, 200],
                                requireInteraction: true,
                                data: { clientId: match.id }
                            });
                        }
                    });
                }
            }
        }, 5000); // Chequear cada 5s para mayor precisión
        return () => clearInterval(interval);
    }, [clients, activeAlert]);


    // --- CARGAR CONFIGURACIÓN DEL USUARIO (en vivo) ---
    React.useEffect(() => {
        if (!user) return;
        const settingsDocId = groupData?.groupId || user.uid;
        const unsub = db.collection('settings').doc(settingsDocId).onSnapshot(doc => {
            const data = doc.exists ? doc.data() : {};
            buildProductsFromSettings(data); // reconstruye el catálogo de productos
            setAppSettings(data);
        }, e => console.error("Error loading settings:", e));
        return () => unsub();
    }, [user, groupData]);

    // --- ONLINE/OFFLINE DETECTOR ---
    React.useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
    }, []);

    // --- SW UPDATE DETECTOR ---
    React.useEffect(() => {
        const onSwUpdate = () => setSwUpdate(true);
        window.addEventListener('sw-update-available', onSwUpdate);
        return () => window.removeEventListener('sw-update-available', onSwUpdate);
    }, []);

    // --- INSTALL PROMPT ---
    React.useEffect(() => {
        const onBeforeInstall = (e) => { e.preventDefault(); setInstallPrompt(e); };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    // --- AUTO-MERGE DUPLICATE PHONE CLIENTS IN DIRECTORY ---
    React.useEffect(() => {
        if (mergingDuplicates.current || !user || clients.length === 0) return;

        // Group on_demand clients by normalized phone
        const phoneGroups = {};
        clients.forEach(c => {
            if (!c.phone || c.phone.length < 6) return;
            const key = c.phone.replace(/\D/g, '');
            if (!phoneGroups[key]) phoneGroups[key] = [];
            phoneGroups[key].push(c);
        });

        // Find groups with duplicates where ALL entries are on_demand (safe to merge)
        const toMerge = Object.values(phoneGroups).filter(group => {
            if (group.length < 2) return false;
            // Only auto-merge when all duplicates are in directory (on_demand)
            return group.every(c => c.freq === 'on_demand');
        });

        if (toMerge.length === 0) return;

        mergingDuplicates.current = true;

        (async () => {
            try {
                for (const group of toMerge) {
                    // Sort by updatedAt descending - keep the newest
                    group.sort((a, b) => {
                        const ta = a.updatedAt?.seconds || 0;
                        const tb = b.updatedAt?.seconds || 0;
                        return tb - ta;
                    });
                    const keeper = group[0];
                    const duplicates = group.slice(1);

                    for (const dup of duplicates) {
                        const dupDebts = debts.filter(d => d.clientId === dup.id);
                        const dupTransfers = transfers.filter(t => t.clientId === dup.id);

                        await firestoreRetry(() => {
                            const batch = db.batch();

                            // Reassign debts from duplicate to keeper
                            for (const d of dupDebts) {
                                batch.update(db.collection('debts').doc(d.id), {
                                    clientId: keeper.id,
                                    clientName: keeper.name,
                                    clientAddress: keeper.address || '',
                                    clientLat: keeper.lat || null,
                                    clientLng: keeper.lng || null,
                                    clientMapsLink: keeper.mapsLink || null
                                });
                            }

                            // Reassign transfers from duplicate to keeper
                            for (const t of dupTransfers) {
                                batch.update(db.collection('transfers').doc(t.id), {
                                    clientId: keeper.id,
                                    clientName: keeper.name
                                });
                            }

                            // Update keeper's hasDebt if duplicate had debts
                            if (dupDebts.length > 0 && !keeper.hasDebt) {
                                batch.update(db.collection('clients').doc(keeper.id), { hasDebt: true });
                            }

                            // Delete the duplicate client
                            batch.delete(db.collection('clients').doc(dup.id));

                            return batch.commit();
                        });
                    }
                }
                console.log("Auto-merge: duplicados fusionados correctamente");
            } catch (e) {
                console.error("Error al fusionar duplicados:", e);
            } finally {
                mergingDuplicates.current = false;
            }
        })();
    }, [clients, debts, transfers, user]);

    // --- TOAST LOGIC ---
    const showUndoToast = (message, undoAction) => {
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        setToast({ message, undoAction });
        toastTimeout.current = setTimeout(() => {
            setToast(null);
        }, 6000);
    };

    const handleUndo = () => {
        if (toast && toast.undoAction) {
            toast.undoAction();
            setToast(null);
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
        }
    };
    

    // --- ALARMAS HANDLERS ---
    const handleSaveAlarm = async (time) => {
        try {
            if (alarmModal.clientId) {
                await firestoreRetry(() => db.collection('clients').doc(alarmModal.clientId).update({ alarm: time }));
            }
        } catch(e) { showUndoToast(getErrorMessage(e), null); }
        setAlarmModal({ isOpen: false, clientId: null, currentVal: '' });
    };
    
    // --- DEUDAS HANDLERS ---
    const handleAddDebt = async (client, amount) => {
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return;
        try {
            await firestoreRetry(() => db.collection('debts').add({
                ...getDataScope(),
                userId: user.uid,
                clientId: client.id,
                clientName: client.name,
                clientAddress: client.address,
                clientLat: client.lat || null,
                clientLng: client.lng || null,
                clientMapsLink: client.mapsLink || null,
                amount: parseFloat(amount),
                createdAt: new Date(),
                paid: false
            }));
            // Marcar el cliente con deuda activa
            await firestoreRetry(() => db.collection('clients').doc(client.id).update({ hasDebt: true }));
            setDebtModal({ isOpen: false, client: null });
        } catch(e) { console.error("Error creando deuda:", e); showUndoToast(getErrorMessage(e), null); }
    };

    const handleDebtPaid = async (debt) => {
        try {
            await firestoreRetry(() => db.collection('debts').doc(debt.id).delete());
            // Usar estado local (ya sincronizado) para verificar si quedan deudas
            const remaining = debts.filter(d => d.clientId === debt.clientId && d.id !== debt.id);
            if (remaining.length === 0) {
                await firestoreRetry(() => db.collection('clients').doc(debt.clientId).update({ hasDebt: false }));
            }
        } catch(e) { console.error("Error eliminando deuda:", e); showUndoToast(getErrorMessage(e), null); }
    };

    const handleEditDebt = async (debt, newAmount) => {
        if (!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0) return;
        try {
            await firestoreRetry(() => db.collection('debts').doc(debt.id).update({ amount: parseFloat(newAmount) }));
        } catch(e) { console.error("Error editando deuda:", e); showUndoToast(getErrorMessage(e), null); }
    };

    // --- TRANSFERENCIAS HANDLERS ---
    const handleAddTransfer = async (client) => {
        // Guard contra doble-click: si ya estamos creando una transferencia para este cliente, ignorar
        if (addingTransferFor.current === client.id) return;
        try {
            addingTransferFor.current = client.id;
            // Verificar si ya tiene transferencia pendiente
            const existing = transfers.find(t => t.clientId === client.id);
            if (existing) {
                showUndoToast("Ya tiene transferencia pendiente", null);
                return;
            }

            await firestoreRetry(() => db.collection('transfers').add({
                ...getDataScope(),
                userId: user.uid,
                clientId: client.id,
                clientName: client.name,
                clientAddress: client.address,
                clientLat: client.lat || null,
                clientLng: client.lng || null,
                clientMapsLink: client.mapsLink || null,
                createdAt: new Date(),
                reviewed: false
            }));
            await firestoreRetry(() => db.collection('clients').doc(client.id).update({ hasPendingTransfer: true }));
        } catch(e) { console.error("Error creando transferencia:", e); showUndoToast(getErrorMessage(e), null); }
        finally { addingTransferFor.current = null; }
    };

    const handleTransferReviewed = async (transfer) => {
        try {
            await firestoreRetry(() => db.collection('transfers').doc(transfer.id).delete());
            // Usar estado local (ya sincronizado) para verificar si quedan transferencias
            const remaining = transfers.filter(t => t.clientId === transfer.clientId && t.id !== transfer.id);
            if (remaining.length === 0) {
                await firestoreRetry(() => db.collection('clients').doc(transfer.clientId).update({ hasPendingTransfer: false }));
            }
        } catch(e) { console.error("Error eliminando transferencia:", e); showUndoToast(getErrorMessage(e), null); }
    };
    
    const handleToggleStar = async (client) => {
        const newVal = !client.isStarred;
        // Optimista: actualizar UI inmediatamente
        setClients(prev => prev.map(c => c.id === client.id ? {...c, isStarred: newVal} : c));
        try {
            await firestoreRetry(() => db.collection('clients').doc(client.id).update({ isStarred: newVal }));
        } catch(e) {
            // Revertir en caso de error
            setClients(prev => prev.map(c => c.id === client.id ? {...c, isStarred: !newVal} : c));
            showUndoToast(getErrorMessage(e), null);
        }
    };

    const handleDismissAlert = async () => {
        try {
            if (activeAlert && activeAlert.id) {
                await firestoreRetry(() => db.collection('clients').doc(activeAlert.id).update({ alarm: '' }));
            }
        } catch(e) { showUndoToast(getErrorMessage(e), null); }
        setActiveAlert(null);
    };


    const handleMarkAsDoneInList = async (client) => {
        try {
            if (client.freq === 'once') {
                // Once: marcar como completado
                const prevFields = {
                    isCompleted: client.isCompleted || false,
                    completedAt: client.completedAt || null,
                    updatedAt: client.updatedAt || null,
                    alarm: client.alarm || '',
                    isStarred: client.isStarred || false
                };
                const undoAction = async () => {
                    try { await db.collection('clients').doc(client.id).update(prevFields); }
                    catch(e) { console.error("Undo error", e); }
                };
                const updateData = {
                    isCompleted: true, completedAt: new Date(), updatedAt: new Date(), alarm: '', isStarred: false
                };
                // Garantizar que siempre tenga specificDate para la auto-limpieza
                if (!client.specificDate) {
                    updateData.specificDate = new Date().toISOString().split('T')[0];
                }
                await firestoreRetry(() => db.collection('clients').doc(client.id).update(updateData));
                showUndoToast("Pedido completado", undoAction);
            } else {
                // Periódico: escribir a Firestore y dejar que onSnapshot actualice la UI.
                // Sincronizado con la app nativa (markAsDone): se guarda lastVisited y se
                // limpia specificDate; la rotación la calcula getNextVisitDate desde lastVisited.
                const prevFields = {
                    lastVisited: client.lastVisited || null,
                    alarm: client.alarm || '',
                    isStarred: client.isStarred || false
                };
                if (client.specificDate) {
                    prevFields.specificDate = client.specificDate;
                }

                const updates = { lastVisited: new Date(), alarm: '' };

                if (client.specificDate) {
                    updates.specificDate = '';
                }
                if (client.isStarred) {
                    updates.isStarred = false;
                }

                await firestoreRetry(() => db.collection('clients').doc(client.id).update(updates));

                const undoAction = async () => {
                    try { await db.collection('clients').doc(client.id).update(prevFields); }
                    catch(e) { console.error("Undo error", e); }
                };
                showUndoToast("Pedido completado", undoAction);
            }
        } catch(e) { console.error(e); }
    };

    const handleRestoreCompleted = async (client) => {
        try {
            await firestoreRetry(() => db.collection('clients').doc(client.id).update({
                isCompleted: false,
                completedAt: null,
                updatedAt: new Date()
            }));
        } catch(e) { console.error(e); showUndoToast(getErrorMessage(e), null); }
    };


    
    const handleClearCompleted = (day) => {
        const completedForDay = clients.filter(c =>
            c.isCompleted &&
            c.freq === 'once' &&
            ((c.visitDays && c.visitDays.includes(day)) || c.visitDay === day)
        );
        if (completedForDay.length === 0) return;

        setConfirmModal({
            isOpen: true,
            title: '¿Limpiar completados?',
            message: `${completedForDay.length} pedido(s) completado(s) se moverán al Directorio.`,
            confirmText: "Limpiar",
            isDanger: false,
            action: async () => {
                try {
                    for (let i = 0; i < completedForDay.length; i += 450) {
                        const chunk = completedForDay.slice(i, i + 450);
                        await firestoreRetry(() => {
                            const batch = db.batch();
                            chunk.forEach(c => {
                                batch.update(db.collection('clients').doc(c.id), {
                                    freq: 'on_demand',
                                    visitDay: 'Sin Asignar',
                                    visitDays: [],
                                    isCompleted: false,
                                    completedAt: null,
                                    updatedAt: new Date()
                                });
                            });
                            return batch.commit();
                        });
                    }
                    showUndoToast("Movidos al Directorio", null);
                } catch(e) { console.error(e); showUndoToast(getErrorMessage(e), null); }
                setConfirmModal(prev => ({...prev, isOpen: false}));
            }
        });
    };

    
    const getVisibleClients = React.useCallback((dayToFilter, source) => {
         const filtered = (source || clients)
            .filter(c => c.freq !== 'on_demand')
            .filter(c => !c.isCompleted)
            // Excluir pedidos "once" sin fecha asignada (dato incompleto)
            .filter(c => !(c.freq === 'once' && !c.specificDate))
            .filter(c => {
                if (dayToFilter === '') return true;
                // Soportar tanto visitDays (array) como visitDay (string legacy)
                if (c.visitDays && c.visitDays.length > 0) {
                    return c.visitDays.includes(dayToFilter);
                }
                return c.visitDay === dayToFilter;
            });
         
         // Ordenar: priorizar listOrders del día, luego listOrder normalizado
         return filtered.sort((a, b) => {
            // Obtener orden específico del día
            const hasOrderA = a.listOrders && typeof a.listOrders[dayToFilter] === 'number';
            const hasOrderB = b.listOrders && typeof b.listOrders[dayToFilter] === 'number';
            
            let orderA, orderB;
            
            if (hasOrderA) {
                orderA = a.listOrders[dayToFilter];
            } else {
                // Si no tiene listOrders del día, usar listOrder pero normalizado
                // Los timestamps son muy grandes, así que los ponemos al final
                orderA = a.listOrder > 1000000 ? 999999 + (a.listOrder / 1e15) : (a.listOrder || 999999);
            }
            
            if (hasOrderB) {
                orderB = b.listOrders[dayToFilter];
            } else {
                orderB = b.listOrder > 1000000 ? 999999 + (b.listOrder / 1e15) : (b.listOrder || 999999);
            }
            
            return orderA - orderB;
         });
    }, [clients]);
    
    const getCompletedClients = React.useCallback((dayToFilter) => {
         return clients
            .filter(c => c.isCompleted && c.freq === 'once')
            .filter(c => {
                if (dayToFilter === '') return true;
                if (c.visitDays && c.visitDays.length > 0) {
                    return c.visitDays.includes(dayToFilter);
                }
                return c.visitDay === dayToFilter;
            })
            .sort((a, b) => {
                const dateA = a.completedAt?.seconds || 0;
                const dateB = b.completedAt?.seconds || 0;
                return dateB - dateA;
            });
    }, [clients]);

    const groupedClients = React.useMemo(() => {
        if (view !== 'list') return {};
        
        const dayToFilter = selectedDay;
        
        const groups = {};
        let visible = getVisibleClients(dayToFilter);
        
        // Aplicar filtro de búsqueda (usa valor debounced)
        if (debouncedListSearch.trim()) {
            const match = fuzzyMatch(debouncedListSearch);
            visible = visible.filter(c => match(c.name || '', c.address || ''));
        }
        
        // Aplicar filtros activos
        if (activeFilters.length > 0) {
            const typeFilters = activeFilters.filter(f => f === 'once_starred' || f === 'has_debt');
            const productFilters = activeFilters.filter(f => f !== 'once_starred' && f !== 'has_debt');

            visible = visible.filter(c => {
                // Filtros de tipo: AND (debe cumplir todos)
                const passesType = typeFilters.every(filter => {
                    if (filter === 'once_starred') return c.freq === 'once' || c.isStarred;
                    if (filter === 'has_debt') return c.hasDebt === true;
                    return true;
                });
                // Filtros de producto: OR (debe tener al menos uno)
                const passesProduct = productFilters.length === 0 || productFilters.some(filter => {
                    return c.products && parseInt(c.products[filter] || 0) > 0;
                });
                return passesType && passesProduct;
            });
        }
        
        visible.forEach(client => {
                // Pasar el día actual para calcular la fecha correcta
                const date = getNextVisitDate(client, dayToFilter);
                let key = 0;
                let label = "General";
                if (date) {
                     date.setHours(0,0,0,0);
                     key = date.getTime();
                     label = formatDate(date);
                } else {
                    if(client.visitDay && client.visitDay !== 'Sin Asignar') {
                        label = client.visitDay;
                        key = 0; 
                    }
                }
                
                if (!groups[key]) groups[key] = { date: date, label: label, items: [] };
                groups[key].items.push(client);
            });
        
        const sortedKeys = Object.keys(groups).sort((a, b) => a - b);
        const sortedGroups = {};
        sortedKeys.forEach(key => sortedGroups[key] = groups[key]);
        return sortedGroups;
    }, [clients, selectedDay, view, getVisibleClients, debouncedListSearch, activeFilters]);

    // Calculate Counter Totals based on FIRST group (Nearest Date)
    const activeClientsForCounter = React.useMemo(() => {
        if (!groupedClients || Object.keys(groupedClients).length === 0) return [];
        const sortedKeys = Object.keys(groupedClients).sort((a, b) => parseFloat(a) - parseFloat(b));
        // Return items from the first key (earliest date)
        return groupedClients[sortedKeys[0]].items;
    }, [groupedClients]);

    // --- MAPA DE ÍNDICES PRE-COMPUTADO (O(n) en vez de O(n²)) ---
    const clientIndexMap = React.useMemo(() => {
        const map = {};
        const visible = getVisibleClients(selectedDay);
        visible.forEach((c, i) => { map[c.id] = i; });
        return map;
    }, [getVisibleClients, selectedDay]);

    // --- CONTEO DE CLIENTES POR DÍA ---
    const dayCounts = React.useMemo(() => {
        const counts = {};
        ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].forEach(day => {
            counts[day] = clients.filter(c => {
                if (c.freq === 'on_demand' || c.isCompleted) return false;
                if (c.freq === 'once' && !c.specificDate) return false;
                if (c.visitDays && c.visitDays.length > 0) return c.visitDays.includes(day);
                return c.visitDay === day;
            }).length;
        });
        return counts;
    }, [clients]);

    const handleGoogleLogin = async () => {
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                await auth.signInWithRedirect(googleProvider);
            } else {
                try {
                    await auth.signInWithPopup(googleProvider);
                } catch (popupError) {
                    if (popupError.code === 'auth/popup-blocked') {
                        await auth.signInWithRedirect(googleProvider);
                    } else {
                        throw popupError;
                    }
                }
            }
        } catch (error) {
            showUndoToast("Error al iniciar sesión. Intentá de nuevo.", null);
        }
    };
    const handleLogout = () => {
        setConfirmModal({ isOpen: true, title: '¿Cerrar sesión?', message: 'Se cerrará tu cuenta en este dispositivo.', confirmText: 'Cerrar sesión', isDanger: false, action: () => { auth.signOut(); setConfirmModal(prev => ({...prev, isOpen: false})); } });
    };
    
    // --- NUEVA FUNCIÓN HANDLEInputChange ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { [name]: value };
            if (name === 'specificDate' && value) {
                const d = new Date(value + 'T12:00:00');
                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const dayName = days[d.getDay()];
                updates.visitDay = dayName;
                updates.visitDays = [dayName];
            }
            if (name === 'freq' && value === 'on_demand') {
                updates.visitDay = 'Sin Asignar';
                updates.visitDays = [];
            }
            return { ...prev, ...updates };
        });
    };
    
    const handleProductChange = (prodId, val) => {
        setFormData(prev => ({
            ...prev,
            products: { ...prev.products, [prodId]: val }
        }));
    };

    const resetForm = () => { 
        setFormData({ 
            name: '', phone: '', address: '', lat: '', lng: '', freq: 'weekly', visitDay: 'Lunes', visitDays: ['Lunes'], notes: '', locationInput: '', specificDate: '',
            products: { b20: '', b12: '', b6: '', soda: '', bombita: '', disp_elec_new: '', disp_elec_chg: '', disp_nat: '' }
        }); 
        setEditingId(null); 
    };
    const editClient = (c) => { 
        setFormData({
            ...c, 
            locationInput: c.mapsLink || (c.lat ? `${c.lat},${c.lng}` : ''),
            visitDays: c.visitDays || (c.visitDay ? [c.visitDay] : ['Lunes']),
            products: c.products || { b20: '', b12: '', b6: '', soda: '', bombita: '', disp_elec_new: '', disp_elec_chg: '', disp_nat: '' }
        }); 
        setEditingId(c.id);
        setView('add');
    };

    // --- HANDLER: Actualización rápida de cliente (desde modal del directorio) ---
    const handleQuickUpdateClient = async (clientId, data) => {
        try {
            var updateData = { ...data, updatedAt: new Date() };
            // Si es pedido "una vez" y cambió la fecha, recalcular día y orden
            // Solo recalcular posición si la fecha realmente cambió
            const existingClient = clients.find(c => c.id === clientId);
            const dateActuallyChanged = data.freq === 'once' && data.specificDate &&
                existingClient && data.specificDate !== existingClient.specificDate;
            if (dateActuallyChanged) {
                const d = new Date(data.specificDate + 'T12:00:00');
                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const dayName = days[d.getDay()];
                const minOrder = dayExtremeOrder(clients, dayName, 'min', clientId);
                updateData.visitDay = dayName;
                updateData.visitDays = [dayName];
                updateData.listOrder = minOrder - 1;
                updateData.listOrders = { [dayName]: minOrder - 1 };
            }
            await firestoreRetry(() => db.collection('clients').doc(clientId).update(updateData));
            showUndoToast("Cliente actualizado.", null);
        } catch(e) {
            showUndoToast(getErrorMessage(e), null);
        }
    };


    // Helper: abrir URL externa sin dejar ventana en blanco en móvil
    const openExternal = (url) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isAppProtocol = url.startsWith('whatsapp://') || url.startsWith('tel:');
        if (isMobile || isAppProtocol) { location.href = url; } else { window.open(url, '_blank'); }
    };

    // IMPLEMENTACIÓN DE sendPhotoWhatsApp
    const sendPhotoWhatsApp = (phone) => {
         if (!phone) return;
         const cleanPhone = normalizePhone(phone);
         openExternal(`whatsapp://send?phone=${cleanPhone}`);
    };

    const sendWhatsApp = (phone) => {
        if (!phone) return;
        const cleanPhone = normalizePhone(phone);
        const msg = encodeURIComponent(getWhatsAppMessage('whatsappEnCamino'));
        openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
    };

    const sendWhatsAppDirect = (phone) => {
        if (!phone) return;
        const cleanPhone = normalizePhone(phone);
        openExternal(`whatsapp://send?phone=${cleanPhone}`);
    };


    const sendDebtTotal = (phone, total) => {
        if (!phone) return;
        const cleanPhone = normalizePhone(phone);
        const template = getWhatsAppMessage('whatsappDeuda');
        const msg = encodeURIComponent(template.replace('${total}', `$${total.toLocaleString()}`));
        openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
    };

    const sendReminder = (phone) => {
        if (!phone) return;
        const cleanPhone = normalizePhone(phone);
        const msg = encodeURIComponent(getWhatsAppMessage('whatsappRecordatorio'));
        openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
    };

    const openGoogleMaps = (lat, lng, link) => {
        let url = '';
        if(lat && lng) { url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`; }
        else if(link && isSafeUrl(link)) { url = link; }
        else { showUndoToast("Ubicación no disponible.", null); return; }
        openExternal(url);
    };
    
     const handleLocationPaste = (e) => {
        const value = e.target.value;
        const coords = parseLocationInput(value);
        if (coords) {
            setFormData(prev => ({...prev, locationInput: value, lat: coords.lat, lng: coords.lng}));
        } else {
            setFormData(prev => ({...prev, locationInput: value}));
        }
    };
    
    const handleSaveClient = async (e) => {
        e.preventDefault();
        if (saving) return;
        // Cualquier miembro del grupo puede crear/editar clientes
        if (!formData.name || !formData.name.trim()) { showUndoToast("El nombre del cliente es obligatorio.", null); return; }
        const hasCoordinates = formData.lat && formData.lng;
        const hasMapLink = formData.locationInput && isShortLink(formData.locationInput);
        if (!hasCoordinates && !hasMapLink) { showUndoToast("Por favor, ingresá una ubicación válida.", null); return; }
        setSaving(true);
        try {
            const currentWeek = getWeekNumber(new Date());
            let visitDays = formData.visitDays && formData.visitDays.length > 0 ? formData.visitDays : [formData.visitDay];

            // Si tiene fecha específica, forzar visitDays al día de esa fecha
            if (formData.specificDate) {
                const d = new Date(formData.specificDate + 'T12:00:00');
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const derivedDay = dayNames[d.getDay()];
                visitDays = [derivedDay];
            }

            // Validación: asegurar que hay días válidos si no es on_demand
            if (formData.freq !== 'on_demand' && (visitDays.length === 0 || visitDays.includes('Sin Asignar'))) {
                showUndoToast("Seleccioná al menos un día de visita.", null);
                setSaving(false);
                return;
            }

            // Validación: "una vez" requiere fecha específica
            if (formData.freq === 'once' && !formData.specificDate) {
                showUndoToast("Los pedidos de una vez requieren una fecha.", null);
                setSaving(false);
                return;
            }
            
            const sanitized = sanitizeClientData(formData);
            const data = {
                ...sanitized,
                ...getDataScope(),
                userId: user.uid,
                updatedAt: new Date(),
                startWeek: currentWeek,
                visitDays: visitDays,
                visitDay: visitDays[0] || 'Sin Asignar', // Mantener compatibilidad
                isPinned: editingId ? (formData.isPinned || false) : (formData.freq !== 'once'),
                mapsLink: sanitized.mapsLink || sanitized.locationInput
            };
            
            if (editingId) { 
                // Al editar, solo agregar listOrders para días NUEVOS que no existían
                const existingListOrders = formData.listOrders || {};
                const newListOrders = { ...existingListOrders };
                visitDays.forEach(day => {
                    if (newListOrders[day] === undefined) {
                        // Calcular siguiente orden para el día nuevo
                        const maxOrder = dayExtremeOrder(clients, day, 'max', editingId);
                        newListOrders[day] = maxOrder + 1;
                    }
                });
                // Limpiar días que ya no están seleccionados
                Object.keys(newListOrders).forEach(day => {
                    if (!visitDays.includes(day)) {
                        delete newListOrders[day];
                    }
                });
                data.listOrders = newListOrders;
                delete data.listOrder; // No sobrescribir listOrder general
                await firestoreRetry(() => db.collection('clients').doc(editingId).update(data));
            } else {
                // Cliente nuevo - crear listOrders con número secuencial para cada día
                const listOrders = {};
                visitDays.forEach(day => {
                    // Todos los clientes nuevos van al INICIO
                    const minOrder = dayExtremeOrder(clients, day, 'min');
                    listOrders[day] = minOrder - 1;
                });
                data.listOrder = listOrders[visitDays[0]];
                data.listOrders = listOrders;
                await firestoreRetry(() => db.collection('clients').add(data));
            }
            resetForm(); setView('list');
        } catch(e) { showUndoToast(getErrorMessage(e), null); } finally { setSaving(false); }
    };

    // --- IMPORTAR CLIENTES EN LOTE ---
    // importRows: [{ name, phone, address, lat, lng, mapsLink, notes, products, day, freq }]
    // Crea cada cliente con el mismo formato que el alta individual (van al inicio del día).
    const handleBulkImport = async (importRows) => {
        const currentWeek = getWeekNumber(new Date());
        const dayMinOrder = {}; // día -> menor listOrder ya asignado en ESTE lote (evita choques)
        let created = 0;
        try {
            for (const row of importRows) {
                const name = (row.name || '').trim();
                if (!name) continue;
                const freq = ['weekly', 'biweekly', 'triweekly', 'monthly', 'on_demand'].indexOf(row.freq) > -1 ? row.freq : 'weekly';
                const visitDays = freq === 'on_demand' ? [] : [row.day || 'Lunes'];
                const products = {};
                Object.keys(row.products || {}).forEach(k => {
                    const v = sanitizeProductQty(row.products[k]);
                    if (v !== '') products[k] = v;
                });
                const mapsLink = (row.mapsLink && isSafeUrl(row.mapsLink)) ? row.mapsLink : '';
                const data = {
                    name: sanitizeString(name, 100),
                    phone: sanitizePhone(row.phone || ''),
                    address: sanitizeString(row.address || '', 200),
                    notes: sanitizeString(row.notes || '', 500),
                    lat: sanitizeString(row.lat || '', 20),
                    lng: sanitizeString(row.lng || '', 20),
                    mapsLink: mapsLink,
                    locationInput: mapsLink,
                    freq: freq,
                    specificDate: null,
                    products: products,
                    visitDays: visitDays,
                    visitDay: visitDays[0] || 'Sin Asignar',
                    isPinned: freq !== 'once',
                    ...getDataScope(),
                    userId: user.uid,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    startWeek: currentWeek,
                };
                // listOrders: los nuevos van al INICIO (minOrder - 1), igual que el alta individual.
                const listOrders = {};
                visitDays.forEach(dy => {
                    let minOrder = dayExtremeOrder(clients, dy, 'min');
                    if (dayMinOrder[dy] !== undefined) minOrder = Math.min(minOrder, dayMinOrder[dy]);
                    listOrders[dy] = minOrder - 1;
                    dayMinOrder[dy] = minOrder - 1;
                });
                data.listOrder = visitDays.length ? listOrders[visitDays[0]] : 0;
                data.listOrders = listOrders;
                await firestoreRetry(() => db.collection('clients').add(data));
                created++;
            }
            showUndoToast(created + ' cliente' + (created !== 1 ? 's' : '') + ' importado' + (created !== 1 ? 's' : '') + '.', null);
        } catch (e) {
            console.error('Error importando clientes:', e);
            showUndoToast(getErrorMessage(e) + (created > 0 ? ' (' + created + ' creados antes del error)' : ''), null);
        }
    };

    // --- GUARDAR NOTA ---
    const handleSaveNote = async (noteText, noteDate) => {
        try {
            const d = new Date(noteDate + 'T12:00:00');
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dayName = days[d.getDay()];

            // Notas van al inicio del recorrido
            const minOrder = dayExtremeOrder(clients, dayName, 'min');

            const data = {
                isNote: true,
                name: 'NOTA',
                phone: '',
                address: '',
                notes: noteText,
                freq: 'once',
                specificDate: noteDate,
                visitDays: [dayName],
                visitDay: dayName,
                listOrder: minOrder - 1,
                listOrders: { [dayName]: minOrder - 1 },
                products: {},
                isCompleted: false,
                isStarred: false,
                isPinned: false,
                alarm: '',
                ...getDataScope(),
                userId: user.uid,
                updatedAt: new Date(),
                startWeek: getWeekNumber(new Date())
            };

            await firestoreRetry(() => db.collection('clients').add(data));
            setNoteModal(false);
            showUndoToast("Nota añadida", null);
        } catch(e) {
            console.error("Error adding note:", e);
            showUndoToast(getErrorMessage(e), null);
        }
    };

    // --- EDITAR NOTA ---
    const handleEditNote = async (noteText, noteDate) => {
        if (!editNoteData) return;
        try {
            const d = new Date(noteDate + 'T12:00:00');
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const newDayName = days[d.getDay()];
            const oldDayName = editNoteData.visitDay;

            const updateData = {
                notes: noteText,
                specificDate: noteDate,
                visitDays: [newDayName],
                visitDay: newDayName,
                updatedAt: new Date()
            };

            // Si cambió de día, recalcular posición en el nuevo día
            if (newDayName !== oldDayName) {
                const minOrder = dayExtremeOrder(clients, newDayName, 'min', editNoteData.id);
                updateData.listOrder = minOrder - 1;
                updateData.listOrders = { [newDayName]: minOrder - 1 };
            }

            await firestoreRetry(() => db.collection('clients').doc(editNoteData.id).update(updateData));
            setEditNoteData(null);
            showUndoToast("Nota actualizada", null);
        } catch(e) {
            console.error("Error editing note:", e);
            showUndoToast(getErrorMessage(e), null);
        }
    };

    const handleScheduleFromDirectory = async (clientData, newDays, newFreq, newDate, newNotes, newProducts) => {
         try {
            const currentWeek = getWeekNumber(new Date());
            const newData = {
                name: clientData.name, phone: clientData.phone, address: clientData.address, lat: clientData.lat, lng: clientData.lng, mapsLink: clientData.mapsLink,
                ...getDataScope(),
                userId: user.uid,
                freq: newFreq, updatedAt: new Date(), 
                notes: newNotes, isPinned: false,
                products: newProducts || {} 
            };
            
            if (newDate) {
                 // Pedido de una vez - siempre al INICIO con número negativo
                 const d = new Date(newDate + 'T12:00:00'); 
                 const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                 const dayName = days[d.getDay()];
                 
                 // Encontrar el mínimo orden existente y restar 1 para ir antes
                 // Nuevo pedido va ANTES de todo (minOrder - 1)
                 const newOrder = dayExtremeOrder(clients, dayName, 'min') - 1;
                 
                 newData.visitDay = dayName;
                 newData.visitDays = [dayName];
                 newData.specificDate = newDate; 
                 newData.startWeek = currentWeek;
                 newData.listOrder = newOrder;
                 newData.listOrders = { [dayName]: newOrder };
            } else {
                 // Pedido semanal - agregar al final con número secuencial
                 newData.visitDays = newDays;
                 newData.visitDay = newDays[0];
                 newData.startWeek = currentWeek;
                 newData.specificDate = null;
                 
                 // Calcular el siguiente orden para cada día
                 const listOrders = {};
                 newDays.forEach(day => {
                     // Al final del día. Sin normalizar timestamps legacy (comportamiento original).
                     const maxOrder = dayExtremeOrder(clients, day, 'max', null, false);
                     listOrders[day] = maxOrder + 1;
                 });
                 newData.listOrders = listOrders;
                 newData.listOrder = listOrders[newDays[0]];
            }
            
            if (clientData.freq === 'on_demand' || clientData.visitDay === 'Sin Asignar') {
                await firestoreRetry(() => db.collection('clients').doc(clientData.id).update(newData));
                showUndoToast("Cliente reactivado", null);
            } else {
                newData.createdAt = new Date();
                await firestoreRetry(() => db.collection('clients').add(newData));
                showUndoToast("Visita adicional creada", null);
            }
            setScheduleClient(null);
            setSelectedDay(newData.visitDays[0]);
            setView('list');
        } catch(e) { console.error(e); showUndoToast(getErrorMessage(e), null); }
    };
    const handleDeleteClient = (id) => {
        // Cualquier miembro puede quitar de la semana (se guarda en directorio)
        setConfirmModal({ isOpen: true, title: '¿Quitar de la lista?', message: 'Se guardará en el Directorio.', confirmText: "Quitar", isDanger: false, action: async () => {
            try {
                await firestoreRetry(() => db.collection('clients').doc(id).update({ freq: 'on_demand', visitDay: 'Sin Asignar', visitDays: [] }));
            } catch(e) { showUndoToast(getErrorMessage(e), null); }
            setConfirmModal(prev => ({...prev, isOpen: false}));
        } });
    };
    const handleDeletePermanently = (id) => {
        if (!isAdmin) { showUndoToast("No tenés permisos para eliminar clientes.", null); return; }
        setConfirmModal({ isOpen: true, title: '¿Eliminar Definitivamente?', message: 'Se borrará para siempre.', isDanger: true, action: async () => {
        try {
            const clientDebts = debts.filter(d => d.clientId === id);
            for (const d of clientDebts) { await firestoreRetry(() => db.collection('debts').doc(d.id).delete()); }
            const clientTransfers = transfers.filter(t => t.clientId === id);
            for (const t of clientTransfers) { await firestoreRetry(() => db.collection('transfers').doc(t.id).delete()); }
            await firestoreRetry(() => db.collection('clients').doc(id).delete());
        } catch(e) { console.error("Error eliminando cliente:", e); showUndoToast(getErrorMessage(e), null); }
        setConfirmModal(prev => ({...prev, isOpen: false}));
    } }); };
    

     const handleMagicPaste = (text) => {
         const parsed = parseContactString(text);
         if (!parsed.name && !parsed.link) { showUndoToast("No se pudo detectar el formato.", null); return; }
         if (view === 'add') {
             // Cualquier miembro puede agregar clientes
             setFormData(prev => ({ 
                 ...prev, 
                 name: parsed.name, 
                 address: parsed.address, 
                 phone: parsed.phone || prev.phone,
                 locationInput: parsed.link, 
                 lat: parsed.lat, 
                 lng: parsed.lng,
                 notes: parsed.notes || prev.notes,
                 products: {
                     ...prev.products,
                     ...Object.fromEntries(
                         Object.entries(parsed.products).filter(([k, v]) => v !== '')
                     )
                 }
             }));
             setShowPasteModal(false);
         } else {
             // Cualquier miembro puede importar clientes
             const currentWeek = getWeekNumber(new Date());
             const cleanProducts = Object.fromEntries(
                 Object.entries(parsed.products).filter(([k, v]) => v !== '').map(([k, v]) => [k, parseInt(v) || 0])
             );
             const safeMapsLink = (parsed.link && isSafeUrl(parsed.link)) ? parsed.link : '';
             const newData = {
                 name: sanitizeString(parsed.name, 100), phone: sanitizePhone(parsed.phone || ''), address: sanitizeString(parsed.address, 200), lat: sanitizeString(parsed.lat || '', 20), lng: sanitizeString(parsed.lng || '', 20), mapsLink: safeMapsLink, ...getDataScope(), userId: user.uid, freq: 'on_demand', visitDay: 'Sin Asignar', visitDays: [], notes: sanitizeString(parsed.notes || '', 500), updatedAt: new Date(), startWeek: currentWeek, listOrder: Date.now(), isPinned: false, products: cleanProducts
             };
             firestoreRetry(() => db.collection('clients').add(newData)).then(() => { showUndoToast("Importado al Directorio.", null); setShowPasteModal(false); }).catch((e) => { showUndoToast(getErrorMessage(e), null); });
         }
    };

    const filteredDirectory = React.useMemo(() => {
        return clients
            .filter(c => !c.isNote)
            .filter(c => {
                if (!debouncedSearch.trim()) return true;
                const match = fuzzyMatch(debouncedSearch);
                return match(c.name || '', c.address || '', c.phone || '');
            })
            .filter(c => {
                if (directoryFilter === 'all') return true;
                if (directoryFilter === 'no_location') return !((!!(c.lat && c.lng)) || !!c.mapsLink);
                if (directoryFilter === 'with_debt') {
                    const ids = c._mergedIds || [c.id];
                    return debts.some(d => ids.indexOf(d.clientId) > -1 && d.amount > 0);
                }
                return c.freq === directoryFilter;
            })
            // Merge duplicates by phone number (keep newest, preserve debt info)
            .reduce((unique, item) => {
                const key = item.phone ? item.phone.replace(/\D/g, '') : item.id;
                if (!item.phone || item.phone.length < 6) {
                    unique.push(item);
                    return unique;
                }
                const existingIndex = unique.findIndex(u => u.phone && u.phone.replace(/\D/g, '') === key);
                if (existingIndex > -1) {
                    const existing = unique[existingIndex];
                    const itemTime = new Date((item.updatedAt?.seconds || 0) * 1000);
                    const existingTime = new Date((existing.updatedAt?.seconds || 0) * 1000);
                    // Keep the newer one but merge hasDebt and collect all IDs
                    const mergedIds = [...(existing._mergedIds || [existing.id]), item.id];
                    const mergedHasDebt = existing.hasDebt || item.hasDebt;
                    if (itemTime > existingTime) {
                        unique[existingIndex] = { ...item, hasDebt: mergedHasDebt, _mergedIds: mergedIds };
                    } else {
                        unique[existingIndex] = { ...existing, hasDebt: mergedHasDebt, _mergedIds: mergedIds };
                    }
                } else {
                    unique.push(item);
                }
                return unique;
            }, [])
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [clients, debouncedSearch, directoryFilter, debts]);

    // Lista del registro ordenada por la columna elegida en la vista tabla
    const sortedTableClients = React.useMemo(() => {
        const arr = filteredDirectory.slice();
        const key = tableSort.key, dir = tableSort.dir;
        const debtOf = getDebtTotal;
        const freqRank = { weekly: 1, biweekly: 2, triweekly: 3, monthly: 4, once: 5, on_demand: 6 };
        arr.sort((a, b) => {
            let va, vb;
            if (key === 'phone') { va = a.phone || ''; vb = b.phone || ''; }
            else if (key === 'address') { va = (a.address || '').toLowerCase(); vb = (b.address || '').toLowerCase(); }
            else if (key === 'freq') { va = freqRank[a.freq] || 9; vb = freqRank[b.freq] || 9; }
            else if (key === 'debt') { va = debtOf(a); vb = debtOf(b); }
            else { va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); }
            if (va < vb) return dir === 'asc' ? -1 : 1;
            if (va > vb) return dir === 'asc' ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filteredDirectory, tableSort, getDebtTotal]);

    const directoryCounts = React.useMemo(() => {
        const all = clients.filter(c => !c.isNote);
        const counts = { total: all.length, weekly: 0, biweekly: 0, triweekly: 0, monthly: 0, once: 0, on_demand: 0, no_location: 0, with_debt: 0 };
        all.forEach(c => {
            if (c.freq && counts[c.freq] !== undefined) counts[c.freq]++;
            if (!((!!(c.lat && c.lng)) || !!c.mapsLink)) counts.no_location++;
            const ids = c._mergedIds || [c.id];
            if (debts.some(d => ids.indexOf(d.clientId) > -1 && d.amount > 0)) counts.with_debt++;
        });
        return counts;
    }, [clients, debts]);

    // --- ESTADÍSTICAS / REPORTES (panel de escritorio) ---
    const stats = React.useMemo(() => {
        const real = clients.filter(c => !c.isNote && c.name);
        const active = real.filter(c => c.freq !== 'on_demand');
        const byFreq = { weekly: 0, biweekly: 0, triweekly: 0, monthly: 0, once: 0 };
        active.forEach(c => { if (byFreq[c.freq] !== undefined) byFreq[c.freq]++; });

        // Carga por día de visita (Lun–Sáb): clientes asignados + unidades de producto.
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const sumUnits = (c) => {
            if (!c.products) return 0;
            return Object.keys(c.products).reduce((s, k) => s + (parseInt(c.products[k] || 0, 10) || 0), 0);
        };
        const perDay = days.map(d => {
            const cl = active.filter(c => (c.visitDays && c.visitDays.includes(d)) || c.visitDay === d);
            return { day: d, clients: cl.length, units: cl.reduce((s, c) => s + sumUnits(c), 0) };
        });

        // Totales por producto en todo el padrón activo (demanda por ciclo).
        const prodTotals = {};
        active.forEach(c => {
            if (!c.products) return;
            Object.keys(c.products).forEach(k => {
                const q = parseInt(c.products[k] || 0, 10) || 0;
                if (q > 0) prodTotals[k] = (prodTotals[k] || 0) + q;
            });
        });
        const prodList = Object.keys(prodTotals).map(k => {
            const p = PRODUCTS.find(x => x.id === k);
            return { id: k, label: p ? p.label : k, short: p ? p.short : k, sticker: p ? p.sticker : null, icon: p ? p.icon : '📦', qty: prodTotals[k] };
        }).sort((a, b) => b.qty - a.qty);
        const totalUnits = prodList.reduce((s, p) => s + p.qty, 0);

        // Deudas: clientes deudores únicos + monto total.
        const debtByClient = {};
        debts.forEach(d => { if ((d.amount || 0) > 0) debtByClient[d.clientId] = (debtByClient[d.clientId] || 0) + (d.amount || 0); });
        const debtorCount = Object.keys(debtByClient).length;
        const debtTotal = Object.keys(debtByClient).reduce((s, k) => s + debtByClient[k], 0);

        // Altas del mes en curso.
        const now = new Date();
        const newThisMonth = real.filter(c => {
            const dt = parseDate(c.createdAt);
            return dt && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
        }).length;

        return {
            totalActive: active.length,
            directoryOnly: real.filter(c => c.freq === 'on_demand').length,
            notes: clients.filter(c => c.isNote).length,
            byFreq, perDay, prodList, totalUnits,
            debtorCount, debtTotal,
            transfersPending: transfers.length,
            newThisMonth,
            starred: active.filter(c => c.isStarred).length,
            noLocation: active.filter(c => !((c.lat && c.lng) || c.mapsLink)).length,
        };
    }, [clients, debts, transfers]);

    const handleExportClients = () => {
        try {
            const allClients = clients.filter(c => c.name);
            if (allClients.length === 0) { showUndoToast("No hay clientes para exportar.", null); return; }

            // Headers del CSV
            const headers = ['Nombre', 'Teléfono', 'Dirección', 'Día', 'Frecuencia', 'Productos', 'Notas', 'Tiene Deuda', 'Favorito', 'Link Maps'];
            
            const freqLabels = { weekly: 'Semanal', biweekly: 'Cada 2 sem', triweekly: 'Cada 3 sem', monthly: 'Cada 4 sem', once: 'Una vez', on_demand: 'Archivado' };
            
            const rows = allClients.map(c => {
                // Armar resumen de productos
                let prodParts = [];
                if (c.products) {
                    PRODUCTS.forEach(p => {
                        const qty = parseInt(c.products[p.id] || 0);
                        if (qty > 0) prodParts.push(`${p.label}: ${qty}`);
                    });
                }
                
                return [
                    c.name || '',
                    c.phone || '',
                    c.address || '',
                    c.visitDay || '',
                    freqLabels[c.freq] || c.freq || '',
                    prodParts.join(', '),
                    c.notes || '',
                    c.hasDebt ? 'Sí' : 'No',
                    c.isStarred ? 'Sí' : 'No',
                    c.mapsLink || ''
                ];
            });
            
            // Escapar campos CSV
            const escapeCsv = (val) => {
                const str = String(val);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            };
            
            // BOM para que Excel/Sheets reconozca UTF-8
            const bom = '\uFEFF';
            const csvContent = bom + [
                headers.map(escapeCsv).join(','),
                ...rows.map(row => row.map(escapeCsv).join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `RutaWater_Clientes_${date}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showUndoToast(`${allClients.length} clientes exportados`, null);
        } catch(e) { 
            console.error("Error exportando:", e); 
            showUndoToast("Error al exportar. Intentá de nuevo.", null);
        }
    };

    const handleExportBackup = () => {
        try {
            const allClients = clients.filter(c => c.name);
            if (allClients.length === 0 && debts.length === 0 && transfers.length === 0) {
                showUndoToast("No hay datos para exportar.", null);
                return;
            }
            const backup = {
                exportDate: new Date().toISOString().split('T')[0],
                exportedBy: user.email || user.uid,
                clients: allClients.map(c => ({
                    id: c.id, name: c.name, phone: c.phone || '', address: c.address || '',
                    lat: c.lat || '', lng: c.lng || '', freq: c.freq || '',
                    visitDay: c.visitDay || '', visitDays: c.visitDays || [],
                    specificDate: c.specificDate || '', notes: c.notes || '',
                    products: c.products || {}, isStarred: c.isStarred || false,
                    alarm: c.alarm || '', mapsLink: c.mapsLink || '', isNote: c.isNote || false,
                    hasDebt: c.hasDebt || false
                })),
                debts: debts.map(d => ({
                    id: d.id, clientId: d.clientId, clientName: d.clientName || '',
                    clientAddress: d.clientAddress || '', amount: d.amount || 0,
                    createdAt: d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toISOString() : ''
                })),
                transfers: transfers.map(t => ({
                    id: t.id, clientId: t.clientId, clientName: t.clientName || '',
                    clientAddress: t.clientAddress || '',
                    createdAt: t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toISOString() : ''
                }))
            };
            const jsonContent = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `RutaWater_Backup_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            const counts = [];
            if (backup.clients.length > 0) counts.push(`${backup.clients.length} clientes`);
            if (backup.debts.length > 0) counts.push(`${backup.debts.length} deudas`);
            if (backup.transfers.length > 0) counts.push(`${backup.transfers.length} transf.`);
            showUndoToast(`Backup: ${counts.join(', ')}`, null);
        } catch(e) {
            console.error("Error exportando backup:", e);
            showUndoToast("Error al exportar. Intentá de nuevo.", null);
        }
    };

    // --- REORDENAR CLIENTE: posiciones enteras secuenciales con desplazamiento ---
    // Maneja tanto asignación manual de posición como drag-and-drop.
    // Renumera TODOS los clientes del día con enteros secuenciales (0,1,2,...),
    // garantizando coherencia entre grupos de fechas (hoy, próxima semana, etc.)
    // y que cada tarjeta se desplace como máximo 1 posición.
    const reorderClientForDay = async (clientId, dayToFilter, options) => {
        // Leer del ref sincrónico para tener siempre las posiciones más recientes
        // (evita race condition cuando se asignan posiciones rápidamente)
        const allClients = [...getVisibleClients(dayToFilter, clientsRef.current)];
        const currentIndex = allClients.findIndex(c => c.id === clientId);
        if (currentIndex === -1) return;

        // Remover la tarjeta de su posición actual
        const [movedClient] = allClients.splice(currentIndex, 1);

        // Determinar índice de inserción (0-based, en la lista SIN la tarjeta movida)
        let insertIndex;
        if (options.targetPosition !== undefined) {
            // Asignación manual de posición (1-indexed desde el usuario)
            insertIndex = Math.max(0, Math.min(options.targetPosition - 1, allClients.length));
        } else if (options.afterClientId) {
            // Drag: insertar justo después de un cliente específico
            const afterIdx = allClients.findIndex(c => c.id === options.afterClientId);
            insertIndex = afterIdx >= 0 ? afterIdx + 1 : allClients.length;
        } else if (options.beforeClientId) {
            // Drag: insertar justo antes de un cliente específico (primera posición del grupo)
            const beforeIdx = allClients.findIndex(c => c.id === options.beforeClientId);
            insertIndex = beforeIdx >= 0 ? beforeIdx : 0;
        } else {
            insertIndex = 0;
        }

        // Insertar en la posición objetivo
        allClients.splice(insertIndex, 0, movedClient);

        // Si la tarjeta quedó en la misma posición, no hacer nada
        const newIndex = allClients.indexOf(movedClient);
        if (newIndex === currentIndex) return;

        // Asignar posiciones enteras secuenciales a TODOS los clientes.
        // Solo escribir actualizaciones para los que cambiaron.
        const updates = [];
        allClients.forEach((client, newPos) => {
            const storedPos = client.listOrders && typeof client.listOrders[dayToFilter] === 'number'
                ? client.listOrders[dayToFilter]
                : undefined;
            if (storedPos !== newPos) {
                updates.push({ id: client.id, position: newPos });
            }
        });

        if (updates.length === 0) return;

        // Optimista: actualizar ref SINCRÓNICAMENTE + estado React
        // El ref garantiza que la siguiente llamada vea posiciones correctas
        // incluso antes de que React re-renderice
        const updateMap = {};
        updates.forEach(u => { updateMap[u.id] = u.position; });
        const applyUpdate = list => list.map(c => {
            if (updateMap[c.id] !== undefined) {
                return { ...c, listOrders: { ...(c.listOrders || {}), [dayToFilter]: updateMap[c.id] } };
            }
            return c;
        });
        clientsRef.current = applyUpdate(clientsRef.current);
        setClients(applyUpdate);

        try {
            await firestoreRetry(() => {
                const batch = db.batch();
                updates.forEach(({ id, position }) => {
                    batch.update(db.collection('clients').doc(id), {
                        [`listOrders.${dayToFilter}`]: position
                    });
                });
                return batch.commit();
            });
        } catch (e) {
            console.error("Error reordering:", e);
            showUndoToast(getErrorMessage(e), null);
        }
    };

    const changeClientPosition = async (clientId, newPosStr) => {
        const newPos = parseInt(newPosStr, 10);
        if (isNaN(newPos) || newPos < 1) return;
        await reorderClientForDay(clientId, selectedDay, { targetPosition: newPos });
    };

    // --- SORTABLEJS: DRAG-TO-REORDER TARJETAS ---
    const sortableInstances = React.useRef([]);
    React.useEffect(() => {
        // Limpiar instancias previas
        sortableInstances.current.forEach(s => s.destroy());
        sortableInstances.current = [];

        if (view !== 'list' || !selectedDay || typeof Sortable === 'undefined') return;

        // Esperar al siguiente frame para que el DOM esté listo
        const timer = setTimeout(() => {
            const groupKeys = Object.keys(groupedClients);
            groupKeys.forEach(key => {
                const container = document.getElementById(`group-${key}`);
                if (!container) return;
                const instance = Sortable.create(container, {
                    handle: '.drag-handle',
                    filter: '.order-input',
                    preventOnFilter: false,
                    animation: 200,
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    delay: 150,
                    delayOnTouchOnly: true,
                    touchStartThreshold: 5,
                    onEnd: async (evt) => {
                        if (evt.oldIndex === evt.newIndex) return;
                        // Capturar el nuevo orden del DOM ANTES de revertir (solo hijos directos)
                        const newOrder = Array.from(container.children)
                            .map(el => el.getAttribute('data-client-id'))
                            .filter(Boolean);

                        // Revertir el movimiento DOM para que React controle el render
                        const { item, oldIndex: oi, newIndex: ni } = evt;
                        if (oi < ni) {
                            container.insertBefore(item, container.children[oi]);
                        } else {
                            container.insertBefore(item, container.children[oi + 1]);
                        }

                        const movedClientId = item.getAttribute('data-client-id');
                        if (!movedClientId) return;

                        const movedNewIndex = newOrder.indexOf(movedClientId);
                        if (movedNewIndex === -1) return;

                        // Determinar vecinos en el grupo para posicionamiento coherente
                        const prevId = movedNewIndex > 0 ? newOrder[movedNewIndex - 1] : null;
                        const nextId = movedNewIndex < newOrder.length - 1 ? newOrder[movedNewIndex + 1] : null;

                        // Usar reorderClientForDay con posicionamiento por vecinos
                        // para mantener coherencia entre grupos de fechas
                        if (prevId) {
                            await reorderClientForDay(movedClientId, selectedDay, { afterClientId: prevId });
                        } else if (nextId) {
                            await reorderClientForDay(movedClientId, selectedDay, { beforeClientId: nextId });
                        }
                    }
                });
                sortableInstances.current.push(instance);
            });
        }, 100);
        return () => {
            clearTimeout(timer);
            sortableInstances.current.forEach(s => s.destroy());
            sortableInstances.current = [];
        };
    }, [groupedClients, selectedDay, view]);

    if (loadingAuth) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold">Cargando...</div>;
    if (!user) return <LoginScreen onLogin={handleGoogleLogin} />;

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 font-sans ${activeSection === 'cartera' ? 'pb-24' : 'pb-6'} relative`}>
            {/* MODALES: renderizado condicional para evitar reconciliación innecesaria */}
            {confirmModal.isOpen && <ConfirmModal isOpen={true} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} cancelText={confirmModal.cancelText} isDanger={confirmModal.isDanger} onConfirm={confirmModal.action} onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })} />}
            {scheduleClient && <ScheduleModal isOpen={true} client={scheduleClient} onClose={() => setScheduleClient(null)} onSave={handleScheduleFromDirectory} />}
            {showPasteModal && <PasteContactModal isOpen={true} onClose={() => setShowPasteModal(false)} onPaste={handleMagicPaste} />}
            {alarmModal.isOpen && <AlarmModal isOpen={true} initialValue={alarmModal.currentVal} onClose={() => setAlarmModal({isOpen: false, clientId: null, currentVal: ''})} onSave={handleSaveAlarm} />}
            {noteModal && <NoteModal isOpen={true} onClose={() => setNoteModal(false)} onSave={handleSaveNote} />}
            {showBulkImport && <BulkImportModal isOpen={true} onClose={() => setShowBulkImport(false)} onImport={handleBulkImport} defaultDay={selectedDay} />}
            {editNoteData && <NoteModal isOpen={true} editNote={editNoteData} onClose={() => setEditNoteData(null)} onSave={handleEditNote} />}
            {showGroupModal && <GroupModal
                isOpen={true}
                onClose={() => setShowGroupModal(false)}
                user={user}
                groupData={groupData}
                onGroupUpdate={(newGroupData) => {
                    setGroupData(newGroupData);
                }}
            />}
            {showDebtClientSearch && <ClientSearchModal isOpen={true} clients={clients} onClose={() => setShowDebtClientSearch(false)} onSelect={(client) => { setShowDebtClientSearch(false); setDebtModal({ isOpen: true, client }); }} />}
            {debtModal.isOpen && <DebtModal isOpen={true} client={debtModal.client} onClose={() => setDebtModal({ isOpen: false, client: null })} onSave={handleAddDebt} />}
            {editDebtModal.isOpen && <EditDebtModal isOpen={true} debt={editDebtModal.debt} onClose={() => setEditDebtModal({ isOpen: false, debt: null })} onSave={handleEditDebt} />}
            {viewDebtModal.isOpen && <ViewDebtModal
                isOpen={true}
                client={viewDebtModal.client}
                debts={debts}
                onClose={() => setViewDebtModal({ isOpen: false, client: null })}
                onPaid={(debt) => {
                    setViewDebtModal({ isOpen: false, client: null });
                    setConfirmModal({
                        isOpen: true, title: '¿Deuda pagada?',
                        message: `Confirmar que ${debt.clientName} pagó $${debt.amount?.toLocaleString()}`,
                        confirmText: "Pagada", isDanger: false,
                        action: async () => {
                            await handleDebtPaid(debt);
                            setConfirmModal(prev => ({...prev, isOpen: false}));
                        }
                    });
                }}
                onEdit={(debt) => setEditDebtModal({ isOpen: true, debt })}
                onAddMore={(client) => setDebtModal({ isOpen: true, client })}
                onSendDebtTotal={sendDebtTotal}
                onSendReminder={sendReminder}
            />}
            {quickEditClient && <EditClientQuickModal isOpen={true} client={quickEditClient} onClose={() => setQuickEditClient(null)} onSave={handleQuickUpdateClient} showClientInfo={quickEditShowInfo} />}
            {relationshipClient && <RelationshipsModal isOpen={true} client={clients.find(c => c.id === relationshipClient.id) || relationshipClient} allClients={clients} onClose={() => setRelationshipClient(null)} onAdd={handleAddRelationship} onRemove={handleRemoveRelationship} />}
            {smartOrderOpen && <SmartOrderModal isOpen={true} onClose={() => setSmartOrderOpen(false)} onInterpret={aiParseOrder} onConfirm={handleAiConfirm} />}
            {catalogOpen && <ProductCatalogModal isOpen={true} products={PRODUCTS} hidden={appSettings?.productHidden || []} onClose={() => setCatalogOpen(false)} onRename={catalogRename} onSetEmoji={catalogSetEmoji} onToggleHidden={catalogToggleHidden} onAdd={catalogAddProduct} onRemove={catalogRemoveCustom} onMove={catalogMove} />}
            {showSettingsModal && <SettingsModal
                isOpen={true}
                groupData={groupData}
                darkOn={darkOn}
                onToggleTheme={toggleTheme}
                onLogout={handleLogout}
                onOpenGroup={() => { setShowSettingsModal(false); setShowGroupModal(true); }}
                onOpenCatalog={() => { setShowSettingsModal(false); setCatalogOpen(true); }}
                onOpenWhatsApp={() => { setShowSettingsModal(false); setShowWhatsAppModal(true); }}
                onImport={() => { setShowSettingsModal(false); setShowBulkImport(true); }}
                onExportCSV={handleExportClients}
                onExportBackup={handleExportBackup}
                onClose={() => setShowSettingsModal(false)}
            />}
            {showWhatsAppModal && <WhatsAppTemplatesModal
                isOpen={true}
                settings={appSettings}
                onClose={() => setShowWhatsAppModal(false)}
                onSave={async (newSettings) => {
                    try {
                        const settingsDocId = groupData?.groupId || user.uid;
                        await firestoreRetry(() => db.collection('settings').doc(settingsDocId).set(newSettings, { merge: true }));
                        setAppSettings(prev => ({ ...prev, ...newSettings }));
                        showUndoToast("Mensajes guardados", null);
                    } catch(e) { showUndoToast(getErrorMessage(e), null); }
                }}
            />}
            {activeAlert && <AlarmBanner data={activeAlert} onClose={handleDismissAlert} />}

            {/* TOAST NOTIFICATION */}
            {toast && <Toast message={toast.message} onUndo={handleUndo} hasUndo={!!toast.undoAction} />}

            {/* OFFLINE INDICATOR */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-center text-sm font-medium py-2 z-50 flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                    Sin conexión - Los cambios se sincronizarán al reconectar
                </div>
            )}

            {/* SW UPDATE BANNER */}
            {swUpdate && (
                <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center text-sm font-medium py-2 z-50 flex items-center justify-center gap-3">
                    Nueva versión disponible
                    <button onClick={() => window.location.reload()} className="bg-white text-blue-600 px-3 py-0.5 rounded-full text-xs font-bold hover:bg-blue-50">
                        Actualizar
                    </button>
                </div>
            )}

            {/* INSTALL APP BANNER */}
            {installPrompt && (
                <div className="fixed top-0 left-0 right-0 bg-green-600 text-white text-center text-sm font-medium py-2 z-40 flex items-center justify-center gap-3">
                    Instalá RutaWater en tu dispositivo
                    <button onClick={() => { installPrompt.prompt(); installPrompt.userChoice.then(() => setInstallPrompt(null)); }} className="bg-white text-green-700 px-3 py-0.5 rounded-full text-xs font-bold hover:bg-green-50">
                        Instalar
                    </button>
                    <button onClick={() => setInstallPrompt(null)} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
                </div>
            )}

            <header className={`bg-blue-600/90 dark:bg-gray-900/80 backdrop-blur-lg text-white p-4 shadow-lg shadow-blue-900/10 dark:shadow-black/20 sticky top-0 z-30 transition-all duration-200`} style={{marginTop: ((!isOnline ? 36 : 0) + (swUpdate ? 36 : 0) + (installPrompt ? 36 : 0)) || undefined}}>
                <div className={`flex justify-between items-center ${isWide ? '' : 'max-w-2xl mx-auto'}`}>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center gap-2 cursor-pointer active:opacity-80 transition-opacity"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <span className="text-xl">🚚</span>
                            <h1 className="text-xl font-bold">RutaWater</h1>
                        </div>
                        {isWide && (
                            <div className="flex items-center gap-1 ml-1">
                                <button onClick={() => { setActiveSection('cartera'); setView('list'); }} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeSection === 'cartera' && view === 'list' ? 'bg-white/20' : 'hover:bg-white/10'}`}>🏠 Inicio</button>
                                <button onClick={() => { setActiveSection('cartera'); setView('directory'); }} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeSection === 'cartera' && (view === 'directory' || view === 'tabla') ? 'bg-white/20' : 'hover:bg-white/10'}`}>👥 Directorio</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isWide && (
                            <div className="relative">
                                <button onClick={() => setShowFabMenu(!showFabMenu)} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                                    ＋ Nuevo <span className={`inline-block transition-transform ${showFabMenu ? 'rotate-180' : ''}`}>▾</span>
                                </button>
                                {showFabMenu && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowFabMenu(false)} />
                                        <div className="absolute right-0 top-10 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-48 overflow-hidden" style={{ animation: 'slideUpFade 0.2s ease-out forwards' }}>
                                            <button onClick={() => { resetForm(); setView('add'); setShowFabMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><span>➕</span><span className="flex-1 text-left">Nuevo cliente</span></button>
                                            <div className="border-t border-gray-100 dark:border-gray-700" />
                                            <button onClick={() => { setNoteModal(true); setShowFabMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><span>📝</span><span className="flex-1 text-left">Nueva nota</span></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        {/* SELECTOR DE SECCIÓN */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowSectionMenu(!showSectionMenu)} 
                                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                {activeSection === 'cartera' && <>👥 Cartera</>}
                                {activeSection === 'deudas' && <>💰 Deudas</>}
                                {activeSection === 'transferencias' && <>💳 Transferencias</>}
                                {activeSection === 'estadisticas' && <>📊 Estadísticas</>}
                                <span className={`transition-transform duration-200 inline-block ${showSectionMenu ? 'rotate-180' : ''}`}>▾</span>
                                {/* Badges de pendientes */}
                                {activeSection !== 'deudas' && debts.length > 0 && (
                                    <span className="bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">{debts.length}</span>
                                )}
                                {activeSection !== 'transferencias' && transfers.length > 0 && (
                                    <span className="bg-emerald-500 text-white text-[9px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">{transfers.length}</span>
                                )}
                            </button>
                            {showSectionMenu && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setShowSectionMenu(false)} />
                                    <div className="absolute right-0 top-10 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-56 overflow-hidden" style={{animation: 'slideUpFade 0.2s ease-out forwards'}}>
                                        <button
                                            onClick={() => { setActiveSection('cartera'); setShowSectionMenu(false); setView('list'); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeSection === 'cartera' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <span>👥</span>
                                            <span className="flex-1 text-left">Cartera de Clientes</span>
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700" />
                                        <button
                                            onClick={() => { setActiveSection('deudas'); setShowSectionMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeSection === 'deudas' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <span>💰</span>
                                            <span className="flex-1 text-left">Deudas de Clientes</span>
                                            {debts.length > 0 && <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">{debts.length}</span>}
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700" />
                                        <button
                                            onClick={() => { setActiveSection('transferencias'); setShowSectionMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeSection === 'transferencias' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <span>💳</span>
                                            <span className="flex-1 text-left">Revisar Transferencias</span>
                                            {transfers.length > 0 && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">{transfers.length}</span>}
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700" />
                                        <button
                                            onClick={() => { setActiveSection('estadisticas'); setShowSectionMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeSection === 'estadisticas' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <span>📊</span>
                                            <span className="flex-1 text-left">Estadísticas</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Grupo / Tema / Cerrar sesión ahora viven dentro de Configuración */}
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className={`p-1.5 rounded-lg transition-colors relative ${groupData?.groupId ? 'bg-purple-500/20 text-purple-200' : 'hover:bg-white/10'}`}
                            title="Configuración"
                        >
                            ⚙️
                        </button>
                    </div>
                </div>
            </header>

            <main className={((view === 'tabla' || ((view === 'list' || view === 'directory') && isWide)) ? 'max-w-none' : 'max-w-2xl') + ' mx-auto p-4 overflow-x-hidden'}>
                {/* ==================== SECCIÓN: CARTERA DE CLIENTES ==================== */}
                {activeSection === 'cartera' && (
                <>
                {view === 'list' && !isWide && (
                    <div className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                                <button key={day} onClick={() => { setSelectedDay(day); setListSearchTerm(''); setActiveFilters([]); setShowFilterMenu(false); }} className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 ${selectedDay === day ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                                    {day}
                                    {dayCounts[day] > 0 && (
                                        <span className={`text-[11px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${selectedDay === day ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>{dayCounts[day]}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {selectedDay !== '' && (
                            <>
                                {/* TOTAL LOADS COUNTER (Nearest date only) */}
                                <ProductCounter clients={activeClientsForCounter} label={Object.keys(groupedClients).length > 0 ? groupedClients[Object.keys(groupedClients).sort((a, b) => parseFloat(a) - parseFloat(b))[0]]?.label : null} />
                                
                                {/* BARRA DE BÚSQUEDA Y FILTRO */}
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1 relative">
                                        <input 
                                            type="text" 
                                            placeholder="Buscar por nombre o dirección..." 
                                            value={listSearchTerm} 
                                            onChange={(e) => setListSearchTerm(e.target.value)} 
                                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                                        />
                                        <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
                                            🔍
                                        </div>
                                        {listSearchTerm && (
                                            <button 
                                                onClick={() => setListSearchTerm('')}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative" ref={el => { if (el) el._filterBtnRef = el; }}>
                                        <button
                                            id="filter-btn"
                                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                                            className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                                                activeFilters.length > 0
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            <span>🔍</span>
                                            Filtros
                                            {activeFilters.length > 0 && (
                                                <span className="bg-white text-blue-600 text-[11px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">{activeFilters.length}</span>
                                            )}
                                        </button>

                                        {/* MENÚ DESPLEGABLE DE FILTROS */}
                                        {showFilterMenu && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />
                                                <div className="fixed z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-64 overflow-y-auto" style={{animation: 'slideUpFade 0.2s ease-out forwards', maxHeight: 'calc(100vh - 200px)', top: (() => { const btn = document.getElementById('filter-btn'); if (btn) { const r = btn.getBoundingClientRect(); return (r.bottom + 8) + 'px'; } return '200px'; })(), right: '16px'}}>
                                                    {/* Header del menú */}
                                                    <div className="flex justify-between items-center px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filtros</span>
                                                        {activeFilters.length > 0 && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setActiveFilters([]); }}
                                                                className="text-[11px] text-red-500 dark:text-red-400 font-bold hover:text-red-600"
                                                            >
                                                                Limpiar todo
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Sección: Tipo de pedido */}
                                                    <div className="px-3 py-2">
                                                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Tipo</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveFilters(prev => 
                                                                    prev.includes('once_starred') 
                                                                        ? prev.filter(f => f !== 'once_starred') 
                                                                        : [...prev, 'once_starred']
                                                                );
                                                            }}
                                                            className={`w-full mt-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                                                activeFilters.includes('once_starred')
                                                                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800'
                                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                        >
                                                            <span>⭐</span>
                                                            <span>Una vez / Favoritos</span>
                                                            {activeFilters.includes('once_starred') && (
                                                                <span className="ml-auto">✅</span>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveFilters(prev => 
                                                                    prev.includes('has_debt') 
                                                                        ? prev.filter(f => f !== 'has_debt') 
                                                                        : [...prev, 'has_debt']
                                                                );
                                                            }}
                                                            className={`w-full mt-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                                                activeFilters.includes('has_debt')
                                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800'
                                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                        >
                                                            <span>💰</span>
                                                            <span>Con deuda</span>
                                                            {activeFilters.includes('has_debt') && (
                                                                <span className="ml-auto">✅</span>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Separador */}
                                                    <div className="border-t border-gray-100 dark:border-gray-700" />

                                                    {/* Sección: Productos */}
                                                    <div className="px-3 py-2 pb-3">
                                                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Productos</span>
                                                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                                                            {getVisibleProducts().map(prod => {
                                                                const isActive = activeFilters.includes(prod.id);
                                                                return (
                                                                    <button
                                                                        key={prod.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveFilters(prev => 
                                                                                prev.includes(prod.id)
                                                                                    ? prev.filter(f => f !== prod.id)
                                                                                    : [...prev, prod.id]
                                                                            );
                                                                        }}
                                                                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                                                                            isActive
                                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                                                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                                                                        }`}
                                                                    >
                                                                        <ProductGlyph product={prod} size={16} />
                                                                        <span className="truncate">{prod.short}</span>
                                                                        {isActive && (
                                                                            <span className="ml-auto shrink-0">✅</span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* CHIPS DE FILTROS ACTIVOS */}
                                {activeFilters.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeFilters.map(filter => {
                                            let label = '';
                                            let bgColor = '';
                                            if (filter === 'once_starred') {
                                                label = '⭐ Una vez / Favoritos';
                                                bgColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
                                            } else if (filter === 'has_debt') {
                                                label = '💰 Con deuda';
                                                bgColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
                                            } else {
                                                const prod = PRODUCTS.find(p => p.id === filter);
                                                label = prod ? `${prod.icon} ${prod.label}` : filter;
                                                bgColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                                            }
                                            return (
                                                <button
                                                    key={filter}
                                                    onClick={() => setActiveFilters(prev => prev.filter(f => f !== filter))}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${bgColor}`}
                                                >
                                                    {label}
                                                    <span>✕</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                        {/* SKELETON LOADING */}
                        {selectedDay !== '' && !isCloudActive && clients.length === 0 && (
                            <div className="grid gap-3">
                                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                            </div>
                        )}

                        {/* RENDERIZADO POR GRUPOS DE FECHA */}
                        {selectedDay !== '' && (isCloudActive || clients.length > 0) ? (
                            Object.keys(groupedClients).map(key => (
                                <div key={key} className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider pl-2 border-l-4 border-blue-200 dark:border-blue-900">
                                        {groupedClients[key].label} <span className="text-gray-400 dark:text-gray-500 font-normal">({groupedClients[key].items.length})</span>
                                    </h3>
                                    <div id={`group-${key}`} className="grid grid-cols-1 gap-3">
                                        {groupedClients[key].items.map((client) => (
                                            <div key={client.id} data-client-id={client.id} className="min-w-0">
                                                <ClientCard
                                                    client={client}
                                                    trueIndex={clientIndexMap[client.id] ?? 0}
                                                    isAdmin={isAdmin}
                                                    onToggleStar={handleToggleStar}
                                                    onDebtClick={handleDebtClick}
                                                    onAddTransfer={handleAddTransfer}
                                                    onSetAlarm={handleSetAlarmForClient}
                                                    onEdit={(c) => { setQuickEditClient(c); setQuickEditShowInfo(false); }}
                                                    onEditNote={(note) => setEditNoteData(note)}
                                                    onDelete={handleDeleteClient}
                                                    onOpenMaps={openGoogleMaps}
                                                    onSendPhoto={sendPhotoWhatsApp}
                                                    onSendWhatsApp={sendWhatsApp}
                                                    onMarkDone={handleMarkAsDoneInList}
                                                    onChangePosition={changeClientPosition}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="grid gap-3">
                                <p className="text-center text-gray-500 dark:text-gray-400 mt-10">Selecciona un día para ver la agenda organizada.</p>
                            </div>
                        )}
                        
                        {/* SECCIÓN COMPLETADOS */}
                        {selectedDay !== '' && getCompletedClients(selectedDay).length > 0 && (
                            <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        ✅ Completados ({getCompletedClients(selectedDay).length})
                                    </h3>
                                    <button
                                        onClick={() => handleClearCompleted(selectedDay)}
                                        className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 hover:text-red-600 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        🗑️ Eliminar todos
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {getCompletedClients(selectedDay).map(client => (
                                        <Card key={client.id} className="p-3 opacity-60 hover:opacity-100 transition-opacity bg-gray-50 dark:bg-gray-800/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                        ✅
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-500 dark:text-gray-400 line-through">{(client.name || '').toUpperCase()}</h4>
                                                        {client.isNote && client.notes ? (
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{client.notes}</p>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">{client.address}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleRestoreCompleted(client)}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-800"
                                                    >
                                                        Restaurar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePermanently(client.id)}
                                                        className="p-1.5 opacity-40 hover:opacity-100 transition-all"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* VISTAS DIRECTORIO Y ADD IGUALES CON MODIFICACION DE FORMULARIO */}
                {view === 'directory' && !isWide && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">👥 Directorio</h2>
                                <div className="flex gap-1.5">                                    <button onClick={() => setView('tabla')} className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800 flex items-center gap-1" title="Vista de tabla (escritorio)">📊 Tabla</button>
                                    <button onClick={() => setShowBulkImport(true)} className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-orange-200 dark:hover:bg-orange-800 flex items-center gap-1" title="Importar clientes en lote (pegar contactos o CSV)">📥 Importar</button>
                                    <button onClick={handleExportClients} className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-green-200 dark:hover:bg-green-800 flex items-center gap-1">📤 CSV</button>
                                    <button onClick={handleExportBackup} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center gap-1">💾 Backup</button>
                                </div>
                            </div>
                            <div className="relative">
                                <input type="text" aria-label="Buscar en el registro de clientes" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                                <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500">🔍</div>
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1" style={{scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'}}>
                                {[
                                    { key: 'all', label: 'Todos', count: directoryCounts.total },
                                    { key: 'weekly', label: 'Sem', count: directoryCounts.weekly },
                                    { key: 'biweekly', label: 'Quin', count: directoryCounts.biweekly },
                                    { key: 'triweekly', label: 'C/3', count: directoryCounts.triweekly },
                                    { key: 'monthly', label: 'Mens', count: directoryCounts.monthly },
                                    { key: 'once', label: '1 vez', count: directoryCounts.once },
                                    { key: 'on_demand', label: 'Dir', count: directoryCounts.on_demand },
                                    { key: 'no_location', label: 'Sin ubic.', count: directoryCounts.no_location },
                                    { key: 'with_debt', label: 'Deuda', count: directoryCounts.with_debt },
                                ].filter(f => f.key === 'all' || f.count > 0).map(f => (
                                    <button key={f.key} onClick={() => setDirectoryFilter(directoryFilter === f.key ? 'all' : f.key)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors flex-shrink-0 ${directoryFilter === f.key ? (f.key === 'no_location' ? 'bg-yellow-500 text-white' : f.key === 'with_debt' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                        {f.label} {f.count > 0 && <span className={`ml-0.5 ${directoryFilter === f.key ? 'opacity-80' : 'opacity-50'}`}>{f.count}</span>}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center font-medium">
                                {filteredDirectory.length} cliente{filteredDirectory.length !== 1 ? 's' : ''}
                                {directoryFilter !== 'all' && (' de ' + directoryCounts.total)}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredDirectory.map(client => {
                                var prodList = [];
                                if (client.products) {
                                    prodList = Object.keys(client.products)
                                        .filter(function(k) { return parseInt(client.products[k] || 0) > 0; })
                                        .map(function(k) { var p = PRODUCTS.find(function(prod) { return prod.id === k; }); return { qty: client.products[k], prod: p, label: p ? p.short : k }; });
                                }
                                var debtTotal = getDebtTotal(client);
                                var freqBadge = getFreqBadge(client.freq);
                                var freqLabel = freqBadge.label, freqColor = freqBadge.color;
                                var isOnDemand = client.freq === 'on_demand' || !(client.visitDays && client.visitDays.length > 0);
                                var hasLocation = !!(client.lat && client.lng) || !!client.mapsLink;
                                var avatarColors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500','bg-red-500'];
                                var avatarColor = avatarColors[(client.name || '').charCodeAt(0) % avatarColors.length];
                                var initial = (client.name || '?').charAt(0).toUpperCase();
                                return (
                                <Card key={client.id} className="p-4">
                                    {/* HEADER: Avatar + Nombre + Teléfono */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                                            {initial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{(client.name || '').toUpperCase()}</h3>
                                                {client.phone && <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{client.phone}</span>}
                                            </div>
                                            {client.address && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">📍 {client.address}</p>}
                                        </div>
                                    </div>

                                    {/* BADGES: Frecuencia + Días + Deuda */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${freqColor}`}>{freqLabel}</span>
                                        {client.visitDays && client.visitDays.length > 0 && (
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">{client.visitDays.map(function(d) { return d.slice(0, 3); }).join(', ')}</span>
                                        )}
                                        {debtTotal > 0 && (
                                            <button onClick={() => { var c = { ...client, hasDebt: true }; setViewDebtModal({ isOpen: true, client: c }); }} className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">💰 ${debtTotal.toLocaleString()}</button>
                                        )}
                                    </div>

                                    {/* PRODUCTOS: Chips individuales */}
                                    {prodList.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                            {prodList.map(function(p, i) { return (
                                                <span key={i} className="text-[11px] font-medium bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-600 inline-flex items-center gap-1"><ProductGlyph product={p.prod} size={13} /> {p.qty}x {p.label}</span>
                                            ); })}
                                        </div>
                                    )}

                                    {/* ACCIONES */}
                                    <div className="flex items-center gap-1.5 mt-3">
                                        {client.phone && <button onClick={() => openExternal('tel:' + normalizePhone(client.phone))} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors" title="Llamar">📞</button>}
                                        {client.phone && <button onClick={() => sendWhatsAppDirect(client.phone)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" title="WhatsApp">💬</button>}
                                        <button onClick={() => hasLocation ? openGoogleMaps(client.lat, client.lng, client.mapsLink) : null} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasLocation ? 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800 opacity-30 cursor-default'}`} title={hasLocation ? 'Maps' : 'Sin ubicación'}>📍</button>
                                        <button onClick={() => { var c = { ...client, hasDebt: debtTotal > 0 }; if (debtTotal > 0) { setViewDebtModal({ isOpen: true, client: c }); } else { setDebtModal({ isOpen: true, client: c }); } }} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors" title="Deuda">{debtTotal > 0 ? '🔴' : '💰'}</button>
                                        {isAdmin && <button onClick={() => { setQuickEditClient(client); setQuickEditShowInfo(true); }} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Editar">✏️</button>}
                                        <div className="flex-1" />
                                        <button onClick={() => setScheduleClient(client)} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm shadow-blue-600/20 transition-colors active:scale-[0.97]">
                                            {isOnDemand ? '📅 Agendar' : '+ Visita'}
                                        </button>
                                    </div>
                                </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
                {(view === 'tabla' || (view === 'directory' && isWide)) && (
                    <div className="space-y-3">
                        {/* CABECERA: título + buscador + filtros + acciones */}
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">📊 Registro de clientes</h2>
                                <div className="flex gap-1.5">
                                    {!isWide && <button onClick={() => { setView('directory'); setTableSelectedClient(null); }} className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1" title="Volver a tarjetas">👥 Tarjetas</button>}                                    <button onClick={() => setSmartOrderOpen(true)} className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center gap-1" title="Crear/agendar desde texto con IA">✨ Pedido IA</button>
                                    <button onClick={() => setCatalogOpen(true)} className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-teal-200 dark:hover:bg-teal-800 flex items-center gap-1" title="Editar catálogo de productos">📦 Productos</button>
                                    <button onClick={() => setColWidths({ ...DEFAULT_COL_WIDTHS })} className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1" title="Restablecer anchos de columnas">↔ Anchos</button>
                                    <button onClick={() => setShowBulkImport(true)} className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-orange-200 dark:hover:bg-orange-800 flex items-center gap-1" title="Importar clientes en lote (pegar contactos o CSV)">📥 Importar</button>
                                    <button onClick={handleExportClients} className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-green-200 dark:hover:bg-green-800 flex items-center gap-1">📤 CSV</button>
                                    <button onClick={handleExportBackup} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center gap-1">💾 Backup</button>
                                </div>
                            </div>
                            <div className="relative">
                                <input type="text" aria-label="Buscar clientes por nombre, dirección o teléfono" placeholder="Buscar por nombre, dirección o teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                                <div className="absolute left-3 top-3 text-gray-400 dark:text-gray-500">🔍</div>
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                                )}
                            </div>
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                {[
                                    { key: 'all', label: 'Todos', count: directoryCounts.total },
                                    { key: 'weekly', label: 'Sem', count: directoryCounts.weekly },
                                    { key: 'biweekly', label: 'Quin', count: directoryCounts.biweekly },
                                    { key: 'triweekly', label: 'C/3', count: directoryCounts.triweekly },
                                    { key: 'monthly', label: 'Mens', count: directoryCounts.monthly },
                                    { key: 'once', label: '1 vez', count: directoryCounts.once },
                                    { key: 'on_demand', label: 'Dir', count: directoryCounts.on_demand },
                                    { key: 'no_location', label: 'Sin ubic.', count: directoryCounts.no_location },
                                    { key: 'with_debt', label: 'Deuda', count: directoryCounts.with_debt },
                                ].filter(f => f.key === 'all' || f.count > 0).map(f => (
                                    <button key={f.key} onClick={() => setDirectoryFilter(directoryFilter === f.key ? 'all' : f.key)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${directoryFilter === f.key ? (f.key === 'no_location' ? 'bg-yellow-500 text-white' : f.key === 'with_debt' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                        {f.label} {f.count > 0 && <span className={`ml-0.5 ${directoryFilter === f.key ? 'opacity-80' : 'opacity-50'}`}>{f.count}</span>}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">{sortedTableClients.length} cliente{sortedTableClients.length !== 1 ? 's' : ''}</p>
                        </div>

                        {/* DOS PANELES: tabla + edición */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start">
                            {/* TABLA */}
                            <div className="flex-1 min-w-0 w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table ref={tableRef} className="text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                                        <colgroup>
                                            {TABLE_COLUMNS.map(col => <col key={col.key} style={{ width: ((colWidths[col.key] || 100) / TABLE_COLUMNS.reduce((s, c) => s + (colWidths[c.key] || 100), 0) * 100) + '%' }} />)}
                                        </colgroup>
                                        <thead>
                                            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
                                                {TABLE_COLUMNS.map((col, ci) => (
                                                    <th key={col.key} className="p-0 select-none">
                                                        <div onClick={col.sortable ? () => toggleTableSort(col.key) : undefined} className={`relative px-3 py-2.5 ${col.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''} ${col.key === 'actions' ? 'text-right' : ''}`}>
                                                            <span className="block truncate pr-2">{col.label}{col.sortable && tableSort.key === col.key ? (tableSort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
                                                            {ci < TABLE_COLUMNS.length - 1 && (
                                                                <span onMouseDown={(e) => startColResize(col.key, e)} onClick={(e) => e.stopPropagation()} className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-400/50 z-10" title="Arrastrá para ajustar el ancho"></span>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedTableClients.length === 0 && (
                                                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">Sin clientes que coincidan.</td></tr>
                                            )}
                                            {sortedTableClients.map(client => {
                                                const debtTotal = getDebtTotal(client);
                                                const freqBadge = getFreqBadge(client.freq);
                                                const freqLabel = freqBadge.label, freqColor = freqBadge.color;
                                                const days = (client.visitDays && client.visitDays.length > 0) ? client.visitDays.map(d => d.slice(0, 3)).join(', ') : '—';
                                                let prodStr = '—';
                                                if (client.products) {
                                                    const parts = Object.keys(client.products)
                                                        .filter(k => parseInt(client.products[k] || 0) > 0)
                                                        .map(k => { const p = PRODUCTS.find(pr => pr.id === k); return client.products[k] + 'x ' + (p ? p.short : k); });
                                                    if (parts.length > 0) prodStr = parts.join(' · ');
                                                }
                                                const hasLocation = !!(client.lat && client.lng) || !!client.mapsLink;
                                                const isSelected = tableSelectedClient && tableSelectedClient.id === client.id;
                                                return (
                                                    <tr key={client.id} onClick={() => setTableSelectedClient(client)} className={`border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-colors align-top ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                                                        <td className="px-3 py-2.5 font-bold text-gray-900 dark:text-white break-words">{(client.name || '').toUpperCase()}</td>
                                                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 truncate">{client.phone || '—'}</td>
                                                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 break-words">{client.address || '—'}</td>
                                                        <td className="px-3 py-2.5 overflow-hidden whitespace-nowrap"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${freqColor}`}>{freqLabel}</span></td>
                                                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 truncate">{days}</td>
                                                        <td className="px-3 py-2.5 overflow-hidden whitespace-nowrap">{debtTotal > 0 ? <span className="text-red-600 dark:text-red-400 font-bold">${debtTotal.toLocaleString()}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 break-words">{prodStr}</td>
                                                        <td className="px-3 py-2.5 overflow-hidden whitespace-nowrap text-right">
                                                            <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                                                                {client.phone && <button onClick={() => sendWhatsAppDirect(client.phone)} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30" title="WhatsApp">💬</button>}
                                                                <button onClick={() => hasLocation ? openGoogleMaps(client.lat, client.lng, client.mapsLink) : null} className={`w-7 h-7 rounded-full flex items-center justify-center ${hasLocation ? 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-800 opacity-30 cursor-default'}`} title={hasLocation ? 'Maps' : 'Sin ubicación'}>📍</button>
                                                                <button onClick={() => setScheduleClient(client)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold" title="Agendar visita">📅</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* PANEL DE EDICIÓN */}
                            <div className="w-full lg:w-[380px] flex-shrink-0">
                                <div className="lg:sticky lg:top-4 space-y-2">
                                    {tableSelectedClient ? (
                                        <>
                                            <div className="flex gap-2">
                                                <button onClick={() => setScheduleClient(tableSelectedClient)} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">📅 Agendar días de visita</button>
                                                <button onClick={() => setTableSelectedClient(null)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600">Cerrar</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setRelationshipClient(tableSelectedClient)} className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-800 flex items-center justify-center gap-1.5">👨‍👩‍👧 Familia</button>
                                                <button onClick={() => handleCloneClient(tableSelectedClient)} className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-1.5" title="Duplicar al directorio">⧉ Clonar</button>
                                            </div>
                                            <EditClientQuickModal inline={true} isOpen={true} client={tableSelectedClient} showClientInfo={true} onClose={() => setTableSelectedClient(null)} onSave={handleQuickUpdateClient} />
                                        </>
                                    ) : (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                            👈 Seleccioná un cliente de la tabla para editarlo acá.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {view === 'list' && isWide && (() => {
                    // Día seleccionado: ordenado por fecha de próxima visita, con búsqueda y filtro aplicados.
                    let dayClients = getVisibleClients(selectedDay).slice().sort((a, b) => {
                        const da = getNextVisitDate(a, selectedDay);
                        const db = getNextVisitDate(b, selectedDay);
                        return (da ? da.getTime() : Infinity) - (db ? db.getTime() : Infinity);
                    });
                    if (debouncedListSearch.trim()) {
                        const match = fuzzyMatch(debouncedListSearch);
                        dayClients = dayClients.filter(c => c.isNote ? match(c.notes || '') : match(c.name || '', c.address || '', c.phone || ''));
                    }
                    if (weekFilter !== 'all') {
                        dayClients = dayClients.filter(c => {
                            if (weekFilter === 'with_debt') { const ids = c._mergedIds || [c.id]; return debts.some(d => ids.indexOf(d.clientId) > -1 && d.amount > 0); }
                            return c.freq === weekFilter;
                        });
                    }
                    // Contador de carga: SÓLO los clientes de la fecha más cercana (no las visitas futuras
                    // de quincenales/mensuales que también caen en este día). Es lo que hay que cargar HOY.
                    let _nearestKey = null;
                    dayClients.forEach(c => {
                        if (c.isNote) return;
                        const d = getNextVisitDate(c, selectedDay);
                        const k = d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : Infinity;
                        if (_nearestKey === null || k < _nearestKey) _nearestKey = k;
                    });
                    const nearestClients = dayClients.filter(c => {
                        if (c.isNote) return false;
                        const d = getNextVisitDate(c, selectedDay);
                        const k = d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : Infinity;
                        return k === _nearestKey;
                    });
                    const nearestLabel = nearestClients.length ? formatDate(getNextVisitDate(nearestClients[0], selectedDay)) : '';
                    const totals = {};
                    nearestClients.forEach(c => { if (c.products) Object.keys(c.products).forEach(k => { const q = parseInt(c.products[k] || 0); if (q > 0) totals[k] = (totals[k] || 0) + q; }); });
                    const totalList = PRODUCTS.filter(p => totals[p.id] > 0).map(p => ({ id: p.id, short: p.short, sticker: p.sticker, icon: p.icon, qty: totals[p.id] }));
                    // Numeración del recorrido: cuenta sólo clientes (las notas no llevan número).
                    const posById = {};
                    let _posCounter = 0;
                    dayClients.forEach(c => { if (!c.isNote) { _posCounter++; posById[c.id] = _posCounter; } });
                    // Agrupar por fecha de próxima visita para separar la tabla con encabezados.
                    const renderRows = [];
                    let _lastDateKey = '__init__';
                    let _curHeader = null;
                    dayClients.forEach(c => {
                        const d = getNextVisitDate(c, selectedDay);
                        const dKey = d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : 'nofecha';
                        if (dKey !== _lastDateKey) {
                            _curHeader = { type: 'header', key: 'h-' + dKey, label: d ? formatDate(d) : 'Sin fecha', count: 0 };
                            renderRows.push(_curHeader);
                            _lastDateKey = dKey;
                        }
                        if (!c.isNote && _curHeader) _curHeader.count++;
                        renderRows.push({ type: c.isNote ? 'note' : 'client', client: c });
                    });
                    return (
                        <div className="flex gap-3 items-start pb-24">
                            {/* MENÚ VERTICAL DE DÍAS */}
                            <div className="w-44 flex-shrink-0 sticky top-4 space-y-1.5">
                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => {
                                    const count = getVisibleClients(day).length;
                                    const isSel = selectedDay === day;
                                    const isOver = dragOverDay === day;
                                    return (
                                        <button key={day}
                                            onClick={() => setSelectedDay(day)}
                                            onDragOver={(e) => { e.preventDefault(); if (dragOverDay !== day) setDragOverDay(day); }}
                                            onDragLeave={() => setDragOverDay(d => d === day ? null : d)}
                                            onDrop={(e) => { e.preventDefault(); const info = dragInfoRef.current; setDragOverDay(null); if (info && info.fromDay !== day) handleMoveClientDay(info.client, info.fromDay, day); dragInfoRef.current = null; }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${isSel ? 'bg-blue-600 text-white shadow-sm' : isOver ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                            <span>{day}</span>
                                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${isSel ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{getVisibleClients(day).length}</span>
                                        </button>
                                    );
                                })}
                                <button onClick={() => setSmartOrderOpen(true)} className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800" title="Crear/agendar desde texto con IA">✨ Pedido IA</button>
                                <button onClick={() => setView('directory')} className="w-full mt-1.5 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800" title="Registro de clientes (tabla)">📊 Directorio</button>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center pt-1">Arrastrá una fila a un día para moverla</p>
                            </div>

                            {/* DÍA SELECCIONADO */}
                            <div className="flex-1 min-w-0 space-y-3">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">📅 {selectedDay} <span className="text-sm font-medium text-gray-400 dark:text-gray-500">· {dayClients.length} cliente{dayClients.length !== 1 ? 's' : ''}</span></h2>
                                    </div>
                                    {totalList.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap bg-blue-50/60 dark:bg-blue-900/10 rounded-lg p-2 border border-blue-100 dark:border-blue-900/30">
                                            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1 mr-0.5" title="Lo que hay que cargar para la fecha más cercana (se actualiza solo)">📦 Cargar{nearestLabel ? ' · ' + nearestLabel : ''}:</span>
                                            {totalList.map(p => {
                                                // Soda: se carga por cajón (6 sifones). Cajones en grande, sifones en chico.
                                                const isSoda = p.id === 'soda';
                                                const bigQty = isSoda ? Math.ceil(p.qty / 6) : p.qty;
                                                return (
                                                    <span key={p.id} className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 pl-1.5 pr-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm">
                                                        <ProductGlyph product={p} size={16} />
                                                        <span className="text-[11px] font-bold uppercase tracking-wide text-blue-500 dark:text-blue-400">{isSoda ? 'Caj' : p.short}</span>
                                                        <span className="text-base font-black text-blue-900 dark:text-blue-100 leading-none">{bigQty}</span>
                                                        {isSoda && <span className="text-[11px] font-bold text-blue-400 dark:text-blue-500">({p.qty} sif.)</span>}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <div className="relative flex-1 min-w-[220px]">
                                            <input type="text" aria-label="Buscar en el día seleccionado" placeholder="Buscar (nombre, dirección, teléfono, nota)..." value={listSearchTerm} onChange={(e) => setListSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm" />
                                            <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">🔍</div>
                                            {listSearchTerm && <button onClick={() => setListSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>}
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[
                                                { key: 'all', label: 'Todos' },
                                                { key: 'weekly', label: 'Sem' },
                                                { key: 'biweekly', label: 'Quin' },
                                                { key: 'triweekly', label: 'C/3' },
                                                { key: 'monthly', label: 'Mens' },
                                                { key: 'once', label: '1 vez' },
                                                { key: 'with_debt', label: 'Deuda' },
                                            ].map(f => (
                                                <button key={f.key} onClick={() => setWeekFilter(weekFilter === f.key ? 'all' : f.key)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${weekFilter === f.key ? (f.key === 'with_debt' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{f.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table ref={homeTableRef} className="text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                                        <colgroup>
                                            {HOME_TABLE_COLUMNS.map(col => <col key={col.key} style={{ width: ((homeColWidths[col.key] || 100) / HOME_TABLE_COLUMNS.reduce((s, c) => s + (homeColWidths[c.key] || 100), 0) * 100) + '%' }} />)}
                                        </colgroup>
                                        <thead>
                                            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
                                                {HOME_TABLE_COLUMNS.map((col, ci) => (
                                                    <th key={col.key} className="p-0 select-none">
                                                        <div className={`relative px-3 py-2.5 ${col.key === 'actions' ? 'text-right' : ''}`}>
                                                            <span className="block truncate pr-2">{col.label}</span>
                                                            {ci < HOME_TABLE_COLUMNS.length - 1 && (
                                                                <span onMouseDown={(e) => startHomeColResize(col.key, e)} className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-400/50 z-10" title="Arrastrá para ajustar el ancho"></span>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dayClients.length === 0 && (
                                                <tr><td colSpan={HOME_TABLE_COLUMNS.length} className="px-3 py-10 text-center text-gray-400 dark:text-gray-500">No hay clientes para mostrar en {selectedDay}.</td></tr>
                                            )}
                                            {renderRows.map((row) => {
                                        if (row.type === 'header') {
                                            return (
                                                <tr key={row.key}>
                                                    <td colSpan={HOME_TABLE_COLUMNS.length} className="px-3 py-2 bg-gray-100/80 dark:bg-gray-900/50 border-t-2 border-b border-gray-300 dark:border-gray-600">
                                                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">📆 {row.label} <span className="text-gray-400 dark:text-gray-500 font-bold normal-case">· {row.count} cliente{row.count !== 1 ? 's' : ''}</span></span>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        const c = row.client;
                                        if (c.isNote) {
                                            const noteDate = getNextVisitDate(c, selectedDay);
                                            return (
                                                <tr key={c.id} draggable
                                                    onDragStart={(e) => { dragInfoRef.current = { client: c, fromDay: selectedDay }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', c.id); } catch (err) {} }}
                                                    onClick={() => setEditNoteData(c)}
                                                    className="border-b border-gray-50 dark:border-gray-700/50 cursor-grab active:cursor-grabbing bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors">
                                                    <td colSpan={HOME_TABLE_COLUMNS.length} className="px-3 py-2.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm text-amber-800 dark:text-amber-200 truncate">📝 {c.notes || '(nota vacía)'}</span>
                                                            {noteDate && <span className="text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap flex-shrink-0">📆 {formatDate(noteDate)}</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        let prodStr = '—';
                                        if (c.products) { const parts = Object.keys(c.products).filter(k => parseInt(c.products[k] || 0) > 0).map(k => { const p = PRODUCTS.find(pr => pr.id === k); return c.products[k] + 'x ' + (p ? p.short : k); }); if (parts.length) prodStr = parts.join(' · '); }
                                        const debtT = getDebtTotal(c);
                                        const visitDate = getNextVisitDate(c, selectedDay);
                                        const hasLocation = !!(c.lat && c.lng) || !!c.mapsLink;
                                        return (
                                            <tr key={c.id} draggable
                                                onDragStart={(e) => { dragInfoRef.current = { client: c, fromDay: selectedDay }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', c.id); } catch (err) {} }}
                                                onClick={() => { setQuickEditClient(c); setQuickEditShowInfo(true); }}
                                                className="border-b border-gray-50 dark:border-gray-700/50 cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors align-top">
                                                <td className="px-2 py-2.5 text-center"><span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold">{posById[c.id]}</span></td>
                                                <td className="px-3 py-2.5 font-bold text-gray-900 dark:text-white break-words" title={c.name || ''}>{(c.name || '').toUpperCase()}</td>
                                                <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 break-words">{c.address || '—'}</td>
                                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 break-words">{prodStr}</td>
                                                <td className="px-3 py-2.5 overflow-hidden whitespace-nowrap">{visitDate ? <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatDate(visitDate)}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                <td className="px-3 py-2.5 overflow-hidden whitespace-nowrap">{debtT > 0 ? <span className="text-red-600 dark:text-red-400 font-bold">${debtT.toLocaleString()}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                <td className="px-3 py-2.5 overflow-hidden whitespace-nowrap text-right">
                                                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                                                        {c.phone && <button onClick={() => sendWhatsAppDirect(c.phone)} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30" title="WhatsApp">💬</button>}
                                                        <button onClick={() => hasLocation ? openGoogleMaps(c.lat, c.lng, c.mapsLink) : null} className={`w-7 h-7 rounded-full flex items-center justify-center ${hasLocation ? 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-800 opacity-30 cursor-default'}`} title={hasLocation ? 'Maps' : 'Sin ubicación'}>📍</button>
                                                        <button onClick={() => setRelationshipClient(c)} className={`w-7 h-7 rounded-full flex items-center justify-center ${c.relationships && Object.keys(c.relationships).length > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'} hover:bg-amber-200 dark:hover:bg-amber-800`} title="Familia">👨‍👩‍👧</button>
                                                        <button onClick={() => setScheduleClient(c)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold" title="Agendar">📅</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                        </tbody>
                                    </table>
                                  </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
                 {view === 'add' && (
                    <form onSubmit={handleSaveClient} className="space-y-5">
                        {/* HEADER */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">{editingId ? '✏️ Editar' : '👤 Nuevo'} Cliente</h2>
                            <button type="button" onClick={() => setShowPasteModal(true)} className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40">📋 Pegar Contacto</button>
                        </div>

                        {/* ── SECCIÓN: DATOS DEL CLIENTE ── */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Datos del cliente</p>
                            <div className="relative">
                                <input required name="name" value={formData.name} onChange={handleInputChange} maxLength={100} className="w-full p-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Nombre" />
                                <div className="absolute left-3 top-3 text-gray-400">👤</div>
                            </div>
                            <div className="relative">
                                <input name="phone" value={formData.phone} onChange={handleInputChange} maxLength={20} className="w-full p-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Teléfono" />
                                <div className="absolute left-3 top-3 text-gray-400">📞</div>
                            </div>
                            <div className="relative">
                                <input required name="address" value={formData.address} onChange={handleInputChange} maxLength={200} className="w-full p-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Dirección" />
                                <div className="absolute left-3 top-3 text-gray-400">📍</div>
                            </div>
                            <div className="relative">
                                <input type="text" value={formData.locationInput} onChange={handleLocationPaste} className="w-full p-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Pega link de Google Maps..." />
                                <div className="absolute left-3 top-3 text-gray-400">🔗</div>
                            </div>
                        </div>

                        {/* ── SECCIÓN: PROGRAMACIÓN ── */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Programación</p>

                            {/* Días de visita */}
                            <div>
                                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Días de visita <span className="text-xs text-gray-400">(puede elegir varios)</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => {
                                        const isSelected = (formData.visitDays || [formData.visitDay]).includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.visitDays || [formData.visitDay];
                                                    if (current.includes(day)) {
                                                        if (current.length > 1) {
                                                            const newDays = current.filter(d => d !== day);
                                                            setFormData({...formData, visitDays: newDays, visitDay: newDays[0]});
                                                        }
                                                    } else {
                                                        const newDays = [...current, day];
                                                        setFormData({...formData, visitDays: newDays, visitDay: newDays[0]});
                                                    }
                                                }}
                                                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                                    isSelected
                                                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {isSelected && '✓ '}{day.slice(0, 3)}
                                            </button>
                                        );
                                    })}
                                </div>
                                {(formData.visitDays || []).length > 1 && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">📅 {(formData.visitDays || []).length} días seleccionados</p>
                                )}
                            </div>

                            {/* Frecuencia */}
                            <div>
                                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Frecuencia</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['weekly', 'once', 'biweekly', 'triweekly', 'monthly'].map(freqType => {
                                        let label = '', icon = '';
                                        switch(freqType) {
                                            case 'weekly': label = 'Semanal'; icon = '🔄'; break;
                                            case 'once': label = 'Una vez'; icon = '1️⃣'; break;
                                            case 'biweekly': label = 'Cada 2 sem'; icon = '📅'; break;
                                            case 'triweekly': label = 'Cada 3 sem'; icon = '📅'; break;
                                            case 'monthly': label = 'Cada 4 sem'; icon = '📅'; break;
                                        }
                                        const isSelected = formData.freq === freqType;
                                        return (
                                            <button key={freqType} type="button" onClick={() => setFormData({...formData, freq: freqType})}
                                                className={`p-2.5 rounded-lg text-xs font-medium transition-all text-center ${isSelected ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25 font-bold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                            >
                                                <span className="block text-base mb-0.5">{icon}</span>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button type="button" onClick={() => setFormData({...formData, freq: 'on_demand'})}
                                    className={`w-full mt-2 p-2.5 rounded-lg text-sm font-medium transition-all text-center ${formData.freq === 'on_demand' ? 'bg-gray-600 dark:bg-gray-500 text-white font-bold' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                >
                                    📂 Solo guardar en Directorio (Sin día asignado)
                                </button>
                            </div>

                            {/* Fecha */}
                            <div className="min-w-0 overflow-hidden">
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha (Opcional)</label>
                                <input type="date" name="specificDate" value={formData.specificDate || ''} onChange={handleInputChange} className="w-full p-3 border rounded-lg bg-gray-50 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" style={{maxWidth: '100%', boxSizing: 'border-box'}} min={new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>

                        {/* ── SECCIÓN: PEDIDO ── */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pedido habitual</p>
                            <div className="grid grid-cols-2 gap-2">
                                {getVisibleProducts().map(prod => (
                                    <div key={prod.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <span className="text-sm font-medium flex items-center gap-1.5 dark:text-gray-300"><ProductGlyph product={prod} size={18} /> {prod.label}</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={formData.products[prod.id] || ''}
                                            onChange={(e) => handleProductChange(prod.id, e.target.value)}
                                            className="w-14 p-1.5 text-center border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── SECCIÓN: NOTAS ── */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notas</p>
                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} maxLength={500} className="w-full p-3 border rounded-lg h-24 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none" placeholder="Observaciones del cliente..." />
                        </div>

                        {/* ── BOTONES ── */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" onClick={() => { setView('list'); resetForm(); }} className="flex-1">Cancelar</Button>
                            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]">
                                {saving ? 'Guardando...' : '💾 Guardar'}
                            </button>
                        </div>
                    </form>
                )}
                </>
                )}

                {/* ==================== SECCIÓN: DEUDAS DE CLIENTES ==================== */}
                {activeSection === 'deudas' && <DebtsScreen
                    debts={debts} clients={clients} transfers={transfers} isWide={isWide}
                    debtSearchTerm={debtSearchTerm} setDebtSearchTerm={setDebtSearchTerm} debouncedDebtSearch={debouncedDebtSearch}
                    debtSortMode={debtSortMode} setDebtSortMode={setDebtSortMode}
                    setShowDebtClientSearch={setShowDebtClientSearch}
                    openGoogleMaps={openGoogleMaps} setEditDebtModal={setEditDebtModal}
                    confirmPayOneDebt={confirmPayOneDebt} confirmPayAllDebts={confirmPayAllDebts} confirmReviewTransfers={confirmReviewTransfers}
                    sendWhatsAppDirect={sendWhatsAppDirect} handleAddTransfer={handleAddTransfer}
                    showUndoToast={showUndoToast} setConfirmModal={setConfirmModal}
                    handleDebtPaid={handleDebtPaid} handleTransferReviewed={handleTransferReviewed}
                />}

                {/* ==================== SECCIÓN: REVISAR TRANSFERENCIAS ==================== */}
                {activeSection === 'transferencias' && <TransfersScreen
                    transfers={transfers}
                    isWide={isWide}
                    searchTerm={transferSearchTerm}
                    setSearchTerm={setTransferSearchTerm}
                    debouncedSearch={debouncedTransferSearch}
                    onReviewed={handleTransferReviewed}
                    onOpenMaps={openGoogleMaps}
                />}

                {activeSection === 'estadisticas' && <StatsScreen stats={stats} />}
            </main>

            {/* NAV inferior - solo en móvil (en escritorio la navegación está en el header) */}
            {activeSection === 'cartera' && !isWide && (
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 flex justify-around p-2 z-20 pb-safe shadow-lg shadow-black/5 transition-all duration-200">
                <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setView('list'); }} className={`p-2 rounded-lg flex flex-col items-center ${view === 'list' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}><span className="text-xl">🏠</span><span className="text-xs font-medium">Inicio</span></button>
                {isAdmin ? (
                    <div className="relative flex items-center justify-center w-20">
                        {showFabMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowFabMenu(false)} />
                                <div className="absolute bottom-16 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-48 overflow-hidden" style={{animation: 'slideUpFade 0.2s ease-out forwards'}}>
                                    <button
                                        onClick={() => { resetForm(); setView('add'); setShowFabMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span>👤</span>
                                        <span className="font-medium">Nuevo cliente</span>
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-700" />
                                    <button
                                        onClick={() => { setNoteModal(true); setShowFabMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span>📝</span>
                                        <span className="font-medium">Añadir nota</span>
                                    </button>
                                </div>
                            </>
                        )}
                        <button onClick={() => setShowFabMenu(!showFabMenu)} className="group flex items-center justify-center" aria-label="Nuevo">
                            <div className={`absolute -top-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-blue-600/30 border-4 border-white dark:border-gray-900 transition-all duration-300 transform group-active:scale-95 ${showFabMenu ? 'rotate-45' : ''}`}>
                                <Icons.Plus size={30} strokeWidth={3} />
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="relative flex items-center justify-center w-20">
                        {showFabMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowFabMenu(false)} />
                                <div className="absolute bottom-16 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-48 overflow-hidden" style={{animation: 'slideUpFade 0.2s ease-out forwards'}}>
                                    <button
                                        onClick={() => { resetForm(); setView('add'); setShowFabMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span>👤</span>
                                        <span className="font-medium">Nuevo cliente</span>
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-700" />
                                    <button
                                        onClick={() => { setNoteModal(true); setShowFabMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span>📝</span>
                                        <span className="font-medium">Añadir nota</span>
                                    </button>
                                </div>
                            </>
                        )}
                        <button onClick={() => setShowFabMenu(!showFabMenu)} className="group flex items-center justify-center" aria-label="Nuevo">
                            <div className={`absolute -top-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-blue-600/30 border-4 border-white dark:border-gray-900 transition-all duration-300 transform group-active:scale-95 ${showFabMenu ? 'rotate-45' : ''}`}>
                                <Icons.Plus size={30} strokeWidth={3} />
                            </div>
                        </button>
                    </div>
                )}
                <button onClick={() => setView('directory')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'directory' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}><span className="text-xl">👥</span><span className="text-xs font-medium">Directorio</span></button>
            </nav>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);
