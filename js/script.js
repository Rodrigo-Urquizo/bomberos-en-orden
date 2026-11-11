// Menú desplegable para celular
const boton = document.getElementById('menu-boton');
const lista = document.getElementById('menu-lista');

boton.addEventListener('click', () => {
  const abierto = lista.classList.toggle('abierto');
  boton.setAttribute('aria-expanded', abierto);
});

// Cierra el menú al elegir una sección
lista.querySelectorAll('a').forEach((enlace) => {
  enlace.addEventListener('click', () => {
    lista.classList.remove('abierto');
    boton.setAttribute('aria-expanded', 'false');
  });
});
