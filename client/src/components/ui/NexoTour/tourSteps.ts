import { Step } from 'react-joyride';

/**
 * TourStep extiende Step de react-joyride con metadatos propios:
 *  - emotion: expresión del avatar de Nexo
 *  - navigateTo: URL a la que navegar ANTES de mostrar este paso
 *    (usa 'PROFILE' para que NexoTour inyecte el username dinámico)
 */
export type TourStep = Step & {
  emotion?: 'happy' | 'explaining' | 'excited' | 'smug' | 'wink' | 'neutral' | 'surprised';
  navigateTo?: string; // URL o 'PROFILE'
  disableBeacon?: boolean;
};

export const tourSteps: TourStep[] = [
  // ─────────────────────────────────────────────────
  // SECCIÓN 1 · Inicio / Dashboard
  // ─────────────────────────────────────────────────
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido a AniNexo!',
    content:
      '¡Hola! Soy Nexo, tu asistente de inteligencia artificial. Estoy aquí para guiarte por todo lo que puedes hacer en AniNexo. ¿Me acompañas en este pequeño tour?',
    emotion: 'happy',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-inicio"]',
    placement: 'bottom',
    title: 'Barra de navegación',
    content:
      'Desde la barra de navegación puedes moverte entre las secciones principales: Inicio, Explorar, Comunidad, tu Nexo IA y más. Siempre está aquí para orientarte.',
    emotion: 'explaining',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="search-box"]',
    placement: 'bottom',
    title: 'Búsqueda rápida',
    content:
      'Con el buscador puedes encontrar cualquier anime al instante. Escribe el título, presiona Enter y verás los resultados con toda la información disponible.',
    emotion: 'wink',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="nav-ia-nexo"]',
    placement: 'bottom',
    title: 'Tu asistente Nexo',
    content:
      'Aquí me encontrarás siempre. Puedo responderte preguntas sobre anime, recomendarte series según tus gustos y ayudarte a descubrir nuevas historias. ¡Pruébame!',
    emotion: 'excited',
    disableBeacon: true,
    spotlightPadding: 8,
  },

  // ─────────────────────────────────────────────────
  // SECCIÓN 2 · Página de Anime (Naruto Shippuden, ID 1735)
  // ─────────────────────────────────────────────────
  {
    target: 'body',
    placement: 'center',
    title: 'Explorando Naruto Shippuden',
    content:
      '¡De vuelta a la Aldea de la Hoja! Te llevaré a la página del popular Naruto Shippuden para mostrarte cómo se ve un anime con todo el detalle de AniNexo.',
    emotion: 'excited',
    disableBeacon: true,
    navigateTo: '/dashboard/anime/1735-naruto-shippuden',
  },
  {
    target: '[data-tour="anime-header"]',
    placement: 'bottom',
    title: 'Identidad del anime',
    content:
      'En la cabecera verás el gran título, el banner y detalles rápidos como la temporada de estreno, el formato y el promedio de aprobación de los fans.',
    emotion: 'explaining',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="anime-sidebar"]',
    placement: 'left',
    title: 'Ficha Técnica Completa',
    content:
      'Mira: aquí podrás ver el número exacto de episodios (¡500 capítulos!), su duración media (24 min), el estudio que lo animó (Studio Pierrot), sus géneros como Acción y Aventura, y hasta la sección de "Enlaces" donde te indicamos en qué plataformas de streaming puedes verlo oficialmente.',
    emotion: 'smug',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="anime-actions"]',
    placement: 'left',
    title: 'Acciones y Grupos',
    content:
      'Desde aquí puedes agregar esta obra a tu colección personal, marcarla como favorita o crear tu propio grupo temático para discutir sobre los ninjas y combates con tus amigos.',
    emotion: 'wink',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="anime-overview"]',
    placement: 'top',
    title: 'Vista General de Naruto Shippuden',
    content:
      'En esta pestaña inicial encontrarás la sinopsis completa, las relaciones (secuelas, películas o precuelas de la franquicia), el Tráiler oficial de YouTube para revivir combates icónicos y nuestras recomendaciones exclusivas de AniNexo con animes similares que te podrían encantar.',
    emotion: 'explaining',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="anime-characters"]',
    placement: 'top',
    title: 'Personajes y Actores de Voz',
    content:
      'Aquí verás a todos los personajes legendarios como Naruto, Sasuke o Kakashi. Además de su rol (principal o secundario), te mostramos a sus respectivos actores de voz (seiyuus) originales japoneses con foto incluida. ¡Para que conozcas las voces detrás de los jutsus!',
    emotion: 'excited',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="anime-staff"]',
    placement: 'top',
    title: 'Equipo de Producción (Staff)',
    content:
      'En esta sección rendimos honor al staff técnico y de producción, incluyendo los directores de los capítulos y, por supuesto, la autoría original de Masashi Kishimoto.',
    emotion: 'explaining',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="anime-stats"]',
    placement: 'top',
    title: 'Estadísticas de la Comunidad',
    content:
      'Aquí tienes los datos duros: gráficos interactivos de la distribución de puntuaciones (del 1 al 10) otorgadas por los fans, el nivel de popularidad global y la cantidad de miembros activos de la comunidad que lo están viendo.',
    emotion: 'smug',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="anime-social"]',
    placement: 'top',
    title: 'Sección Social y Foro',
    content:
      '¡Esta es mi favorita! El apartado Social es un espacio dedicado a la comunidad donde podrás conversar en tiempo real sobre Naruto Shippuden, postear memes divertidos sobre ninjas o debatir teorías y conocer a personas con tus mismos gustos de manera interactiva.',
    emotion: 'happy',
    disableBeacon: true,
    spotlightPadding: 8,
  },

  // ─────────────────────────────────────────────────
  // SECCIÓN 3 · Comunidad
  // ─────────────────────────────────────────────────
  {
    target: 'body',
    placement: 'center',
    title: 'La Comunidad de AniNexo',
    content:
      '¡Ahora te muestro la Comunidad! Es el corazón social de AniNexo: conecta con otros fans, comparte reseñas, reacciona a posts y haz nuevos amigos.',
    emotion: 'happy',
    disableBeacon: true,
    navigateTo: '/dashboard/community',
  },
  {
    target: '[data-tour="community-feed"]',
    placement: 'right',
    title: 'Feed principal',
    content:
      'El feed muestra las publicaciones más recientes de la comunidad. Puedes crear posts, reseñas de anime, compartir imágenes y expresar tu opinión con reacciones únicas.',
    emotion: 'explaining',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="community-left-sidebar"]',
    placement: 'right',
    title: 'Menú de comunidad',
    content:
      'En el panel izquierdo puedes acceder a tu perfil, ver sugerencias de usuarios afines a tus gustos, unirte a grupos temáticos y explorar los rankings de anime.',
    emotion: 'wink',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="community-right-sidebar"]',
    placement: 'left',
    title: 'Tus conexiones',
    content:
      'Aquí aparecen tus amigos conectados en tiempo real. Puedes enviarles mensajes directos, ver qué anime están viendo ahora mismo e invitarlos a ver algo juntos.',
    emotion: 'excited',
    disableBeacon: true,
    spotlightPadding: 8,
  },

  // ─────────────────────────────────────────────────
  // SECCIÓN 4 · Perfil de usuario
  // ─────────────────────────────────────────────────
  {
    target: 'body',
    placement: 'center',
    title: 'Tu perfil personal',
    content:
      'Por último, te muestro tu perfil. Aquí vive todo sobre ti: tu colección, tus logros, tu ADN de anime y cómo te presentas ante la comunidad. ¡Es tuyo para personalizar!',
    emotion: 'excited',
    disableBeacon: true,
    navigateTo: 'PROFILE',
  },
  {
    target: '[data-tour="profile-header"]',
    placement: 'bottom',
    title: 'Tu identidad en AniNexo',
    content:
      'La cabecera de perfil muestra tu avatar, tu nombre, tu arquetipo de anime y tus estadísticas principales: animes vistos, amigos y mucho más.',
    emotion: 'explaining',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="profile-edit-btn"]',
    placement: 'bottom',
    title: 'Personaliza tu perfil',
    content:
      'Con el botón de Personalizar Perfil puedes cambiar tu foto, tu banner, el color de acento, tu bio y responder preguntas para calcular tu ADN de anime único.',
    emotion: 'wink',
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="profile-stats"]',
    placement: 'top',
    title: 'Tu ADN de Anime',
    content:
      'Esta sección analiza todos tus gustos y hábitos para crear tu perfil de otaku único. Aquí verás tus géneros favoritos, los estudios de animación que más te gustan y más.',
    emotion: 'smug',
    disableBeacon: true,
    spotlightPadding: 8,
  },

  // ─────────────────────────────────────────────────
  // CIERRE
  // ─────────────────────────────────────────────────
  {
    target: 'body',
    placement: 'center',
    title: '¡Ya conoces AniNexo!',
    content:
      'Eso es todo por ahora. Ya tienes todo lo necesario para disfrutar al máximo de la plataforma. Recuerda que puedo ayudarte en cualquier momento desde el botón de IA Nexo. ¡Nos vemos por aquí!',
    emotion: 'happy',
    disableBeacon: true,
  },
];
