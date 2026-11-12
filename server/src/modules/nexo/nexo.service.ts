import prisma from '../../lib/prisma';
import { GoogleGenAI, Content, ThinkingLevel } from '@google/genai';
import { socketService } from '../../lib/socketService';
import { MessagingService } from '../messaging/messaging.service';

const messagingService = new MessagingService();

export interface NexoHistoryTurn {
  role: 'user' | 'model' | 'nexo';
  text: string;
}

const DEFAULT_STANDARD_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_PREMIUM_MODEL = 'gemini-3.5-flash';
const GEMINI_3_FALLBACK_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
];

const INVALID_KEY_PLACEHOLDERS = new Set([
  '',
  'mock-key',
  'tu_gemini_api_key_aqui',
  'your_gemini_api_key_here',
]);

export class NexoService {
  private getApiKey(): string {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || INVALID_KEY_PLACEHOLDERS.has(apiKey)) {
      const error: any = new Error(
        'Nexo AI no está configurado: agrega tu GEMINI_API_KEY real en server/.env y reinicia el servidor.'
      );
      error.statusCode = 503;
      throw error;
    }
    return apiKey;
  }

  private getClient(): GoogleGenAI {
    const apiKey = this.getApiKey();
    return new GoogleGenAI({ apiKey });
  }

  private getCandidateModels(isPremium: boolean): string[] {
    const standardModel = (process.env.GEMINI_MODEL || '').trim() || DEFAULT_STANDARD_MODEL;
    const premiumModel = (process.env.GEMINI_PREMIUM_MODEL || '').trim() || DEFAULT_PREMIUM_MODEL;
    const preferred = isPremium ? [premiumModel, standardModel] : [standardModel];
    return Array.from(new Set([...preferred, ...GEMINI_3_FALLBACK_CHAIN].filter(Boolean)));
  }

  private isModelFallbackEligible(error: any): boolean {
    const status = error?.status || error?.statusCode;
    const msg = String(error?.message || '').toLowerCase();
    return (
      status === 404 ||
      status === 429 ||
      status === 503 ||
      status === 504 ||
      msg.includes('not found') ||
      msg.includes('no longer available') ||
      msg.includes('is not supported') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      msg.includes('unavailable') ||
      msg.includes('high demand') ||
      msg.includes('deadline_exceeded')
    );
  }

  async chatWithNexo(
    userId: string,
    message: string,
    history: NexoHistoryTurn[] = []
  ): Promise<string> {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      const err: any = new Error('El mensaje no puede estar vacío.');
      err.statusCode = 400;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err: any = new Error('Usuario no encontrado.');
      err.statusCode = 404;
      throw err;
    }

    const ai = this.getClient();
    const isPremium = Boolean(
      user.isPremium && (!user.premiumUntil || user.premiumUntil > new Date())
    );

    const context = await this.getDeepContext(userId);
    const candidateModels = this.getCandidateModels(isPremium);

    const systemPrompt = isPremium
      ? [
          `Eres Nexo, el asistente avanzado de inteligencia artificial de AniNexo (plataforma social y catálogo de anime y manga).`,
          `Estás conversando con ${user.username}, un usuario PREMIUM.`,
          `Responde siempre en español natural, cercano, culto en anime y manga, dando recomendaciones precisas, análisis detallados y joyas ocultas cuando sea útil.`,
          `Usa el contexto real del usuario solo como referencia personal; nunca inventes títulos que no existan ni finjas acciones que no ocurrieron.`,
          ``,
          `CONTEXTO REAL DEL USUARIO:`,
          context,
        ].join('\n')
      : [
          `Eres Nexo, el asistente de inteligencia artificial de AniNexo.`,
          `Estás conversando con ${user.username} (plan gratuito).`,
          `Responde siempre en español de forma útil, directa, con conocimiento real de anime y manga y un toque tsundere/ingenioso sin dejar de ayudar de verdad.`,
          `Si el tema es muy largo, sé conciso y recuerda ocasionalmente que con Premium obtiene análisis aún más extensos.`,
          ``,
          `CONTEXTO REAL DEL USUARIO:`,
          context,
        ].join('\n');

    const normalizedHistory: Content[] = history
      .filter((turn) => turn && typeof turn.text === 'string' && turn.text.trim().length > 0)
      .slice(-12)
      .map((turn) => ({
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text.trim() }],
      }));

    const contents: Content[] = [
      ...normalizedHistory,
      {
        role: 'user',
        parts: [{ text: cleanMessage }],
      },
    ];

    const useGoogleSearch = process.env.GEMINI_ENABLE_SEARCH === 'true';

    const callGemini = async (modelName: string) => {
      const isGemini3 = /^gemini-3/i.test(modelName);
      return ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: isPremium ? 2500 : 1200,
          temperature: 0.7,
          ...(isGemini3 ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
          ...(useGoogleSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });
    };

    let activeModel = candidateModels[0] || DEFAULT_STANDARD_MODEL;
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      activeModel = modelName;
      try {
        const res = await callGemini(modelName);
        if (res?.text?.trim()) {
          response = res;
          break;
        }
        lastError = new Error(`El modelo ${modelName} devolvió una respuesta vacía.`);
      } catch (err: any) {
        lastError = err;
        if (!this.isModelFallbackEligible(err)) {
          throw this.formatGeminiError(err);
        }
        console.warn(
          `[NexoAI] Modelo ${modelName} no disponible o congestionado (${err?.status || err?.statusCode || 'ERR'}); probando siguiente modelo Gemini real...`
        );
      }
    }

    if (!response) {
      throw this.formatGeminiError(lastError || new Error('No se pudo obtener respuesta de Gemini.'));
    }

    const reply = response.text?.trim();
    if (!reply) {
      const err: any = new Error('Gemini no devolvió contenido en la respuesta.');
      err.statusCode = 502;
      throw err;
    }

    await this.logInteraction(
      userId,
      cleanMessage,
      reply,
      activeModel,
      response.usageMetadata?.totalTokenCount
    );

    return reply;
  }

  private formatGeminiError(error: any): Error {
    console.error('[NexoAI] Error real de Gemini API:', error);
    const rawMsg = String(error?.message || 'Error desconocido al comunicarse con Gemini');
    const status = error?.status || error?.statusCode;

    let userMessage = 'Error al comunicarse con la API de Google Gemini.';
    let statusCode = 502;

    if (
      status === 401 ||
      status === 403 ||
      rawMsg.toLowerCase().includes('api key') ||
      rawMsg.toLowerCase().includes('permission')
    ) {
      userMessage = 'La GEMINI_API_KEY configurada no es válida o no tiene permisos para este modelo.';
      statusCode = 401;
    } else if (status === 429 || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('resource_exhausted')) {
      userMessage = 'Se alcanzó el límite de cuota/solicitudes de tu clave de Gemini API. Intenta nuevamente en unos segundos.';
      statusCode = 429;
    } else if (status === 404 || rawMsg.toLowerCase().includes('not found')) {
      userMessage = `El modelo configurado (${process.env.GEMINI_MODEL || DEFAULT_STANDARD_MODEL}) no está disponible para tu clave de Gemini.`;
      statusCode = 400;
    }

    const wrapped: any = new Error(userMessage);
    wrapped.statusCode = statusCode;
    return wrapped;
  }

  /**
   * Nexo responde en una conversación persistente (Exclusivo Premium)
   */
  async chatInConversation(userId: string, conversationId: string, messageContent: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const hasPremium = Boolean(
      user?.isPremium && (!user.premiumUntil || user.premiumUntil > new Date())
    );
    if (!user || !hasPremium) {
      const err: any = new Error('Acceso denegado: Solo usuarios Premium pueden usar el chat persistente con Nexo');
      err.statusCode = 403;
      throw err;
    }

    const nexoUser = await this.getOrCreateNexoUser();

    // Obtener historial reciente real de la conversación antes de guardar el nuevo mensaje
    const recentMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { senderId: true, content: true },
    });

    const history: NexoHistoryTurn[] = recentMessages
      .reverse()
      .map((m) => ({
        role: m.senderId === nexoUser.id ? 'model' : 'user',
        text: m.content,
      }));

    // 1. Guardar el mensaje del usuario
    const userMsg = await messagingService.sendMessage(conversationId, userId, messageContent);
    socketService.emitToRoom(`conv_${conversationId}`, 'new_message', userMsg);

    // 2. Emitir indicador de escritura real
    socketService.emitToRoom(`conv_${conversationId}`, 'user_typing', {
      userId: nexoUser.id,
      conversationId,
    });

    try {
      // 3. Obtener respuesta real de Gemini
      const nexoReply = await this.chatWithNexo(userId, messageContent, history);

      // 4. Guardar y emitir respuesta real de Nexo
      const nexoMsg = await messagingService.sendMessage(conversationId, nexoUser.id, nexoReply);

      socketService.emitToRoom(`conv_${conversationId}`, 'new_message', nexoMsg);

      return { userMsg, nexoMsg };
    } finally {
      socketService.emitToRoom(`conv_${conversationId}`, 'user_stop_typing', {
        userId: nexoUser.id,
        conversationId,
      });
    }
  }

  private async getOrCreateNexoUser() {
    let nexoUser = await prisma.user.findUnique({ where: { username: 'Nexo' } });
    if (!nexoUser) {
      nexoUser = await prisma.user.create({
        data: {
          username: 'Nexo',
          email: 'nexo@aninexo.com',
          passwordHash: 'AI_VIRTUAL_USER',
          role: 'ADMIN',
          avatarUrl: 'https://img.icons8.com/fluency/96/artificial-intelligence.png',
        },
      });
    }
    return nexoUser;
  }

  /**
   * Genera un bloque de texto con información real del usuario para dar contexto a Gemini.
   */
  private async getDeepContext(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        animeLists: { take: 15, orderBy: { updatedAt: 'desc' } },
        badges: { include: { badge: true } },
        nexoMemories: true,
      },
    });

    if (!user) return '';

    const animeIds = user.animeLists.map((a) => a.animeId);
    const animes = animeIds.length > 0
      ? await prisma.anime.findMany({
          where: { id: { in: animeIds } },
          select: { id: true, titleRomaji: true, titleEnglish: true },
        })
      : [];
    const titleById = new Map(
      animes.map((a) => [a.id, a.titleEnglish || a.titleRomaji])
    );

    const animeContext = user.animeLists
      .map((a) => {
        const title = titleById.get(a.animeId) || `Anime #${a.animeId}`;
        return `${title} (Estado: ${a.status}, Ep: ${a.progress ?? 0}, Score: ${a.score ?? 'N/A'})`;
      })
      .join('; ');

    const memoryContext = user.nexoMemories
      .map((m) => `- ${m.key}: ${m.value}`)
      .join('\n');

    const badgesContext = user.badges.map((b) => b.badge.name).join(', ');

    return [
      `- Username: ${user.username}`,
      `- Plan: ${user.isPremium ? 'PREMIUM' : 'FREE'}`,
      `- Bio: ${user.bio || 'Sin biografía'}`,
      `- Medallas: ${badgesContext || 'Ninguna aún'}`,
      `- Lista de anime reciente: ${animeContext || 'Aún no ha registrado animes'}`,
      memoryContext ? `- Memorias guardadas:\n${memoryContext}` : '- Memorias guardadas: Ninguna aún',
    ].join('\n');
  }

  private async logInteraction(
    userId: string,
    input: string,
    output: string,
    modelUsed: string,
    tokens?: number
  ) {
    try {
      await prisma.nexoInteraction.create({
        data: {
          userId,
          type: 'CHAT',
          input,
          output,
          tokensUsed: tokens ?? null,
          modelUsed,
        },
      });
    } catch (err) {
      console.error('[NexoAI] Error guardando analítica en NexoInteraction:', err);
    }
  }

  /**
   * Permite que Nexo recuerde información real del usuario en DB.
   */
  async updateMemory(userId: string, key: string, value: string) {
    await prisma.nexoMemory.upsert({
      where: { userId_key: { userId, key } },
      update: { value },
      create: { userId, key, value },
    });
  }
}
