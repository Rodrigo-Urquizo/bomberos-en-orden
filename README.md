# Bomberos en Orden

Página web informativa de una sola hoja para una compañía de bomberos voluntarios de San Borja, Lima, perteneciente al Cuerpo General de Bomberos Voluntarios del Perú (CGBVP).

Proyecto del curso **Gestión de Proyectos**, Universidad de Lima – Grupo 6.

La página es solo informativa: no tiene formularios, registro de usuarios ni base de datos.

## Estructura

```
index.html        Contenido de la página
css/styles.css    Estilos (colores, diseño, celular)
js/script.js      Menú desplegable para celular
logo.svg          Logo del CGBVP (debes agregarlo en esta carpeta)
```

## Cómo editar los textos

1. Abre `index.html` con cualquier editor de texto (Bloc de notas, VS Code).
2. Busca `[COMPLETAR]` (Ctrl + F) y reemplázalo con el dato real:
   - Número de la compañía (título, pie de página)
   - Historia (sección *Conócenos*)
   - Misión y visión
   - Dirección, horario y teléfono de la compañía (sección *Ubicación y contacto*)
3. El enlace de Google Maps está en la sección de contacto. Reemplaza el valor de `href` por el enlace de la ubicación exacta de la compañía (en Google Maps: Compartir → Copiar enlace).
4. Para cambiar la lista de donaciones, edita los `<li>` dentro de la sección `donar`.

## Colores

Están al inicio de `css/styles.css`, en `:root`: rojo `#C8102E`, dorado `#F2C200` y texto gris oscuro `#333333`.

## Logo

Coloca el archivo `logo.svg` en la raíz del proyecto (junto a `index.html`). Si no existe, la página simplemente no lo muestra.

## Ver la página en tu computadora

Haz doble clic en `index.html`.

## Publicación

La página se publica con GitHub Pages desde la rama `main`. Cada vez que subas cambios a `main`, el sitio se actualiza en uno o dos minutos.
