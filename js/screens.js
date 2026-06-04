// --- SCREENS: pantallas de sección extraídas de App para achicar app.js ---
// Son presentacionales: reciben datos y handlers por props, no tienen estado propio
// (salvo lo estrictamente local). La lógica/estado sigue viviendo en App.

// === ESTADÍSTICAS / REPORTES ===
// Sólo depende de `stats` (memo calculado en App desde clients/debts/transfers).
const StatsScreen = ({ stats }) => (
    <div className="space-y-4 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">📊 Estadísticas y reportes</h2>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
                { label: 'Clientes activos', value: stats.totalActive, icon: '👥' },
                { label: 'En directorio', value: stats.directoryOnly, icon: '📇' },
                { label: 'Con deuda', value: stats.debtorCount, sub: '$' + stats.debtTotal.toLocaleString(), icon: '💰' },
                { label: 'Transf. pendientes', value: stats.transfersPending, icon: '💳' },
                { label: 'Nuevos este mes', value: stats.newThisMonth, icon: '✨' },
            ].map((c, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <div className="text-2xl mb-1">{c.icon}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">{c.value}</div>
                    {c.sub && <div className="text-xs font-bold text-red-500 dark:text-red-400 mt-0.5">{c.sub}</div>}
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mt-1">{c.label}</div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Clientes por día de visita */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">📅 Clientes por día de visita</h3>
                <div className="space-y-2">
                    {stats.perDay.map(d => {
                        const max = Math.max(1, ...stats.perDay.map(x => x.clients));
                        return (
                            <div key={d.day} className="flex items-center gap-2">
                                <span className="w-16 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{d.day.slice(0, 3)}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                                    <div className="bg-blue-500 h-full rounded-full flex items-center justify-end px-2 min-w-[1.5rem]" style={{ width: Math.max(6, (d.clients / max) * 100) + '%' }}>
                                        <span className="text-[10px] font-bold text-white">{d.clients}</span>
                                    </div>
                                </div>
                                <span className="w-16 text-[10px] text-gray-400 dark:text-gray-500 text-right shrink-0">{d.units} u.</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Clientes por frecuencia */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">🔄 Clientes por frecuencia</h3>
                <div className="space-y-2">
                    {[
                        { key: 'weekly', label: 'Semanal', color: 'bg-blue-500' },
                        { key: 'biweekly', label: 'Quincenal', color: 'bg-purple-500' },
                        { key: 'triweekly', label: 'Cada 3 sem', color: 'bg-pink-500' },
                        { key: 'monthly', label: 'Mensual', color: 'bg-teal-500' },
                        { key: 'once', label: 'Una vez', color: 'bg-orange-500' },
                    ].map(f => {
                        const v = stats.byFreq[f.key] || 0;
                        const max = Math.max(1, stats.byFreq.weekly, stats.byFreq.biweekly, stats.byFreq.triweekly, stats.byFreq.monthly, stats.byFreq.once);
                        return (
                            <div key={f.key} className="flex items-center gap-2">
                                <span className="w-20 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{f.label}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                                    <div className={`${f.color} h-full rounded-full flex items-center justify-end px-2 min-w-[1.5rem]`} style={{ width: Math.max(6, (v / max) * 100) + '%' }}>
                                        <span className="text-[10px] font-bold text-white">{v}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Demanda de productos por ciclo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2 flex-wrap">📦 Demanda de productos por ciclo <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({stats.totalUnits} unidades en total)</span></h3>
            {stats.prodList.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No hay productos asignados al padrón.</p>
            ) : (
                <div className="space-y-2">
                    {stats.prodList.map(p => {
                        const max = Math.max(1, ...stats.prodList.map(x => x.qty));
                        return (
                            <div key={p.id} className="flex items-center gap-2">
                                <span className="w-32 text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0 flex items-center gap-1.5 truncate"><ProductGlyph product={p} size={16} /> <span className="truncate">{p.label}</span></span>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                                    <div className="bg-cyan-500 h-full rounded-full flex items-center justify-end px-2 min-w-[1.5rem]" style={{ width: Math.max(6, (p.qty / max) * 100) + '%' }}>
                                        <span className="text-[10px] font-bold text-white">{p.qty}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Extras */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
                { label: 'Favoritos', value: stats.starred, icon: '⭐' },
                { label: 'Sin ubicación', value: stats.noLocation, icon: '📍' },
                { label: 'Notas', value: stats.notes, icon: '📄' },
                { label: 'Total registros', value: stats.totalActive + stats.directoryOnly, icon: '🗂️' },
            ].map((c, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3">
                    <span className="text-xl">{c.icon}</span>
                    <div><div className="text-lg font-black text-gray-900 dark:text-white leading-none">{c.value}</div><div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">{c.label}</div></div>
                </div>
            ))}
        </div>
    </div>
);

// === TRANSFERENCIAS ===
// Tabla (escritorio) / tarjetas (móvil) de transferencias pendientes de revisar.
const TransfersScreen = ({ transfers, isWide, searchTerm, setSearchTerm, debouncedSearch, onReviewed, onOpenMaps }) => (
    <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    💳 Transferencias
                </h2>
                {transfers.length > 0 && (
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                        {transfers.length} pendiente{transfers.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <div className="relative">
                <input type="text" placeholder="Buscar por nombre o dirección..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm" />
                <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500">🔍</div>
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                )}
            </div>
        </div>

        {transfers.length === 0 ? (
            <div className="text-center py-16">
                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    💳
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay transferencias por revisar</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Las transferencias se marcan desde la tarjeta del cliente</p>
            </div>
        ) : (
            isWide ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Dirección</th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers
                            .filter((() => { const m = fuzzyMatch(debouncedSearch); return t => m(t.clientName || '', t.clientAddress || ''); })())
                            .map(transfer => (
                            <tr key={transfer.id} className="border-b border-gray-50 dark:border-gray-700/50 border-l-4 border-l-emerald-500 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">{(transfer.clientName || '').toUpperCase()}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[340px]"><span onClick={() => onOpenMaps(transfer.clientLat, transfer.clientLng, transfer.clientMapsLink)} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline">📍 {transfer.clientAddress}</span></td>
                                <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">{transfer.createdAt ? new Date(transfer.createdAt.seconds ? transfer.createdAt.seconds * 1000 : transfer.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => onReviewed(transfer)} className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-800">✅ Revisada</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            ) : (
            <div className="grid grid-cols-1 gap-3">
                {transfers
                    .filter((() => { const m = fuzzyMatch(debouncedSearch); return t => m(t.clientName || '', t.clientAddress || ''); })())
                    .map(transfer => (
                    <Card key={transfer.id} className="p-4 border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">{(transfer.clientName || '').toUpperCase()}</h3>
                                <div
                                    onClick={() => onOpenMaps(transfer.clientLat, transfer.clientLng, transfer.clientMapsLink)}
                                    className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline mt-0.5"
                                >
                                    📍 {transfer.clientAddress}
                                </div>
                                {transfer.createdAt && (
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                        {new Date(transfer.createdAt.seconds ? transfer.createdAt.seconds * 1000 : transfer.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => onReviewed(transfer)}
                                className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 ml-3"
                            >
                                ✅ Revisada
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            )
        )}
    </div>
);

// === DEUDAS ===
// Tabla (escritorio) / tarjetas (móvil) de deudas agrupadas por cliente.
const DebtsScreen = ({ debts, clients, transfers, isWide, debtSearchTerm, setDebtSearchTerm, debouncedDebtSearch, debtSortMode, setDebtSortMode, setShowDebtClientSearch, openGoogleMaps, setEditDebtModal, confirmPayOneDebt, confirmPayAllDebts, confirmReviewTransfers, sendWhatsAppDirect, handleAddTransfer, showUndoToast, setConfirmModal, handleDebtPaid, handleTransferReviewed }) => (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    💰 Deudas
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowDebtClientSearch(true)}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        ➕ Añadir
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
                                <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500">🔍</div>
                                {debtSearchTerm && (
                                    <button onClick={() => setDebtSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
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
                                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    💰
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
                                {isWide ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
                                                <th className="px-4 py-3">Cliente</th>
                                                <th className="px-4 py-3">Dirección</th>
                                                <th className="px-4 py-3">Deudas</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                                <th className="px-4 py-3 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {debtGroups.map(groupDebts => {
                                                const first = groupDebts[0];
                                                const clientTotal = groupDebts.reduce((sum, d) => sum + (d.amount || 0), 0);
                                                const client = clients.find(c => c.id === first.clientId);
                                                const phone = client?.phone;
                                                const clientTransfers = transfers.filter(t => t.clientId === first.clientId);
                                                const maxAge = getGroupMaxAge(groupDebts);
                                                const borderColor = maxAge > 30 ? 'border-l-red-600' : maxAge > 15 ? 'border-l-amber-500' : 'border-l-red-400';
                                                return (
                                                    <tr key={first.clientId || first.id} className={`border-b border-gray-50 dark:border-gray-700/50 border-l-4 ${borderColor} hover:bg-gray-50 dark:hover:bg-gray-700/20 align-top`}>
                                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">{(first.clientName || '').toUpperCase()}</td>
                                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[280px]"><span onClick={() => openGoogleMaps(first.clientLat, first.clientLng, first.clientMapsLink)} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline">📍 {first.clientAddress}</span></td>
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-1">
                                                                {groupDebts.map(debt => (
                                                                    <div key={debt.id} className="flex items-center gap-2">
                                                                        <span className="text-[11px] text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">{debt.createdAt ? new Date(debt.createdAt.seconds ? debt.createdAt.seconds * 1000 : debt.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}</span>
                                                                        <span className="font-bold text-gray-800 dark:text-gray-200 w-16 flex-shrink-0">${debt.amount?.toLocaleString()}</span>
                                                                        <button onClick={() => setEditDebtModal({ isOpen: true, debt })} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-xs flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600" title="Editar">✏️</button>
                                                                        <button onClick={() => confirmPayOneDebt(debt)} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[11px] font-bold hover:bg-green-200 dark:hover:bg-green-800" title="Marcar pagada">✅</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-red-600 dark:text-red-400 text-lg whitespace-nowrap align-middle">${clientTotal.toLocaleString()}</td>
                                                        <td className="px-4 py-3 align-middle">
                                                            <div className="flex gap-1.5 justify-end flex-wrap">
                                                                {groupDebts.length > 1 && <button onClick={() => confirmPayAllDebts(groupDebts, first, clientTotal)} className="px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-[11px] font-bold hover:bg-green-600 whitespace-nowrap">✅ Todas</button>}
                                                                {phone && <button onClick={() => sendWhatsAppDirect(phone)} className="px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-[11px] font-bold hover:bg-green-600" title="WhatsApp">💬</button>}
                                                                {clientTransfers.length > 0 ? <button onClick={() => confirmReviewTransfers(clientTransfers, first)} className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[11px] font-bold whitespace-nowrap">✅ Revisada{clientTransfers.length > 1 ? ` (${clientTransfers.length})` : ''}</button> : client ? <button onClick={() => { handleAddTransfer(client); showUndoToast('Transferencia marcada para revisar', null); }} className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[11px] font-bold">💳 Transf.</button> : null}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                ) : (
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
                                                        <span className="shrink-0">📍</span> <span className="break-words">{first.clientAddress}</span>
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
                                                            ✏️
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
                                                            ✅ Pagada
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
                                                    ✅ Pagar todas
                                                </button>
                                            )}
                                            {phone && (
                                                <button
                                                    onClick={() => sendWhatsAppDirect(phone)}
                                                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-600"
                                                >
                                                    💬 Chat
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
                                                    ✅ Revisada{clientTransfers.length > 1 ? ` (${clientTransfers.length})` : ''}
                                                </button>
                                            ) : client ? (
                                                <button
                                                    onClick={() => {
                                                        handleAddTransfer(client);
                                                        showUndoToast("Transferencia marcada para revisar", null);
                                                    }}
                                                    className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-200 dark:hover:bg-emerald-800"
                                                >
                                                    💳 Transf.
                                                </button>
                                            ) : null}
                                        </div>
                                    </Card>
                                    );
                                })}
                                </div>
                                )}
                            </div>
                            );
                        })()}
                    </div>
);
