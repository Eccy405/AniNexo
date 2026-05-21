# Arquitectura de Seguridad Enterprise - AniNexo

Este documento describe las medidas de seguridad implementadas en la plataforma AniNexo para garantizar la integridad, confidencialidad y disponibilidad de los datos.

## 1. Autenticación y Autorización

### JWT (JSON Web Tokens) con Rotación
- **Access Tokens:** Corta duración (15 min) para minimizar el impacto de un robo.
- **Refresh Tokens:** Larga duración (7 días), almacenados en base de datos.
- **Detección de Reutilización:** Si se intenta usar un Refresh Token que ya fue rotado, se considera una brecha de seguridad y se invalidan inmediatamente TODOS los tokens activos de ese usuario.
- **Blacklist:** Soporte para invalidación inmediata vía Redis.

### OAuth 2.0
- Soporte para autenticación delegada mediante Google y Discord, vinculando cuentas sociales a perfiles de AniNexo de forma segura.

## 2. Protección de Capa de Aplicación

### Rate Limiting (Redis-backed)
- **Global:** Limita el tráfico general para prevenir DoS.
- **Autenticación:** Límites estrictos en login y registro para prevenir ataques de fuerza bruta.
- **IA Nexo:** Control de cuotas para evitar el drenaje de tokens de OpenAI.

### Sanitización y XSS
- Todo el contenido de entrada (`body`, `query`, `params`) es procesado por un middleware de sanitización basado en `DOMPurify` para eliminar scripts maliciosos.

### Anti-Spam y Anti-Bots
- **Honeypot:** Campos invisibles en formularios para detectar bots automatizados.
- **Similitud de Contenido:** Bloqueo de mensajes idénticos enviados en ráfaga.

## 3. Seguridad de Datos e Infraestructura

### SQL Injection
- Uso estricto de **Prisma ORM**, que utiliza consultas parametrizadas por defecto, eliminando el riesgo de inyección SQL.

### Security Headers (Helmet)
- Implementación de cabeceras CSP (Content Security Policy), HSTS, y protección contra Clickjacking (Frameguard).

### CSRF
- Protección mediante tokens CSRF en cookies con atributos `HttpOnly` y `SameSite: Lax`.

## 4. Auditoría y Monitoreo

### Logs de Seguridad
- Registro detallado de eventos de seguridad (fallos de login, accesos de admin, cambios de rol) en `logs/security.log`.
- Almacenamiento persistente en la tabla `SecurityLog` para auditorías históricas.

### Monitoreo Admin
- Acceso a rutas `/admin` protegido por roles jerárquicos (`ADMIN`, `SUPERADMIN`) y verificación de sesión reciente.

## 5. Seguridad Premium
- Middleware `requirePremium` que valida en tiempo real el estado de la suscripción y la fecha de expiración, bloqueando el acceso a funciones avanzadas de la IA Nexo.

---
*AniNexo Security Architecture v1.0 - Implementada y Documentada.*
