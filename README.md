# Torneos Quincho Pavón — Web

App para organizar los torneos de FC26 en el quincho: cargar jugadores,
sortear o armar equipos a mano, "gana y sigue" (individual y en parejas),
ranking con destacados y perdedores, historial, y estadísticas acumuladas
por mes y por año. Todo en negro y rojo, sin instalar nada — anda desde el
navegador de cualquier celular, iPhone incluido.

## Lo que hace la app

- Menú principal → Iniciar torneo → elegís **Parejas (2v2)** o **Individual**
- Cargás los jugadores presentes y los confirmás
- Elegís cómo armar los equipos → **al azar** o **manualmente**
- Se juega, cargás el resultado y el jugador destacado de cada partido
- Modo individual: "gana y sigue" (el que pierde sale, entra el que esperaba)
- Modo parejas por sorteo: arma TODAS las parejas desde el arranque (no solo
  las 2 que juegan primero). La pareja ganadora sigue jugando; a la que
  pierde le entra el próximo de la cola — con una pantalla de confirmación
  antes de armar cada partido nuevo, para que no se arme solo
- **Botón "FINALIZAR TORNEO"** (en Ranking): cierra la noche y muestra un
  resumen con el campeón, el más destacado y el perdedor de esa noche. Cada
  torneo es la juntada de esa noche puntual — la próxima vez que se junten,
  arrancan un torneo nuevo desde cero
- **Ranking con 3 pestañas — Noche / Mes / Año**: cada una muestra el
  campeón, el jugador más destacado (el que más veces fue elegido MVP de un
  partido) y el "perdedor" de ese período, más la tabla completa. El de
  mes/año se arma acumulando los datos de TODOS los torneos jugados en ese
  rango de fechas, no solo el de esa noche
- Botones de "volver" en todo el flujo, y navegación inferior (Inicio /
  Torneos / Ranking) siempre visible — el botón "Torneos" te lleva directo
  a donde quedó el torneo en curso
- Todo se guarda en Firebase Firestore en tiempo real, compartido entre
  todos los que tengan el link
- Instalable como PWA: "Agregar a pantalla de inicio" tanto en iPhone
  (Safari) como en Android (Chrome), funciona como una app nativa

## Stack

- HTML / CSS / JavaScript vanilla (sin frameworks)
- Firebase Firestore como base de datos en tiempo real
- PWA (manifest.json + service worker) para instalación en el celular

## Estructura del proyecto

```
index.html              -> pantalla base
css/style.css            -> estilos (paleta negro/rojo)
js/firebase-config.js     -> credenciales de Firebase
js/state.js                -> estado global + sync con Firestore + ranking por jugador
js/app.js                    -> lógica: torneo, sorteo, gana y sigue, resultados, finalizar, mes/año
js/render.js                   -> dibuja cada pantalla
manifest.json + sw.js            -> "agregar a pantalla de inicio"
icons/                             -> ícono de la app
firestore.rules                    -> reglas de acceso a la base de datos
```
