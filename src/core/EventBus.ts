type EventCallback = (...args: unknown[]) => void;

interface EventMap {
  'npc:interact': [npcId: string];
  'dialogue:start-puzzle': [puzzleId: string];
  'puzzle:completed': [grade: string];
  'puzzle:back-to-world': [];
  'dialogue:ended': [];
  'chapter:advanced': [];
}

class TypedEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
  }

  off<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  once<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): void {
    const wrapper = (...args: EventMap[K]) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

export const EventBus = new TypedEventBus();
