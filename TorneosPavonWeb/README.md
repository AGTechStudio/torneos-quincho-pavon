# Torneos Quincho Pavón — Web

App para organizar tus torneos de FC26 en el quincho: cargar jugadores,
sortear o armar equipos a mano, "gana y sigue" (individual y en parejas),
ranking con destacados y perdedores, historial, y estadísticas acumuladas
por mes y por año. Todo en negro y rojo, sin instalar nada — anda desde el
navegador de cualquier celular, iPhone incluido.

Esta guía asume que arrancás de cero, usando **Visual Studio Code** y
publicando en **GitHub Pages** (gratis).

---

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

---

## Resumen de lo que vamos a hacer

1. Crear la base de datos en Firebase (donde se guardan jugadores, equipos, resultados)
2. Conectar esta carpeta a esa base de datos
3. Probarla en tu PC con VS Code
4. Subirla a un repositorio en GitHub
5. Activar GitHub Pages para que quede en una URL pública
6. Compartir el link con el grupo

---

## Paso 1 — Crear el proyecto en Firebase

> Si ya habías creado un proyecto de Firebase para esta app (o para una app
> Android hermana), **usá ese mismo**, no crees uno nuevo. Saltá directo al
> Paso 1.3, y en el Paso 1.2 solo tenés que actualizar las reglas si no
> tenían todavía el bloque de "collection group" (más abajo).

### 1.1. Crear el proyecto
1. Andá a **https://console.firebase.google.com**
2. Tocá **"Crear un proyecto"**, ponele un nombre (ej: `torneos-quincho-pavon`)
3. Podés desactivar Google Analytics (no hace falta)

### 1.2. Activar Firestore (la base de datos)
1. En el menú de la izquierda, entrá a **Firestore Database**
2. Tocá **"Crear base de datos"**
3. Elegí **modo producción**
4. Elegí una región cercana (ej. `southamerica-east1`)
5. Andá a la pestaña **Reglas** y reemplazá todo el contenido por esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /torneos/{torneoId} {
      allow read, write: if true;

      match /jugadores/{jugadorId} {
        allow read, write: if true;
      }
      match /equipos/{equipoId} {
        allow read, write: if true;
      }
      match /partidos/{partidoId} {
        allow read, write: if true;
      }
    }

    // Habilita las consultas "de todos los torneos a la vez" (collection
    // group) que usa el ranking de Mes y Año. Sin esto, esas dos pestañas
    // tiran "Missing or insufficient permissions" aunque la regla de
    // arriba esté bien.
    match /{path=**}/partidos/{partidoId} {
      allow read: if true;
    }
  }
}
```
6. Tocá **Publicar**

*(Esto deja el torneo abierto para que cualquiera con el link pueda cargar resultados, pensado para uso cerrado entre amigos esa noche — no hay datos sensibles, solo nombres y resultados.)*

### 1.3. Registrar la app web y conseguir las credenciales
1. En la consola de Firebase, en la vista general del proyecto, tocá el botón **"+ Agregar app"** (o Configuración del proyecto ⚙️ → Tus apps → ícono **`</>`**)
2. Elegí la plataforma **Web** (ícono `</>`)
3. Ponele un apodo (ej: "Pavón Web") → dejá SIN marcar Firebase Hosting → **Registrar app**
4. Te va a mostrar un bloque de código con un objeto `firebaseConfig` así:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "torneos-quincho-pavon.firebaseapp.com",
  projectId: "torneos-quincho-pavon",
  storageBucket: "torneos-quincho-pavon.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```
5. **Copiá esos 6 valores**, los vas a necesitar en el paso siguiente. (Esta información no es secreta, es normal que quede pública en el código — la seguridad real la dan las Reglas de Firestore del paso 1.2, no esta clave.)

### 1.4. Crear el índice para el ranking mensual y anual

El ranking de "Mes" y "Año" busca los partidos de **todos** los torneos a la vez. Para que esa consulta funcione hacen falta DOS cosas, en este orden:

**Primero, los permisos** (ya los agregaste en el paso 1.2, con el bloque `{path=**}`). Si te salteaste ese paso, hacelo ahora — sin esto, la consola del navegador va a mostrar `Missing or insufficient permissions`, que es un error de permisos, no de índice, y Firestore ni siquiera te va a llegar a pedir el índice.

**Después, el índice.** Con los permisos ya corregidos y publicados:

1. Abrí la web y probá tocar la pestaña **"Mes"** o **"Año"** dentro de Ranking.
2. Si hace falta el índice, la consola del navegador (**F12** → pestaña **Console**) va a mostrar un error tipo *"The query requires an index"*, con un **link azul** que empieza con `https://console.firebase.google.com/.../firestore/indexes...`.
3. Hacé clic en ese link → te abre la consola de Firebase con el índice ya precargado (colección `partidos`, ámbito "Grupo de colecciones", campo `timestamp`) → tocá **"Crear índice"**.
4. Esperá 1-2 minutos a que el índice termine de crearse (en Firestore Database → Índices, vas a ver el estado pasar de "Compilando" a "Habilitado").
5. Volvé a la web y tocá "Mes" o "Año" de nuevo.

---

## Paso 2 — Abrir el proyecto en VS Code y completar la config

1. Descomprimí el .zip que te paso en una carpeta, por ejemplo `TorneosPavonWeb`.
2. Abrí VS Code → `File > Open Folder...` → seleccioná esa carpeta.
3. En el panel de la izquierda, abrí `js/firebase-config.js`.
4. Reemplazá el objeto `firebaseConfig` de ejemplo por el que copiaste en el Paso 1.3.
5. Guardá el archivo (`Ctrl+S`).

---

## Paso 3 — Probarla en tu PC antes de publicarla

Los navegadores modernos no dejan que Firestore funcione bien si abrís el `index.html` con doble clic (protocolo `file://`), así que lo mejor es levantar un servidor local de prueba:

1. En VS Code, andá a Extensiones y buscá **"Live Server"** (de Ritwick Dey). Instalala.
2. Clic derecho sobre `index.html` → **"Open with Live Server"**.
3. Probá crear un torneo, agregar jugadores, sortear equipos, cargar un resultado.
4. Si ves un cartel rojo arriba de todo diciendo que falta configurar Firebase, revisá el Paso 2. Si ves otro tipo de error, abrí la consola (F12) para el detalle.

---

## Paso 4 — Subir el proyecto a GitHub

### 4.1. Si todavía no tenés Git instalado
Bajalo de **https://git-scm.com/downloads** e instalalo.

### 4.2. Crear el repositorio en GitHub
1. Andá a **https://github.com** → **"New repository"**
2. Nombre: por ejemplo `torneos-quincho-pavon`
3. Dejalo en **Public** (para GitHub Pages gratis)
4. **NO** marques "Add a README" → **Create repository**
5. Copiá la URL que te muestra, tipo `https://github.com/tu-usuario/torneos-quincho-pavon.git`

### 4.3. Subir el código desde VS Code
En la terminal integrada de VS Code (`Terminal > New Terminal`):

```bash
git init
git add .
git commit -m "Primera versión de Torneos Quincho Pavón Web"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/torneos-quincho-pavon.git
git push -u origin main
```

---

## Paso 5 — Activar GitHub Pages

1. En tu repositorio de GitHub → **Settings** → **Pages**
2. Source: **"Deploy from a branch"** → Branch: **`main`**, carpeta **`/ (root)`** → **Save**
3. Esperá 1-2 minutos: te va a dar una URL tipo `https://tu-usuario.github.io/torneos-quincho-pavon/`

---

## Paso 6 — Compartirla con tus amigos

Mandá esa URL por WhatsApp. Cada uno la abre desde su celular y puede:
- **iPhone (Safari):** compartir → **"Agregar a pantalla de inicio"**
- **Android (Chrome):** menú → **"Agregar a pantalla principal"**

Todos ven y cargan datos de la misma base de Firestore en tiempo real.

---

## Cómo actualizar la web más adelante

```bash
git add .
git commit -m "Descripción del cambio"
git push
```
GitHub Pages se actualiza solo en 1-2 minutos.

---

## Estructura del proyecto

```
index.html              -> pantalla base
css/style.css            -> estilos (paleta negro/rojo)
js/firebase-config.js     -> tus credenciales de Firebase (Paso 1.3 y 2)
js/state.js                -> estado global + sync con Firestore + ranking por jugador
js/app.js                   -> lógica: torneo, sorteo, gana y sigue, resultados, finalizar, mes/año
js/render.js                  -> dibuja cada pantalla
manifest.json + sw.js           -> "agregar a pantalla de inicio"
icons/                            -> ícono de la app
firestore.rules                   -> reglas para pegar en la consola de Firebase
```

## Si algo no funciona

- **Cartel rojo de "Firebase no está configurado":** completá `js/firebase-config.js` (Paso 2).
- **"Missing or insufficient permissions" en la consola:** revisá que hayas publicado las reglas completas del Paso 1.2 (con el bloque `{path=**}` al final).
- **"The query requires an index":** seguí el Paso 1.4.
- **La página se ve pero rota:** abrí la consola del navegador (F12) → pestaña "Console" → mandame el error que aparezca en rojo.
- **GitHub Pages tira 404:** esperá un par de minutos más, o confirmá en Settings → Pages que el branch/carpeta estén bien elegidos.
