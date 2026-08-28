// Todo el render de pantallas (sin frameworks). Cada función devuelve un
// string de HTML que se inyecta en #app. La interacción usa onclick
// apuntando a funciones globales definidas en app.js / state.js.

function render() {
  const app = document.getElementById('app');
  let html = '';

  switch (State.route) {
    case 'home': html = screenHome(); break;
    case 'mode_select': html = screenModeSelect(); break;
    case 'add_players': html = screenAddPlayers(); break;
    case 'confirm_players': html = screenConfirmPlayers(); break;
    case 'team_select_method': html = screenTeamSelectMethod(); break;
    case 'draw_teams': html = screenDrawTeams(); break;
    case 'manual_teams': html = screenManualTeams(); break;
    case 'teams_ready': html = screenTeamsReady(); break;
    case 'post_match': html = screenPostMatch(); break;
    case 'enter_result': html = screenEnterResult(); break;
    case 'gana_y_sigue': html = screenGanaYSigue(); break;
    case 'ranking': html = screenRanking(); break;
    case 'historial': html = screenHistorial(); break;
    case 'resumen_noche': html = screenResumenNoche(); break;
    default: html = screenHome();
  }

  app.innerHTML = firebaseConfigWarningBanner() + html;
}

// ---------- Piezas compartidas ----------

/**
 * Si js/firebase-config.js todavía tiene los valores de ejemplo sin
 * completar, mostramos un cartel rojo bien visible arriba de todo, para que
 * quede clarísimo por qué los botones no hacen nada (en vez de que parezca
 * que la app está rota).
 */
function firebaseConfigWarningBanner() {
  try {
    if (typeof firebaseConfig === 'undefined') return '';
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'REEMPLAZAR' && !firebaseConfig.apiKey.includes('REEMPLAZAR')) {
      return '';
    }
  } catch (e) {
    return '';
  }
  return `
    <div style="background:#D81E1E; color:#fff; padding:12px 16px; font-size:12.5px; font-weight:700; text-align:center; line-height:1.5;">
      ⚠️ Firebase no está configurado todavía.<br/>
      Completá <code style="background:rgba(0,0,0,0.25); padding:1px 5px; border-radius:4px;">js/firebase-config.js</code> con los datos de tu proyecto (ver README, Paso 1 y 2).
    </div>
  `;
}

function headerSvg(subtitle, backTarget) {
  return `
  <div class="header">
    ${backTarget ? `<button class="back-btn" style="position:absolute; top:14px; left:14px; z-index:2; background:rgba(0,0,0,0.45); border-radius:8px; padding:2px 12px 6px 12px; color:#fff;" onclick="setRoute('${backTarget}')">←</button>` : ''}
    <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice">
      <defs>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#D81E1E" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#D81E1E" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="150" fill="#0D0D0D"/>
      <g opacity="0.10" stroke="#D81E1E" stroke-width="3">
        <line x1="60" y1="0" x2="10" y2="150"/>
        <line x1="120" y1="0" x2="70" y2="150"/>
        <line x1="180" y1="0" x2="130" y2="150"/>
        <line x1="240" y1="0" x2="190" y2="150"/>
        <line x1="300" y1="0" x2="250" y2="150"/>
      </g>

      <!-- resplandor rojo detrás del joystick -->
      <ellipse cx="260" cy="82" rx="130" ry="55" fill="url(#glowGrad)"/>

      <!-- ===== Joystick estilo consola, genérico, rojo y negro ===== -->
      <g>
        <!-- gatillos L2/R2 -->
        <rect x="150" y="42" width="34" height="12" rx="6" fill="#1C1C1C" stroke="#3A3A3A" stroke-width="1"/>
        <rect x="336" y="42" width="34" height="12" rx="6" fill="#1C1C1C" stroke="#3A3A3A" stroke-width="1"/>
        <!-- gatillos L1/R1 -->
        <rect x="152" y="55" width="30" height="8" rx="4" fill="#141414"/>
        <rect x="338" y="55" width="30" height="8" rx="4" fill="#141414"/>

        <!-- empuñaduras (grips) -->
        <ellipse cx="182" cy="115" rx="34" ry="42" fill="#141414"/>
        <ellipse cx="338" cy="115" rx="34" ry="42" fill="#141414"/>

        <!-- cuerpo central -->
        <rect x="170" y="58" width="180" height="58" rx="26" fill="#161616" stroke="#2A2A2A" stroke-width="1.5"/>

        <!-- barra de luz roja -->
        <rect x="245" y="52" width="30" height="7" rx="3.5" fill="#D81E1E"/>

        <!-- touchpad -->
        <rect x="228" y="70" width="64" height="24" rx="7" fill="#0D0D0D" stroke="#D81E1E" stroke-width="1.5" opacity="0.9"/>

        <!-- cruceta (D-pad) -->
        <rect x="196" y="66" width="7" height="20" rx="2" fill="#4A4A4A"/>
        <rect x="189" y="73" width="21" height="7" rx="2" fill="#4A4A4A"/>

        <!-- botones de acción (genéricos, sin símbolos de marca) -->
        <circle cx="318" cy="66" r="4.5" fill="#D81E1E"/>
        <circle cx="329" cy="77" r="4.5" fill="#EDEDED"/>
        <circle cx="318" cy="88" r="4.5" fill="#EDEDED"/>
        <circle cx="307" cy="77" r="4.5" fill="#EDEDED"/>

        <!-- joystick analógico izquierdo -->
        <circle cx="205" cy="100" r="16" fill="#0D0D0D" stroke="#D81E1E" stroke-width="3"/>
        <circle cx="205" cy="100" r="7" fill="#3A3A3A"/>

        <!-- joystick analógico derecho -->
        <circle cx="312" cy="118" r="17" fill="#0A0A0A" stroke="#D81E1E" stroke-width="3"/>
        <circle cx="312" cy="118" r="7" fill="#3A3A3A"/>
      </g>
    </svg>
    <div class="title-block">
      <p class="eyebrow">TORNEOS</p>
      <p class="brand">QUINCHO PAVÓN</p>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    </div>
  </div>`;
}

function bottomNav(current) {
  const items = [
    ['inicio', 'Inicio', '🏠'],
    ['torneos', 'Torneos', '🏆'],
    ['ranking', 'Ranking', '📊']
  ];
  return `
  <div class="bottom-nav">
    ${items.map(([key, label, icon]) => `
      <button class="${key === current ? 'active' : ''}" onclick="goHomeNav('${key}')">
        <span class="nav-icon">${icon}</span>${label}
      </button>
    `).join('')}
  </div>`;
}

function continuarTorneoBanner() {
  const t = State.torneo;
  if (!t || t.estado !== 'EN_CURSO') return '';
  return `<button class="btn btn-primary" onclick="irATorneos()" style="margin-bottom:16px;">◀ VOLVER AL PARTIDO</button>`;
}

function screenTitle(title, subtitle) {
  return `
    <h1 class="screen-title">${title}</h1>
    ${subtitle ? `<p class="screen-subtitle">${subtitle}</p>` : ''}
  `;
}

// ---------- 1. Menú principal ----------

function screenHome() {
  const t = State.torneo;
  const enCurso = t && t.estado === 'EN_CURSO';
  const armando = t && t.estado === 'ARMANDO';
  return `
    ${headerSvg()}
    <div class="content">
      <h1 class="screen-title">¡Bienvenido al Quincho!</h1>
      <p class="screen-subtitle">Organizá tus torneos, armá equipos y jugá las mejores partidas.</p>
      ${enCurso ? `<button class="btn btn-primary" onclick="irATorneos()">▶ CONTINUAR TORNEO EN CURSO</button><div style="height:10px"></div>` : ''}
      ${armando ? `<button class="btn btn-primary" onclick="setRoute('add_players')">▶ SEGUIR ARMANDO EL TORNEO</button><div style="height:10px"></div>` : ''}
      <button class="btn ${(enCurso || armando) ? 'btn-secondary' : 'btn-primary'}" onclick="setRoute('mode_select')">INICIAR TORNEO</button>
      <div style="height:14px"></div>
      <div class="card clickable" onclick="setRoute('ranking')">🏆&nbsp;&nbsp;Ranking de la noche</div>
      <div class="card clickable" onclick="setRoute('historial')">🕓&nbsp;&nbsp;Historial</div>
    </div>
    ${bottomNav('inicio')}
  `;
}

// ---------- 2. Modo de juego ----------

function screenModeSelect() {
  return `
    ${headerSvg(null, 'home')}
    <div class="content">
      ${screenTitle('¿Qué querés jugar hoy?')}
      <div class="mode-card" onclick="crearTorneo('PAREJAS')">
        <div class="icon-box red">👥</div>
        <div>
          <p class="title">PAREJAS (2 vs 2)</p>
          <p class="desc">Armamos parejas al azar o a mano y jugás.</p>
        </div>
      </div>
      <div class="mode-card" onclick="crearTorneo('INDIVIDUAL')">
        <div class="icon-box red">🙋</div>
        <div>
          <p class="title">INDIVIDUAL</p>
          <p class="desc">Competí 1 vs 1 contra todos, gana y sigue.</p>
        </div>
      </div>
    </div>
    ${bottomNav('inicio')}
  `;
}

// ---------- 3. Agregar jugadores ----------

function screenAddPlayers() {
  const jugadores = State.jugadores;
  return `
    ${headerSvg(null, 'home')}
    <div class="content">
      ${screenTitle('Agregá los jugadores', 'Ingresá los nombres de los jugadores presentes.')}
      <div id="players-list">
        ${jugadores.map(j => `
          <div class="player-row">
            <span class="name">${escapeHtml(j.nombre)}</span>
            <button class="icon-btn" onclick="quitarJugador('${j.id}')">✕</button>
          </div>
        `).join('') || '<p class="empty-hint">Todavía no agregaste jugadores.</p>'}
      </div>
      <div class="input-row" style="margin-top:10px;">
        <input type="text" id="nuevo-jugador-input" placeholder="Nombre del jugador" onkeydown="if(event.key==='Enter'){submitNuevoJugador();}" />
        <button class="add-btn" onclick="submitNuevoJugador()">+</button>
      </div>
      <div style="height:20px"></div>
      <button class="btn btn-primary" ${jugadores.length < 2 ? 'disabled' : ''} onclick="setRoute('confirm_players')">
        CONTINUAR (${jugadores.length})
      </button>
    </div>
    ${bottomNav('torneos')}
  `;
}

// ---------- 4. Confirmar jugadores ----------

function screenConfirmPlayers() {
  const jugadores = State.jugadores;
  const confirmados = jugadores.filter(j => j.presente).length;
  return `
    ${headerSvg(null, 'add_players')}
    <div class="content">
      ${screenTitle('Jugadores confirmados', 'Revisá los jugadores antes de armar los equipos.')}
      ${jugadores.map(j => `
        <div class="player-row">
          <span class="name">${escapeHtml(j.nombre)}</span>
          <div class="checkbox ${j.presente ? 'checked' : ''}" onclick='togglePresenteById("${j.id}")'>${j.presente ? '✓' : ''}</div>
        </div>
      `).join('')}
      <div style="height:20px"></div>
      <div class="btn-row">
        <button class="btn btn-secondary" onclick="setRoute('add_players')">VOLVER</button>
        <button class="btn btn-primary" ${confirmados < 2 ? 'disabled' : ''} onclick="continuarDesdeConfirmar()">
          CONTINUAR (${confirmados})
        </button>
      </div>
    </div>
    ${bottomNav('torneos')}
  `;
}

// ---------- Pantalla nueva: método de selección ----------

function screenTeamSelectMethod() {
  return `
    ${headerSvg(null, 'confirm_players')}
    <div class="content">
      ${screenTitle('¿Cómo armamos los equipos?', 'Elegí si querés que sorteemos o armarlos vos mismo.')}
      <div class="method-card" onclick="elegirAzar()">
        <div class="icon-box red">🎲</div>
        <div>
          <p class="title">SORTEAR AL AZAR</p>
          <p class="desc">Pavón arma los equipos de forma aleatoria y pareja.</p>
        </div>
      </div>
      <div class="method-card" onclick="elegirManual()">
        <div class="icon-box blue">👆</div>
        <div>
          <p class="title">ELEGIR MANUALMENTE</p>
          <p class="desc">Armá vos los equipos, jugador por jugador.</p>
        </div>
      </div>
    </div>
    ${bottomNav('torneos')}
  `;
}

// ---------- 5. Sorteo de parejas ----------

function screenDrawTeams() {
  const equipos = State.equipos;
  if (equipos.length < 2) {
    return `
      ${headerSvg()}
      <div class="content">
        ${screenTitle('Parejas sorteadas', '¡Que empiece la diversión!')}
        <p class="empty-hint">Sorteando...</p>
      </div>
    `;
  }
  return `
    ${headerSvg(null, 'team_select_method')}
    <div class="content">
      ${screenTitle('Parejas sorteadas', '¡Que empiece la diversión!')}
      ${teamBadge(equipos[0], 'red')}
      <div class="vs-label">VS</div>
      ${teamBadge(equipos[1], 'blue')}
      ${colaEsperaHtml()}
      <div style="height:20px"></div>
      <button class="btn btn-primary" onclick="setRoute('teams_ready')">COMENZAR PARTIDO</button>
    </div>
    ${bottomNav('torneos')}
  `;
}

function teamBadge(equipo, color) {
  return `
    <div class="team-badge ${color}">
      <span class="chip">${escapeHtml(equipo.nombre)}</span>
      ${(equipo.jugadoresNombres || []).map(n => `<p class="player-name">${escapeHtml(n)}</p>`).join('')}
    </div>
  `;
}

// ---------- Pantalla nueva: selección manual ----------

function screenManualTeams() {
  const jugadores = jugadoresConfirmados();
  const rojoCount = jugadores.filter(j => State.manualAssign[j.id] === 'rojo').length;
  const azulCount = jugadores.filter(j => State.manualAssign[j.id] === 'azul').length;

  return `
    ${headerSvg(null, 'team_select_method')}
    <div class="content">
      ${screenTitle('Armá los equipos', 'Tocá A o B para asignar a cada jugador.')}
      <div class="row" style="margin-bottom:10px;">
        <span style="color:var(--red); font-weight:700; font-size:13px;">A: ${rojoCount}</span>
        <span style="color:var(--blue); font-weight:700; font-size:13px;">B: ${azulCount}</span>
      </div>
      ${jugadores.map(j => {
        const estado = State.manualAssign[j.id];
        const rowClass = estado === 'rojo' ? 'rojo' : (estado === 'azul' ? 'azul' : '');
        return `
        <div class="assign-row ${rowClass}">
          <span class="name">${escapeHtml(j.nombre)}</span>
          <div>
            <button class="chip-btn ${estado === 'rojo' ? 'active rojo' : ''}" onclick="setManualAssign('${j.id}','rojo')">A</button>
            <button class="chip-btn ${estado === 'azul' ? 'active azul' : ''}" onclick="setManualAssign('${j.id}','azul')">B</button>
          </div>
        </div>`;
      }).join('')}
      <div style="height:20px"></div>
      <button class="btn btn-primary" ${(rojoCount === 0 || azulCount === 0) ? 'disabled' : ''} onclick="confirmarEquiposManualDesdeUI()">
        CONFIRMAR EQUIPOS
      </button>
    </div>
    ${bottomNav('torneos')}
  `;
}

// ---------- 6. Equipos listos ----------

function screenTeamsReady() {
  const equipos = State.equipos;
  const numeroPartido = (State.partidos ? State.partidos.length : 0) + 1;
  return `
    ${headerSvg()}
    <div class="content">
      ${screenTitle('Equipos listos', `Partido N° ${numeroPartido} · Esperando resultado...`)}
      ${equipos.length >= 2 ? `
        <div class="teams-row">
          ${teamBadge(equipos[0], 'red')}
          ${teamBadge(equipos[1], 'blue')}
        </div>
      ` : ''}
      ${colaEsperaHtml()}
      <button class="btn btn-primary" onclick="setRoute('enter_result')">INGRESAR RESULTADO</button>
    </div>
    ${bottomNav('torneos')}
  `;
}

function colaEsperaHtml() {
  const cola = State.colaEsperaParejas || [];
  if (cola.length === 0) return '';
  const textos = cola.map(item => {
    if (item.tipo === 'equipo') {
      return 'Pareja: ' + item.jugadores.map(j => j.nombre).join(' y ');
    }
    return item.jugador ? item.jugador.nombre : '';
  }).filter(Boolean);
  if (textos.length === 0) return '';
  return `<p style="color:var(--text-gray); font-size:12px; margin-bottom:14px;">Esperando para entrar: ${escapeHtml(textos.join(' · '))}</p>`;
}

// ---------- Pantalla nueva: confirmar el próximo partido ----------

function screenPostMatch() {
  const res = State.ultimoResultado;
  const prox = State.proximoPartido;
  const numeroPartido = State.partidos ? State.partidos.length : 0;

  if (!res || !prox) {
    setTimeout(() => setRoute('teams_ready'), 0);
    return `${headerSvg()}<div class="content"><p class="empty-hint">Volviendo...</p></div>`;
  }

  const ganadorNombre = res.golesA === res.golesB
    ? 'Empate'
    : (res.golesA > res.golesB ? res.equipoANombre : res.equipoBNombre);

  return `
    ${headerSvg(null, 'teams_ready')}
    <div class="content">
      ${screenTitle('¡Partido guardado!', `Partido N° ${numeroPartido} de la noche`)}
      <div class="card" style="text-align:center; margin-bottom:18px;">
        <p style="color:var(--text-gray); font-size:12px; margin:0 0 6px 0;">${escapeHtml(res.equipoANombre)} vs ${escapeHtml(res.equipoBNombre)}</p>
        <p style="font-size:28px; font-weight:900; margin:0;">${res.golesA} - ${res.golesB}</p>
        <p style="color:var(--gold); font-size:13px; font-weight:700; margin:8px 0 0 0;">${res.golesA === res.golesB ? 'Empataron' : '🏆 Ganó ' + escapeHtml(ganadorNombre)}</p>
      </div>

      <p class="screen-subtitle" style="margin-bottom:10px;">${prox.empate ? 'Se repite el mismo cruce:' : '¿Jugamos el próximo partido?'}</p>
      <div class="teams-row">
        ${teamBadge(prox.equipoA, 'red')}
        ${teamBadge(prox.equipoB, 'blue')}
      </div>
      ${colaEsperaPreviewHtml(prox.nuevaCola)}

      <button class="btn btn-primary" onclick="confirmarSiguientePartido('teams_ready')">CONFIRMAR SIGUIENTE PARTIDO</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="confirmarSiguientePartido('ranking')">VER RANKING POR AHORA</button>
    </div>
    ${bottomNav('torneos')}
  `;
}

function colaEsperaPreviewHtml(cola) {
  if (!cola || cola.length === 0) return '';
  const textos = cola.map(item => {
    if (item.tipo === 'equipo') return 'Pareja: ' + item.jugadores.map(j => j.nombre).join(' y ');
    return item.jugador ? item.jugador.nombre : '';
  }).filter(Boolean);
  if (textos.length === 0) return '';
  return `<p style="color:var(--text-gray); font-size:12px; margin: 10px 0 16px 0;">Esperando para entrar: ${escapeHtml(textos.join(' · '))}</p>`;
}

// ---------- 7. Ingresar resultado ----------

function screenEnterResult() {
  const equipos = State.equipos;
  const nombreA = equipos[0] ? equipos[0].nombre : 'Equipo A';
  const nombreB = equipos[1] ? equipos[1].nombre : 'Equipo B';
  const jugadores = [...(equipos[0] ? equipos[0].jugadoresNombres || [] : []), ...(equipos[1] ? equipos[1].jugadoresNombres || [] : [])];
  const volverA = (State.torneo && State.torneo.formato === 'GANA_Y_SIGUE') ? 'gana_y_sigue' : 'teams_ready';

  return `
    ${headerSvg(null, volverA)}
    <div class="content">
      ${screenTitle('Ingresá el resultado', '¿Quién ganó esta partida?')}
      <div class="score-row">
        <div class="score-box">
          <p class="team-label red">${escapeHtml(nombreA)}</p>
          <p class="value" id="score-a">${tempGolesA}</p>
          <div class="stepper">
            <button onclick="stepScore('a',-1)">-</button>
            <button onclick="stepScore('a',1)">+</button>
          </div>
        </div>
        <span class="vs-label" style="padding:0;">VS</span>
        <div class="score-box">
          <p class="team-label blue">${escapeHtml(nombreB)}</p>
          <p class="value" id="score-b">${tempGolesB}</p>
          <div class="stepper">
            <button onclick="stepScore('b',-1)">-</button>
            <button onclick="stepScore('b',1)">+</button>
          </div>
        </div>
      </div>
      <p style="color:var(--text-gray); font-size:13px; margin-bottom:8px;">Jugador destacado (opcional)</p>
      <select id="destacado-select">
        <option value="">Elegí un jugador</option>
        ${jugadores.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')}
      </select>
      <div style="height:20px"></div>
      <button class="btn btn-primary" onclick="submitResultado()">GUARDAR RESULTADO</button>
    </div>
    ${bottomNav('torneos')}
  `;
}

// ---------- 8. Gana y sigue ----------

function screenGanaYSigue() {
  const equipos = State.equipos;
  const enEspera = State.colaEspera[0] || '—';
  return `
    ${headerSvg()}
    <div class="content">
      ${screenTitle('Gana y sigue', 'Sistema dinámico')}
      ${equipos.length >= 2 ? `
        <div class="teams-row">
          ${teamBadge(equipos[0], 'red')}
          ${teamBadge(equipos[1], 'blue')}
        </div>
      ` : ''}
      <p style="color:var(--text-gray); font-size:12px;">El que pierde sale y entra el jugador que está afuera.</p>
      <div class="card" style="margin-top:8px;">
        <p style="color:var(--text-gray); font-size:12px; margin:0 0 4px 0;">Jugador en espera:</p>
        <p style="font-weight:700; font-size:16px; margin:0;">${escapeHtml(enEspera)}</p>
      </div>
      <div style="height:16px"></div>
      <button class="btn btn-primary" onclick="setRoute('enter_result')">SIGUIENTE PARTIDA</button>
    </div>
    ${bottomNav('torneos')}
  `;
}

// ---------- 10. Ranking (Noche / Mes / Año) ----------

function screenRanking() {
  const tab = State.rankingTab || 'noche';
  let partidosScope, cargando, subtitulo, tituloPerdedor;

  if (tab === 'mes') {
    partidosScope = State.partidosMes;
    cargando = State.cargandoMes;
    subtitulo = 'Acumulado de todos los torneos de este mes';
    tituloPerdedor = 'Perdedor del mes';
  } else if (tab === 'anio') {
    partidosScope = State.partidosAnio;
    cargando = State.cargandoAnio;
    subtitulo = 'Acumulado de todos los torneos de este año';
    tituloPerdedor = 'Perdedor del año';
  } else {
    partidosScope = State.partidos;
    cargando = false;
    subtitulo = '¡Los más ganadores!';
    tituloPerdedor = 'Perdedor de la noche';
  }

  const ranking = calcularRankingDesdePartidos(partidosScope);
  const campeon = ranking[0] || null;
  const perdedor = ranking.length > 1 ? ranking[ranking.length - 1] : null;
  const destacadoCandidatos = ranking.filter(r => r.destacados > 0).sort((a, b) => b.destacados - a.destacados);
  const masDestacado = destacadoCandidatos[0] || null;
  const enCurso = State.torneo && State.torneo.estado === 'EN_CURSO';

  return `
    ${headerSvg()}
    <div class="content">
      ${screenTitle('Ranking', subtitulo)}
      <div class="pill-tabs">
        <button class="${tab === 'noche' ? 'active' : ''}" onclick="cambiarTabRanking('noche')">Noche</button>
        <button class="${tab === 'mes' ? 'active' : ''}" onclick="cambiarTabRanking('mes')">Mes</button>
        <button class="${tab === 'anio' ? 'active' : ''}" onclick="cambiarTabRanking('anio')">Año</button>
      </div>

      ${tab === 'noche' && enCurso ? `
        ${continuarTorneoBanner()}
        <button class="btn btn-secondary" onclick="pedirFinalizarTorneo()" style="margin-bottom:16px;">🏁 FINALIZAR TORNEO</button>
      ` : ''}

      ${cargando ? '<p class="empty-hint">Cargando...</p>' : (
        ranking.length === 0 ? `<p class="empty-hint">Todavía no hay partidos ${tab === 'noche' ? 'esta noche' : (tab === 'mes' ? 'este mes' : 'este año')}.</p>` : `
          ${campeon ? highlightCard('🏆', tab === 'noche' ? 'Campeón de la noche' : (tab === 'mes' ? 'Campeón del mes' : 'Campeón del año'), campeon.nombre, `${campeon.puntos} pts`) : ''}
          ${masDestacado ? highlightCard('⭐', 'Más destacado', masDestacado.nombre, `${masDestacado.destacados} veces`) : ''}
          ${perdedor ? highlightCard('💀', tituloPerdedor, perdedor.nombre, `${perdedor.derrotas} derrotas`) : ''}
          <div style="height:6px"></div>
          ${ranking.map((item, i) => `
            <div class="ranking-row">
              <div class="medal" style="background:${medalBg(i)}; color:${medalColor(i)}">${i + 1}</div>
              <div class="info">
                <p class="name">${escapeHtml(item.nombre)}</p>
                <p class="stats">${item.victorias}V · ${item.empates}E · ${item.derrotas}D</p>
              </div>
              <span class="points">${item.puntos} pts</span>
            </div>
          `).join('')}
        `
      )}
    </div>
    ${bottomNav('ranking')}
  `;
}

function highlightCard(emoji, label, nombre, detalle) {
  return `
    <div class="card" style="display:flex; align-items:center; gap:12px;">
      <div style="font-size:26px; flex-shrink:0;">${emoji}</div>
      <div style="flex:1; min-width:0;">
        <p style="color:var(--text-gray); font-size:11px; margin:0;">${label}</p>
        <p style="font-weight:800; font-size:15px; margin:2px 0 0 0; word-break:break-word;">${escapeHtml(nombre)}</p>
      </div>
      <div style="color:var(--red); font-weight:700; font-size:12px; flex-shrink:0; text-align:right;">${detalle}</div>
    </div>
  `;
}

function medalBg(i) {
  if (i === 0) return 'rgba(255,199,44,0.2)';
  if (i === 1) return 'rgba(192,192,192,0.2)';
  if (i === 2) return 'rgba(205,127,50,0.2)';
  return 'rgba(110,110,118,0.2)';
}
function medalColor(i) {
  if (i === 0) return '#FFC72C';
  if (i === 1) return '#C0C0C0';
  if (i === 2) return '#CD7F32';
  return '#6E6E76';
}

// ---------- Pantalla nueva: resumen al finalizar el torneo ----------

function screenResumenNoche() {
  const ranking = calcularRankingDesdePartidos(State.partidos);
  const campeon = ranking[0] || null;
  const perdedor = ranking.length > 1 ? ranking[ranking.length - 1] : null;
  const destacadoCandidatos = ranking.filter(r => r.destacados > 0).sort((a, b) => b.destacados - a.destacados);
  const masDestacado = destacadoCandidatos[0] || null;
  const totalPartidos = State.partidos.length;

  return `
    ${headerSvg()}
    <div class="content">
      ${screenTitle('¡Torneo finalizado!', `${totalPartidos} partido${totalPartidos === 1 ? '' : 's'} jugado${totalPartidos === 1 ? '' : 's'} esta noche`)}
      ${campeon ? highlightCard('🏆', 'Campeón de la noche', campeon.nombre, `${campeon.puntos} pts`) : ''}
      ${masDestacado ? highlightCard('⭐', 'Más destacado', masDestacado.nombre, `${masDestacado.destacados} veces`) : ''}
      ${perdedor ? highlightCard('💀', 'Perdedor de la noche', perdedor.nombre, `${perdedor.derrotas} derrotas`) : ''}
      <div style="height:16px"></div>
      <button class="btn btn-primary" onclick="setRoute('ranking')">VER RANKING COMPLETO</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="setRoute('home')">VOLVER AL INICIO</button>
    </div>
    ${bottomNav('inicio')}
  `;
}

// ---------- 11. Historial ----------

function screenHistorial() {
  const partidos = State.partidos;
  return `
    ${headerSvg()}
    <div class="content">
      ${screenTitle('Historial de partidos', 'Revisá todas las partidas de la noche.')}
      ${continuarTorneoBanner()}
      ${partidos.length === 0 ? '<p class="empty-hint">Todavía no hay partidos jugados.</p>' : partidos.map(p => `
        <div class="history-row">
          <div class="teams">
            <div>${escapeHtml(p.equipoANombre)} vs ${escapeHtml(p.equipoBNombre)}</div>
            <div class="time">${formatHora(p.timestamp)}</div>
          </div>
          <span class="score">${p.golesA} - ${p.golesB}</span>
        </div>
      `).join('')}
    </div>
    ${bottomNav('torneos')}
  `;
}

function formatHora(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// ---------- utilidades ----------

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
