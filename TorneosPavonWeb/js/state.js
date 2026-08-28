// Estado global simple (sin frameworks, para que ande directo en cualquier navegador).

const State = {
  route: 'home',
  torneoId: localStorage.getItem('pavon_torneoId') || null,
  torneo: null,
  jugadores: [],
  equipos: [],
  partidos: [],
  colaEspera: [],
  colaEsperaParejas: [],
  proximoPartido: null,
  ultimoResultado: null,
  manualAssign: {},
  unsub: [],
  _rutaRestaurada: false,
  rankingTab: 'noche',
  partidosMes: [],
  partidosAnio: [],
  cargandoMes: false,
  cargandoAnio: false
};

function setRoute(route) {
  State.route = route;
  render();
}

function goHomeNav(key) {
  if (key === 'inicio') setRoute('home');
  if (key === 'torneos') irATorneos();
  if (key === 'ranking') setRoute('ranking');
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function clearListeners() {
  State.unsub.forEach(fn => { try { fn(); } catch (e) {} });
  State.unsub = [];
}

function subscribeTorneo(id) {
  clearListeners();
  State.torneoId = id;
  State._rutaRestaurada = false;
  localStorage.setItem('pavon_torneoId', id);

  State.unsub.push(
    db.collection('torneos').doc(id).onSnapshot(snap => {
      State.torneo = snap.exists ? { id: snap.id, ...snap.data() } : null;

      // La cola de espera y el "próximo partido pendiente de confirmar" ahora
      // viven en Firestore (adentro del documento del torneo), no solo en la
      // memoria del navegador. Así sobreviven a un F5 / recarga de página,
      // y si otro celular mira el torneo ve exactamente lo mismo.
      State.colaEsperaParejas = (State.torneo && State.torneo.colaEsperaParejas) || [];
      State.colaEspera = (State.torneo && State.torneo.colaEspera) || [];
      State.proximoPartido = (State.torneo && State.torneo.proximoPartido) || null;
      State.ultimoResultado = (State.torneo && State.torneo.ultimoResultado) || null;

      // La primera vez que llega el documento (recién abierta la página, o
      // recién recargada) reubicamos al usuario en la pantalla que le
      // corresponde según en qué estaba el torneo, en vez de mandarlo
      // siempre al menú principal.
      if (!State._rutaRestaurada && State.torneo) {
        State._rutaRestaurada = true;
        restaurarRutaSegunEstado();
      }

      render();
    })
  );

  State.unsub.push(
    db.collection('torneos').doc(id).collection('jugadores').orderBy('orden').onSnapshot(snap => {
      State.jugadores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    })
  );

  State.unsub.push(
    db.collection('torneos').doc(id).collection('equipos').onSnapshot(snap => {
      // Orden estable: "ROJO" siempre en la posición 0 (Equipo A), "AZUL" en
      // la 1 (Equipo B), sin importar el orden en que Firestore devuelva
      // los documentos.
      State.equipos = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.color || '').localeCompare(a.color || ''));
      render();
    })
  );

  State.unsub.push(
    db.collection('torneos').doc(id).collection('partidos').orderBy('timestamp', 'desc').onSnapshot(snap => {
      State.partidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    })
  );
}

function jugadoresConfirmados() {
  return State.jugadores.filter(j => j.presente);
}

/**
 * Al recargar la página (o abrir el link de nuevo), en vez de mandar
 * siempre al menú principal, reubicamos al usuario en la pantalla que
 * corresponde según el estado real del torneo guardado en Firestore.
 */
function restaurarRutaSegunEstado() {
  const t = State.torneo;
  if (!t) return;

  if (t.estado === 'FINALIZADO') {
    State.route = 'resumen_noche';
    return;
  }
  if (t.estado !== 'EN_CURSO') {
    // Todavía se estaba armando el torneo (cargando jugadores, eligiendo
    // método de equipos, etc). No podemos saber el paso exacto, así que lo
    // dejamos en el menú principal para que retome desde "Iniciar torneo".
    return;
  }
  if (t.proximoPartido) {
    State.route = 'post_match';
    return;
  }
  if (t.formato === 'GANA_Y_SIGUE') {
    State.route = 'gana_y_sigue';
    return;
  }
  State.route = 'teams_ready';
}

/**
 * Calcula el ranking a partir de una lista de partidos, agrupando por
 * JUGADOR (no por "Equipo A/B"). Esto es necesario porque en Parejas por
 * sorteo los equipos rotan integrantes durante la noche — lo único que
 * identifica de verdad a una persona es su nombre, guardado en cada partido
 * dentro de jugadoresA/jugadoresB (quiénes jugaban en ese equipo en ESE
 * partido puntual). Sirve tanto para el ranking de la noche como para el
 * de mes/año, pasándole distintas listas de partidos.
 */
function calcularRankingDesdePartidos(partidos) {
  const mapa = {};
  function item(nombre) {
    if (!mapa[nombre]) mapa[nombre] = { nombre, puntos: 0, victorias: 0, empates: 0, derrotas: 0, partidosJugados: 0, destacados: 0 };
    return mapa[nombre];
  }

  (partidos || []).filter(p => p.finalizado).forEach(p => {
    // jugadoresA/jugadoresB son el detalle real de quién jugaba en cada
    // equipo en ese partido puntual. Si un partido viejo no lo tiene
    // (guardado antes de este cambio), usamos el nombre del equipo como
    // respaldo para no perder ese dato de la estadística.
    const jugadoresA = (p.jugadoresA && p.jugadoresA.length) ? p.jugadoresA : [p.equipoANombre].filter(Boolean);
    const jugadoresB = (p.jugadoresB && p.jugadoresB.length) ? p.jugadoresB : [p.equipoBNombre].filter(Boolean);

    let resA, resB;
    if (p.golesA > p.golesB) { resA = 'victoria'; resB = 'derrota'; }
    else if (p.golesB > p.golesA) { resA = 'derrota'; resB = 'victoria'; }
    else { resA = 'empate'; resB = 'empate'; }

    function aplicar(nombre, resultado) {
      if (!nombre) return;
      const it = item(nombre);
      it.partidosJugados++;
      if (resultado === 'victoria') { it.puntos += 3; it.victorias++; }
      else if (resultado === 'empate') { it.puntos += 1; it.empates++; }
      else { it.derrotas++; }
    }
    jugadoresA.forEach(nombre => aplicar(nombre, resA));
    jugadoresB.forEach(nombre => aplicar(nombre, resB));

    if (p.jugadorDestacado) {
      item(p.jugadorDestacado).destacados++;
    }
  });

  return Object.values(mapa).sort((a, b) => b.puntos - a.puntos);
}
