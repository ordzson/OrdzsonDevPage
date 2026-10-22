# OrdzsonDevPage · Siete propuestas

Comparador de las siete propuestas seleccionadas para Ordzson. Abre con **Frutiger Aero · Panorama**. El selector superior reúne todas las alternativas y los botones **Anterior / Siguiente** recorren la colección. En móvil, la barra compacta muestra la propuesta activa: **Propuestas (7)** abre el selector y sus parámetros. Se recoge al elegir una opción, desplazarse por la página, tocar su contenido o pulsar Escape.

Vista previa: <http://localhost:4173/>.

Para iniciar el servidor desde esta carpeta:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

## Propuestas y valores iniciales

| Propuesta | Enlace | Densidad | Tamaño | Velocidad | Intensidad | Cursor | Carácter |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frutiger Aero · Panorama | [?proposal=aero-panorama](?proposal=aero-panorama) | 42 | 68 | 45 | 89 | 35 | 84 |
| Frutiger Aero · Cristal | [?proposal=aero-cristal](?proposal=aero-cristal) | 88 | 72 | 0.4 | — | — | 80 |
| Corriente | [?proposal=current](?proposal=current) | 95 | 38 | 17 | 80 | 100 | 100 |
| Cristales de luz | [?proposal=shards](?proposal=shards) | 65 | — | — | 10 | — | — |
| Órbita | [?proposal=orbit](?proposal=orbit) | 100 | 65 | 38 | 96 | 100 | 50 |
| Vector | [?proposal=vector](?proposal=vector) | 360 | 80 | 1 | — | — | 100 |
| Seda | [?proposal=seda](?proposal=seda) | 1120 | 0.8 | 0.3 | — | — | 75 |

Los valores proceden de los seis enlaces elegidos por el usuario. Cada familia mantiene sus propias unidades y rangos. Cristales de luz conserva 65 fragmentos como valor de densidad, grano 12, luz 10 y estilo Prisma; sus alternativas Cristal y Flujo también se pueden compartir y guardar. Panorama, Corriente y Órbita tienen seis controles; Cristal, Vector y Seda tienen cuatro.

La franja **Parámetros actuales** muestra los nombres y valores de la propuesta activa y se actualiza al mover sus controles. **Ajustar parámetros** abre su panel de edición; los controles flotantes originales también siguen disponibles. Los cambios se conservan por propuesta en el navegador. **Restablecer** recupera los valores de esta tabla. **Copiar enlace** comparte la página unificada con la propuesta y sus ajustes actuales; si el portapapeles está bloqueado, esos valores ya están disponibles en la barra de direcciones.

Cristales de luz ocupa la cuarta posición de siete. La selección admite teclado, navegación atrás/adelante y enlaces directos. La pausa se mantiene al cambiar de familia. El movimiento reducido del sistema se respeta al cargar cada propuesta. El acceso al selector permanece disponible mientras se recorre cada alternativa. En escritorio se puede recoger manualmente; en móvil comienza recogido y se abre sobre la propuesta sin reducir su espacio.

## Archivos y GitHub Pages

La página es estática, sin instalación de dependencias ni compilación. GitHub Pages sirve estos archivos desde la raíz de la rama `main`:

- `index.html`
- `proposals.css`
- `proposals.js`
- `proposals/`, con sus recursos y licencias

Todas las rutas son relativas y permiten alojar el sitio en el subdirectorio de un repositorio. No depende de archivos ocultos de Impeccable. `.nojekyll` permite servir directamente los recursos estáticos.

La colección unificada usa copias independientes con claves nuevas de almacenamiento, de modo que los ajustes guardados en las exploraciones anteriores no sustituyen los nuevos valores iniciales. Las previews originales y la configuración de trabajo se conservan localmente y están excluidas del repositorio.

## Recursos y verificación

Se reutilizan los paisajes conceptuales generados para las exploraciones originales, las capturas de Bamboo Salon y Lirios y las fuentes locales con sus licencias. Los cuatro PNG conservan su procedencia incrustada. Los proyectos, enlaces y el estado de Lirios permanecen como en las propuestas originales.

Las siete propuestas se verificaron en escritorio (1440 × 1000) y móvil (390 × 844), incluidos sus valores iniciales, controles, almacenamiento, enlaces compartidos, navegación y movimiento reducido. Las capturas y el informe se conservan localmente en `.impeccable/review/seven-proposals/`.
