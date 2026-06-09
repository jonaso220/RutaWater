// --- HELPERS: Funciones utilitarias puras ---
// Declaradas con var para ser accesibles globalmente desde scripts Babel

// --- SANITIZACIÓN Y VALIDACIÓN ---

var sanitizeString = function(str, maxLen) {
    if (!str) return '';
    maxLen = maxLen || 500;
    return String(str).trim().slice(0, maxLen);
};

var sanitizePhone = function(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^\d+\-\s()]/g, '').slice(0, 20);
};

var sanitizeProductQty = function(val) {
    if (!val && val !== 0) return '';
    var n = parseInt(val, 10);
    if (isNaN(n) || n < 0 || n > 9999) return '';
    return String(n);
};

var isSafeUrl = function(url) {
    if (!url) return false;
    try {
        var parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch(e) {
        return false;
    }
};

var sanitizeClientData = function(data) {
    var clean = {};
    clean.name = sanitizeString(data.name, 100);
    clean.phone = sanitizePhone(data.phone);
    clean.address = sanitizeString(data.address, 200);
    clean.notes = sanitizeString(data.notes, 500);
    clean.lat = sanitizeString(data.lat, 20);
    clean.lng = sanitizeString(data.lng, 20);
    clean.freq = ['weekly','biweekly','triweekly','monthly','once','on_demand'].indexOf(data.freq) !== -1 ? data.freq : 'weekly';
    clean.visitDay = sanitizeString(data.visitDay, 20);
    clean.specificDate = sanitizeString(data.specificDate, 10);
    clean.locationInput = sanitizeString(data.locationInput, 300);
    clean.mapsLink = (data.mapsLink && isSafeUrl(data.mapsLink)) ? data.mapsLink : '';

    // Sanitizar visitDays
    var validDays = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    clean.visitDays = Array.isArray(data.visitDays) ? data.visitDays.filter(function(d) { return validDays.indexOf(d) !== -1; }) : [];

    // Sanitizar productos
    var validProducts = ['b20','b12','b6','soda','bombita','disp_elec_new','disp_elec_chg','disp_nat'];
    clean.products = {};
    validProducts.forEach(function(pid) {
        clean.products[pid] = data.products ? sanitizeProductQty(data.products[pid]) : '';
    });

    return clean;
};

// --- REINTENTOS Y MANEJO DE ERRORES ---

var firestoreRetry = function(operation, maxRetries) {
    maxRetries = maxRetries || 3;
    var attempt = function(retriesLeft) {
        return operation().catch(function(e) {
            if (retriesLeft <= 1) throw e;
            var delay = Math.pow(2, maxRetries - retriesLeft) * 1000;
            return new Promise(function(r) { setTimeout(r, delay); }).then(function() {
                return attempt(retriesLeft - 1);
            });
        });
    };
    return attempt(maxRetries);
};

var getErrorMessage = function(error) {
    if (!error) return 'Ocurrió un error inesperado.';
    var code = error.code || '';
    var msg = error.message || '';
    if (code === 'permission-denied' || code === 'PERMISSION_DENIED') return 'No tenés permisos para esta acción.';
    if (code === 'not-found') return 'El registro no fue encontrado.';
    if (code === 'unavailable' || code === 'deadline-exceeded' || msg.indexOf('network') !== -1 || msg.indexOf('Failed to fetch') !== -1)
        return 'Error de conexión. Verificá tu internet e intentá de nuevo.';
    return 'Ocurrió un error. Intentá de nuevo.';
};

var parseDate = function(val) {
    if (!val) return null;
    if (val.seconds !== undefined) return new Date(val.seconds * 1000);
    return new Date(val);
};

var normalizeText = function(text) {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// Damerau-Levenshtein (optimal string alignment): como Levenshtein pero cuenta una
// transposición adyacente (ej. "jaun" vs "juan") como una sola edición — uno de los
// typos más comunes. Sincronizado con la app nativa (src/utils/helpers.ts).
var damerau = function(a, b) {
    var al = a.length, bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    var d = [];
    for (var i = 0; i <= al; i++) d[i] = [i];
    for (var j = 0; j <= bl; j++) d[0][j] = j;
    for (i = 1; i <= al; i++) {
        for (j = 1; j <= bl; j++) {
            var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[al][bl];
};

// Normaliza un teléfono a dígitos comparables: quita no-dígitos, código país 598 y
// cero inicial (formato local 098... -> 98...). Así el formato/espacios no bloquean.
var normalizePhoneForComparison = function(phone) {
    if (!phone) return '';
    var digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.indexOf('598') === 0) digits = digits.slice(3);
    if (digits.indexOf('0') === 0) digits = digits.slice(1);
    return digits;
};

// Tolerancia de typo según el largo de la palabra (palabras largas permiten más edits).
var wordTolerance = function(len) {
    return len <= 4 ? 1 : len <= 7 ? 1 : len <= 11 ? 2 : 3;
};

// ¿La palabra de búsqueda `w` matchea algún token de `textWords`? Substring (cubre
// prefijos tipo "mar"->"maria") o typo dentro de tolerancia (Damerau, incluyendo el
// prefijo del token para errores al empezar a tipear un nombre largo).
var wordMatches = function(textWords, w) {
    for (var k = 0; k < textWords.length; k++) {
        var tw = textWords[k];
        if (tw.indexOf(w) > -1) return true;
        if (w.length >= 3) {
            var md = wordTolerance(w.length);
            if (damerau(tw, w) <= md) return true;
            if (tw.length > w.length && damerau(tw.slice(0, w.length), w) <= md) return true;
        }
    }
    return false;
};

var fuzzyMatch = function(searchTerm) {
    if (!searchTerm) return function() { return true; };
    var cleaned = normalizeText(searchTerm).trim().replace(/\s+/g, ' ');
    if (!cleaned) return function() { return true; };
    var words = cleaned.split(' ').filter(Boolean);

    // Búsqueda por número: si la query es de dígitos, matchea contra teléfonos
    // normalizados (ignora espacios, guiones, +, código 598 y cero inicial).
    var queryDigits = normalizePhoneForComparison(searchTerm);
    var hasDigitQuery = queryDigits.length >= 3;
    var isPureDigits = /^[\d\s+().-]+$/.test(searchTerm.trim());

    return function() {
        var fields = Array.prototype.slice.call(arguments);

        if (hasDigitQuery) {
            for (var i = 0; i < fields.length; i++) {
                var fd = normalizePhoneForComparison(fields[i] || '');
                if (fd && fd.indexOf(queryDigits) > -1) return true;
            }
            // Una query puramente numérica solo tiene sentido contra teléfonos/números.
            if (isPureDigits) return false;
        }

        var combined = fields.map(function(f) { return normalizeText(f || ''); }).join(' ');

        // Fast path: la query completa aparece tal cual.
        if (combined.indexOf(cleaned) > -1) return true;

        // Cada palabra de la query debe matchear algún token.
        var textWords = combined.split(/\s+/).filter(Boolean);
        return words.every(function(w) { return wordMatches(textWords, w); });
    };
};

// Ranking de relevancia para ordenar resultados (mayor = mejor match). Sincronizado
// con la app nativa: nombre exacto 1000 > empieza-con 800 > palabra-empieza 700 >
// contiene 500 > dirección 400/350/300 > teléfono 250/200 > nº de dirección 150.
var matchScore = function(searchTerm, name, address, phone) {
    var term = normalizeText(searchTerm).trim();
    if (!term) return 0;
    var n = normalizeText(name);
    var a = normalizeText(address);
    var wordStartsWith = function(text, q) {
        return text.split(/\s+/).filter(Boolean).some(function(w) { return w.indexOf(q) === 0; });
    };
    if (n === term) return 1000;
    if (n.indexOf(term) === 0) return 800;
    if (wordStartsWith(n, term)) return 700;
    if (n.indexOf(term) > -1) return 500;
    if (a.indexOf(term) === 0) return 400;
    if (wordStartsWith(a, term)) return 350;
    if (a.indexOf(term) > -1) return 300;
    var qd = normalizePhoneForComparison(searchTerm);
    if (qd.length >= 3) {
        var pd = normalizePhoneForComparison(phone);
        if (pd) {
            if (pd.indexOf(qd) === 0) return 250;
            if (pd.indexOf(qd) > -1) return 200;
        }
        var ad = normalizePhoneForComparison(address);
        if (ad && ad.indexOf(qd) > -1) return 150;
    }
    return 100;
};

var getDayIndex = function(dayName) {
    if (!dayName) return -1;
    var normalized = normalizeText(dayName);
    var map = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6
    };
    return map[normalized] !== undefined ? map[normalized] : -1;
};

var getWeekNumber = function(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

// Sincronizado con la app nativa (src/utils/helpers.ts:getNextVisitDate).
// specificDate sólo es fecha fija para 'once'; para periódicos es una fecha ancla
// de inicio y la rotación real se calcula desde lastVisited.
// Próxima visita "efectiva" para ordenar/agrupar/contar en la UI: una fecha
// vencida (un 'once' pendiente o un periódico en días de gracia) cuenta como
// HOY — igual que el clamp de la agrupación móvil y de la app nativa.
var getEffectiveVisitDate = function(client, forDay) {
    var d = getNextVisitDate(client, forDay);
    if (!d) return null;
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return d < hoy ? hoy : d;
};

// yyyy-mm-dd en hora LOCAL. toISOString() es UTC y a partir de las 21:00
// (UTC-3) ya dice "mañana" — no usar para "hoy".
var toLocalDateString = function(d) {
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
};

// Días que una visita no entregada sigue figurando como pendiente ("Hoy")
// antes de saltar sola al próximo ciclo, como si se hubiera marcado Listo.
var LATE_GRACE_DAYS = 2;

var getNextVisitDate = function(client, forDay) {
    if (client.freq === 'once') {
        if (!client.specificDate) return null;
        // La BD compartida (IA/nativa) puede traer fechas malformadas; un
        // Invalid Date acá rompería a cualquier consumidor.
        var onceDate = new Date(client.specificDate + 'T12:00:00');
        return isNaN(onceDate.getTime()) ? null : onceDate;
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var dayToUse = forDay || client.visitDay;
    var targetDayIndex = getDayIndex(dayToUse);
    if (targetDayIndex === -1) return null;

    var currentDayIndex = today.getDay();
    var diff = targetDayIndex - currentDayIndex;
    if (diff < 0) diff += 7;

    var nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);

    var lastVisited = parseDate(client.lastVisited);

    var intervalWeeks = 1;
    if (client.freq === 'biweekly') intervalWeeks = 2;
    if (client.freq === 'triweekly') intervalWeeks = 3;
    if (client.freq === 'monthly') intervalWeeks = 4;

    if (lastVisited) {
        var lastVisitedDay = new Date(lastVisited);
        lastVisitedDay.setHours(0, 0, 0, 0);

        // Ciclo anclado al DÍA del cliente, no a la fecha real de entrega:
        //  1) La visita se atribuye a su ocurrencia agendada MÁS CERCANA
        //     (empate → la pasada): una entrega tarde (martes para un cliente
        //     de lunes) pertenece al lunes que pasó; una adelantada (sábado)
        //     al lunes que viene. Entregar tarde mantiene día y ritmo.
        //  2) La próxima visita del día objetivo es su ocurrencia intervalWeeks
        //     después de la semana atribuida — o la misma semana para un día
        //     hermano posterior de un cliente multi-día.
        //  3) Una visita perdida sigue pendiente LATE_GRACE_DAYS días y después
        //     salta sola al próximo ciclo, como si se hubiera dado Listo.
        var dayIndexes = [targetDayIndex];
        if (Array.isArray(client.visitDays)) {
            client.visitDays.forEach(function(d) {
                var idx = getDayIndex(d);
                if (idx !== -1 && dayIndexes.indexOf(idx) === -1) dayIndexes.push(idx);
            });
        }
        var mainDayIndex = getDayIndex(client.visitDay);
        if (mainDayIndex !== -1 && dayIndexes.indexOf(mainDayIndex) === -1) dayIndexes.push(mainDayIndex);

        var bestOffset = null;
        dayIndexes.forEach(function(idx) {
            var fwd = (idx - lastVisitedDay.getDay() + 7) % 7;
            var offsets = fwd === 0 ? [0] : [fwd - 7, fwd];
            offsets.forEach(function(off) {
                if (bestOffset === null ||
                    Math.abs(off) < Math.abs(bestOffset) ||
                    (Math.abs(off) === Math.abs(bestOffset) && off < bestOffset)) {
                    bestOffset = off;
                }
            });
        });
        var attributed = new Date(lastVisitedDay);
        attributed.setDate(attributed.getDate() + (bestOffset || 0));

        // Ocurrencia del día objetivo en la semana atribuida (semana de lunes),
        // y saltar ciclos enteros hasta pasar la visita atribuida y la gracia.
        var candidate = new Date(attributed);
        candidate.setDate(candidate.getDate() - ((attributed.getDay() + 6) % 7) + ((targetDayIndex + 6) % 7));
        if (candidate.getTime() <= attributed.getTime()) {
            candidate.setDate(candidate.getDate() + intervalWeeks * 7);
        }
        var graceLimit = new Date(today);
        graceLimit.setDate(graceLimit.getDate() - LATE_GRACE_DAYS);
        while (candidate < graceLimit) {
            candidate.setDate(candidate.getDate() + intervalWeeks * 7);
        }
        nextDate.setTime(candidate.getTime());
    }

    // Para periódicos, respetar specificDate como fecha ancla de inicio.
    if (client.specificDate) {
        var startDate = new Date(client.specificDate + 'T00:00:00');
        if (startDate > today && nextDate < startDate) {
            // Fecha de inicio futura: empujar nextDate al primer día que coincida
            // en o después de startDate.
            while (nextDate < startDate) {
                nextDate.setDate(nextDate.getDate() + 7);
            }
        } else if (!lastVisited && startDate <= today && nextDate > today) {
            // Fecha pasada/hoy sin lastVisited (recién editado): traer nextDate a la
            // ocurrencia de la misma semana que specificDate para que reaparezca ya.
            // Sólo si specificDate es reciente (últimos 7 días) para no traer datos viejos.
            var daysSinceStart = Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceStart < 7) {
                var candidate = new Date(nextDate);
                candidate.setDate(candidate.getDate() - 7);
                if (candidate >= startDate) {
                    nextDate.setTime(candidate.getTime());
                }
            }
        }
    }

    return nextDate;
};

var formatDate = function(date) {
    if (!date) return 'Sin fecha';
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return 'Para Hoy';
    var diffTime = d - today;
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Mañana';
    if (diffDays === 7) return 'Próxima Semana';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

var normalizePhone = function(phone) {
    if (!phone) return '';
    var clean = phone.replace(/\D/g, '');
    // Ya tiene código de país uruguayo
    if (clean.startsWith('598')) return clean;
    // Número internacional largo (ej: 5491112345678) - no asumir Uruguay
    if (clean.length >= 11) return clean;
    // Formato local uruguayo
    if (clean.startsWith('0')) return '598' + clean.slice(1);
    if (clean.length <= 9) return '598' + clean;
    return clean;
};

var isShortLink = function(input) {
    return input && (input.includes("goo.gl") || input.includes("maps.app.goo.gl") || input.includes("google.com/maps"));
};

var parseLocationInput = function(input) {
    if (!input) return null;
    var m = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return { lat: m[1], lng: m[2] };
    return null;
};

var parseContactString = function(str) {
    // 0. Limpiar caracteres de formato de WhatsApp/mensajería
    str = str.replace(/\*/g, '').replace(/(?:^|\s)_([^_]+)_(?:\s|$)/g, ' $1 ');

    var lines = str.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; });

    var name = '', address = '', phone = '', link = '', lat = '', lng = '', notes = '';
    var products = { b20: '', b12: '', b6: '', soda: '', bombita: '', disp_elec_new: '', disp_elec_chg: '', disp_nat: '' };

    // 1. Extraer URL de Google Maps
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    var urls = str.match(urlRegex);
    if (urls) {
        link = urls[0];
        var m = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) { lat = m[1]; lng = m[2]; }
    }

    // 2. Extraer teléfono
    var i;
    for (i = 0; i < lines.length; i++) {
        var telMatch = lines[i].match(/tel[eé]fono\s*:\s*(\d[\d\s\-]*)/i);
        if (telMatch) { phone = telMatch[1].replace(/[\s\-]/g, ''); break; }
    }
    if (!phone) {
        for (i = 0; i < lines.length; i++) {
            if (lines[i].match(urlRegex)) continue;
            var numMatch = lines[i].match(/\b(0\d{8,})\b/);
            if (numMatch) { phone = numMatch[1]; break; }
        }
    }

    // 3. Extraer nombre
    for (i = 0; i < lines.length; i++) {
        var nameMatch = lines[i].match(/nombre\s*:\s*(.+)/i);
        if (nameMatch) { name = nameMatch[1].trim(); break; }
    }

    // 4. Extraer dirección + esquina
    var direccion = '', esquina = '';
    for (i = 0; i < lines.length; i++) {
        var dirMatch = lines[i].match(/direcci[oó]n\s*:\s*(.+)/i);
        if (dirMatch) { direccion = dirMatch[1].trim(); }
        var esqMatch = lines[i].match(/esquina\s*:\s*(.+)/i);
        if (esqMatch) { esquina = esqMatch[1].trim(); }
    }
    if (direccion && esquina) { address = direccion + ' (esq. ' + esquina + ')'; }
    else if (direccion) { address = direccion; }

    // 5. Extraer productos
    var fullText = str.toLowerCase();

    var b20Match = fullText.match(/bid[oó]n[:\s]*20\s*(?:lts?|litros?)?\s*(\d+)/i) || fullText.match(/20\s*(?:lts?|litros?)\s*(\d+)/i);
    if (b20Match) products.b20 = b20Match[1];

    var b12Match = fullText.match(/bid[oó]n[:\s]*12\s*(?:lts?|litros?)?\s*(\d+)/i) || fullText.match(/12\s*(?:lts?|litros?)\s*(\d+)/i);
    if (b12Match) products.b12 = b12Match[1];

    var b6Match = fullText.match(/bid[oó]n[:\s]*6\s*(?:lts?|litros?)?\s*(\d+)/i) || fullText.match(/6\s*(?:lts?|litros?)\s*(\d+)/i);
    if (b6Match) products.b6 = b6Match[1];

    var sodaMatch = fullText.match(/soda\s*:\s*(\d+)/i);
    if (sodaMatch && parseInt(sodaMatch[1]) > 0) products.soda = sodaMatch[1];

    var bombitaMatch = fullText.match(/bombita\s*:?\s*(\d+)/i);
    if (bombitaMatch && parseInt(bombitaMatch[1]) > 0) products.bombita = bombitaMatch[1];

    var dispElecNewMatch = fullText.match(/dispensador\s*:?\s*(?:elec(?:trico)?|elé(?:ctrico)?)\s*(?:nuevo)?\s*(\d+)/i) || fullText.match(/disp(?:ensador)?\s*:?\s*elec\s*(\d+)/i);
    if (dispElecNewMatch && parseInt(dispElecNewMatch[1]) > 0) products.disp_elec_new = dispElecNewMatch[1];

    var dispElecChgMatch = fullText.match(/dispensador\s*:?\s*(?:elec(?:trico)?|elé(?:ctrico)?)\s*cambio\s*(\d+)/i);
    if (dispElecChgMatch && parseInt(dispElecChgMatch[1]) > 0) products.disp_elec_chg = dispElecChgMatch[1];

    var dispNatMatch = fullText.match(/dispensador\s*:?\s*nat(?:ural)?\s*(\d+)/i) || fullText.match(/disp(?:ensador)?\s*:?\s*nat\s*(\d+)/i);
    if (dispNatMatch && parseInt(dispNatMatch[1]) > 0) products.disp_nat = dispNatMatch[1];

    // 6. Extraer notas/detalle
    var detalles = [];
    var isAfterProducts = false;
    for (i = 0; i < lines.length; i++) {
        if (/producto|bidon|soda|dispensador/i.test(lines[i])) { isAfterProducts = true; }
        var detMatch = lines[i].match(/detalle\s*:\s*(.+)/i);
        if (detMatch) {
            var detText = detMatch[1].trim();
            if (detText.length <= 20 && !isAfterProducts && !/nuevo|coordinar|espera|llam/i.test(detText)) {
                if (address) address += ' - ' + detText;
                else address = detText;
            } else if (isAfterProducts || detText.length > 20 || /nuevo|coordinar|espera|llam/i.test(detText)) {
                detalles.push(detText);
            }
        }
    }
    notes = detalles.join(' | ');

    // 7. Fallback
    if (!name && !address && !phone) {
        var cleanStr = str.replace(link, '').trim().replace(/-+$/, '').trim();
        var parts = cleanStr.split(/\s+-\s+/).map(function(s) { return s.trim(); }).filter(function(s) { return s; });
        if (parts.length >= 2) { name = parts[0]; address = parts.slice(1).join(' - '); }
        else if (parts.length === 1) { name = parts[0]; address = parts[0]; }
    }

    return { name: name, address: address, phone: phone, link: link, lat: lat, lng: lng, products: products, notes: notes };
};
