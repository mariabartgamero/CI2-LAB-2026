# Corporate Ride – Plataforma de carsharing corporativo

**Corporate Ride** es una aplicación web fullstack orientada a la movilidad corporativa compartida. El proyecto permite que los empleados de distintas empresas puedan registrarse con un código corporativo, visualizar coches eléctricos disponibles en un mapa, reservar trayectos, unirse a viajes de compañeros de su misma empresa y acumular puntos responsables cuando el viaje se completa con más de un ocupante.

La aplicación se ha desarrollado como un MVP funcional compuesto por un **backend en Spring Boot**, una **base de datos PostgreSQL** y un **frontend web estático** integrado dentro del propio proyecto. El backend expone una API REST para gestionar usuarios, empresas, oficinas, coches y reservas, mientras que el frontend consume dicha API para construir una experiencia interactiva basada en mapa.

---

## 1. Objetivo del proyecto

El objetivo principal de Corporate Ride es fomentar el uso compartido de vehículos dentro del entorno empresarial, reduciendo desplazamientos individuales y facilitando que los empleados puedan coordinar viajes hacia oficinas o destinos dentro de Madrid.

La aplicación busca resolver una situación típica de movilidad corporativa: distintos empleados de una misma empresa necesitan desplazarse a sedes, oficinas o direcciones concretas, pero no existe una herramienta sencilla que permita saber qué coches están disponibles, quién ha reservado uno, cuántas plazas quedan libres o si es posible compartir trayecto.

Con Corporate Ride, el usuario puede:

- Crear una cuenta vinculada a una empresa mediante un código corporativo.
- Iniciar sesión y mantener la sesión activa en el navegador.
- Ver en un mapa los coches disponibles o reservados por empleados de su misma empresa.
- Consultar información de cada coche: matrícula, batería, autonomía estimada, ubicación, plazas disponibles y estado.
- Crear reservas de ida hacia una oficina de la empresa.
- Crear reservas de vuelta hacia una dirección concreta validada en Madrid.
- Unirse a reservas existentes si pertenecen a su empresa y quedan plazas libres.
- Cancelar su participación antes de iniciar el trayecto.
- Marcarse como listo antes del viaje.
- Iniciar y finalizar trayectos.
- Acumular puntos responsables cuando el trayecto se completa con al menos dos ocupantes.
- Consultar su historial de reservas completadas, canceladas y caducadas.

---

## 2. Tecnologías utilizadas

El proyecto se ha construido utilizando una arquitectura fullstack sencilla, donde el backend y el frontend se sirven desde la misma aplicación Spring Boot.

| Capa | Tecnología | Uso principal |
|---|---|---|
| Backend | Java 21 + Spring Boot 3.3.5 | Desarrollo de la API REST y lógica de negocio |
| Persistencia | Spring Data JPA + Hibernate | Mapeo de entidades y acceso a base de datos |
| Base de datos | PostgreSQL | Almacenamiento de usuarios, empresas, coches, oficinas y reservas |
| Frontend | HTML, CSS y JavaScript modular | Interfaz de usuario y consumo de la API |
| Mapas | Leaflet + OpenStreetMap/CARTO | Visualización de coches y oficinas en mapa |
| Geocodificación | Nominatim / OpenStreetMap | Validación de direcciones para trayectos de vuelta |
| Gestión de dependencias | Maven | Compilación y ejecución del proyecto |

---

## 3. Estructura general de la aplicación

La aplicación se divide en tres bloques principales:

1. **Frontend**: contiene la interfaz de acceso, registro, mapa, ficha de coche, reserva activa y menú de usuario.
2. **Backend**: contiene los controladores REST, servicios de negocio, repositorios, modelos de datos y DTOs.
3. **Base de datos**: almacena la información persistente y permite que las reservas, usuarios y coches se mantengan entre sesiones.

```mermaid
flowchart LR
    U[Usuario] --> F[Frontend HTML CSS JS]
    F --> API[API REST Spring Boot]
    API --> S[Servicios de negocio]
    S --> R[Repositorios JPA]
    R --> DB[(PostgreSQL)]
    F --> MAP[Leaflet / OpenStreetMap]
    F --> GEO[Nominatim]
```

---

## 4. Funcionalidades principales

### 4.1 Registro e inicio de sesión

La primera pantalla de la aplicación permite al usuario iniciar sesión o crear una cuenta nueva.

En el registro se solicitan los siguientes datos:

- Nombre completo.
- Correo corporativo.
- Contraseña.
- Confirmación de contraseña.
- DNI.
- Código de empresa.

El sistema valida desde el frontend que el correo tenga un formato básico, que el DNI siga el patrón de 8 números y una letra, que las contraseñas coincidan y que el código de empresa exista. Además, el backend vuelve a validar los datos para evitar registros duplicados o empresas inexistentes.

Los códigos de empresa incluidos en los datos iniciales son:

| Empresa | Código |
|---|---|
| Telefónica | `TEL2026` |
| Repsol | `REP2026` |
| Endesa | `END2026` |
| Accenture | `ACC2026` |

Cuando el login o el registro son correctos, el usuario queda guardado en `localStorage` como usuario activo y se muestra directamente la pantalla principal del mapa.

---

### 4.2 Pantalla principal con mapa

Después de iniciar sesión, el usuario accede a una vista tipo aplicación móvil centrada en un mapa interactivo. Esta pantalla está gestionada principalmente por `MapScreen.js`.

El mapa permite:

- Visualizar coches mediante marcadores personalizados.
- Visualizar oficinas de la empresa del usuario.
- Seleccionar un coche para abrir una ficha inferior con su información.
- Centrar de nuevo el mapa en Madrid.
- Consultar una reserva activa si el usuario ya tiene una.
- Abrir el menú lateral con perfil, puntos e historial.

La aplicación usa Leaflet para crear el mapa y una capa de tiles basada en OpenStreetMap/CARTO.

---

### 4.3 Visualización de coches

Los coches se obtienen desde el endpoint `/api/cars/visible?userId={id}`. Esta llamada no muestra simplemente todos los coches sin filtro, sino que adapta la visibilidad al usuario.

Un usuario puede ver:

- Coches libres.
- Coches con reserva activa siempre que la reserva pertenezca a su misma empresa.

De esta forma, las reservas de otras empresas no se muestran como viajes a los que el usuario pueda unirse. Esto mantiene la lógica corporativa del sistema: cada empleado solo comparte viajes con usuarios de su propia empresa.

Cada coche contiene información como:

- Matrícula.
- Porcentaje de batería.
- Estado del coche.
- Coordenadas.
- Plazas totales.
- Plazas disponibles.
- Reserva activa asociada, si existe.

Los estados principales de un coche son:

| Estado | Significado |
|---|---|
| `LIBRE` | El coche no tiene ninguna reserva activa y puede reservarse. |
| `RESERVA_PENDIENTE` | El coche tiene una reserva creada, pero aún no se ha iniciado el trayecto. |
| `RESERVA_CONFIRMADA` | La reserva tiene al menos dos ocupantes. |
| `COMPLETO` | Todas las plazas del coche están ocupadas. |
| `EN_USO` | El trayecto ha comenzado y el coche está en circulación. |

---

### 4.4 Ficha de coche

Al pulsar sobre un coche del mapa se abre una ficha inferior, implementada en `CarBottomSheet.js`. Esta ficha muestra la información principal del vehículo y las acciones disponibles para el usuario.

La ficha incluye:

- Matrícula del coche.
- Modelo mostrado en la interfaz.
- Imagen del vehículo.
- Porcentaje de batería.
- Autonomía estimada.
- Plazas libres.
- Destino del viaje, si ya existe una reserva.
- Distancia aproximada hasta el destino.
- Tiempo estimado de llegada.
- Puntos responsables previstos.
- Lista de ocupantes si el coche ya tiene una reserva.

En función del estado del coche y de la situación del usuario, la ficha puede mostrar diferentes botones:

| Situación | Acción disponible |
|---|---|
| Coche libre y usuario sin reserva activa | Reservar coche |
| Coche reservado por la misma empresa con plazas libres | Unirse al viaje |
| Usuario ya apuntado a la reserva | Cancelar viaje |
| Usuario con otra reserva activa | Acción bloqueada |
| Coche en uso o no disponible | No disponible |

---

### 4.5 Creación de reservas

El usuario puede crear una reserva seleccionando un coche libre. La reserva puede ser de dos tipos:

#### Ida a oficina

En este caso el destino se selecciona entre las oficinas de la empresa del usuario. La aplicación carga estas oficinas desde el backend mediante el endpoint `/api/offices/company/{companyId}`.

Para una reserva de ida se calcula:

- Distancia entre la ubicación actual del coche y la oficina seleccionada.
- Duración aproximada del trayecto.
- Puntos previstos.

#### Vuelta a dirección

En este caso el usuario introduce una dirección de destino. La dirección se valida con Nominatim y debe corresponder a una dirección completa dentro de Madrid.

El sistema comprueba que la dirección incluya calle y número, que exista una coincidencia válida y que el resultado esté en España/Madrid. Si la dirección es válida, se calculan la distancia, el tiempo estimado y los puntos responsables.

#### Restricciones de reserva

El backend aplica varias reglas para mantener coherencia en el sistema:

- Solo se pueden reservar coches en estado `LIBRE`.
- Un usuario no puede tener más de una reserva activa al mismo tiempo.
- La hora de inicio no puede estar en el pasado.
- Solo se puede reservar con un máximo de 12 horas de antelación.
- Un usuario solo puede tener una reserva de ida y una reserva de vuelta por día.
- Para reservas de ida, la oficina debe pertenecer a la empresa del usuario.
- Para reservas de vuelta, se debe proporcionar una dirección y coordenadas válidas.

Cuando se crea la reserva, el usuario creador se añade automáticamente como primer ocupante y el coche pasa a estado `RESERVA_PENDIENTE`.

---

### 4.6 Unirse a una reserva existente

Un usuario puede unirse a una reserva si cumple las siguientes condiciones:

- La reserva pertenece a su misma empresa.
- El coche aún no ha iniciado el trayecto.
- La hora de salida todavía no ha pasado.
- Quedan plazas disponibles.
- El usuario no está ya apuntado a esa reserva.
- El usuario no tiene otra reserva activa.
- El usuario no supera el límite diario de reservas de ese tipo.

Cuando un segundo usuario se une a la reserva, el coche pasa de `RESERVA_PENDIENTE` a `RESERVA_CONFIRMADA`. Si se llenan todas las plazas, el estado pasa a `COMPLETO`.

---

### 4.7 Reserva activa

Si el usuario tiene una reserva activa, la aplicación muestra una tarjeta superior gestionada por `ActiveReservationCard.js`.

Esta tarjeta permite ver:

- Matrícula del coche reservado.
- Tipo de trayecto.
- Destino.
- Hora de salida.
- Estado de la reserva.
- Ocupantes.
- Puntos previstos.
- Botones de acción según el rol del usuario.

Las acciones disponibles dependen de si el usuario es conductor o acompañante:

| Usuario | Acción |
|---|---|
| Conductor | Iniciar viaje |
| Conductor | Finalizar viaje |
| Conductor | Cancelar reserva antes de iniciar |
| Acompañante | Marcarse como listo |
| Acompañante | Cancelar participación antes de iniciar |

El conductor no necesita marcarse como listo. Los acompañantes sí pueden hacerlo antes del inicio del trayecto. El backend permite iniciar el viaje cuando llega la hora de salida o cuando todos los pasajeros activos se han marcado como listos.

---

### 4.8 Inicio y finalización del trayecto

Cuando el conductor inicia el viaje:

- Se valida que sea el creador de la reserva.
- Se comprueba que el trayecto se pueda iniciar.
- La hora de salida se actualiza al momento real de inicio.
- La hora estimada de llegada se recalcula manteniendo la duración prevista.
- El coche pasa a estado `EN_USO`.

Cuando el conductor finaliza el viaje:

- La reserva pasa a estado completado.
- El coche vuelve a estar `LIBRE`.
- La ubicación del coche se actualiza al destino del trayecto.
- Se asignan puntos responsables si el viaje tuvo al menos dos ocupantes.
- Los participantes activos pasan a estado completado dentro del historial.

---

### 4.9 Sistema de puntos responsables

Corporate Ride incluye un sistema de puntos para incentivar los viajes compartidos. Los puntos se calculan en el frontend a partir de la distancia aproximada del coche al destino.

La regla usada es:

```text
puntos = distancia_km * 10
```

Sin embargo, el backend solo asigna los puntos al finalizar el trayecto si el coche ha tenido al menos dos ocupantes. Si el usuario viaja solo, el trayecto puede completarse, pero no genera puntos.

Esta lógica evita premiar reservas individuales y refuerza el objetivo principal de la aplicación: compartir desplazamientos corporativos.

---

### 4.10 Cancelación de reservas

Antes de iniciar el viaje, cualquier usuario apuntado puede cancelar su participación.

El comportamiento depende de la situación:

- Si cancela un acompañante, se elimina su participación activa y se actualiza el número de plazas ocupadas.
- Si cancela el conductor y quedan otros usuarios, el primer ocupante restante pasa a ser el nuevo conductor.
- Si ya no queda ningún ocupante, la reserva se cancela por completo y el coche vuelve a estar libre.

El sistema mantiene un historial mediante la entidad `ReservationParticipant`, por lo que las cancelaciones no se pierden: se guardan como participaciones canceladas.

---

### 4.11 Historial y menú de usuario

El menú lateral, implementado en `MenuDrawer.js`, permite consultar información del perfil y del historial del usuario.

Incluye:

- Nombre del usuario.
- Empresa asociada.
- Puntos responsables acumulados.
- Reservas completadas.
- Reservas canceladas.
- Reservas caducadas.
- Rol del usuario en cada reserva: creador o acompañante.
- Número de ocupantes y puntos de cada trayecto.
- Botón para cerrar sesión.

La información se obtiene desde `/api/reservations/user/{userId}` y se construye a partir del historial de participación de cada usuario.

---

### 4.12 Caducidad automática de reservas

El backend incluye una tarea programada que se ejecuta cada minuto para detectar reservas que no han sido iniciadas a tiempo.

Si una reserva sigue activa, no ha comenzado y su hora de salida ha pasado hace más de 15 minutos, el sistema la marca como `EXPIRED` y libera el coche.

Esto evita que un vehículo quede bloqueado indefinidamente por una reserva que nunca se inició.

---

## 5. Arquitectura del backend

El backend sigue una estructura por capas típica de Spring Boot:

```text
controller  ->  service  ->  repository  ->  database
```

### 5.1 Controllers

Los controladores definen los endpoints REST que consume el frontend.

| Archivo | Responsabilidad |
|---|---|
| `AuthController.java` | Registro e inicio de sesión. |
| `CarController.java` | Consulta de coches disponibles, visibles o totales. |
| `CompanyController.java` | Consulta de empresas y códigos corporativos. |
| `OfficeController.java` | Consulta de oficinas asociadas a una empresa. |
| `ReservationController.java` | Creación, unión, inicio, finalización, cancelación e historial de reservas. |
| `UserController.java` | Consulta de información de usuario. |

### 5.2 Services

Los servicios contienen la lógica principal de negocio.

| Archivo | Responsabilidad |
|---|---|
| `AuthService.java` | Valida registros, comprueba duplicados y autentica usuarios. |
| `CarService.java` | Recupera coches y decide qué coches son visibles para cada usuario. |
| `CompanyService.java` | Gestiona empresas y oficinas. |
| `ReservationService.java` | Aplica toda la lógica de reservas, ocupantes, puntos, cancelaciones y caducidad. |
| `UserService.java` | Recupera datos actualizados de usuario. |

### 5.3 Repositories

Los repositorios extienden `JpaRepository` y permiten acceder a la base de datos sin escribir SQL manual para las operaciones básicas.

| Archivo | Entidad gestionada |
|---|---|
| `CarRepository.java` | Coches. |
| `CompanyRepository.java` | Empresas. |
| `OfficeRepository.java` | Oficinas. |
| `ReservationRepository.java` | Reservas. |
| `ReservationParticipantRepository.java` | Historial de participantes. |
| `UserRepository.java` | Usuarios. |

### 5.4 DTOs

Los DTOs definen los datos que entran y salen de la API. Esta separación evita enviar directamente las entidades de base de datos al frontend y permite construir respuestas adaptadas a la interfaz.

Ejemplos:

- `UserResponse`: datos públicos del usuario.
- `CarMapResponse`: información necesaria para pintar coches en el mapa.
- `ReservationResponse`: información completa de una reserva para la interfaz.
- `CreateReservationRequest`: datos necesarios para crear una reserva.
- `AuthRequest` y `RegisterRequest`: datos de login y registro.

### 5.5 Gestión de errores

El proyecto define una excepción propia, `AppException`, para los errores de negocio. Estos errores se capturan en `GlobalExceptionHandler`, que devuelve respuestas HTTP controladas con un mensaje en formato JSON.

Ejemplo de respuesta de error:

```json
{
  "error": "Ya tienes una reserva activa"
}
```

---

## 6. Modelo de datos

El modelo principal se compone de empresas, usuarios, oficinas, coches, reservas y participantes.

```mermaid
erDiagram
    COMPANY ||--o{ USER : tiene
    COMPANY ||--o{ OFFICE : tiene
    COMPANY ||--o{ RESERVATION : agrupa
    CAR ||--o{ RESERVATION : se_reserva
    USER ||--o{ RESERVATION : crea
    RESERVATION ||--o{ RESERVATION_PARTICIPANT : registra
    USER ||--o{ RESERVATION_PARTICIPANT : participa
    OFFICE ||--o{ RESERVATION : destino_ida
```

### 6.1 Entidades principales

#### `Company`

Representa una empresa cliente de Corporate Ride. Cada empresa tiene un nombre y un código corporativo único usado durante el registro.

#### `User`

Representa a un empleado registrado. Cada usuario pertenece a una empresa, tiene un DNI único, un correo único y un acumulado de puntos responsables.

#### `Office`

Representa una oficina corporativa. Cada oficina pertenece a una empresa y tiene dirección y coordenadas.

#### `Car`

Representa un vehículo disponible en la plataforma. Cada coche tiene matrícula, batería, estado, coordenadas y número total de plazas.

#### `Reservation`

Representa una reserva de coche. Guarda el coche, la empresa, el usuario creador, los ocupantes, el horario, el destino, el tipo de trayecto, los puntos previstos y el estado.

#### `ReservationParticipant`

Representa el historial de participación de un usuario en una reserva. Permite distinguir si un usuario sigue activo, ha cancelado o completó el viaje, además de guardar si se marcó como listo.

---

## 7. Estados principales

### 7.1 Estados de coche

```text
LIBRE -> RESERVA_PENDIENTE -> RESERVA_CONFIRMADA -> COMPLETO
                         \-> EN_USO -> LIBRE
```

- `LIBRE`: el coche se puede reservar.
- `RESERVA_PENDIENTE`: existe una reserva con un único ocupante.
- `RESERVA_CONFIRMADA`: existe una reserva con dos o más ocupantes.
- `COMPLETO`: no quedan plazas disponibles.
- `EN_USO`: el viaje ya ha comenzado.

### 7.2 Estados de reserva

Internamente, la reserva usa principalmente estos estados:

| Estado interno | Significado |
|---|---|
| `ACTIVE` | Reserva activa, pendiente o en curso. |
| `COMPLETED` | Trayecto finalizado. |
| `CANCELLED` | Reserva cancelada. |
| `EXPIRED` | Reserva caducada por no iniciarse a tiempo. |

Para el frontend, algunos estados se convierten a etiquetas más comprensibles:

| Estado visible | Significado |
|---|---|
| `PENDIENTE` | Reserva activa todavía no iniciada. |
| `EN_CURSO` | Trayecto iniciado. |
| `FINALIZADA` | Trayecto completado. |
| `CANCELADA` | Reserva cancelada. |
| `EXPIRED` | Reserva caducada. |

### 7.3 Estados de participante

| Estado | Significado |
|---|---|
| `ACTIVE` | El usuario sigue apuntado a la reserva. |
| `CANCELLED` | El usuario canceló su participación. |
| `COMPLETED` | El usuario completó el trayecto. |

---

## 8. Estructura del frontend

El frontend se encuentra dentro de `src/main/resources/static`, por lo que Spring Boot lo sirve automáticamente desde `http://localhost:8080`.

```text
src/main/resources/static/
├── index.html
├── app.js
├── styles.css
└── js/
    ├── components/
    │   ├── ActiveReservationCard.js
    │   ├── CarBottomSheet.js
    │   └── MenuDrawer.js
    ├── screens/
    │   └── MapScreen.js
    ├── services/
    │   ├── api.js
    │   ├── authService.js
    │   ├── carService.js
    │   ├── officeService.js
    │   ├── reservationService.js
    │   └── userService.js
    └── utils/
        ├── dateTime.js
        └── location.js
```

### 8.1 `index.html`

Contiene la estructura principal de la interfaz:

- Vista de autenticación.
- Formularios de login y registro.
- Contenedor del mapa.
- Barra superior flotante.
- Tarjeta de usuario.
- Tarjeta de reserva activa.
- Ficha inferior del coche.
- Menú lateral.
- Toasts de mensajes.

### 8.2 `app.js`

Gestiona la autenticación, la validación inicial de formularios y el cambio entre la vista de acceso y la vista principal de la aplicación.

También guarda y recupera el usuario activo desde `localStorage`.

### 8.3 `MapScreen.js`

Es el módulo principal de la pantalla del mapa. Se encarga de:

- Inicializar Leaflet.
- Cargar coches visibles.
- Cargar oficinas de la empresa.
- Cargar reserva activa e historial.
- Pintar marcadores de coches y oficinas.
- Gestionar selección de coche.
- Actualizar la interfaz después de reservar, unirse, cancelar, iniciar o finalizar.
- Mantener actualizada la reserva activa mediante refrescos periódicos.

### 8.4 Componentes

| Componente | Función |
|---|---|
| `CarBottomSheet.js` | Muestra la ficha del coche y permite reservar, unirse o cancelar. |
| `ActiveReservationCard.js` | Muestra la reserva activa y sus acciones principales. |
| `MenuDrawer.js` | Muestra perfil, puntos, historial y cierre de sesión. |

### 8.5 Servicios del frontend

Los servicios encapsulan las llamadas al backend:

| Servicio | Endpoints consumidos |
|---|---|
| `authService.js` | `/api/auth/login`, `/api/auth/register` |
| `carService.js` | `/api/cars/visible` |
| `officeService.js` | `/api/offices/company/{companyId}` |
| `reservationService.js` | `/api/reservations` y acciones sobre reservas |
| `userService.js` | `/api/users/{id}` |
| `api.js` | Función genérica `apiRequest()` |

### 8.6 Utilidades

| Archivo | Función |
|---|---|
| `dateTime.js` | Formateo y validación de fechas, límite de 12 horas y hora por defecto. |
| `location.js` | Cálculo de distancias, tiempos, puntos y validación de direcciones. |

---

## 9. API REST

### 9.1 Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registra un nuevo usuario asociado a una empresa. |
| `POST` | `/api/auth/login` | Inicia sesión con correo y contraseña. |

### 9.2 Empresas y oficinas

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/companies` | Devuelve todas las empresas disponibles. |
| `GET` | `/api/offices/company/{companyId}` | Devuelve las oficinas asociadas a una empresa. |

### 9.3 Coches

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/cars` | Devuelve todos los coches. |
| `GET` | `/api/cars/available` | Devuelve solo los coches libres. |
| `GET` | `/api/cars/visible?userId={id}` | Devuelve los coches visibles para un usuario. |

### 9.4 Usuarios

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/users/{id}` | Devuelve los datos actualizados de un usuario. |

### 9.5 Reservas

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/reservations` | Crea una nueva reserva. |
| `POST` | `/api/reservations/{id}/join` | Une un usuario a una reserva existente. |
| `POST` | `/api/reservations/{id}/ready` | Marca a un acompañante como listo. |
| `POST` | `/api/reservations/{id}/start` | Inicia el viaje. |
| `POST` | `/api/reservations/{id}/finish` | Finaliza el viaje. |
| `POST` | `/api/reservations/{id}/cancel` | Cancela la reserva o la participación del usuario. |
| `GET` | `/api/reservations/user/{userId}/active` | Devuelve la reserva activa del usuario, si existe. |
| `GET` | `/api/reservations/user/{userId}` | Devuelve el historial de reservas del usuario. |

---

## 10. Base de datos

La aplicación utiliza PostgreSQL como base de datos principal. Hibernate está configurado para actualizar el esquema de forma automática mediante:

```properties
spring.jpa.hibernate.ddl-auto=update
```

El archivo `src/main/resources/seed-postgres.sql` contiene datos iniciales para poder probar la aplicación:

- Empresas.
- Oficinas.
- Usuarios de ejemplo.
- Coches distribuidos por Madrid.

Este seed no se ejecuta automáticamente en cada arranque, ya que `spring.sql.init.mode=never` evita duplicados o conflictos en una base compartida.

Para cargar los datos iniciales manualmente puede utilizarse:

```bash
psql "postgresql://usuario:password@HOST:PORT/NOMBRE_BD?sslmode=require" -f src/main/resources/seed-postgres.sql
```

---

## 11. Instalación y ejecución

### 11.1 Requisitos previos

Para ejecutar el proyecto es necesario tener instalado:

- Java 21.
- Maven.
- PostgreSQL o acceso a una base PostgreSQL remota.

### 11.2 Configuración de base de datos

La conexión a PostgreSQL debe configurarse en `src/main/resources/application.properties` o mediante variables de entorno.

Por seguridad, no se recomienda subir credenciales reales al repositorio. Una configuración segura sería:

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver
```

Ejemplo en Mac/Linux:

```bash
export DB_URL="jdbc:postgresql://HOST:PORT/NOMBRE_BD?sslmode=require"
export DB_USERNAME="usuario"
export DB_PASSWORD="password"
```

Ejemplo en Windows PowerShell:

```powershell
$env:DB_URL="jdbc:postgresql://HOST:PORT/NOMBRE_BD?sslmode=require"
$env:DB_USERNAME="usuario"
$env:DB_PASSWORD="password"
```

### 11.3 Arranque del proyecto

Desde la raíz del proyecto:

```bash
mvn spring-boot:run
```

La aplicación quedará disponible en:

```text
http://localhost:8080
```

Al estar el frontend dentro de `src/main/resources/static`, no hace falta arrancar un servidor frontend independiente. Spring Boot sirve directamente la web y también expone la API REST.

---

## 12. Flujo de uso recomendado

1. Abrir `http://localhost:8080`.
2. Iniciar sesión con un usuario de prueba o crear una cuenta nueva.
3. Visualizar los coches disponibles en el mapa.
4. Seleccionar un coche libre.
5. Elegir tipo de trayecto:
   - Ida a una oficina de la empresa.
   - Vuelta a una dirección de Madrid.
6. Seleccionar la hora de inicio.
7. Crear la reserva.
8. Desde otro usuario de la misma empresa, abrir la aplicación y unirse al viaje.
9. Marcarse como listo si se entra como acompañante.
10. Iniciar el trayecto desde el usuario creador.
11. Finalizar el viaje.
12. Comprobar que se asignan puntos si había al menos dos ocupantes.
13. Revisar el historial en el menú lateral.

---

## 13. Datos de prueba

El seed incluye usuarios de ejemplo. Algunos de ellos son:

| Usuario | Email | Contraseña | Empresa |
|---|---|---|---|
| Ana López | `ana@telefonica.test` | `1234` | Telefónica |
| Carlos Martín | `carlos@telefonica.test` | `1234` | Telefónica |
| Marta Ruiz | `marta@telefonica.test` | `1234` | Telefónica |
| Diego Santos | `diego@repsol.test` | `1234` | Repsol |
| Nerea Gil | `nerea@endesa.test` | `1234` | Endesa |
| Pablo Vega | `pablo@accenture.test` | `1234` | Accenture |

Estos usuarios permiten probar el comportamiento multiempresa. Por ejemplo, dos usuarios de Telefónica podrán compartir una reserva entre ellos, pero un usuario de Repsol no debería poder unirse a una reserva de Telefónica.

---

## 14. Estructura del repositorio

```text
CI2-LAB-2026/
├── pom.xml
├── README.md
├── .gitignore
├── .env.example
└── src/
    └── main/
        ├── java/
        │   └── com/ci2lab/carsharing/
        │       ├── CarsharingApplication.java
        │       ├── config/
        │       │   ├── DatabaseMigrationConfig.java
        │       │   └── WebConfig.java
        │       ├── controller/
        │       │   ├── AuthController.java
        │       │   ├── CarController.java
        │       │   ├── CompanyController.java
        │       │   ├── OfficeController.java
        │       │   ├── ReservationController.java
        │       │   └── UserController.java
        │       ├── dto/
        │       ├── exception/
        │       ├── model/
        │       ├── repository/
        │       └── service/
        └── resources/
            ├── application.properties
            ├── seed-postgres.sql
            ├── imagenes/
            │   └── coche.png
            └── static/
                ├── index.html
                ├── app.js
                ├── styles.css
                └── js/
                    ├── components/
                    ├── screens/
                    ├── services/
                    └── utils/
```

---

## 15. Decisiones de diseño

### 15.1 Backend y frontend en el mismo proyecto

El frontend se ha colocado dentro de `src/main/resources/static` para que Spring Boot lo sirva automáticamente. Esto simplifica el despliegue y evita tener que levantar dos aplicaciones separadas durante la demo.

### 15.2 Separación por capas

El backend se divide en controladores, servicios, repositorios, modelos y DTOs. Esta estructura permite separar responsabilidades:

- Los controladores reciben las peticiones.
- Los servicios aplican reglas de negocio.
- Los repositorios acceden a los datos.
- Los DTOs definen la información intercambiada con el frontend.
- Los modelos representan las tablas de la base de datos.

### 15.3 Historial de participantes

En lugar de guardar únicamente la lista actual de usuarios apuntados, el proyecto incluye una entidad `ReservationParticipant`. Esta decisión permite conservar información histórica sobre usuarios que cancelan, completan el trayecto o se marcan como listos.

Gracias a esta estructura, el menú lateral puede mostrar reservas completadas, canceladas y caducadas de forma más precisa.

### 15.4 Sistema de puntos vinculado a ocupación

Los puntos solo se asignan si el trayecto se completa con al menos dos ocupantes. Esta regla está alineada con el objetivo de reducir trayectos individuales y fomentar que los empleados compartan coche.

### 15.5 Validación de direcciones para trayectos de vuelta

Para los trayectos de vuelta se utiliza geocodificación con Nominatim. Esto permite convertir una dirección escrita por el usuario en coordenadas reales y calcular distancia, tiempo y puntos aproximados.

---

## 16. Limitaciones y posibles mejoras

El proyecto funciona como MVP académico, pero podrían incorporarse mejoras para una versión de producción:

- Cifrado de contraseñas con `BCrypt`.
- Autenticación mediante JWT o sesiones seguras.
- Roles de usuario y panel de administración.
- Gestión avanzada de disponibilidad de vehículos.
- Integración con servicios reales de rutas para calcular tiempos más precisos.
- Sustitución del cálculo de distancia en línea recta por distancia real de conducción.
- Despliegue en una plataforma pública con variables de entorno seguras.
- Tests unitarios y de integración.
- Mejor control de concurrencia cuando varios usuarios intentan reservar o unirse al mismo coche a la vez.
- Gestión de mantenimiento, carga de batería y disponibilidad real de flota.

---

## 17. Conclusión

Corporate Ride es una aplicación web fullstack que integra frontend, backend y base de datos para resolver un caso realista de movilidad corporativa compartida. El sistema permite registrar usuarios por empresa, visualizar coches en un mapa, crear reservas, compartir trayectos, gestionar ocupantes, controlar estados de vehículos y asignar puntos responsables al completar viajes compartidos.

El proyecto destaca por combinar una interfaz visual basada en mapa con una API REST estructurada y una lógica de negocio que controla restricciones importantes como empresa del usuario, plazas disponibles, límites de reserva, caducidad automática y asignación de puntos. De esta forma, Corporate Ride no se limita a mostrar coches, sino que gestiona el ciclo completo de una reserva corporativa desde su creación hasta su finalización.
