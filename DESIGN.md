# Design System & Guidelines: Portfolio-MetalSyntax

Este documento describe el sistema de diseño, la paleta de colores, la tipografía y la estructura utilizada en este proyecto. Puedes utilizar esta guía para mantener la consistencia visual al expandir el portafolio o al crear nuevos proyectos basados en este diseño.

## 🛠 Tecnologías Base
- **Framework**: Nuxt.js
- **Estilos**: Tailwind CSS
- **Modo**: Soporte para temas Claro (Light) y Oscuro (Dark) a través de variables CSS.

## 🎨 Paleta de Colores

### Colores Principales
- **Aqua (Primario)**:
  - Base (`aqua-100`): `#00c08b` *(Utilizado para acentos y elementos interactivos como Swiper)*
  - Oscuro (`aqua-200`): `#00976D`

### Colores Neutros y Escala de Grises
- **Graylight** (Claros):
  - `100`: `#f5f5f5`
  - `200`: `#e4e4e4`
  - `300`: `#e2e8f0`
- **Grayblacked** (Oscuros profundos):
  - `100`: `#00100b`
  - `200`: `#001810`
- **Dark**:
  - Surface: `#0c0c0c`
  - Background (`dark-bg`): `#001E26`

### Variables de Interfaz (Tokens Semánticos)
El proyecto utiliza variables CSS (`--ui-*`) inyectadas en la configuración de Tailwind (`ui.bg`, `ui.bg-muted`, etc.) para manejar el cambio de tema dinámico.

**Tema Oscuro (Por defecto):**
- Fondo (`--ui-bg`): `#0a0a0a`
- Fondo Atenuado / Elevado (`--ui-bg-muted` / `--ui-bg-elevated`): `#171717`
- Fondo Acentuado (`--ui-bg-accented`): `#262626`
- Texto Atenuado (`--ui-text-muted`): `#a3a3a3`

**Tema Claro (`.light`):**
- Fondo (`--ui-bg`): `#ffffff`
- Fondo Atenuado / Elevado (`--ui-bg-muted` / `--ui-bg-elevated`): `#f5f5f5`
- Fondo Acentuado (`--ui-bg-accented`): `#e5e5e5`
- Texto Atenuado (`--ui-text-muted`): `#4b5563`

## 🖋 Tipografía
El proyecto hereda la tipografía sans-serif por defecto de Tailwind CSS. Se recomienda el uso de fuentes modernas y legibles como **Inter** o **Roboto** para mantener una estética limpia y profesional.

## 🧩 Estructura y Componentes
- **Fondos y Textos Globales**: El `<body>` utiliza las clases de Tailwind `@apply bg-ui-bg text-gray-200;`, lo que garantiza que el fondo y el color de texto base se adapten automáticamente al tema activo.
- **Swiper / Carruseles**: Los controles de navegación y paginación están sobrescritos para utilizar el color principal (`#00c08b`).

## 💡 Cómo aplicar estos estilos en otros proyectos
1. Copia la extensión `colors` de `tailwind.config.js`.
2. Asegúrate de incluir las variables CSS en el archivo principal de estilos (ej. `tailwind.css` o `global.css`).
3. Utiliza clases semánticas de Tailwind basadas en la interfaz: `bg-ui-bg`, `bg-ui-bg-muted`, `text-ui-text-muted`.
4. Implementa el cambio de tema añadiendo o quitando la clase `light` a la etiqueta `<html>`.
