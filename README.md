# Corporate Carsharing

Backend Spring Boot con frontend estatico para carsharing corporativo.

## Base de datos principal: PostgreSQL

La configuracion principal usa PostgreSQL mediante variables de entorno. No subas al repositorio URLs reales, usuarios, passwords, dumps privados ni archivos `.env`.

### Mac/Linux

```bash
export DB_URL="jdbc:postgresql://HOST:PORT/NOMBRE_BD"
export DB_USERNAME="usuario"
export DB_PASSWORD="password"
```

Si la base requiere SSL, anadelo en la URL:

```bash
export DB_URL="jdbc:postgresql://HOST:PORT/NOMBRE_BD?sslmode=require"
```

### Windows PowerShell

```powershell
$env:DB_URL="jdbc:postgresql://HOST:PORT/NOMBRE_BD"
$env:DB_USERNAME="usuario"
$env:DB_PASSWORD="password"
```

Con SSL:

```powershell
$env:DB_URL="jdbc:postgresql://HOST:PORT/NOMBRE_BD?sslmode=require"
```

### Arrancar backend

```bash
mvn spring-boot:run
```

El backend arranca en `http://localhost:8080`. Con PostgreSQL, Hibernate crea o actualiza las tablas con `spring.jpa.hibernate.ddl-auto=update`.

### Seed inicial

El archivo `src/main/resources/seed-postgres.sql` contiene datos iniciales de empresas, usuarios, oficinas y coches. Ejecutalo una sola vez contra la base PostgreSQL remota, despues de que la app haya creado las tablas.

No se ejecuta automaticamente en cada arranque: `spring.sql.init.mode=never` esta configurado en el perfil principal para evitar duplicados o conflictos en la base compartida.

Ejemplo con `psql`:

```bash
psql "postgresql://usuario:password@HOST:PORT/NOMBRE_BD?sslmode=require" -f src/main/resources/seed-postgres.sql
```

### Probar backend

```bash
curl -i http://localhost:8080/api/cars/visible?userId=1
curl -i http://localhost:8080/api/reservations/user/1
curl -i http://localhost:8080/api/companies
```

Para validar persistencia compartida, crea una reserva desde el frontend o API, recarga la pagina y comprueba que sigue existiendo. Al cancelarla debe quedar como `CANCELLED` en PostgreSQL y el historial debe leerse desde la base.
