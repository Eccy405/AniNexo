# Plan: Funcionalidades Sociales - Amigos, Guardado, Recuerdos, Compartir

## Resumen
Implementar funcionalidades para los botones "Amigos", "Guardado", "Recuerdos" y el botón de "Compartir" en publicaciones del feed social.

---

## Archivos a Crear/Modificar

### 1. Nuevos Componentes (Frontend)

#### 1.1 `FriendsModal.tsx` - Ventana de gestión de amigos
**Ruta:** `client/src/components/profile/FriendsModal.tsx`
- Lista de amigos con foto, username
- Opción para asignar apodos a cada amigo
- Botón para eliminar amigo
- Botón para enviar mensaje directo
- Integración con sistema de mensajes existente

#### 1.2 `SavedPostsModal.tsx` - Publicaciones guardadas
**Ruta:** `client/src/components/feed/SavedPostsModal.tsx`
- Muestra publicaciones guardadas por el usuario
- Permite quitar del guardado
- Visualización con PostCard/PostItem

#### 1.3 `MemoriesModal.tsx` - Historial de interacciones
**Ruta:** `client/src/components/feed/MemoriesModal.tsx`
- Muestra publicaciones donde el usuario reaccionó o comentó
- Ordenado por fecha (más reciente primero)

---

### 2. Modificaciones a Componentes Existentes

#### 2.1 `PostItem.tsx` - Agregar botón "Guardar" en menú de 3 puntitos
**Ruta:** `client/src/components/feed/PostItem.tsx`
- Agregar opción "Guardar publicación" en el menú desplegable (MoreHorizontal)
- Al guardar, llamar a API `/api/feed/save`
- Actualizar estado visual (icono de guardado)

#### 2.2 `PostItem.tsx` - Agregar funcionalidad al botón "Compartir"
**Ruta:** `client/src/components/feed/PostItem.tsx`
- Mostrar modal de confirmación de share
- Al compartir, crear nuevo post con referencia al original
- Guardar en historial de recuerdos

#### 2.3 `TopNavbar.tsx` - Agregar botón "Amigos" en icon-group
**Ruta:** `client/src/components/layout/TopNavbar.tsx`
- Agregar botón de amigos con icono Users
- Abrir FriendsModal al hacer click

#### 2.4 `community/page.tsx` - Hacer funcionales los botones del sidebar
**Ruta:** `client/src/app/dashboard/community/page.tsx`
- "Amigos" → Abrir FriendsModal
- "Guardado" → Abrir SavedPostsModal
- "Recuerdos" → Abrir MemoriesModal
- "Grupos temáticos" → Navegar a página dedicada

---

### 3. Backend - Nuevas Rutas y Controladores

#### 3.1 Modelo Prisma - `SavedPost`
**Archivo:** `server/prisma/schema.prisma`
```prisma
model SavedPost {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@unique([userId, postId])
  @@map("savedpost")
}

model FriendNickname {
  id       String @id @default(uuid())
  userId   String
  friendId String
  nickname String
  
  @@unique([userId, friendId])
  @@map("friendnickname")
}
```

#### 3.2 `feed.routes.ts` - Rutas para guardar y compartir
**Ruta:** `server/src/modules/feed/feed.routes.ts`
```
POST /api/feed/:postId/save - Guardar publicación
DELETE /api/feed/:postId/save - Quitar de guardado
POST /api/feed/:postId/share - Compartir publicación
GET /api/feed/saved/:userId - Obtener publicaciones guardadas
GET /api/feed/memories/:userId - Obtener historial de interacciones
```

#### 3.3 `feed.controller.ts` - Lógica de negocio
**Ruta:** `server/src/modules/feed/feed.controller.ts`
- `savePost()` - Guardar publicación en colección del usuario
- `unsavePost()` - Quitar publicación guardada
- `sharePost()` - Crear share con referencia y guardar en recuerdos
- `getSavedPosts()` - Obtener publicaciones guardadas por usuario
- `getMemories()` - Obtener historial de reacciones/comentarios

#### 3.4 `friends.routes.ts` - Rutas para apodos
**Ruta:** `server/src/modules/friends/friend.routes.ts`
```
PUT /api/friends/:friendId/nickname - Asignar apodo
GET /api/friends/:friendId/nickname - Obtener apodo
```

#### 3.5 `friend.controller.ts` - Lógica de apodos
**Ruta:** `server/src/modules/friends/friend.controller.ts`
- `setFriendNickname()` - Asignar apodo a amigo
- `getFriendNickname()` - Obtener apodo

---

## Orden de Implementación

### Fase 1: Backend (Base de datos y APIs)
1. Agregar modelos `SavedPost` y `FriendNickname` al schema.prisma
2. Ejecutar migración de base de datos
3. Implementar rutas y controladores para guardar/obtener posts guardados
4. Implementar rutas y controladores para compartir (con memoria)
5. Implementar rutas para apodos de amigos

### Fase 2: Frontend (Componentes)
1. Crear `FriendsModal.tsx` con gestión completa de amigos
2. Crear `SavedPostsModal.tsx` para mostrar posts guardados
3. Crear `MemoriesModal.tsx` para historial de interacciones
4. Modificar `PostItem.tsx`:
   - Agregar opción "Guardar" en menú (3 puntitos)
   - Implementar funcionalidad de "Compartir"
5. Modificar `TopNavbar.tsx` - Agregar botón "Amigos"
6. Modificar `community/page.tsx` - Conectar botones del sidebar

### Fase 3: Integración y Pruebas
1. Verificar flujo completo de guardar/retweet
2. Verificar que los recuerdos se guardan al reaccionar/comentar/compartir
3. Probar apodos de amigos
4. Asegurar responsive design

---

## Consideraciones Técnicas
- Usar el mismo patrón de modales existente (UserListModal, ChatModal)
- Reutilizar componentes UI existentes (Card, Button)
- Mantener consistencia con el tema visual oscuro del sitio
- Usar localStorage para el usuario actual (patrón existente)
- API endpoints usar el prefijo `/api/...` que se resuelve a `NEXT_PUBLIC_API_URL`