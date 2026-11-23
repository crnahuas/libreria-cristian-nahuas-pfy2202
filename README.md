# Entre Líneas

Entre Líneas es una librería desarrollada con React. Permite explorar libros por categoría, buscar por título o autor, comparar precios y consultar la ficha de cada libro.

## Ejecutar el proyecto

Necesitas Node.js 24 y npm. Desde la carpeta del proyecto:

```bash
npm ci
npm run dev
```

Abre la dirección que muestra Vite en la terminal, normalmente `http://127.0.0.1:5173/`.

## Cómo funciona

- **Inicio:** muestra un libro destacado, una selección del catálogo y accesos a las categorías.
- **Catálogo:** permite buscar sin distinguir tildes ni mayúsculas, filtrar por categoría y ordenar por precio o título.
- **Detalle:** presenta la portada, el autor, la sinopsis, el precio y los datos de la edición.
- **Navegación:** utiliza React Router. Las rutas se conservan al recargar la página.
- **Consultas:** muestra indicadores de carga y permite reintentar cuando ocurre un error. Si hay datos consultados anteriormente, puede conservarlos mientras se recupera el servicio.

Durante el desarrollo (`npm run dev`), el selector **Probar estados del servicio** permite elegir una respuesta normal, errores 404 o 500, fallo de conexión, carga lenta o un listado vacío. Cambiar la selección cancela la petición anterior. **Reintentar** solicita la respuesta normal y **Actualizar consulta** repite la consulta seleccionada. La versión de producción excluye estos controles e ignora el parámetro `scenario` de la URL.

Las portadas proceden de Open Library. Si una imagen no carga, aparece una portada con el título y el autor. Sus fuentes están en [Portadas](docs/PORTADAS.md).

## Datos y API

Las páginas consultan un servicio REST mediante `fetch`. Mock Service Worker intercepta las peticiones y responde con los datos del catálogo definidos en `src/mocks/data.js`.

| Petición | Resultado |
| --- | --- |
| `GET /api/categories` | Categorías disponibles. |
| `GET /api/books` | Catálogo completo. |
| `GET /api/books?limit=4` | Los cuatro libros del inicio; el primero también se muestra como destacado. |
| `GET /api/books?category=ficcion` | Libros de una categoría. |
| `GET /api/books/:bookId` | Ficha de un libro. |

TanStack Query mantiene los resultados en memoria durante la sesión. Reutiliza las respuestas durante cinco minutos y cancela las consultas que dejan de ser necesarias. El detalle consulta las categorías cuando dispone del identificador de categoría del libro. La búsqueda filtra de inmediato y se guarda en la URL tras 300 ms sin escribir; el orden también se conserva en la URL.

La [revisión de recorridos](docs/INTEGRACION_REST.md#revisión-de-los-tres-recorridos) registra los datos, las peticiones y los mensajes de inicio, búsqueda y detalle fallido.

La configuración del servicio está en `.env.example`. Para conectar otra API, crea `.env.local`, establece `VITE_ENABLE_MOCKS=false` y define `VITE_API_URL` con la URL del servicio terminada en `/api/`.

## Organización

| Carpeta | Contenido |
| --- | --- |
| `src/pages` | Pantallas de la aplicación. |
| `src/components` | Componentes compartidos. |
| `src/hooks` | Consultas y comportamientos de interfaz. |
| `src/services` | Cliente HTTP y configuración de caché. |
| `src/mocks` | Datos y endpoints del servicio local. |
| `src/styles` | Estilos y adaptación a distintos tamaños de pantalla. |
| `tests` | Pruebas de API, componentes y navegación. |
| `evidencias/capturas` | Capturas de las pantallas. |

## Comandos

| Comando | Función |
| --- | --- |
| `npm run dev` | Inicia el servidor local. |
| `npm run build` | Compila la aplicación en `dist/`. |
| `npm run preview` | Abre la versión compilada en un servidor local. |
| `npm test` | Ejecuta las pruebas de API y componentes. |
| `npm run test:e2e` | Compila y prueba desarrollo y producción en navegador; genera las [capturas](evidencias/README.md) en desarrollo. |
