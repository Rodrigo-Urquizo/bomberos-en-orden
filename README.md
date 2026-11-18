# Bomberos en Orden

Página web informativa de una sola hoja para una compañía de bomberos voluntarios de San Borja, Lima, perteneciente al Cuerpo General de Bomberos Voluntarios del Perú (CGBVP).

Proyecto del curso **Gestión de Proyectos**, Universidad de Lima – Grupo 6.

La página es solo informativa: no tiene formularios, registro de usuarios ni base de datos.

## Estructura

```
index.html        Contenido de la página
css/styles.css    Estilos (colores, diseño, celular)
js/script.js      Menú desplegable para celular
logo.svg          Escudo del CGBVP (logo de la cabecera)
apps-script/      Panel interno de inventario (web app de Google Apps Script)
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

## Panel interno de inventario (`apps-script/`)

Página para la pantalla del área común de emergencias. Muestra el inventario por andamio, el stock total de cada insumo y avisa qué lotes están vencidos o por vencer. Se llega desde el enlace *🔒 Inventario – solo personal autorizado* del pie de la página pública.

**Quién puede verlo:** el panel es una web app de Google Apps Script que se ejecuta con la cuenta de Google de quien la abre. Solo ven el inventario las personas con quienes se compartió la hoja; cualquier otra cuenta ve *Acceso restringido*.

- **Dar acceso:** en la hoja de inventario → *Compartir* → agregar el correo como *Lector* (o *Editor* si va a actualizar el inventario).
- **Quitar acceso:** quitar el correo de *Compartir*.
- La hoja debe estar en *Acceso general → Restringido*.
- La primera vez, Google pide a cada persona autorizar el panel ("Google no verificó esta app" → *Configuración avanzada* → *Ir a…*). Solo se hace una vez.

**Archivos:**

```
apps-script/Codigo.js         Lee la hoja con los permisos del usuario (HOJA_ID va aquí)
apps-script/Panel.html        Estructura del panel
apps-script/Estilos.html      Estilos
apps-script/Script.html       Agrupa insumos, calcula vencimientos y alertas, se actualiza cada 60 s
apps-script/appsscript.json   Configuración: ejecutar como el usuario, requiere iniciar sesión
```

**Publicar cambios del panel** (desde la carpeta `apps-script/`):

```
npx @google/clasp login                     # solo la primera vez, con la cuenta dueña del proyecto
npx @google/clasp push                      # sube el código a Google
npx @google/clasp update-deployment AKfycbw48wmTAxujsvFavjUgJ7_ogJQFoa-7JgKs-3IBZ3d2IZRtnIyrbceXK2djpX_uF75vHg
                                            # actualiza la versión publicada sin cambiar el enlace
```

Enlace del panel: https://script.google.com/macros/s/AKfycbw48wmTAxujsvFavjUgJ7_ogJQFoa-7JgKs-3IBZ3d2IZRtnIyrbceXK2djpX_uF75vHg/exec

Las columnas se reconocen por su nombre (Andamio, Categoría, Artículo, Unidad de medida, Contenido, Cantidad, Fecha de expiración, Talla), así que se pueden reordenar. Si se agrega una columna *Stock mínimo*, el panel avisa cuando haya menos de ese mínimo. Un lote se marca *por vencer* si vence en los próximos 180 días (`diasAviso` en `Script.html`).

## Módulo de registro de ingresos (avance)

El botón **+ Registrar ingreso** del panel abre un formulario para anotar insumos **comprados por la compañía** o **donados por la ciudadanía**. Lo usa solo el personal con acceso al panel; la página pública no tiene formularios.

Qué hace al guardar (código en `apps-script/Ingresos.js`):

- Valida los datos: origen (compra o donación), andamio, artículo y cantidad mayor que 0; la fecha de expiración se escribe como `sep-27`. Los insumos médicos deben traer fecha, y no se aceptan lotes vencidos.
- Si en la hoja ya existe una fila con el mismo andamio, artículo, unidad, contenido, talla y fecha de expiración, **suma la cantidad** a esa fila. Si no, agrega una **fila nueva** al final.
- Agrega las columnas *Origen*, *Fecha de ingreso* y *Registrado por* a la pestaña de inventario si todavía no existen.
- Anota cada ingreso en la pestaña **Registro de ingresos** (se crea sola): fecha y hora, quién, origen, artículo, cantidad, proveedor o donante y qué se hizo.
- Escribe con la cuenta de quien usa el panel. Quien solo puede ver la hoja recibe un aviso y no se registra nada; para dar permiso de registro hay que darle acceso de **editor** en la hoja.

Para publicarlo hay que subir el código a Google con `clasp push` y volver a aceptar los permisos, porque el panel ahora necesita permiso de edición sobre la hoja (antes era solo lectura). El formulario también funciona en la vista previa local con los datos de ejemplo.

## Colores

Están al inicio de `css/styles.css`, en `:root`: rojo `#C8102E`, dorado `#F2C200` y texto gris oscuro `#333333`.

## Logo

Para cambiar el logo, reemplaza el archivo `logo.svg` en la raíz del proyecto (junto a `index.html`).

## Ver la página en tu computadora

Haz doble clic en `index.html`.

## Publicación

La página se publica con GitHub Pages desde la rama `main`. Cada vez que subas cambios a `main`, el sitio se actualiza en uno o dos minutos.
