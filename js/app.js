// --- APP: Componente principal ---
function App() {
    const [view, setView] = React.useState('list');
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

    // --- ESTADO NOTAS ---
    const [noteModal, setNoteModal] = React.useState(false);
    const [editNoteData, setEditNoteData] = React.useState(null);
    const [showFabMenu, setShowFabMenu] = React.useState(false);

    // --- ESTADO DEUDAS ---
    const [debts, setDebts] = React.useState([]);
    const [debtModal, setDebtModal] = React.useState({ isOpen: false, client: null });
    const [editDebtModal, setEditDebtModal] = React.useState({ isOpen: false, debt: null });
    const [viewDebtModal, setViewDebtModal] = React.useState({ isOpen: false, client: null });
    const [showDebtClientSearch, setShowDebtClientSearch] = React.useState(false);

    // --- ESTADO TRANSFERENCIAS ---
    const [transfers, setTransfers] = React.useState([]);

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
    const getWhatsAppMessage = (key) => {
        if (appSettings && appSettings[key]) return appSettings[key];
        if (key === 'whatsappEnCamino') return DEFAULT_WHATSAPP_EN_CAMINO;
        if (key === 'whatsappDeuda') return DEFAULT_WHATSAPP_DEUDA;
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


    // --- CARGAR CONFIGURACIÓN DEL USUARIO ---
    React.useEffect(() => {
        if (!user) return;
        const settingsDocId = groupData?.groupId || user.uid;
        db.collection('settings').doc(settingsDocId).get().then(doc => {
            if (doc.exists) setAppSettings(doc.data());
        }).catch(e => console.error("Error loading settings:", e));
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
                await firestoreRetry(() => db.collection('clients').doc(client.id).update({
                    isCompleted: true, completedAt: new Date(), updatedAt: new Date(), alarm: '', isStarred: false
                }));
                showUndoToast("Pedido completado", undoAction);
            } else {
                // Periódico: escribir a Firestore y dejar que onSnapshot actualice la UI
                const prevFields = {
                    lastVisited: client.lastVisited || null,
                    alarm: client.alarm || '',
                    isStarred: client.isStarred || false
                };
                if (client.specificDate) {
                    prevFields.specificDate = client.specificDate;
                }

                // Para clientes sin specificDate, usar la fecha del día que se está viendo
                // (no new Date()) para que getNextVisitDate lo detecte correctamente
                // incluso si se marca "listo" desde un día anterior.
                let visitDate = new Date();
                if (!client.specificDate && selectedDay) {
                    const targetDate = getNextVisitDate(client, selectedDay);
                    if (targetDate) {
                        visitDate = targetDate;
                    }
                }
                const updates = { lastVisited: visitDate, alarm: '' };

                if (client.specificDate) {
                    let interval = 1;
                    if (client.freq === 'biweekly') interval = 2;
                    if (client.freq === 'triweekly') interval = 3;
                    if (client.freq === 'monthly') interval = 4;
                    const currentSpecificDate = new Date(client.specificDate + 'T12:00:00');
                    const nextSpecificDate = new Date(currentSpecificDate);
                    nextSpecificDate.setDate(nextSpecificDate.getDate() + (interval * 7));
                    const tomorrow = new Date();
                    tomorrow.setHours(0,0,0,0);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    while (nextSpecificDate < tomorrow) {
                        nextSpecificDate.setDate(nextSpecificDate.getDate() + (interval * 7));
                    }
                    updates.specificDate = nextSpecificDate.toISOString().split('T')[0];
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
            c.visitDay === day
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
            if (data.freq === 'once' && data.specificDate) {
                const d = new Date(data.specificDate + 'T12:00:00');
                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const dayName = days[d.getDay()];
                const existingInDay = clients.filter(c =>
                    c.id !== clientId &&
                    c.freq !== 'on_demand' &&
                    !c.isCompleted &&
                    ((c.visitDays && c.visitDays.includes(dayName)) || c.visitDay === dayName)
                );
                let minOrder = 0;
                if (existingInDay.length > 0) {
                    const orders = existingInDay.map(c => {
                        const order = c.listOrders?.[dayName] ?? c.listOrder ?? 0;
                        return order > 100000 ? 0 : order;
                    });
                    minOrder = Math.min(...orders);
                }
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
        if (isMobile) { location.href = url; } else { window.open(url, '_blank'); }
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
            
            const sanitized = sanitizeClientData(formData);
            const data = {
                ...sanitized,
                ...getDataScope(),
                userId: user.uid,
                updatedAt: new Date(),
                startWeek: currentWeek,
                visitDays: visitDays,
                visitDay: visitDays[0] || 'Sin Asignar', // Mantener compatibilidad
                isPinned: false,
                mapsLink: sanitized.mapsLink || sanitized.locationInput
            };
            
            if (editingId) { 
                // Al editar, solo agregar listOrders para días NUEVOS que no existían
                const existingListOrders = formData.listOrders || {};
                const newListOrders = { ...existingListOrders };
                visitDays.forEach(day => {
                    if (newListOrders[day] === undefined) {
                        // Calcular siguiente orden para el día nuevo
                        const existingInDay = clients.filter(c =>
                            c.id !== editingId &&
                            c.freq !== 'on_demand' &&
                            !c.isCompleted &&
                            ((c.visitDays && c.visitDays.includes(day)) || c.visitDay === day)
                        );
                        let maxOrder = -1;
                        if (existingInDay.length > 0) {
                            const orders = existingInDay.map(c => {
                                const order = c.listOrders?.[day] ?? c.listOrder ?? 0;
                                return order > 100000 ? 0 : order;
                            });
                            maxOrder = Math.max(...orders);
                        }
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
                    const existingInDay = clients.filter(c => 
                        c.freq !== 'on_demand' && 
                        !c.isCompleted && 
                        ((c.visitDays && c.visitDays.includes(day)) || c.visitDay === day)
                    );
                    
                    if (formData.freq === 'once') {
                        // Pedido de una vez: va al INICIO
                        let minOrder = 0;
                        if (existingInDay.length > 0) {
                            const orders = existingInDay.map(c => {
                                const order = c.listOrders?.[day] ?? c.listOrder ?? 0;
                                return order > 100000 ? 0 : order;
                            });
                            minOrder = Math.min(...orders);
                        }
                        listOrders[day] = minOrder - 1;
                    } else {
                        // Pedido semanal: va al FINAL
                        let maxOrder = -1;
                        if (existingInDay.length > 0) {
                            const orders = existingInDay.map(c => {
                                const order = c.listOrders?.[day] ?? c.listOrder ?? 0;
                                return order > 100000 ? 0 : order;
                            });
                            maxOrder = Math.max(...orders);
                        }
                        listOrders[day] = maxOrder + 1;
                    }
                });
                data.listOrder = listOrders[visitDays[0]];
                data.listOrders = listOrders;
                await firestoreRetry(() => db.collection('clients').add(data));
            }
            resetForm(); setView('list');
        } catch(e) { showUndoToast(getErrorMessage(e), null); } finally { setSaving(false); }
    };

    // --- GUARDAR NOTA ---
    const handleSaveNote = async (noteText, noteDate) => {
        try {
            const d = new Date(noteDate + 'T12:00:00');
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dayName = days[d.getDay()];

            // Notas van al inicio del recorrido
            const existingInDay = clients.filter(c =>
                c.freq !== 'on_demand' && !c.isCompleted &&
                ((c.visitDays && c.visitDays.includes(dayName)) || c.visitDay === dayName)
            );
            let minOrder = 0;
            if (existingInDay.length > 0) {
                const orders = existingInDay.map(c => {
                    const order = c.listOrders?.[dayName] ?? c.listOrder ?? 0;
                    return order > 100000 ? 0 : order;
                });
                minOrder = Math.min(...orders);
            }

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
                const existingInDay = clients.filter(c =>
                    c.id !== editNoteData.id && c.freq !== 'on_demand' && !c.isCompleted &&
                    ((c.visitDays && c.visitDays.includes(newDayName)) || c.visitDay === newDayName)
                );
                let minOrder = 0;
                if (existingInDay.length > 0) {
                    const orders = existingInDay.map(c => {
                        const order = c.listOrders?.[newDayName] ?? c.listOrder ?? 0;
                        return order > 100000 ? 0 : order;
                    });
                    minOrder = Math.min(...orders);
                }
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
                 const existingInDay = clients.filter(c => 
                    c.freq !== 'on_demand' && 
                    !c.isCompleted && 
                    ((c.visitDays && c.visitDays.includes(dayName)) || c.visitDay === dayName)
                 );
                 
                 // Calcular el orden mínimo (puede ser negativo o positivo)
                 let minOrder = 0;
                 if (existingInDay.length > 0) {
                     const orders = existingInDay.map(c => {
                         const order = c.listOrders?.[dayName] ?? c.listOrder ?? 0;
                         // Ignorar timestamps muy grandes
                         return order > 100000 ? 0 : order;
                     });
                     minOrder = Math.min(...orders);
                 }
                 // Nuevo pedido va ANTES de todo (minOrder - 1)
                 const newOrder = minOrder - 1;
                 
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
                     const existingInDay = clients.filter(c => 
                        c.freq !== 'on_demand' && 
                        !c.isCompleted && 
                        ((c.visitDays && c.visitDays.includes(day)) || c.visitDay === day)
                     );
                     // Encontrar el máximo orden actual y sumar 1
                     const maxOrder = existingInDay.length > 0
                        ? Math.max(...existingInDay.map(c => (c.listOrders?.[day] ?? c.listOrder ?? 0)))
                        : -1;
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
            .filter(c => {
                if (!debouncedSearch.trim()) return true;
                const match = fuzzyMatch(debouncedSearch);
                return match(c.name || '', c.address || '', c.phone || '');
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
    }, [clients, debouncedSearch]);
    
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
            />}
            {quickEditClient && <EditClientQuickModal isOpen={true} client={quickEditClient} onClose={() => setQuickEditClient(null)} onSave={handleQuickUpdateClient} showClientInfo={quickEditShowInfo} />}
            {showSettingsModal && <SettingsModal
                isOpen={true}
                settings={appSettings}
                onClose={() => setShowSettingsModal(false)}
                onSave={async (newSettings) => {
                    try {
                        const settingsDocId = groupData?.groupId || user.uid;
                        await firestoreRetry(() => db.collection('settings').doc(settingsDocId).set(newSettings, { merge: true }));
                        setAppSettings(prev => ({ ...prev, ...newSettings }));
                        showUndoToast("Configuración guardada", null);
                    } catch(e) { showUndoToast(getErrorMessage(e), null); }
                    setShowSettingsModal(false);
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

            <header className={`bg-blue-600 dark:bg-gray-800 text-white p-4 shadow-lg sticky top-0 z-30 transition-colors duration-200`} style={{marginTop: ((!isOnline ? 36 : 0) + (swUpdate ? 36 : 0) + (installPrompt ? 36 : 0)) || undefined}}>
                <div className="flex justify-between items-center max-w-2xl mx-auto">
                    <div 
                        className="flex items-center gap-2 cursor-pointer active:opacity-80 transition-opacity" 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <Icons.Truck className="w-6 h-6" />
                        <h1 className="text-xl font-bold">RutaWater</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* SELECTOR DE SECCIÓN */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowSectionMenu(!showSectionMenu)} 
                                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                {activeSection === 'cartera' && <><Icons.Users size={15}/> Cartera</>}
                                {activeSection === 'deudas' && <><Icons.DollarSign size={15}/> Deudas</>}
                                {activeSection === 'transferencias' && <><Icons.CreditCard size={15}/> Transferencias</>}
                                <Icons.ChevronDown size={14} className={`transition-transform duration-200 ${showSectionMenu ? 'rotate-180' : ''}`} />
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
                                            <Icons.Users size={18} />
                                            <span className="flex-1 text-left">Cartera de Clientes</span>
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700" />
                                        <button
                                            onClick={() => { setActiveSection('deudas'); setShowSectionMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeSection === 'deudas' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <Icons.DollarSign size={18} />
                                            <span className="flex-1 text-left">Deudas de Clientes</span>
                                            {debts.length > 0 && <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">{debts.length}</span>}
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700" />
                                        <button
                                            onClick={() => { setActiveSection('transferencias'); setShowSectionMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeSection === 'transferencias' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <Icons.CreditCard size={18} />
                                            <span className="flex-1 text-left">Revisar Transferencias</span>
                                            {transfers.length > 0 && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">{transfers.length}</span>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Botón Grupo Familiar */}
                        <button 
                            onClick={() => setShowGroupModal(true)}
                            className={`p-1.5 rounded-lg transition-colors ${groupData?.groupId ? 'bg-purple-500/20 text-purple-200' : 'hover:bg-white/10'}`}
                            title={groupData?.groupId ? (groupData.role === 'admin' ? 'Grupo (Admin)' : 'Grupo (Miembro)') : 'Grupo Familiar'}
                        >
                            <Icons.Users className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Configuración"
                        >
                            <Icons.Settings className="w-5 h-5" />
                        </button>
                        <button onClick={handleLogout}><Icons.LogOut className="w-5 h-5" /></button>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 overflow-x-hidden">
                {/* ==================== SECCIÓN: CARTERA DE CLIENTES ==================== */}
                {activeSection === 'cartera' && (
                <>
                {view === 'list' && (
                    <div className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                                <button key={day} onClick={() => { setSelectedDay(day); setListSearchTerm(''); setActiveFilters([]); setShowFilterMenu(false); }} className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 ${selectedDay === day ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                                    {day}
                                    {dayCounts[day] > 0 && (
                                        <span className={`text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${selectedDay === day ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>{dayCounts[day]}</span>
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
                                            <Icons.Search size={18} />
                                        </div>
                                        {listSearchTerm && (
                                            <button 
                                                onClick={() => setListSearchTerm('')}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <Icons.X size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button 
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
                                                <span className="bg-white text-blue-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">{activeFilters.length}</span>
                                            )}
                                        </button>

                                        {/* MENÚ DESPLEGABLE DE FILTROS */}
                                        {showFilterMenu && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />
                                                <div className="absolute right-0 top-12 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-64 overflow-hidden" style={{animation: 'slideUpFade 0.2s ease-out forwards'}}>
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
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Tipo</span>
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
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Productos</span>
                                                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                                                            {PRODUCTS.map(prod => {
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
                                                                        <span>{prod.icon}</span>
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
                                                label = '💲 Con deuda';
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
                                                    <Icons.X size={12} />
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
                                        <Icons.CheckCircle size={16} /> Completados ({getCompletedClients(selectedDay).length})
                                    </h3>
                                    <button 
                                        onClick={() => handleClearCompleted(selectedDay)}
                                        className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 hover:text-red-600 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Icons.Trash2 size={14} /> Eliminar todos
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {getCompletedClients(selectedDay).map(client => (
                                        <Card key={client.id} className="p-3 opacity-60 hover:opacity-100 transition-opacity bg-gray-50 dark:bg-gray-800/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                                        <Icons.CheckCircle size={18} />
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
                                                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                                    >
                                                        <Icons.Trash2 size={16} />
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
                {view === 'directory' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><Icons.Users /> Directorio</h2>
                                <div className="flex gap-1.5">
                                    <button onClick={handleExportClients} className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-green-200 dark:hover:bg-green-800 flex items-center gap-1"><Icons.Import size={14} className="rotate-180" /> CSV</button>
                                    <button onClick={handleExportBackup} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1.5 rounded-full font-bold hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center gap-1"><Icons.Save size={14} /> Backup</button>
                                </div>
                            </div>
                            <div className="relative">
                                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                                <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500"><Icons.Search size={20} /></div>
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <Icons.X size={20} />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center font-medium">{filteredDirectory.length} cliente{filteredDirectory.length !== 1 ? 's' : ''} en el directorio</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredDirectory.map(client => {
                                var prodSummary = '';
                                if (client.products) {
                                    prodSummary = Object.keys(client.products)
                                        .filter(function(k) { return parseInt(client.products[k] || 0) > 0; })
                                        .map(function(k) { var p = PRODUCTS.find(function(prod) { return prod.id === k; }); return client.products[k] + 'x ' + (p ? p.short : k); })
                                        .join(', ');
                                }
                                var clientIds = client._mergedIds || [client.id];
                                var debtTotal = debts.filter(function(d) { return clientIds.indexOf(d.clientId) > -1; }).reduce(function(sum, d) { return sum + (d.amount || 0); }, 0);
                                var freqLabel = '';
                                switch(client.freq) {
                                    case 'weekly': freqLabel = 'Semanal'; break;
                                    case 'biweekly': freqLabel = 'Quincenal'; break;
                                    case 'triweekly': freqLabel = 'Cada 3 sem'; break;
                                    case 'monthly': freqLabel = 'Mensual'; break;
                                    case 'once': freqLabel = 'Una vez'; break;
                                    case 'on_demand': freqLabel = 'Solo Directorio'; break;
                                    default: freqLabel = client.freq || '';
                                }
                                var isOnDemand = client.freq === 'on_demand' || !(client.visitDays && client.visitDays.length > 0);
                                var hasLocation = !!(client.lat && client.lng) || !!client.mapsLink;
                                return (
                                <Card key={client.id} className={`p-4 border-l-4 ${debtTotal > 0 ? 'border-l-red-500' : 'border-l-transparent'}`}>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{(client.name || '').toUpperCase()}</h3>
                                                {debtTotal > 0 && (
                                                    <button onClick={() => {
                                                        var c = { ...client, hasDebt: true };
                                                        setViewDebtModal({ isOpen: true, client: c });
                                                    }} className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full mt-1 inline-block">${debtTotal.toLocaleString()}</button>
                                                )}
                                            </div>
                                        </div>
                                        {client.address && <p className="text-xs text-gray-500 dark:text-gray-400">{client.address}</p>}
                                        {client.phone && <p className="text-[11px] text-gray-400 dark:text-gray-500">{client.phone}</p>}
                                        {prodSummary && <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mt-1">📦 {prodSummary}</p>}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{freqLabel}</span>
                                            {client.visitDays && client.visitDays.length > 0 && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{client.visitDays.map(function(d) { return d.slice(0, 3); }).join(', ')}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            {client.phone && <button onClick={() => sendWhatsAppDirect(client.phone)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="WhatsApp">💬</button>}
                                            {hasLocation && <button onClick={() => openGoogleMaps(client.lat, client.lng, client.mapsLink)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="Maps">📍</button>}
                                            <button onClick={() => { var c = { ...client, hasDebt: debtTotal > 0 }; if (debtTotal > 0) { setViewDebtModal({ isOpen: true, client: c }); } else { setDebtModal({ isOpen: true, client: c }); } }} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="Deuda">{debtTotal > 0 ? '🔴' : '💰'}</button>
                                            {isAdmin && <button onClick={() => { setQuickEditClient(client); setQuickEditShowInfo(true); }} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar">✏️</button>}
                                            <div className="flex-1" />
                                            <button onClick={() => setScheduleClient(client)} className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-800">
                                                {isOnDemand ? 'Agendar' : '+ Visita'}
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
                 {view === 'add' && (
                    <form onSubmit={handleSaveClient} className="space-y-4">
                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><div className="bg-blue-600 text-white p-1 rounded"><Icons.Plus /></div> {editingId ? 'Editar' : 'Nuevo'} Cliente</h2>
                        
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setShowPasteModal(true)} className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800"><Icons.Clipboard size={14}/> Pegar Formato Contacto</button>
                        </div>

                        <input required name="name" value={formData.name} onChange={handleInputChange} maxLength={100} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Nombre" />
                        <input name="phone" value={formData.phone} onChange={handleInputChange} maxLength={20} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Teléfono" />
                        
                        {/* Selector de múltiples días */}
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Días de Visita <span className="text-xs text-gray-400">(puede elegir varios)</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
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
                                        className={`p-2.5 rounded-lg text-sm font-medium transition-all ${
                                            (formData.visitDays || [formData.visitDay]).includes(day)
                                                ? 'bg-blue-500 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                            {(formData.visitDays || []).length > 1 && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">📅 {(formData.visitDays || []).length} días seleccionados: {(formData.visitDays || []).join(', ')}</p>
                            )}
                        </div>

                        <input required name="address" value={formData.address} onChange={handleInputChange} maxLength={200} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Dirección" />
                        <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-100 dark:border-gray-700">
                            <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><Icons.MapPin size={16}/> Ubicación (GPS/Link)</label>
                            <div className="relative"><input type="text" value={formData.locationInput} onChange={handleLocationPaste} className="w-full p-3 pl-10 border rounded-lg outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Pega link de Maps..." /><div className="absolute left-3 top-3 text-gray-400"><Icons.Link size={20} /></div></div>
                        </div>
                        
                        {/* SECCIÓN PRODUCTOS */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">📦 Productos Habituales</label>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {PRODUCTS.map(prod => (
                                    <div key={prod.id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                                        <span className="text-xs font-medium flex items-center gap-1 dark:text-gray-300">{prod.icon} {prod.label}</span>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            value={formData.products[prod.id] || ''}
                                            onChange={(e) => handleProductChange(prod.id, e.target.value)}
                                            className="w-12 p-1 text-center border rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Frecuencia</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['weekly', 'once', 'biweekly', 'triweekly', 'monthly'].map(freqType => {
                                    let label = '';
                                    switch(freqType) {
                                        case 'weekly': label = 'Semanal'; break;
                                        case 'once': label = 'Una vez'; break;
                                        case 'biweekly': label = 'Cada 2 sem'; break;
                                        case 'triweekly': label = 'Cada 3 sem'; break;
                                        case 'monthly': label = 'Cada 4 sem'; break;
                                    }
                                    const isSelected = formData.freq === freqType;
                                    return (
                                        <label key={freqType} className={`flex items-center gap-2 border p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-bold' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                            <input type="radio" name="freq" value={freqType} checked={isSelected} onChange={handleInputChange} className="accent-blue-600" /> 
                                            {label}
                                        </label>
                                    );
                                })}
                            </div>
                            {/* NUEVA OPCIÓN "SOLO DIRECTORIO" */}
                            <label className={`flex items-center gap-2 border p-3 mt-2 rounded-lg cursor-pointer transition-colors ${formData.freq === 'on_demand' ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 font-bold' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300'}`}>
                                <input type="radio" name="freq" value="on_demand" checked={formData.freq === 'on_demand'} onChange={handleInputChange} className="accent-gray-600" /> 
                                <span className="text-sm">Solo guardar en Directorio (Sin día asignado)</span>
                            </label>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha (Opcional)</label>
                            <input type="date" name="specificDate" value={formData.specificDate || ''} onChange={handleInputChange} className="w-full p-3 border rounded-lg bg-gray-50 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} maxLength={500} className="w-full p-3 border rounded-lg h-24 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Notas..." />
                        <div className="flex gap-3"><Button variant="secondary" onClick={() => { setView('list'); resetForm(); }} className="flex-1">Cancelar</Button><Button type="submit" disabled={saving} className="flex-1">{saving ? 'Guardando...' : <><Icons.Save /> Guardar</>}</Button></div>
                    </form>
                )}
                </>
                )}

                {/* ==================== SECCIÓN: DEUDAS DE CLIENTES ==================== */}
                {activeSection === 'deudas' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg"><Icons.DollarSign size={20} /></div>
                                    Deudas
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowDebtClientSearch(true)}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Icons.Plus size={14} /> Añadir
                                    </button>
                                </div>
                            </div>
                            {/* Resumen general */}
                            {debts.length > 0 && (() => {
                                const totalAmount = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
                                const uniqueClients = new Set(debts.map(d => d.clientId || d.id)).size;
                                return (
                                <div className="flex gap-2 mb-3">
                                    <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 text-center">
                                        <p className="text-lg font-black text-red-600 dark:text-red-400">${totalAmount.toLocaleString()}</p>
                                        <p className="text-[10px] text-red-500/70 dark:text-red-400/60 font-medium">Total pendiente</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5 text-center">
                                        <p className="text-lg font-black text-gray-700 dark:text-gray-200">{uniqueClients}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Cliente{uniqueClients !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5 text-center">
                                        <p className="text-lg font-black text-gray-700 dark:text-gray-200">{debts.length}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Deuda{debts.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                );
                            })()}
                            <div className="relative">
                                <input type="text" placeholder="Buscar por nombre o dirección..." value={debtSearchTerm} onChange={(e) => setDebtSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm" />
                                <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500"><Icons.Search size={18} /></div>
                                {debtSearchTerm && (
                                    <button onClick={() => setDebtSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Icons.X size={18} /></button>
                                )}
                            </div>
                            {/* Botones de ordenamiento */}
                            {debts.length > 0 && (
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => setDebtSortMode('date')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${debtSortMode === 'date' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                        Más reciente
                                    </button>
                                    <button onClick={() => setDebtSortMode('amount')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${debtSortMode === 'amount' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                        Mayor monto
                                    </button>
                                </div>
                            )}
                        </div>

                        {debts.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
                                    <Icons.DollarSign size={32} />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay deudas pendientes</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Las deudas se agregan desde la tarjeta del cliente con el botón $</p>
                            </div>
                        ) : (() => {
                            const now = Date.now();
                            const debtMatch = fuzzyMatch(debouncedDebtSearch);
                            const filteredDebts = debts.filter(d => debtMatch(d.clientName || '', d.clientAddress || ''));
                            const filteredTotal = filteredDebts.reduce((sum, d) => sum + (d.amount || 0), 0);

                            // Agrupar deudas por cliente
                            const groupMap = {};
                            filteredDebts.forEach(d => {
                                const key = d.clientId || d.id;
                                if (!groupMap[key]) groupMap[key] = [];
                                groupMap[key].push(d);
                            });
                            // Ordenar grupos según modo seleccionado
                            const debtGroups = Object.values(groupMap).sort((a, b) => {
                                if (debtSortMode === 'amount') {
                                    const totalA = a.reduce((sum, d) => sum + (d.amount || 0), 0);
                                    const totalB = b.reduce((sum, d) => sum + (d.amount || 0), 0);
                                    return totalB - totalA;
                                }
                                const latestA = Math.max(...a.map(d => d.createdAt?.seconds || 0));
                                const latestB = Math.max(...b.map(d => d.createdAt?.seconds || 0));
                                return latestB - latestA;
                            });

                            // Helper: días de antigüedad de una deuda
                            const getDebtAgeDays = (debt) => {
                                if (!debt.createdAt) return 0;
                                const ts = debt.createdAt.seconds ? debt.createdAt.seconds * 1000 : debt.createdAt;
                                return Math.floor((now - ts) / 86400000);
                            };

                            // Helper: peor antigüedad del grupo (para el borde de la tarjeta)
                            const getGroupMaxAge = (groupDebts) => Math.max(...groupDebts.map(getDebtAgeDays));

                            return (
                            <div className="space-y-3">
                                {debouncedDebtSearch.trim() && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center font-medium">{filteredDebts.length} deuda{filteredDebts.length !== 1 ? 's' : ''} en {debtGroups.length} cliente{debtGroups.length !== 1 ? 's' : ''} — Total: ${filteredTotal.toLocaleString()}</p>
                                )}
                                <div className="grid grid-cols-1 gap-3">
                                {debtGroups.map(groupDebts => {
                                    const first = groupDebts[0];
                                    const clientTotal = groupDebts.reduce((sum, d) => sum + (d.amount || 0), 0);
                                    const client = clients.find(c => c.id === first.clientId);
                                    const phone = client?.phone;
                                    const clientTransfers = transfers.filter(t => t.clientId === first.clientId);
                                    const maxAge = getGroupMaxAge(groupDebts);
                                    const borderColor = maxAge > 30 ? 'border-l-red-600' : maxAge > 15 ? 'border-l-amber-500' : 'border-l-red-400';
                                    return (
                                    <Card key={first.clientId || first.id} className={`border-l-4 ${borderColor}`}>
                                        {/* Header: nombre, dirección, total */}
                                        <div className="p-4 pb-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-gray-900 dark:text-white break-words">{(first.clientName || '').toUpperCase()}</h3>
                                                    <div
                                                        onClick={() => openGoogleMaps(first.clientLat, first.clientLng, first.clientMapsLink)}
                                                        className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline mt-0.5 min-w-0"
                                                    >
                                                        <Icons.MapPin size={12} className="shrink-0" /> <span className="break-words">{first.clientAddress}</span>
                                                    </div>
                                                </div>
                                                <p className="text-2xl font-black text-red-600 dark:text-red-400 shrink-0">${clientTotal.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Lista de deudas individuales */}
                                        <div className="mt-3">
                                            {groupDebts.map((debt, idx) => {
                                                const ageDays = getDebtAgeDays(debt);
                                                const ageBadge = ageDays > 30
                                                    ? { text: `${ageDays}d`, className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' }
                                                    : ageDays > 15
                                                    ? { text: `${ageDays}d`, className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' }
                                                    : null;
                                                return (
                                                <div key={debt.id} className={`px-4 py-2.5 flex items-center justify-between gap-2 ${idx === 0 ? 'border-t border-gray-100 dark:border-gray-700' : 'border-t border-dashed border-gray-100 dark:border-gray-700'}`}>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                {debt.createdAt && (
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                                        {new Date(debt.createdAt.seconds ? debt.createdAt.seconds * 1000 : debt.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                )}
                                                                {ageBadge && (
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ageBadge.className}`}>{ageBadge.text}</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">${debt.amount?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            onClick={() => setEditDebtModal({ isOpen: true, debt })}
                                                            className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                                                        >
                                                            <Icons.Edit size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmModal({
                                                                isOpen: true,
                                                                title: '¿Deuda pagada?',
                                                                message: `Confirmar que ${debt.clientName} pagó $${debt.amount?.toLocaleString()}`,
                                                                confirmText: "Pagada",
                                                                isDanger: false,
                                                                action: async () => { await handleDebtPaid(debt); setConfirmModal(prev => ({...prev, isOpen: false})); }
                                                            })}
                                                            className="px-2 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-bold flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-800"
                                                        >
                                                            <Icons.CheckCircle size={13} /> Pagada
                                                        </button>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>

                                        {/* Acciones comunes del cliente */}
                                        <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                                            {groupDebts.length > 1 && (
                                                <button
                                                    onClick={() => setConfirmModal({
                                                        isOpen: true,
                                                        title: '¿Todas pagadas?',
                                                        message: `Confirmar que ${first.clientName} pagó todas sus deudas (${groupDebts.length}) por un total de $${clientTotal.toLocaleString()}`,
                                                        confirmText: "Todas pagadas",
                                                        isDanger: false,
                                                        action: async () => {
                                                            try {
                                                                const batch = db.batch();
                                                                groupDebts.forEach(d => batch.delete(db.collection('debts').doc(d.id)));
                                                                if (first.clientId) {
                                                                    batch.update(db.collection('clients').doc(first.clientId), { hasDebt: false });
                                                                }
                                                                await batch.commit();
                                                            } catch(e) { console.error("Error pagando todas:", e); showUndoToast(getErrorMessage(e), null); }
                                                            setConfirmModal(prev => ({...prev, isOpen: false}));
                                                        }
                                                    })}
                                                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-600"
                                                >
                                                    <Icons.CheckCircle size={14} /> Pagar todas
                                                </button>
                                            )}
                                            {phone && (
                                                <button
                                                    onClick={() => sendWhatsAppDirect(phone)}
                                                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-600"
                                                >
                                                    <Icons.MessageCircle size={14} /> Chat
                                                </button>
                                            )}
                                            {clientTransfers.length > 0 ? (
                                                <button
                                                    onClick={() => setConfirmModal({
                                                        isOpen: true,
                                                        title: 'Revisar transferencia',
                                                        message: `¿Confirmar que revisaste la transferencia de ${first.clientName}?`,
                                                        confirmText: "Revisada",
                                                        isDanger: false,
                                                        action: async () => {
                                                            for (const t of clientTransfers) { await handleTransferReviewed(t); }
                                                            setConfirmModal(prev => ({...prev, isOpen: false}));
                                                        }
                                                    })}
                                                    className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-200 dark:hover:bg-emerald-800"
                                                >
                                                    <Icons.CheckCircle size={14} /> Revisada{clientTransfers.length > 1 ? ` (${clientTransfers.length})` : ''}
                                                </button>
                                            ) : client ? (
                                                <button
                                                    onClick={() => {
                                                        handleAddTransfer(client);
                                                        showUndoToast("Transferencia marcada para revisar", null);
                                                    }}
                                                    className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-200 dark:hover:bg-emerald-800"
                                                >
                                                    <Icons.CreditCard size={14} /> Transf.
                                                </button>
                                            ) : null}
                                        </div>
                                    </Card>
                                    );
                                })}
                                </div>
                            </div>
                            );
                        })()}
                    </div>
                )}

                {/* ==================== SECCIÓN: REVISAR TRANSFERENCIAS ==================== */}
                {activeSection === 'transferencias' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg"><Icons.CreditCard size={20} /></div>
                                    Transferencias
                                </h2>
                                {transfers.length > 0 && (
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                                        {transfers.length} pendiente{transfers.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input type="text" placeholder="Buscar por nombre o dirección..." value={transferSearchTerm} onChange={(e) => setTransferSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm" />
                                <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500"><Icons.Search size={18} /></div>
                                {transferSearchTerm && (
                                    <button onClick={() => setTransferSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Icons.X size={18} /></button>
                                )}
                            </div>
                        </div>

                        {transfers.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
                                    <Icons.CreditCard size={32} />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay transferencias por revisar</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Las transferencias se marcan desde la tarjeta del cliente</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {transfers
                                    .filter((() => { const m = fuzzyMatch(debouncedTransferSearch); return t => m(t.clientName || '', t.clientAddress || ''); })())
                                    .map(transfer => (
                                    <Card key={transfer.id} className="p-4 border-l-4 border-l-emerald-500">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 dark:text-white">{(transfer.clientName || '').toUpperCase()}</h3>
                                                <div 
                                                    onClick={() => openGoogleMaps(transfer.clientLat, transfer.clientLng, transfer.clientMapsLink)}
                                                    className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline mt-0.5"
                                                >
                                                    <Icons.MapPin size={12} /> {transfer.clientAddress}
                                                </div>
                                                {transfer.createdAt && (
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                                        {new Date(transfer.createdAt.seconds ? transfer.createdAt.seconds * 1000 : transfer.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => handleTransferReviewed(transfer)}
                                                className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 ml-3"
                                            >
                                                <Icons.CheckCircle size={16} /> Revisada
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* NAV - Solo visible en sección Cartera */}
            {activeSection === 'cartera' && (
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex justify-around p-2 z-20 pb-safe shadow-lg transition-colors duration-200">
                <button onClick={() => setView('list')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'list' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}><Icons.Home /><span className="text-xs font-medium">Inicio</span></button>
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
                                        <Icons.Users size={18} className="text-blue-500" />
                                        <span className="font-medium">Nuevo cliente</span>
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-700" />
                                    <button
                                        onClick={() => { setNoteModal(true); setShowFabMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Icons.FileText size={18} className="text-yellow-500" />
                                        <span className="font-medium">Añadir nota</span>
                                    </button>
                                </div>
                            </>
                        )}
                        <button onClick={() => setShowFabMenu(!showFabMenu)} className="group flex items-center justify-center w-20" aria-label="Nuevo">
                            <div className={`absolute -top-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-[80px] h-[80px] flex items-center justify-center shadow-2xl border-[6px] border-white dark:border-gray-900 transition-all duration-300 transform group-active:scale-95 ${showFabMenu ? 'rotate-45' : ''}`}>
                                <Icons.Plus size={40} strokeWidth={3} />
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
                                        <Icons.Users size={18} className="text-blue-500" />
                                        <span className="font-medium">Nuevo cliente</span>
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-700" />
                                    <button
                                        onClick={() => { setNoteModal(true); setShowFabMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Icons.FileText size={18} className="text-yellow-500" />
                                        <span className="font-medium">Añadir nota</span>
                                    </button>
                                </div>
                            </>
                        )}
                        <button onClick={() => setShowFabMenu(!showFabMenu)} className="group flex items-center justify-center w-20" aria-label="Nuevo">
                            <div className={`absolute -top-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-[80px] h-[80px] flex items-center justify-center shadow-2xl border-[6px] border-white dark:border-gray-900 transition-all duration-300 transform group-active:scale-95 ${showFabMenu ? 'rotate-45' : ''}`}>
                                <Icons.Plus size={40} strokeWidth={3} />
                            </div>
                        </button>
                    </div>
                )}
                <button onClick={() => setView('directory')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'directory' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}><Icons.Users /><span className="text-xs font-medium">Directorio</span></button>
            </nav>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);
