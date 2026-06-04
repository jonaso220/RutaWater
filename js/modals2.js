// --- MODALS (parte 2): catálogo de productos, mensajes WhatsApp, configuración,
// grupo familiar e importación en lote. Separado de modals.js para achicar el archivo.
// Carga después de modals.js (ver index.html); usa los globales de components.js/helpers.js.

// --- COMPONENTE MODAL CATÁLOGO DE PRODUCTOS ---
const ProductCatalogModal = ({ isOpen, products, hidden, onClose, onRename, onSetEmoji, onToggleHidden, onAdd, onRemove, onMove }) => {
    const [iconPickerFor, setIconPickerFor] = React.useState(null);
    const [adding, setAdding] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [newShort, setNewShort] = React.useState('');
    const [newEmoji, setNewEmoji] = React.useState('');

    React.useEffect(() => { if (isOpen) { setIconPickerFor(null); setAdding(false); setNewName(''); setNewShort(''); setNewEmoji(''); } }, [isOpen]);
    if (!isOpen) return null;

    const hiddenSet = hidden || [];
    const submitAdd = () => {
        if (!newName.trim()) return;
        onAdd(newName.trim(), newEmoji.trim() || '📦', newShort.trim());
        setAdding(false); setNewName(''); setNewShort(''); setNewEmoji('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ zIndex: 110 }}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[88vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">📦 Catálogo de productos</h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {products.map((p, idx) => {
                        const isCustom = String(p.id).indexOf('custom_') === 0;
                        const isHidden = hiddenSet.indexOf(p.id) > -1;
                        return (
                            <div key={p.id} className={`border rounded-lg p-2 ${isHidden ? 'border-gray-100 dark:border-gray-700 opacity-50' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIconPickerFor(iconPickerFor === p.id ? null : p.id)} title="Cambiar ícono" className="w-9 h-9 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30"><ProductGlyph product={p} size={22} /></button>
                                    <input defaultValue={p.label} key={p.label} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== p.label) onRename(p.id, v); }} className="flex-1 min-w-0 p-1.5 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 w-12 text-center flex-shrink-0">{p.short}</span>
                                    <button onClick={() => onMove(p.id, -1)} disabled={idx === 0} className="w-6 h-7 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 disabled:opacity-30 text-xs">▲</button>
                                    <button onClick={() => onMove(p.id, 1)} disabled={idx === products.length - 1} className="w-6 h-7 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 disabled:opacity-30 text-xs">▼</button>
                                    <button onClick={() => onToggleHidden(p.id)} title={isHidden ? 'Mostrar' : 'Ocultar'} className="w-7 h-7 rounded bg-gray-100 dark:bg-gray-700 text-sm">{isHidden ? '🚫' : '👁'}</button>
                                    {isCustom && <button onClick={() => onRemove(p.id)} title="Eliminar" className="w-7 h-7 rounded bg-red-50 dark:bg-red-900/20 text-sm">🗑️</button>}
                                </div>
                                {iconPickerFor === p.id && (
                                    <div className="mt-2 bg-gray-50 dark:bg-gray-700/40 rounded-lg p-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <input defaultValue={p.sticker ? '' : p.icon} maxLength={6} placeholder="Emoji" className="w-16 p-1.5 text-center text-lg border rounded bg-white dark:bg-gray-800 dark:border-gray-600" onKeyDown={(e) => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) { onSetEmoji(p.id, v); setIconPickerFor(null); } } }} />
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Escribí un emoji y Enter, o elegí un sticker:</span>
                                        </div>
                                        <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                                            {STICKER_IDS.map(sid => (
                                                <button key={sid} onClick={() => { onSetEmoji(p.id, 'sticker:' + sid); setIconPickerFor(null); }} className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center justify-center" title={sid}>
                                                    <img src={'stickers/' + sid + '.png'} alt="" className="w-7 h-7 object-contain" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    {adding ? (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={6} placeholder="📦" className="w-14 p-2 text-center text-lg border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del producto" className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                                <input value={newShort} onChange={(e) => setNewShort(e.target.value)} placeholder="Corto" maxLength={12} className="w-20 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setAdding(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold">Cancelar</button>
                                <button onClick={submitAdd} disabled={!newName.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold disabled:opacity-50">Agregar producto</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600">+ Agregar producto</button>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE MODAL CONFIGURACIÓN ---
// Editor de los 3 mensajes de WhatsApp (mismos campos que la app nativa:
// whatsappEnCamino / whatsappDeuda / whatsappRecordatorio).
const WhatsAppTemplatesModal = ({ isOpen, settings, onClose, onSave }) => {
    const DEFAULT_EN_CAMINO = "Buenas \u{1F69A}. Ya estamos en camino, sos el/la siguiente en la lista de entrega. \u{00A1}Nos vemos en unos minutos!\n\nAquapura";
    const DEFAULT_DEUDA = "La deuda es de ${total}. Saludos";
    const DEFAULT_RECORDATORIO = "Hola, buenas \nEste es un mensaje automatico para informarle que, segun nuestros registros, quedo pendiente un saldo por regularizar.\nCuando pueda, le agradecemos que nos indique en que fecha podriamos saldarlo. Si necesita nuevamente los datos de la cuenta, con gusto se los enviamos.\nMuchas gracias.";

    const [enCamino, setEnCamino] = React.useState('');
    const [deuda, setDeuda] = React.useState('');
    const [recordatorio, setRecordatorio] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            setEnCamino(settings?.whatsappEnCamino || '');
            setDeuda(settings?.whatsappDeuda || '');
            setRecordatorio(settings?.whatsappRecordatorio || '');
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            whatsappEnCamino: enCamino.trim() || '',
            whatsappDeuda: deuda.trim() || '',
            whatsappRecordatorio: recordatorio.trim() || '',
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ zIndex: 115 }}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[88vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-lg"><Icons.WhatsApp size={18} /></div>
                        Mensajes de WhatsApp
                    </h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Personalizá los mensajes que se envían a tus clientes por WhatsApp. Dejá vacío para usar el mensaje por defecto.</p>
                    <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Mensaje "En camino"</p>
                        <textarea value={enCamino} onChange={(e) => setEnCamino(e.target.value)} placeholder={DEFAULT_EN_CAMINO} className="w-full p-3 border rounded-lg bg-gray-50 h-28 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Mensaje de deuda</p>
                        <textarea value={deuda} onChange={(e) => setDeuda(e.target.value)} placeholder={DEFAULT_DEUDA} className="w-full p-3 border rounded-lg bg-gray-50 h-20 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                        <p className="text-[10px] text-gray-400 mt-1">{"Usá ${total} para insertar el monto."}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Mensaje de recordatorio</p>
                        <textarea value={recordatorio} onChange={(e) => setRecordatorio(e.target.value)} placeholder={DEFAULT_RECORDATORIO} className="w-full p-3 border rounded-lg bg-gray-50 h-36 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                        <p className="text-[10px] text-gray-400 mt-1">Recordatorio amable de saldo pendiente (se envía desde el detalle de la deuda).</p>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 shrink-0">
                    <Button onClick={handleSave} className="flex-1"><Icons.Save size={16} /> Guardar</Button>
                    <button onClick={() => { setEnCamino(''); setDeuda(''); setRecordatorio(''); }} className="px-4 py-3 rounded-lg text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap">Restaurar</button>
                </div>
            </div>
        </div>
    );
};

// Fila de acción reutilizable del panel de Configuración (estilo iOS).
const SettingsRow = ({ icon, title, subtitle, onClick, right, danger }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
        <span className="text-xl shrink-0">{icon}</span>
        <span className="flex-1 min-w-0">
            <span className={`block text-sm font-semibold ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{title}</span>
            {subtitle && <span className="block text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</span>}
        </span>
        {right}
        {!danger && <span className="text-gray-300 dark:text-gray-600 text-lg leading-none shrink-0">›</span>}
    </button>
);
const SettingsSectionTitle = ({ children }) => (
    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-1.5 mt-1">{children}</p>
);

const SettingsModal = ({ isOpen, onClose, darkOn, onToggleTheme, onLogout, onOpenGroup, onOpenCatalog, onOpenWhatsApp, onImport, onExportCSV, onExportBackup, groupData }) => {
    if (!isOpen) return null;

    const inGroup = !!(groupData && groupData.groupId);
    const cardCls = "bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ zIndex: 110 }}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[88vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 p-1.5 rounded-lg"><Icons.Settings size={18} /></div>
                        Configuración
                    </h3>
                    <button onClick={onClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-5">

                    {/* GESTIÓN */}
                    <div>
                        <SettingsSectionTitle>Gestión</SettingsSectionTitle>
                        <div className={cardCls}>
                            <SettingsRow
                                icon="👥"
                                title="Grupo familiar"
                                subtitle={inGroup ? (groupData.role === 'admin' ? 'Administrás un grupo' : 'Sos miembro de un grupo') : 'Compartí tus datos con tu familia'}
                                onClick={onOpenGroup}
                                right={inGroup ? <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full shrink-0">Activo</span> : null}
                            />
                            <SettingsRow icon="📦" title="Catálogo de productos" subtitle="Renombrar, ícono, ocultar, ordenar" onClick={onOpenCatalog} />
                            <SettingsRow icon="💬" title="Mensajes de WhatsApp" subtitle="En camino, deuda y recordatorio" onClick={onOpenWhatsApp} />
                        </div>
                    </div>

                    {/* APARIENCIA */}
                    <div>
                        <SettingsSectionTitle>Apariencia</SettingsSectionTitle>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="w-full flex items-center gap-3 px-4 py-3">
                                <span className="text-xl shrink-0">{darkOn ? '🌙' : '☀️'}</span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">Tema {darkOn ? 'oscuro' : 'claro'}</span>
                                    <span className="block text-xs text-gray-400 dark:text-gray-500">Tocá para cambiar</span>
                                </span>
                                <button onClick={onToggleTheme} aria-label="Cambiar tema" className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${darkOn ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${darkOn ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* HERRAMIENTAS */}
                    <div>
                        <SettingsSectionTitle>Herramientas</SettingsSectionTitle>
                        <div className={cardCls}>
                            <SettingsRow icon="📥" title="Importar clientes" subtitle="Pegar contactos o CSV" onClick={onImport} />
                            <SettingsRow icon="📤" title="Exportar a CSV" subtitle="Todos los clientes" onClick={onExportCSV} />
                            <SettingsRow icon="💾" title="Backup (JSON)" subtitle="Copia de seguridad completa" onClick={onExportBackup} />
                        </div>
                    </div>

                    {/* CUENTA */}
                    <div>
                        <SettingsSectionTitle>Cuenta</SettingsSectionTitle>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <SettingsRow icon="🚪" title="Cerrar sesión" onClick={onLogout} danger />
                        </div>
                    </div>

                </div>
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

// --- IMPORTAR CLIENTES EN LOTE ---
const IMPORT_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const IMPORT_FREQ_OPTIONS = [
    { key: 'weekly', label: 'Semanal' },
    { key: 'biweekly', label: 'Quincenal' },
    { key: 'triweekly', label: 'Cada 3 sem' },
    { key: 'monthly', label: 'Mensual' },
    { key: 'on_demand', label: 'Solo Directorio' },
];

const BulkImportModal = ({ isOpen, onClose, onImport, defaultDay }) => {
    const [mode, setMode] = React.useState('contactos'); // 'contactos' | 'tabla'
    const [rawText, setRawText] = React.useState('');
    const [rows, setRows] = React.useState(null); // null = paso de ingreso; array = preview editable
    const [importing, setImporting] = React.useState(false);

    if (!isOpen) return null;

    const baseDay = (defaultDay && IMPORT_DAYS.indexOf(defaultDay) > -1) ? defaultDay : 'Lunes';
    const inputCls = "w-full px-2 py-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 text-sm";

    // Modo "contactos": separa por línea en blanco (o línea de guiones) y parsea cada bloque.
    const parseContactsMode = (text) => {
        const blocks = text.split(/\n\s*\n|\n-{3,}\s*\n/).map(b => b.trim()).filter(Boolean);
        return blocks.map(block => {
            const p = parseContactString(block);
            const products = {};
            Object.keys(p.products || {}).forEach(k => {
                const v = parseInt(p.products[k] || 0, 10);
                if (v > 0) products[k] = v;
            });
            return {
                include: !!(p.name || p.address || p.phone),
                name: p.name || '', phone: p.phone || '', address: p.address || '',
                lat: p.lat || '', lng: p.lng || '', mapsLink: p.link || '',
                notes: p.notes || '', products: products,
                day: baseDay, freq: 'weekly',
            };
        });
    };

    // Modo "tabla": una línea por cliente. Delimitador autodetectado: TAB > ; > ,
    const parseTableMode = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.map(line => {
            const delim = line.indexOf('\t') > -1 ? '\t' : (line.indexOf(';') > -1 ? ';' : ',');
            const cols = line.split(delim).map(c => c.trim());
            const matchedDay = IMPORT_DAYS.filter(d => normalizeText(d) === normalizeText(cols[3] || ''))[0];
            return {
                include: !!cols[0],
                name: cols[0] || '', phone: cols[1] || '', address: cols[2] || '',
                lat: '', lng: '', mapsLink: '', notes: '', products: {},
                day: matchedDay || baseDay, freq: 'weekly',
            };
        });
    };

    const handleProcess = () => {
        setRows(mode === 'contactos' ? parseContactsMode(rawText) : parseTableMode(rawText));
    };

    const updateRow = (idx, patch) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
    const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));
    const setAllDays = (day) => setRows(prev => prev.map(r => ({ ...r, day: day })));
    const setAllFreq = (freq) => setRows(prev => prev.map(r => ({ ...r, freq: freq })));

    const selected = (rows || []).filter(r => r.include && r.name.trim());

    const prodSummary = (products) => Object.keys(products || {}).filter(k => products[k] > 0)
        .map(k => { const p = PRODUCTS.find(x => x.id === k); return products[k] + 'x ' + (p ? p.short : k); }).join(', ');

    const handleClose = () => { setRawText(''); setRows(null); onClose(); };

    const handleConfirm = async () => {
        if (!selected.length) return;
        setImporting(true);
        try {
            await onImport(selected);
            setRawText(''); setRows(null);
            onClose();
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ zIndex: 100 }}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">📥 Importar clientes en lote</h3>
                    <button onClick={handleClose}><Icons.X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>

                {rows === null ? (
                    <div className="p-4 overflow-y-auto flex-1 space-y-3">
                        <div className="flex gap-2">
                            <button onClick={() => setMode('contactos')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'contactos' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>📋 Contactos (WhatsApp)</button>
                            <button onClick={() => setMode('tabla')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'tabla' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>📊 Tabla / CSV</button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {mode === 'contactos'
                                ? 'Pegá varios contactos separados por una línea en blanco. De cada bloque se detectan nombre, dirección, esquina, teléfono, link de Maps, productos y notas.'
                                : 'Una línea por cliente, con columnas separadas por TAB, punto y coma (;) o coma: Nombre, Teléfono, Dirección, Día. (Al pegar desde una planilla se usa TAB automáticamente.)'}
                        </p>
                        <textarea
                            className="w-full border rounded-lg p-3 h-56 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                            placeholder={mode === 'contactos'
                                ? "Nombre: JUAN PÉREZ\nDirección: AV. ITALIA 1234\nTeléfono: 099123456\nBidon: 20Lts 2\n\nNombre: MARÍA LÓPEZ\nDirección: 18 DE JULIO 900\nTeléfono: 098765432"
                                : "Juan Pérez; 099123456; Av. Italia 1234; Lunes\nMaría López; 098765432; 18 de Julio 900; Martes"}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                            <Button onClick={handleProcess} disabled={!rawText.trim()}>Procesar →</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-bold dark:text-white">{selected.length} de {rows.length} se importarán</span>
                            <div className="flex-1" />
                            <label className="text-xs text-gray-500 dark:text-gray-400">Día a todos:</label>
                            <select onChange={(e) => { if (e.target.value) setAllDays(e.target.value); e.target.value = ''; }} defaultValue="" className={inputCls + ' w-auto'}>
                                <option value="">—</option>
                                {IMPORT_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Frec.:</label>
                            <select onChange={(e) => { if (e.target.value) setAllFreq(e.target.value); e.target.value = ''; }} defaultValue="" className={inputCls + ' w-auto'}>
                                <option value="">—</option>
                                {IMPORT_FREQ_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                            </select>
                        </div>
                        <div className="overflow-auto flex-1 p-3">
                            {rows.length === 0 ? (
                                <p className="text-center text-gray-400 dark:text-gray-500 py-10">No se detectaron clientes. Volvé y revisá el formato.</p>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            <th className="p-1 w-8"></th>
                                            <th className="p-1">Nombre</th>
                                            <th className="p-1 w-28">Teléfono</th>
                                            <th className="p-1">Dirección</th>
                                            <th className="p-1 w-24">Día</th>
                                            <th className="p-1 w-28">Frecuencia</th>
                                            <th className="p-1 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, idx) => (
                                            <tr key={idx} className={`align-top ${r.include ? '' : 'opacity-40'}`}>
                                                <td className="p-1 pt-2"><input type="checkbox" checked={r.include} onChange={(e) => updateRow(idx, { include: e.target.checked })} /></td>
                                                <td className="p-1">
                                                    <input value={r.name} onChange={(e) => updateRow(idx, { name: e.target.value })} className={inputCls} placeholder="Nombre" />
                                                    {prodSummary(r.products) && <div className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5 px-1">📦 {prodSummary(r.products)}</div>}
                                                    {r.mapsLink && <div className="text-[10px] text-green-500 dark:text-green-400 mt-0.5 px-1">📍 con ubicación</div>}
                                                </td>
                                                <td className="p-1"><input value={r.phone} onChange={(e) => updateRow(idx, { phone: e.target.value })} className={inputCls} placeholder="—" /></td>
                                                <td className="p-1"><input value={r.address} onChange={(e) => updateRow(idx, { address: e.target.value })} className={inputCls} placeholder="—" /></td>
                                                <td className="p-1"><select value={r.day} disabled={r.freq === 'on_demand'} onChange={(e) => updateRow(idx, { day: e.target.value })} className={inputCls + (r.freq === 'on_demand' ? ' opacity-40' : '')}>{IMPORT_DAYS.map(d => <option key={d} value={d}>{d.slice(0, 3)}</option>)}</select></td>
                                                <td className="p-1"><select value={r.freq} onChange={(e) => updateRow(idx, { freq: e.target.value })} className={inputCls}>{IMPORT_FREQ_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}</select></td>
                                                <td className="p-1 pt-2"><button onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-500" title="Quitar">🗑️</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between gap-2">
                            <Button variant="secondary" onClick={() => setRows(null)}>← Volver</Button>
                            <Button onClick={handleConfirm} disabled={!selected.length || importing}>{importing ? 'Importando…' : 'Importar ' + selected.length + ' cliente' + (selected.length !== 1 ? 's' : '')}</Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
