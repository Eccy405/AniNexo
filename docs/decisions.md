# Registro de Decisiones Técnicas (ADR)

## Decisión 001: Esquema Prisma Monolítico
- **Fecha:** Fase 3 (Revisión de Arquitectura)
- **Contexto:** El usuario solicitó asegurar que la plataforma fuera 100% fiel al prompt original (Red Social Anime Enterprise). Faltaban módulos de bases de datos para Likes, Seguidores, Moderación y Mensajes.
- **Decisión:** Se reestructuró `schema.prisma` en un único archivo pero fuertemente modularizado mediante comentarios. Se añadieron más de 10 modelos nuevos y múltiples relaciones cruzadas complejas (ej. relaciones polimórficas de Likes usando claves opcionales).
- **Consecuencias:** 
  - (+) El esquema ahora soporta escalabilidad masiva y cubre el 100% del requerimiento social y administrativo.
  - (+) La migración no rompe los datos existentes (añadido incremental).
  - (-) Las consultas complejas (como obtener un Post con sus Likes y comentarios) requerirán el uso intensivo de `include` en Prisma, lo que debe ser monitoreado para no impactar el rendimiento.

## Decisión 002: Integración Híbrida Nexo (IA)
- **Fecha:** Fase 3
- **Contexto:** Riesgo de bloqueo en desarrollo por falta de API Key.
- **Decisión:** Programar un servicio híbrido. Si `process.env.OPENAI_API_KEY` existe, utiliza GPT-3.5/GPT-4. Si no, usa un MOCK integrado.
- **Consecuencias:** Permite el desarrollo ininterrumpido del Frontend sin generar gastos en la etapa temprana.
