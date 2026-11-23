# Integración del catálogo con REST

El frontend no importa los arreglos del catálogo. La secuencia es: componente React → `useResource` → `getResource` → `fetch` → MSW → respuesta HTTP JSON. Los datos del catálogo solo se importan desde los handlers del mock.

## Inicio de la aplicación

`main.jsx` importa el módulo del navegador dinámicamente y espera `worker.start()` antes de renderizar. Esto evita que una consulta inicial se adelante a la activación del Service Worker. Un fallo de registro presenta un aviso y un control de recarga.

El worker se sirve desde `public/mockServiceWorker.js` y se copia a `dist/` al compilar. Su URL usa `BASE_URL` para admitir subdirectorios. MSW está habilitado por defecto durante el desarrollo y al ejecutar la versión compilada.

## Consultas y respuestas

`getResource` construye una URL del mismo origen o de `VITE_API_URL`, envía una petición GET con `Accept: application/json`, comprueba `response.ok` y aplica el validador recibido en la opción `validate`. Los contratos `isBook`, `isBookList` e `isCategoryList` viven en `src/services/validators.js`; no dependen de la URL. Un arreglo vacío es una respuesta válida para listados, pero no para el detalle individual de un libro.

Los filtros se envían como parámetros de consulta. El mock verifica que exista la categoría y devuelve solo sus libros. Una categoría válida sin contenido devuelve `[]`; una categoría o un identificador inexistente devuelve 404.

El parámetro opcional `limit` acepta enteros positivos y se aplica después del filtro de categoría. Inicio usa `GET /api/books?limit=4`: presenta esos cuatro libros y reutiliza el primero como destacado. El detalle usa `enabled: Boolean(book?.categoryId)` para consultar las categorías únicamente cuando hay un libro que necesita su nombre.

`selectCategoryName` comparte el nombre y su alternativa legible entre inicio, catálogo y detalle. `BookCover` se ocupa de la imagen y su alternativa local; las tarjetas y las otras vistas comparten un único `Intl.NumberFormat` para los precios.

## Estados y alternativas

El componente compartido `RequestState` muestra carga durante cada petición, incluso en una actualización manual. Una respuesta 404, 500 o un error de conexión presenta mensajes diferentes y opciones para reintentar o regresar al catálogo.

Cada vista declara un solo `RequestState` por recurso. El detalle no muestra el estado de categorías mientras la consulta está deshabilitada.

Al fallar una actualización, se conservan los datos anteriores del mismo recurso. Si se prueba un escenario de error, se puede usar como respaldo su consulta normal. La clave incluye los parámetros de categoría y el escenario: un resultado de Ficción nunca se usa como respuesta de Drama. Sin una consulta exitosa anterior no se inventan resultados.

## Caché y concurrencia

TanStack Query reutiliza una respuesta durante cinco minutos y mantiene las consultas inactivas en memoria hasta diez minutos. Consumidores simultáneos de la misma consulta comparten su estado. Al desmontar o cambiar de recurso, la señal de cancelación se pasa a `fetch`; las respuestas de una consulta anterior no se guardan bajo la clave de la nueva categoría.

Se deshabilitan las consultas automáticas al recuperar el foco y los reintentos automáticos, para que cada consulta se inicie mediante la navegación o una acción explícita. La navegación vuelve a consultar cuando el resultado está vencido. Actualizar y Reintentar fuerzan una consulta; en desarrollo, Reintentar también elimina el escenario de fallo antes de solicitar datos normales.

El catálogo memoiza el filtrado y el ordenamiento sin modificar los libros de la caché. El campo de búsqueda filtra de inmediato y actualiza `q` después de 300 ms sin escribir. La actualización funcional de `setParams` conserva el orden y los otros parámetros. Cambiar de vista o de búsqueda mediante navegación cancela la actualización pendiente; Atrás y Adelante recuperan la búsqueda de la URL.

La caché vive en memoria durante la sesión de la aplicación. Recargar elimina ese respaldo. No es persistencia de servidor ni una implementación completa de uso sin conexión.

## Escenarios de prueba

`scenario` es un parámetro del mock usado por el selector de estados durante el desarrollo. Permite devolver 404, 500, fallo de red, demora o lista vacía. La lógica de simulación vive en `src/dev`, separada de `useResource`, y los accesos protegidos por `import.meta.env.DEV` la excluyen de la compilación de producción. En producción, las vistas no leen `scenario` de la URL. MSW sigue disponible para la demostración del servicio REST simulado.

Los listados no mezclan los datos simulados con los de respuesta normal. La demora habitual es de 450 ms y la lenta de 2500 ms; en las pruebas de integración se elimina la demora habitual para mantenerlas rápidas.

Los tests usan los mismos handlers en `msw/node`. `npm run test:e2e` compila y ejecuta Playwright contra desarrollo (puerto 4174) y producción (puerto 4175), con el Service Worker real. Desarrollo cubre simulación y capturas; producción verifica las peticiones, el historial de búsqueda y la ausencia de controles de simulación. En desarrollo, StrictMode puede iniciar y cancelar una petición durante el montaje inicial; el recorrido comprueba que las interacciones posteriores no repitan la consulta.

## Revisión de los tres recorridos

Los conteos corresponden a una sesión nueva, sin caché, en producción. Las pruebas de componentes y navegador verifican las peticiones y los estados indicados.

| Recorrido | Datos necesarios | Peticiones | Mensaje y resultado |
| --- | --- | --- | --- |
| Abrir inicio | Cuatro libros y categorías; el destacado reutiliza el primer libro. | Una a `GET /api/books?limit=4` y una a `GET /api/categories`. | Un indicador por recurso: «Cargando los libros…» y «Cargando las categorías…»; después, cuatro tarjetas, destacado y enlaces a categorías. |
| Escribir «desolacion» en catálogo | Los libros y categorías ya consultados al entrar. | Una a `GET /api/books` y una a `GET /api/categories` al entrar; ninguna adicional al escribir, ordenar o recorrer el historial. | El listado se reduce inmediatamente a Desolación y muestra «1 libro». `q` se guarda tras 300 ms; una búsqueda sin coincidencias muestra «No encontramos ese libro» y permite limpiar el campo. |
| Abrir un detalle que falla | El libro; las categorías se necesitan después de obtener su identificador. | Solo `GET /api/books/no-existe`; cero peticiones a categorías. Reintentar repite únicamente la consulta del libro. | Un indicador «Cargando el libro…», luego una alerta 404 con «No pudimos cargar el libro», Reintentar y Volver al catálogo. |

La prueba de desarrollo `/libros/frankenstein?scenario=500` verifica además que no se consulten categorías durante el fallo y que, al reintentar con éxito, se obtengan el libro y luego sus categorías. Si falla una actualización con datos previos, se mantiene la última respuesta válida del mismo recurso.
