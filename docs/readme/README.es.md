<h1 align="center">
  <img src="../../assets/app-icon.png" alt="Thoughtline app icon" width="96" height="96" valign="middle" /> 晾念头 · Thoughtline
</h1>

<p align="center">
  <a href="https://github.com/NocodeMrLi/thoughtline/stargazers"><img src="badges/stars.svg" alt="GitHub stars: 0" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases"><img src="badges/downloads.svg" alt="Release asset downloads: 30" /></a>
  <a href="#license"><img src="badges/license.svg" alt="License: UNLICENSED" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.21"><img src="badges/preview.svg" alt="Version: 0.0.21" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/issues"><img src="badges/feedback.svg" alt="Feedback on GitHub" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.21"><img src="badges/platforms.svg" alt="Platforms: macOS and Windows" /></a>
</p>

<p align="center">
  <sub><a href="../../README.md">中文</a> · <a href="../../docs/readme/README.en.md">English</a> · <a href="../../docs/readme/README.ja.md">日本語</a> · <a href="../../docs/readme/README.ko.md">한국어</a> · <a href="../../docs/readme/README.es.md">Español</a> · <a href="../../docs/readme/README.fr.md">Français</a> · <a href="../../docs/readme/README.pt.md">Português</a></sub>
</p>

<p align="center">
  <strong>Cuelga una idea. Mantén la inspiración a mano.</strong><br />
  Una cuerda, unas pinzas y hojas de papel para tus ideas cotidianas.
</p>

<h2 align="center"><a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.21"><ins>Descargar Thoughtline</ins></a></h2>

<p align="center"><sub>macOS Apple Silicon · Windows x64 · 0.0.21</sub></p>

Thoughtline es una herramienta ligera para macOS y Windows. Muestra tus ideas en el borde superior de la pantalla, anota una y vuelve a lo que estabas haciendo.

## Funciones

- Anota título, texto y categoría con un atajo; guarda notas incompletas como borradores.
- Una cuerda de escritorio con pinzas y papel; las ideas nuevas usan la categoría General.
- Mueve una pinza o separa una hoja. Con el botón derecho, **Merge** permite elegir una pinza compatible y **Split** separa la idea actual. Si hace falta, la separación reúne los espacios dispersos; la organización automática conserva el orden de izquierda a derecha. Puedes deshacer la organización.
- Edita en la vista de detalle o el calendario, con guardado automático tras una pausa y cambio inmediato de página.
- Explora por día, mes o año; busca y filtra también las ideas archivadas.
- Restaura notas desde Eliminados recientemente. Borrar un proyecto conserva sus ideas.
- Copia o arrastra el texto sin formato. La nota original se mantiene y no se envía nada automáticamente.
- Guarda los datos localmente; consulta la carpeta real, muévelos o exporta una copia independiente.
- Cambia entre chino/inglés y modo claro/oscuro desde las primeras ventanas, o sigue el sistema; el papel sigue siendo suave y legible.
- Si la cuerda está llena, guarda la idea o elige **Swap onto line** en la misma ventana; la idea anterior queda archivada. Volver a colgar desde el calendario se refleja al instante. Los menús se cierran al retirar el puntero.

- Basta un título o texto; el cuerpo puede quedar vacío. La campana configura un recordatorio único, también visible en el calendario. Las notificaciones requieren permiso y abren la nota. Al cerrar completamente la aplicación no se avisa a tiempo; los recordatorios perdidos se agrupan al reiniciar.

<p align="center"><img src="images/thought-calendar.png" alt="Calendario de ideas con datos de demostración sintéticos." width="740" /><br /><sub>Calendario de ideas con datos de demostración sintéticos.</sub></p>

## Descarga e instalación

Las descargas están disponibles para miembros con acceso al repositorio. Releases incluye paquetes, lanzadores aislados, SHA256SUMS y procedencia de las compilaciones. [Releases](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.21).

| Platform | Package |
|---|---|
| macOS · Apple Silicon | arm64 · DMG |
| Windows | x64 · EXE (NSIS) |

Antes de actualizar, cierra la aplicación normalmente y respalda tus datos. No se prevén certificados de firma comercial ni notarización. Mac conserva la firma local ad-hoc; Windows no tiene firma. El usuario instala mediante los avisos normales de confianza del sistema. La firma no determina la madurez de una versión. No hay actualizaciones automáticas.

## Primeros pasos

1. Pulsa Control + Alt + N (⌃ + ⌥ + N en Mac) para escribir; cambia el atajo en Ajustes.
2. Enter añade un salto de línea. Envía la nota con ⌘ + Enter en Mac o Ctrl + Enter en Windows. Esc guarda el borrador y cierra el editor.
3. Acerca el puntero al borde superior para mostrar la cuerda; abre una hoja para leer, copiar, editar o archivar.
4. Busca ideas archivadas en el calendario o restaura las eliminadas recientemente.

Las etiquetas describen usos, personas o herramientas: ideas cotidianas, notas de trabajo, un responsable directo, un compañero o Codex. Añade informes diarios, planes de diseño o clientes. Las instalaciones nuevas incluyen seis etiquetas; las existentes y sus colores se conservan. El calendario filtra Todo / En la cuerda / Fuera de la cuerda. Fuera incluye ideas guardadas sin colgar, retiradas y registros antiguos que superan la capacidad. Copia o arrastra el texto tú mismo; la recepción en otras aplicaciones requiere verificación por separado.

## Datos y copias de seguridad

Los ajustes del calendario muestran la carpeta real. La migración copia y verifica antes de cambiar; conserva el original. Exportar una copia no cambia la ubicación actual. [Data / 备份说明](../ROUND1-DATA-SAFETY.md).

El formato actual es schema3. La versión 0.0.16-preview.6 no puede leerlo directamente. Conserva los datos nuevos y valida una copia previa en una carpeta independiente antes de volver a una versión anterior. Esa copia no incluye cambios posteriores.

## Desarrollo

Usa Node.js 24.19.0 o una versión 24.x posterior. verify ejecuta comprobación de tipos, pruebas unitarias y compilación. Compila cada paquete en su sistema correspondiente. La aplicación usa Electron, React, TypeScript y Vite.

```bash
npm ci
npm run dev
```

```bash
npm run verify
npm run package:mac
npm run package:win
```

Las comprobaciones automáticas y de paquetes aplicables han pasado. IME, DPI, varias pantallas, foco y campos reales de WeChat, Doubao y WorkBuddy requieren pruebas independientes. La interfaz admite chino e inglés. Cambia el idioma y el modo claro/oscuro directamente en la esquina superior derecha de Composición, Detalle o Calendario; en Ajustes puedes volver a seguir el sistema. Los siete enlaces traducen el README, no indican siete idiomas para la interfaz.

## Comentarios

Usa Issues para errores y sugerencias. Incluye versiones, pasos, resultado esperado y real, y pruebas sin información privada. No subas notas personales ni datos reales. [Issues](https://github.com/NocodeMrLi/thoughtline/issues).

Estrellas y descargas: instantánea de la API del 2026-10-10. Las descargas cuentan archivos de las publicaciones.

<a id="license"></a>
## Licencia y agradecimientos

El proyecto es UNLICENSED; no se ha otorgado permiso de uso como código abierto. Una futura publicación pública definirá su licencia y proceso de contribución. Consulta los avisos de terceros para el código y las licencias incluidos. [Third-party notices](../../THIRD_PARTY_NOTICES.md).

0.0.21 title-only thoughts and reminder fields require the updated reader. Before downgrading, retain current data and use a pre-upgrade backup in a separate directory.
