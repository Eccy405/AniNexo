export type HiveEvents = {
  NODE_HOVER_IN: { id: string; index: number; position: [number, number, number] };
  NODE_HOVER_OUT: { id: string; index: number };
  NODE_SELECTED: { id: string; index: number };
  SCROLL_CHANGE: { progress: number };
  AI_PULSE_START: { originId: string };
};

type Listener<T> = (data: T) => void;

class EventBus {
  private listeners: { [key in keyof HiveEvents]?: Listener<any>[] } = {};

  on<K extends keyof HiveEvents>(event: K, listener: Listener<HiveEvents[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);

    // Return an unsubscribe function
    return () => this.off(event, listener);
  }

  off<K extends keyof HiveEvents>(event: K, listener: Listener<HiveEvents[K]>): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
  }

  emit<K extends keyof HiveEvents>(event: K, data: HiveEvents[K]): void {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach(listener => {
      try {
        listener(data);
      } catch (e) {
        console.error(`[EventBus] Error in listener for event ${event}:`, e);
      }
    });
  }
}

export const eventBus = new EventBus();
