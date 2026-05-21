# 🌌 AniNexo — La Dimensión Social del Anime

> **AniNexo** es una plataforma híbrida de nivel Enterprise que fusiona una **Enciclopedia de Anime (Wikipedia)** robusta con una **Red Social Integrada** de alto rendimiento, complementada por un asistente cognitivo con Inteligencia Artificial llamado **Nexo**.

Diseñado bajo una estética de diseño *Dark-Premium* futurista con acentos en cian brillante, el ecosistema está construido para proporcionar una experiencia de usuario inmersiva, interactiva, fluida y altamente personalizada.

---

## 🚀 Características Clave

### 1. La Enciclopedia Completa (Wikipedia)
*   **Integración AniList GraphQL:** Sincronización dinámica de miles de títulos de anime, películas, personajes y actores de doblaje (seiyuus).
*   **Caché Progresivo Inteligente:** Capa proxy en el backend respaldada por MySQL y Redis que almacena temporalmente consultas recurrentes para optimizar rendimiento y mitigar límites de API (Rate Limits).
*   **Fichas de Datos Detalladas:** Fichas técnicas avanzadas conectadas directamente al ecosistema social.

### 2. Ecosistema Social Integrado
*   **Feed Dinámico Contextual:** Publicaciones, comentarios, me gusta polimórficos, menciones de anime y compartidos en tiempo real.
*   **Identidad Inteligente (ADN Nexo):** Cuestionario de onboarding interactivo que analiza el perfil psicológico, afinidades de géneros y emociones del usuario, asignándole un *Arquetipo* (ej. "Dark Strategist") y un color de acento único para su perfil.
*   **Historias de Usuario (UserStories):** Publicación de contenido multimedia efímero en Base64 con expiración programada de 24 horas.
*   **Mensajería Real-Time:** Chats privados uno a uno y grupales a baja latencia impulsados por Socket.IO.
*   **Sistema de Logros e Insignias (Badges):** Concesión automatizada de medallas basadas en actividades del usuario (ej: primer post, posts populares).

### 3. Nexo: Asistente Cognitivo de IA
*   **Contextualización:** El asistente reconoce la sección actual, el perfil de ADN Nexo y el anime visualizado en pantalla.
*   **Diferenciación de Roles (Monetización):**
    *   **Usuarios Premium:** Acceso a respuestas profundas, detalladas, análisis psicológicos del catálogo de anime y una interfaz flotante avanzada.
    *   **Usuarios Estándar:** Respuestas breves con una personalidad humorística/sarcástica ("tsundere") para minimizar costos de tokens de API.

### 4. Capa Administrativa y Suite de Moderación
*   **Dashboard Enterprise:** Gráficos estadísticos dinámicos del crecimiento de usuarios, posts, mensajes y conversiones Premium mediante agregaciones analíticas diarias (`AnalyticsSnapshot`).
*   **Moderación Multi-Nivel:** Soporte para Reportes, Advertencias (Warnings), Silencios Silenciosos (Shadowbans/Mutes interceptados por Sockets), y Baneos de cuenta.
*   **Sistema de Apelaciones (Appeals):** Interfaz para que usuarios sancionados puedan apelar medidas disciplinarias desde su perfil.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | Next.js 15 (App Router), React, Zustand (Estado global), Tailwind CSS & Vanilla CSS (Alineado con Tokens de Diseño), Socket.IO Client, Axios |
| **Backend** | Node.js, Express, TypeScript, Socket.IO Server, Prisma ORM, Nodemailer, Passport.js (Google OAuth 2.0) |
| **Bases de Datos** | MySQL (Persistencia relacional única fuente de verdad), Redis (Caché de consultas, Lista negra de tokens JWT, Rate Limiting) |
| **IA** | OpenAI API (GPT Models) / Servicio de Mock de Respaldo Integrado |

---

## 📐 Arquitectura del Sistema y Flujo de Datos

El sistema sigue un patrón de diseño basado en dominios (**DDD - Domain Driven Design**) y una separación estricta de responsabilidades (Frontend de presentación, Backend de control y servicios de negocio persistentes).

```mermaid
flowchart TD
    subgraph Cliente [Capa de Presentación (Next.js 15)]
        UI[Interfaz de Usuario / Zustand]
        WS_C[Socket.IO Client]
    end

    subgraph Servidor [Capa de Negocio (Express / Node.js)]
        API[Router & Controllers]
        WS_S[Servidor Socket.IO]
        Services[Servicios de Dominio - Auth, Anime, Feed, Nexo]
    end

    subgraph Datos [Capa de Datos y Persistencia]
        DB[(MySQL / Prisma)]
        Cache[(Redis Cache & Events)]
        AniList[External API AniList GraphQL]
        OpenAI[External API OpenAI GPT]
    end

    UI -->|HTTP Requests| API
    UI <-->|WebSockets| WS_C
    WS_C <-->|Protocolo TCP/WS| WS_S
    API --> Services
    WS_S --> Services
    
    Services -->|Consultas Relacionales| DB
    Services -->|Caché & Rate-Limiting| Cache
    Services -->|Proxy & Sync| AniList
    Services -->|Generación Cognitiva| OpenAI
```

---

## 📂 Estructura del Proyecto

El monorrepósito está organizado de la siguiente manera:

```text
aninexo/
├── client/                 # Aplicación Next.js 15 (Frontend)
│   ├── src/
│   │   ├── app/            # App Router (auth, dashboard, admin, profile)
│   │   ├── components/     # UI base y módulos sociales (feed, list, nexo)
│   │   ├── hooks/          # Custom Hooks (useAuth, useSocket)
│   │   ├── store/          # Zustand State Management
│   │   └── styles/         # Tokens de diseño y CSS modularizado
│   └── package.json
│
├── server/                 # Servidor Node.js / Express (Backend)
│   ├── prisma/             # Schema de base de datos enterprise y migraciones
│   ├── src/
│   │   ├── index.ts        # Inicialización del servidor
│   │   ├── sockets.ts      # Manejador central de WebSockets
│   │   ├── lib/            # Singletons (Prisma, Redis, Logger, Queue)
│   │   ├── middleware/     # JWT Auth, Roles (RBAC), Error Handler, Sanitización
│   │   └── modules/        # Arquitectura modular de dominio (Auth, Anime, Feed, Nexo...)
│   └── package.json
│
├── docs/                   # Documentación detallada de arquitectura, decisiones y seguridad
├── memory/                 # Historial del proyecto y estados de fases
└── tasks/                  # Hojas de ruta y tareas de desarrollo
```

---

## ⚙️ Guía de Instalación y Configuración

### Prerrequisitos
*   **Node.js** (v18 o superior)
*   **MySQL** (Instancia local o en la nube)
*   **Redis** (Opcional en desarrollo, recomendado para optimizaciones)

### 1. Clonar el repositorio y configurar variables de entorno
1.  Duplica el archivo de entorno en el servidor:
    ```bash
    cp server/.env.example server/.env
    ```
2.  Edita `server/.env` con tus credenciales locales de MySQL, tu clave secreta de JWT, tu clave de OpenAI (opcional para desarrollo, el sistema contiene un simulador automático) y tus credenciales SMTP de correo.

### 2. Inicializar la Base de Datos (Prisma)
Accede al directorio del servidor y ejecuta las migraciones de base de datos para generar las tablas y relaciones relacionales estructuradas:
```bash
cd server
npx prisma migrate dev --name init
```
*(Opcional)* Si cuentas con un script de sembrado para catálogos iniciales:
```bash
npx prisma db seed
```

### 3. Iniciar el Servidor Backend
Dentro de la carpeta `server/`, instala dependencias e inicia el servidor en modo desarrollo (se ejecutará en `http://localhost:3001`):
```bash
npm install
npm run dev
```

### 4. Iniciar el Cliente Frontend
Abre otra terminal en la raíz del proyecto, accede a `client/`, instala dependencias e inicia el servidor de desarrollo (se ejecutará en `http://localhost:3000`):
```bash
cd client
npm install
npm run dev
```

---

## 🔒 Arquitectura de Seguridad Implementada

*   **Autenticación JWT Robusta:** Access Tokens de corta duración (15 min) y Refresh Tokens de larga duración (7 días) persistidos en base de datos con detección de reutilización maliciosa y lista negra basada en Redis.
*   **Protección XSS & CSRF:** Sanitización activa de peticiones (`body`, `query`, `params`) y cookies seguras con directivas `HttpOnly` y `SameSite: Lax`.
*   **Prevención de DoS & Spam:** Rate Limiter global y específico para logins e interacciones con el Asistente Nexo.
*   **Prisma ORM Secure Queries:** Consultas 100% parametrizadas para neutralizar cualquier vulnerabilidad de Inyección SQL.

---

## 👥 Contribuciones

1.  Crea un Fork del proyecto.
2.  Crea una rama para tu característica: `git checkout -b feature/nueva-caracteristica`
3.  Realiza el commit de tus cambios: `git commit -m "feat: agrega nueva característica social"`
4.  Realiza el push a la rama: `git push origin feature/nueva-caracteristica`
5.  Abre un Pull Request en GitHub.

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para obtener más información.
