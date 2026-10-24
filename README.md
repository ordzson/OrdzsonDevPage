# Ordzson · Frutiger Aero Panorama

La propuesta aprobada es **Frutiger Aero · Panorama**. El inicio muestra directamente el portafolio, sin comparador, selector de propuestas, anterior/siguiente ni acceso a la galería de logos. Los parámetros de animación, cristal, fondo y apariencia siguen disponibles desde **Parámetros**.

Sitio: <https://ordzson.github.io/OrdzsonDevPage/>.

## Desarrollo local

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Abre <http://localhost:4173/>. El sitio es HTML, CSS y módulos JavaScript, sin dependencias de ejecución. Las imágenes y sonidos se resuelven respecto a sus módulos para funcionar bajo la ruta del proyecto en GitHub Pages.

## Publicación

```sh
pnpm test
pnpm build
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist
```

`scripts/build-pages.mjs` genera `dist/` con una lista explícita de recursos de Panorama y `.nojekyll`. El paquete contiene una única página HTML y excluye las galerías y las páginas de las demás propuestas. GitHub Pages publica la raíz de la rama `gh-pages`; `main` conserva el código fuente completo. Para actualizar el sitio, genera el paquete y publica su contenido en `gh-pages`.

Los parámetros antiguos `proposal`, `world`, `look` y `embed` se ignoran y se retiran de la URL pública. El sitio siempre abre Panorama; los enlaces con parámetros válidos de animación, fondo y apariencia siguen funcionando. **Copiar enlace** comparte la vista actual sin un selector de propuestas.

Con movimiento reducido activado en el sistema (por ejemplo, «Quitar animaciones» o el ahorro de batería en Android), las burbujas siguen subiendo a la mitad de velocidad, se pueden pausar y conservan el mismo reventado; el fondo Aurora queda fijo.

Los valores iniciales de Panorama son densidad 37, tamaño 68, velocidad 45, intensidad 100, respuesta al cursor 0 y reflejos 0; el cristal usa transparencia 80%, desenfoque 10 px, saturación 3.2× y color de burbujas 10%. Se aplican también en dispositivos nuevos. Los ajustes personalizados se guardan por navegador; para llevarlos a otro dispositivo, utiliza **Copiar enlace**. El perfil antiguo sin personalizar se actualiza automáticamente.

## Exploraciones conservadas

El comparador anterior se conserva en `explorations.html`, junto con `proposals.js`, `proposals.css`, las carpetas `proposals/atlas`, `proposals/studies`, `proposals/particles` y la galería `logos/`. Todo permanece en el repositorio para futuras consultas. Estos accesos y las otras páginas HTML no se incluyen en `dist/` ni en GitHub Pages.

Las propuestas conservadas son Panorama, Cristal, Corriente, Cristales de luz, Órbita, Vector, Vector · Cobalto y Seda. Sus controles y archivos originales siguen disponibles en el entorno local. Las capturas reales de Bamboo Salon y Lirios, el estado «En desarrollo» de Lirios y los enlaces de proyectos se mantienen.

## Comprobaciones

`pnpm test` ejecuta siete pruebas de física de burbujas: separación, rebotes, ascenso y reentrada, incluido un grupo apretado que agotaba el solucionador de colisiones y la circulación durante 600 segundos simulados con las dimensiones reales de servicios y densidad alta. La publicación también se comprueba en navegador en escritorio y móvil, bajo la ruta `/OrdzsonDevPage/`, con enlaces antiguos, parámetros, pausa, fondos, movimiento reducido y carga de recursos.
