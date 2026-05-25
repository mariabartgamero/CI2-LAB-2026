# Corporate Carsharing

App fullstack MVP para carsharing corporativo.

## Stack

- Backend: Spring Boot 3, Java 21
- Frontend: HTML, CSS y JavaScript vanilla
- Base de datos: H2 embebida en fichero
- Auth: JWT + Spring Security

## Ejecutar

Ejecutar backend:

```bash
mvn spring-boot:run
```

Abrir frontend:

```text
http://localhost:8080
```

Consola H2:

```text
http://localhost:8080/h2-console
```

Datos de conexion:

```text
JDBC URL: jdbc:h2:file:./dbdata
User Name: sa
Password:
```

## Flujo MVP

1. Crear cuenta en `/register.html` indicando nombre, email, password y empresa.
2. Entrar en `/login.html`.
3. Buscar coches disponibles desde el dashboard.
4. Crear una reserva indicando ID del coche, origen, destino y franja horaria.
5. Ver trayectos disponibles de la empresa.
6. Unirse o cancelar reservas.

## Endpoints principales

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET  /api/companies
POST /api/companies
GET  /api/companies/{id}

GET  /api/cars/available?lat=40.4168&lng=-3.7038&radiusKm=5
POST /api/cars
GET  /api/cars/{id}

POST /api/reservations
GET  /api/reservations/me
GET  /api/reservations/company
GET  /api/reservations/{id}
POST /api/reservations/{id}/join
POST /api/reservations/{id}/cancel
POST /api/reservations/{id}/complete

GET  /api/rides/company/available
```

## Datos iniciales

El registro crea la empresa si no existe. Para crear coches, usa `POST /api/cars` con un token JWT:

```json
{
  "brand": "Toyota",
  "model": "Corolla",
  "licensePlate": "1234ABC",
  "capacity": 5,
  "latitude": 40.4168,
  "longitude": -3.7038
}
```
