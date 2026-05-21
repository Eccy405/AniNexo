# Arquitectura Enterprise: AniNexo (Wikipedia & Social Network)

Este documento define la arquitectura técnica detallada y exhaustiva para AniNexo, una plataforma híbrida que combina una enciclopedia de anime (Wikipedia) con una red social integrada, garantizando escalabilidad, modularidad y separación de responsabilidades para un entorno Enterprise preparado para millones de usuarios.

## 1. Estructura de Carpetas y Módulos

### 1.1 Estructura Backend (Node.js / Express / Prisma)
```text
server/
├── prisma/               
│   └── schema.prisma     # Definición de Base de Datos y migraciones (Modelos Enterprise)
├── src/
│   ├── index.ts          # Punto de entrada (Setup Express, HTTP Server)
│   ├── sockets.ts        # Servidor WebSockets (Socket.IO)
│   ├── lib/              
│   │   ├── prisma.ts     # Cliente singleton Prisma (Conexión persistente MySQL)
│   │   └── redis.ts      # Cliente Redis (Gestión de Caché y Pub/Sub)
│   ├── middleware/       
│   │   ├── auth.ts       # Verificación JWT
│   │   ├── role.ts       # RBAC (Role-Based Access Control)
│   │   └── error.ts      # Manejador centralizado de excepciones
│   └── modules/          # Arquitectura basada en dominios (DDD)
│       ├── auth/         # Autenticación, JWT, Hash de contraseñas
│       ├── anime/        # Proxies e integración con AniList GraphQL
│       ├── profile/      # Perfiles públicos, biografía, contadores
│       ├── list/         # Listas de seguimiento (Viendo, Completado, Score)
│       ├── feed/         # Timeline, Posts, y Algoritmos de ordenamiento
│       ├── social/       # Interacciones (Likes polimórficos, Follows)
│       ├── messaging/    # Chats 1a1, persistencia de mensajes
│       ├── moderation/   # Reportes, Mutes (Shadowban local), Bans
│       ├── admin/        # Configuración global, panel de control
│       └── nexo/         # IA (OpenAI), orquestación de system prompts
```

### 1.2 Estructura Frontend (Next.js 15)
```text
client/
├── src/
│   ├── app/              # App Router (Next.js)
│   │   ├── (auth)/       # Rutas públicas (Login, Register)
│   │   ├── dashboard/    # Rutas privadas protegidas (Feed, Perfil, Listas)
│   │   ├── admin/        # Rutas exclusivas (Panel de Moderación y Analytics)
│   │   └── layout.tsx    # Layout raíz (Providers de Contexto y Temas)
│   ├── components/
│   │   ├── ui/           # Sistema de Diseño Base (Botones, Inputs, Cards, Modales)
│   │   ├── feed/         # Componentes específicos del muro social
│   │   ├── list/         # Cuadrículas de anime y controles de filtrado
│   │   ├── nexo/         # Interfaz flotante/lateral exclusiva del asistente IA
│   │   └── layout/       # Sidebars de navegación dinámica
│   ├── hooks/            # Custom Hooks (useAuth, useSocket, useIntersectionObserver)
│   ├── lib/              # Utilidades, Fetchers (Axios/Fetch wrappers), Socket Client
│   ├── store/            # Estado global del cliente (Zustand)
│   └── styles/           # Sistema de Diseño CSS genérico y Tokens de diseño
```

## 2. Separación de Responsabilidades y Flujos de Datos

La arquitectura sigue un patrón estricto MVC y DDD (Domain-Driven Design):
- **Capa de Presentación (Frontend):** React/Next.js se encarga de renderizar la enciclopedia (Wikipedia), el estado social, reaccionar a WebSockets y capturar interacciones. No almacena lógica de negocio.
- **Capa de Enrutamiento y Control (Backend - Controllers):** Valida los *payloads* HTTP, maneja códigos de estado HTTP y delega el trabajo pesado.
- **Capa de Negocio (Backend - Services):** Contiene el 100% de la lógica (ej. Validar si un usuario puede dar like, procesar IA, emitir eventos a Redis/Socket).
- **Capa de Persistencia (Base de Datos):** MySQL actúa como única fuente de la verdad para datos relacionales (Prisma). Redis actúa como sistema de eventos y caché en memoria.

## 3. Arquitecturas Específicas

### 3.1 Arquitectura de Tiempo Real y Sistema de Eventos
El sistema en tiempo real usa **Socket.IO**.
- El servidor inicializa una conexión y los usuarios se unen a "Rooms" (ej. `room_userId`, `room_conversationId`).
- **Event Bus (Pub/Sub):** En un futuro escalado, se usa Redis Pub/Sub para que múltiples instancias de Node.js puedan emitir eventos de WebSocket a usuarios conectados en otros servidores.

### 3.2 Arquitectura Nexo (Asistente IA)
Nexo funciona como una capa inteligente que interviene en el frontend.
- **Contexto de Inyección:** Nexo recibe la ruta en la que está el usuario y la información del anime en pantalla.
- **Diferenciación de Roles:** Si el usuario es `PREMIUM`, Nexo usa un *System Prompt* elegante, prolijo, y un límite alto de tokens. Si es `USER`, Nexo usa un prompt sarcástico ("tsundere") limitando los tokens para ahorrar costos de API.

### 3.3 Integración AniList y Sistema Caché
Dado que AniList limita las peticiones (rate limiting), el backend actúa como un Proxy inverso con Caché.
- Toda petición a AniList pasa por `AnimeService`.
- Se revisa Redis/MySQL temporal para ver si el ID del anime ya fue consultado en las últimas 24 horas. Si es así (Cache HIT), se ahorra la petición.

### 3.4 Sistema de Moderación y Panel Admin
La moderación es asíncrona.
- Usuarios envían reportes.
- El Panel Admin (Ruta Frontend `/admin` protegida por `role === 'ADMIN'`) consolida reportes.
- El Admin ejecuta una sanción. Si es `MUTE`, el middleware de Sockets intercepta y bloquea silenciosamente cualquier mensaje del usuario. Si es `BAN`, el token JWT se añade a una *blacklist* de Redis.

### 3.5 Feature Flags y Mantenimiento
La base de datos contiene una tabla `SystemSettings`.
- La bandera `MAINTENANCE_MODE` puede activarse en tiempo real desde el Panel Admin.
- Un Middleware en Express verifica en Caché esta bandera. Si está activa, rechaza todas las peticiones con 503, excepto si el token JWT pertenece a un `SUPERADMIN`.

### 3.6 Sistema de Analytics
- Un proceso recurrente (Cron) o triggers SQL agrupan la creación de posts, registros y mensajes por día.
- Se almacenan en `AnalyticsSnapshot`.
- El frontend consume estos *snapshots* para generar gráficos de Chart.js en el Panel Admin.

---

## 4. Diagramas de Flujos Conceptuales Completos

### 4.1 Flujo de Autenticación y Premium
```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend (Auth)
    participant DB as Base de Datos

    U->>F: Introduce Email y Contraseña
    F->>B: POST /api/auth/login
    B->>DB: Consulta User por Email
    DB-->>B: Retorna Hash y Roles
    B->>B: Verifica bcrypt hash
    B-->>F: Retorna JWT y { isPremium: true }
    F->>F: Almacena en localStorage
    F->>U: Redirige a Dashboard (UI Premium Desbloqueada)
```

### 4.2 Flujo de Mensajería (Chat)
```mermaid
sequenceDiagram
    participant U1 as Usuario A
    participant F as Frontend (Socket)
    participant S as Socket.IO (Server)
    participant B as MessagingService
    participant U2 as Usuario B

    U1->>F: Escribe mensaje a B
    F->>S: EMIT 'send_message' { text, convId }
    S->>B: Llama a persistir mensaje
    B->>B: Verifica bloqueos/mutes en DB
    B->>S: Mensaje Guardado
    S->>F: EMIT 'new_message' (A actualiza UI)
    S->>U2: EMIT 'new_message' (B recibe en vivo)
```

### 4.3 Flujo de Sincronización y Caché (AniList)
```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as AnimeService
    participant C as Redis/Cache DB
    participant AL as AniList GraphQL

    F->>B: GET /api/anime/123
    B->>C: Verifica Caché
    alt Caché Expirada o Vacía (MISS)
        C-->>B: null
        B->>AL: Petición GraphQL
        AL-->>B: JSON detallado
        B->>C: Guarda JSON (TTL: 24h)
    else Caché Activa (HIT)
        C-->>B: Retorna JSON guardado
    end
    B-->>F: Retorna Data al usuario
```

### 4.4 Flujo de Reportes y Moderación
```mermaid
sequenceDiagram
    participant U as Usuario C
    participant B as ModerationService
    participant DB as MySQL (Reports)
    participant A as Administrador

    U->>B: Reporta Post (Spam)
    B->>DB: Crea ReportStatus = PENDING
    DB-->>B: OK
    A->>B: Entra al Panel Admin (Ver Reportes)
    B->>DB: Lee PENDING
    A->>B: Resuelve -> Banear Usuario
    B->>DB: Actualiza User.status = BANNED
    B->>B: Invalida JWT actual
```

### 4.5 Flujo de Notificaciones (Event System)
```mermaid
sequenceDiagram
    participant U1 as Usuario A (Emisor)
    participant B as Backend Service
    participant R as Redis (Event Bus)
    participant S as Socket.IO
    participant U2 as Usuario B (Receptor)

    U1->>B: Da 'Like' al Post de Usuario B
    B->>B: Persiste Like en MySQL
    B->>R: PUBLISH 'user_notification' { tipo: 'like', to: B }
    R->>S: Consumo interno del Worker
    S->>U2: EMIT 'notification' a la room del Usuario B
    U2->>U2: Muestra toast/campana en UI
```

### 4.6 Flujo de Recomendaciones de IA
```mermaid
flowchart TD
    A[Usuario navega Perfil] --> B[Frontend pide Recomendación a Nexo]
    B --> C[Backend carga Lista de Animes del Usuario]
    C --> D[Construcción del Prompt Contextual]
    D --> E{Es Premium?}
    E -->|Sí| F[Prompt Detallado + Análisis Psicológico de gustos]
    E -->|No| G[Prompt Estándar de 2 líneas]
    F --> H[OpenAI API]
    G --> H
    H --> I[Devuelve 3 Animes Similares]
    I --> J[UI Muestra "Nexo Recomienda..."]
```

---
## 5. Mandato de Integridad de Datos

Para asegurar que AniNexo mantenga su robustez Enterprise, se establece la siguiente regla de oro:

> [!IMPORTANT]
> **Conectividad Total:** Todo cambio o nueva funcionalidad que se integre en la plataforma debe estar obligatoriamente conectado a la base de datos (MySQL/Prisma). No se permiten estados volátiles o placeholders en componentes críticos.
>
> **Sincronización de Esquema:** Cualquier modificación en la lógica de negocio que requiera nuevos datos debe verse reflejada inmediatamente en el `schema.prisma`, ejecutando las migraciones o actualizaciones necesarias (`db push`) para mantener la coherencia entre el código y la persistencia.

---
*Documento Arquitectónico Enterprise Finalizado - Listo para auditoría y ejecución.*
