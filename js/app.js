// Lógica de negocio (equivalente al TorneoViewModel de la app Android),
// hablando con la misma base de Firestore.

async function crearTorneo(modo) {
  try {
    const ref = db.collection('torneos').doc();
    const torneo = {
      nombre: 'Torneo del ' + new Date().toLocaleDateString('es-AR'),
      fecha: Date.now(),
      modo: modo,
      formato: 'PUNTOS',
      metodoSeleccion: 'SIN_DEFINIR',
      estado: 'ARMANDO',
      puntosPorVictoria: 3,
      puntosPorEmpate: 1
    };
    await ref.set(torneo);
    subscribeTorneo(ref.id);
    setRoute('add_players');
  } catch (e) {
    console.error(e);
    showToast('No se pudo crear el torneo. Revisá la configuración de Firebase (js/firebase-config.js).');
  }
}

async function agregarJugador(nombre) {
  if (!nombre || !nombre.trim() || !State.torneoId) return;
  const orden = State.jugadores.length;
  try {
    await db.collection('torneos').doc(State.torneoId).collection('jugadores').add({
      nombre: nombre.trim(),
      presente: true,
      orden
    });
  } catch (e) {
    console.error(e);
    showToast('No se pudo agregar el jugador.');
  }
}

async function quitarJugador(id) {
  try {
    await db.collection('torneos').doc(State.torneoId).collection('jugadores').doc(id).delete();
  } catch (e) {
    console.error(e);
    showToast('No se pudo quitar el jugador.');
  }
}

async function togglePresenteById(id) {
  const jugador = State.jugadores.find(j => j.id === id);
  if (!jugador) return;
  try {
    await db.collection('torneos').doc(State.torneoId).collection('jugadores').doc(id)
      .update({ presente: !jugador.presente });
  } catch (e) {
    console.error(e);
    showToast('No se pudo actualizar el jugador.');
  }
}

function continuarDesdeConfirmar() {
  const esIndividual = State.torneo && State.torneo.modo === 'INDIVIDUAL';
  if (esIndividual) {
    iniciarGanaYSigue();
  } else {
    setRoute('team_select_method');
  }
}

async function elegirMetodoSeleccion(metodo) {
  try {
    await db.collection('torneos').doc(State.torneoId).update({ metodoSeleccion: metodo });
  } catch (e) {
    console.error(e);
    showToast('No se pudo guardar el método de selección.');
  }
}

async function elegirAzar() {
  await elegirMetodoSeleccion('AZAR');
  await sortearParejas();
}

async function elegirManual() {
  await elegirMetodoSeleccion('MANUAL');
  State.manualAssign = {};
  setRoute('manual_teams');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function guardarEquipos(equipos) {
  const coleccion = db.collection('torneos').doc(State.torneoId).collection('equipos');
  const previos = await coleccion.get();
  const batch = db.batch();
  previos.docs.forEach(d => batch.delete(d.ref));
  equipos.forEach(eq => {
    const ref = coleccion.doc();
    batch.set(ref, eq);
  });
  await batch.commit();
  await db.collection('torneos').doc(State.torneoId).update({ estado: 'EN_CURSO' });
}

async function reemplazarEquipos(equipos) {
  const coleccion = db.collection('torneos').doc(State.torneoId).collection('equipos');
  const previos = await coleccion.get();
  const batch = db.batch();
  previos.docs.forEach(d => batch.delete(d.ref));
  equipos.forEach(eq => {
    const { id, ...rest } = eq;
    batch.set(coleccion.doc(), rest);
  });
  await batch.commit();
}

/**
 * Arma TODAS las parejas de entrada (no solo las 2 que arrancan jugando).
 * Si sobra un jugador (cantidad impar), ese queda solo en la cola y va a
 * entrar más adelante reemplazando a un integrante de la pareja perdedora.
 */
async function sortearParejas() {
  const confirmados = shuffle(jugadoresConfirmados());
  if (confirmados.length < 4) {
    showToast('Necesitás al menos 4 jugadores confirmados para armar parejas.');
    return;
  }

  const equiposFormados = [];
  let i = 0;
  for (; i + 1 < confirmados.length; i += 2) {
    equiposFormados.push([confirmados[i], confirmados[i + 1]]);
  }
  const sueltoFinal = (confirmados.length % 2 === 1) ? confirmados[confirmados.length - 1] : null;

  const primeraPareja = equiposFormados[0];
  const segundaPareja = equiposFormados[1];

  const cola = equiposFormados.slice(2).map(par => ({
    tipo: 'equipo',
    jugadores: par.map(j => ({ id: j.id, nombre: j.nombre }))
  }));
  if (sueltoFinal) {
    cola.push({ tipo: 'jugador', jugador: { id: sueltoFinal.id, nombre: sueltoFinal.nombre } });
  }
  State.colaEsperaParejas = cola;

  try {
    await guardarEquipos([
      { nombre: 'Equipo A', color: 'ROJO', jugadoresIds: primeraPareja.map(j => j.id), jugadoresNombres: primeraPareja.map(j => j.nombre) },
      { nombre: 'Equipo B', color: 'AZUL', jugadoresIds: segundaPareja.map(j => j.id), jugadoresNombres: segundaPareja.map(j => j.nombre) }
    ]);
    await db.collection('torneos').doc(State.torneoId).update({
      colaEsperaParejas: cola,
      colaEspera: [],
      proximoPartido: null,
      ultimoResultado: null
    });
    setRoute('draw_teams');
  } catch (e) {
    console.error(e);
    showToast('No se pudo sortear las parejas.');
  }
}

async function confirmarEquiposManual(rojo, azul) {
  if (!rojo || !azul || rojo.length === 0 || azul.length === 0) {
    showToast('Los dos equipos necesitan al menos un jugador.');
    return;
  }
  try {
    await guardarEquipos([
      { nombre: 'Equipo A', color: 'ROJO', jugadoresIds: rojo.map(j => j.id), jugadoresNombres: rojo.map(j => j.nombre) },
      { nombre: 'Equipo B', color: 'AZUL', jugadoresIds: azul.map(j => j.id), jugadoresNombres: azul.map(j => j.nombre) }
    ]);
    setRoute('teams_ready');
  } catch (e) {
    console.error(e);
    showToast('No se pudo confirmar los equipos.');
  }
}

function confirmarEquiposManualDesdeUI() {
  const jugadores = jugadoresConfirmados();
  const rojo = jugadores.filter(j => State.manualAssign[j.id] === 'rojo');
  const azul = jugadores.filter(j => State.manualAssign[j.id] === 'azul');
  confirmarEquiposManual(rojo, azul);
}

function setManualAssign(jugadorId, equipo) {
  State.manualAssign[jugadorId] = equipo;
  render();
}

async function iniciarGanaYSigue() {
  const confirmados = shuffle(jugadoresConfirmados());
  if (confirmados.length < 3) {
    showToast('Necesitás al menos 3 jugadores confirmados.');
    return;
  }
  const cola = confirmados.slice(2).map(j => j.nombre);
  State.colaEspera = cola;
  const equipos = [
    { nombre: confirmados[0].nombre, color: 'ROJO', jugadoresIds: [confirmados[0].id], jugadoresNombres: [confirmados[0].nombre] },
    { nombre: confirmados[1].nombre, color: 'AZUL', jugadoresIds: [confirmados[1].id], jugadoresNombres: [confirmados[1].nombre] }
  ];
  try {
    const coleccion = db.collection('torneos').doc(State.torneoId).collection('equipos');
    const previos = await coleccion.get();
    const batch = db.batch();
    previos.docs.forEach(d => batch.delete(d.ref));
    equipos.forEach(eq => batch.set(coleccion.doc(), eq));
    await batch.commit();
    await db.collection('torneos').doc(State.torneoId).update({
      estado: 'EN_CURSO',
      formato: 'GANA_Y_SIGUE',
      colaEspera: cola,
      colaEsperaParejas: [],
      proximoPartido: null,
      ultimoResultado: null
    });
    setRoute('gana_y_sigue');
  } catch (e) {
    console.error(e);
    showToast('No se pudo iniciar el modo individual.');
  }
}

let tempGolesA = 0;
let tempGolesB = 0;

function stepScore(equipo, delta) {
  if (equipo === 'a') tempGolesA = Math.max(0, tempGolesA + delta);
  if (equipo === 'b') tempGolesB = Math.max(0, tempGolesB + delta);
  const elA = document.getElementById('score-a');
  const elB = document.getElementById('score-b');
  if (elA) elA.textContent = tempGolesA;
  if (elB) elB.textContent = tempGolesB;
}

function submitResultado() {
  const select = document.getElementById('destacado-select');
  const destacado = select ? select.value : '';
  guardarResultado(tempGolesA, tempGolesB, destacado);
  tempGolesA = 0;
  tempGolesB = 0;
}

async function guardarResultado(golesA, golesB, destacado) {
  if (State.torneo && State.torneo.estado === 'FINALIZADO') {
    showToast('Este torneo ya fue finalizado.');
    setRoute('resumen_noche');
    return;
  }
  const equipoA = State.equipos[0];
  const equipoB = State.equipos[1];
  if (!equipoA || !equipoB) return;

  try {
    const partidoData = {
      equipoAId: equipoA.id,
      equipoANombre: equipoA.nombre,
      equipoBId: equipoB.id,
      equipoBNombre: equipoB.nombre,
      // Quiénes jugaban en cada equipo EN ESTE PARTIDO puntual (los equipos
      // rotan integrantes durante la noche en Parejas por sorteo, así que
      // esto es lo único que permite armar estadísticas por jugador real).
      jugadoresA: equipoA.jugadoresNombres || [],
      jugadoresB: equipoB.jugadoresNombres || [],
      golesA, golesB,
      jugadorDestacado: destacado || '',
      timestamp: Date.now(),
      finalizado: true
    };
    const ref = await db.collection('torneos').doc(State.torneoId).collection('partidos').add(partidoData);
    // Lo agregamos también en memoria al toque, así el contador de partidos y
    // el historial se actualizan al instante sin esperar el ida-y-vuelta de Firestore.
    State.partidos = [{ id: ref.id, ...partidoData }, ...State.partidos];

    if (State.torneo && State.torneo.formato === 'GANA_Y_SIGUE') {
      const perdedor = golesA < golesB ? equipoA : (golesB < golesA ? equipoB : null);
      if (perdedor && State.colaEspera.length > 0) {
        const siguienteNombre = State.colaEspera[0];
        const nuevaColaEspera = [...State.colaEspera.slice(1), (perdedor.jugadoresNombres || [])[0] || ''];
        State.colaEspera = nuevaColaEspera;
        const ganador = perdedor.id === equipoA.id ? equipoB : equipoA;
        const nuevoRetador = { nombre: siguienteNombre, color: perdedor.color, jugadoresIds: [], jugadoresNombres: [siguienteNombre] };
        const nuevos = perdedor.id === equipoA.id ? [nuevoRetador, ganador] : [ganador, nuevoRetador];
        await reemplazarEquipos(nuevos);
        await db.collection('torneos').doc(State.torneoId).update({ colaEspera: nuevaColaEspera });
      }
      setRoute('gana_y_sigue');
      return;
    }

    if (State.torneo && State.torneo.modo === 'PAREJAS' && State.torneo.metodoSeleccion === 'AZAR') {
      const ultimoResultado = { equipoANombre: equipoA.nombre, equipoBNombre: equipoB.nombre, golesA, golesB };
      const proximoPartido = calcularProximoPartidoParejas(golesA, golesB, equipoA, equipoB, State.colaEsperaParejas);
      State.ultimoResultado = ultimoResultado;
      State.proximoPartido = proximoPartido;
      await db.collection('torneos').doc(State.torneoId).update({ ultimoResultado, proximoPartido });
      setRoute('post_match');
      return;
    }

    setRoute('ranking');
  } catch (e) {
    console.error(e);
    showToast('No se pudo guardar el resultado.');
  }
}

/**
 * Calcula (sin guardar en Firestore todavía) cómo quedaría el próximo
 * partido de Parejas por sorteo:
 * - Si hay empate: se repite el mismo cruce.
 * - Si gana una pareja: esa pareja sigue entera. A la que pierde:
 *     · si el próximo de la cola es una PAREJA completa, se reemplaza
 *       entera (la pareja que salió pasa completa al final de la cola).
 *     · si el próximo de la cola es un JUGADOR suelto, sale solo el
 *       integrante que lleva más tiempo jugando (el "veterano") y entra
 *       ese jugador suelto a hacer pareja con el que se queda.
 *     · si no hay nadie esperando, se repite la misma pareja.
 */
function calcularProximoPartidoParejas(golesA, golesB, equipoA, equipoB, colaActual) {
  if (golesA === golesB) {
    return { equipoA, equipoB, nuevaCola: colaActual, huboRotacion: false, empate: true };
  }

  const equipoPerdedor = golesA < golesB ? equipoA : equipoB;
  const equipoGanador = equipoPerdedor.id === equipoA.id ? equipoB : equipoA;
  let nuevaCola = [...colaActual];
  let nuevoEquipoPerdedor;

  if (nuevaCola.length === 0) {
    nuevoEquipoPerdedor = equipoPerdedor;
  } else {
    const challenger = nuevaCola[0];
    nuevaCola = nuevaCola.slice(1);

    if (challenger.tipo === 'equipo') {
      nuevaCola = [...nuevaCola, {
        tipo: 'equipo',
        jugadores: (equipoPerdedor.jugadoresIds || []).map((id, i) => ({ id, nombre: (equipoPerdedor.jugadoresNombres || [])[i] || '' }))
      }];
      nuevoEquipoPerdedor = {
        ...equipoPerdedor,
        jugadoresIds: challenger.jugadores.map(j => j.id),
        jugadoresNombres: challenger.jugadores.map(j => j.nombre)
      };
    } else {
      const veteranoId = (equipoPerdedor.jugadoresIds || [])[0] || '';
      const veteranoNombre = (equipoPerdedor.jugadoresNombres || [])[0] || '';
      const nuevoVeteranoId = (equipoPerdedor.jugadoresIds || [])[1] || '';
      const nuevoVeteranoNombre = (equipoPerdedor.jugadoresNombres || [])[1] || '';
      nuevaCola = [...nuevaCola, { tipo: 'jugador', jugador: { id: veteranoId, nombre: veteranoNombre } }];
      nuevoEquipoPerdedor = {
        ...equipoPerdedor,
        jugadoresIds: [nuevoVeteranoId, challenger.jugador.id].filter(Boolean),
        jugadoresNombres: [nuevoVeteranoNombre, challenger.jugador.nombre]
      };
    }
  }

  const nuevoA = equipoPerdedor.id === equipoA.id ? nuevoEquipoPerdedor : equipoGanador;
  const nuevoB = equipoPerdedor.id === equipoA.id ? equipoGanador : nuevoEquipoPerdedor;
  return { equipoA: nuevoA, equipoB: nuevoB, nuevaCola, huboRotacion: true, empate: false };
}

/** El usuario confirmó que quiere jugar el próximo partido: recién ahí lo escribimos en Firestore. */
async function confirmarSiguientePartido(destino) {
  const prox = State.proximoPartido;
  if (!prox) { setRoute('ranking'); return; }
  State.colaEsperaParejas = prox.nuevaCola;
  try {
    await reemplazarEquipos([prox.equipoA, prox.equipoB]);
    State.proximoPartido = null;
    State.ultimoResultado = null;
    await db.collection('torneos').doc(State.torneoId).update({
      colaEsperaParejas: prox.nuevaCola,
      proximoPartido: null,
      ultimoResultado: null
    });
    setRoute(destino || 'teams_ready');
  } catch (e) {
    console.error(e);
    showToast('No se pudo armar el próximo partido.');
  }
}

/**
 * Pide confirmación y cierra el torneo de la noche. A partir de acá el
 * torneo queda de solo lectura (no se pueden cargar más resultados) y la
 * próxima vez que se junten van a arrancar un torneo nuevo.
 */
function pedirFinalizarTorneo() {
  const seguro = window.confirm('¿Seguro que querés finalizar el torneo de esta noche?\n\nVas a ver el resumen final y no vas a poder cargar más resultados en este torneo.');
  if (seguro) finalizarTorneo();
}

async function finalizarTorneo() {
  try {
    await db.collection('torneos').doc(State.torneoId).update({
      estado: 'FINALIZADO',
      fechaFin: Date.now()
    });
    setRoute('resumen_noche');
  } catch (e) {
    console.error(e);
    showToast('No se pudo finalizar el torneo.');
  }
}

function inicioDeMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function inicioDeAnio() {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1).getTime();
}

/**
 * Trae TODOS los partidos jugados este mes/año, de TODOS los torneos (no
 * solo el actual). Usa una "collection group query": busca la subcolección
 * "partidos" a través de todos los torneos a la vez. Requiere: (1) la regla
 * de Firestore con comodín {path=**} sobre /partidos, y (2) un índice de
 * grupo de colecciones por "timestamp" (Firestore lo pide con un link
 * directo la primera vez que falta).
 */
async function cargarPartidosDelMes() {
  State.cargandoMes = true;
  render();
  try {
    const snap = await db.collectionGroup('partidos').where('timestamp', '>=', inicioDeMes()).get();
    State.partidosMes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    showToast('No se pudo cargar el ranking del mes. Revisá las reglas/índice de Firestore (ver README).');
  } finally {
    State.cargandoMes = false;
    render();
  }
}

async function cargarPartidosDelAnio() {
  State.cargandoAnio = true;
  render();
  try {
    const snap = await db.collectionGroup('partidos').where('timestamp', '>=', inicioDeAnio()).get();
    State.partidosAnio = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    showToast('No se pudo cargar el ranking del año. Revisá las reglas/índice de Firestore (ver README).');
  } finally {
    State.cargandoAnio = false;
    render();
  }
}

function cambiarTabRanking(tab) {
  State.rankingTab = tab;
  render();
  if (tab === 'mes') cargarPartidosDelMes();
  if (tab === 'anio') cargarPartidosDelAnio();
}

/**
 * A dónde te lleva el botón "Torneos" de la barra inferior: si hay un
 * torneo en curso, te lleva directo a la pantalla donde quedó (el partido
 * pendiente de confirmar, el "gana y sigue", o "equipos listos"). Si el
 * torneo ya terminó o todavía no arrancó a jugarse, muestra el historial.
 */
function irATorneos() {
  const t = State.torneo;
  if (t && t.estado === 'EN_CURSO') {
    if (t.proximoPartido) { setRoute('post_match'); return; }
    if (t.formato === 'GANA_Y_SIGUE') { setRoute('gana_y_sigue'); return; }
    setRoute('teams_ready');
    return;
  }
  if (t && t.estado === 'ARMANDO') {
    setRoute('add_players');
    return;
  }
  setRoute('historial');
}

function submitNuevoJugador() {
  const input = document.getElementById('nuevo-jugador-input');
  if (!input) return;
  const val = input.value;
  if (val && val.trim()) {
    agregarJugador(val);
    input.value = '';
    input.focus();
  }
}

// ---------- Arranque ----------

// Red de seguridad: si algo falla en cualquier parte de la app (Firebase mal
// configurado, sin conexión, reglas de Firestore no publicadas, etc.), en vez
// de que el botón "no haga nada" en silencio, mostramos siempre un aviso.
window.addEventListener('error', (e) => {
  console.error('Error en la app:', e.error || e.message);
  showToast('Ocurrió un error. Abrí la consola (F12) para ver el detalle, o revisá js/firebase-config.js.');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Error en la app:', e.reason);
  showToast('Ocurrió un error. Abrí la consola (F12) para ver el detalle, o revisá js/firebase-config.js.');
});

document.addEventListener('DOMContentLoaded', () => {
  if (State.torneoId) {
    subscribeTorneo(State.torneoId);
  }
  render();
});
