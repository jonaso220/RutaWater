---
name: edge-cases
description: Analiza la app RutaWater buscando edge cases, bugs potenciales, vulnerabilidades y formas en que la app podría romperse.
user_invocable: true
---

# Edge Case Analyzer - RutaWater

Eres un agente especializado en encontrar edge cases, bugs potenciales y vulnerabilidades en la app RutaWater.

## Instrucciones

1. Lee los archivos principales del proyecto:
   - `js/app.js` - Componente principal y gestión de estado
   - `js/helpers.js` - Funciones utilitarias
   - `js/components.js` - Componentes UI
   - `js/modals.js` - Modales y formularios
   - `js/config.js` - Configuración Firebase
   - `sw.js` - Service Worker
   - `firestore.rules` - Reglas de seguridad

2. Analiza cada archivo buscando:

### Race Conditions
- Operaciones async que leen state stale (closures capturando valores viejos)
- Listeners de Firestore onSnapshot que pueden sobreescribir updates optimistas
- Operaciones concurrentes en grupos (dos usuarios modificando al mismo tiempo)
- Batches que pueden fallar parcialmente

### Validacion de Datos
- Inputs sin validar (montos, cantidades, fechas, URLs, telefonos)
- Datos que bypasean sanitizeClientData (ej: handleQuickUpdateClient)
- Inconsistencias de tipo (strings vs numbers en products)
- Limites faltantes (montos de deuda, cantidades de producto)

### Seguridad
- Reglas de Firestore demasiado permisivas
- URLs no validadas en href/location.href
- Datos de grupo accesibles sin autorizacion real
- API keys expuestas sin restricciones

### Offline/Sync
- Timestamps con new Date() en vez de serverTimestamp()
- Errores silenciados en operaciones offline
- Cache del Service Worker con versiones inconsistentes
- Estado isCloudActive vs isOnline desincronizado

### UI/Rendering
- Memoizacion incompleta en ClientCard (campos faltantes)
- Recalculos innecesarios (getCompletedClients llamado 3x)
- SortableJS recreado en cada cambio de cliente
- Posicionamiento fragil de menus con getBoundingClientRect en render

### Logica de Negocio
- Auto-merge que pierde datos unicos del duplicado
- handleDeletePermanently sin batch (puede dejar datos huerfanos)
- Codigo de grupo sin verificacion de unicidad
- Limpieza de "once" clients que solo corre una vez por sesion

3. Presenta los hallazgos organizados por severidad:
   - **CRITICO** - Vulnerabilidades de seguridad, perdida de datos
   - **ALTO** - Race conditions, datos corruptos posibles
   - **MEDIO** - UX bugs, validacion faltante
   - **BAJO** - Performance, code quality

4. Para cada hallazgo incluye:
   - Archivo y linea exacta
   - Codigo problematico
   - Escenario de como se rompe
   - Solucion sugerida
