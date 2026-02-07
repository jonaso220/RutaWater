// --- HELPERS: Funciones utilitarias puras ---
// Declaradas con var para ser accesibles globalmente desde scripts Babel

var parseDate = function(val) {
    if (!val) return null;
    if (val.seconds !== undefined) return new Date(val.seconds * 1000);
    return new Date(val);
};

var normalizeText = function(text) {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

var getNextVisitDate = function(client, forDay) {
    if (client.specificDate) return new Date(client.specificDate + 'T12:00:00');
    if (client.freq === 'once') return null;

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

        if (lastVisitedDay.getTime() >= today.getTime()) {
            nextDate.setDate(nextDate.getDate() + (intervalWeeks * 7));
        } else {
            if (intervalWeeks > 1) {
                var daysSince = (nextDate.getTime() - lastVisitedDay.getTime()) / (1000 * 3600 * 24);
                if (daysSince < (intervalWeeks * 7) - 3) {
                    if (daysSince < 7) {
                        nextDate.setDate(nextDate.getDate() + (intervalWeeks * 7) - 7);
                    }
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
    if (clean.startsWith('598')) return clean;
    if (clean.startsWith('0')) return '598' + clean.slice(1);
    if (clean.length === 8 && clean.startsWith('9')) return '598' + clean;
    return '598' + clean;
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
