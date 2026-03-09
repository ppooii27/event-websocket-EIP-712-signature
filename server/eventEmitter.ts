// eventEmitter
export default class EventEmitter<T extends Record<string, any>> {
  // handler storage eventName and Set of handlers
  private handlers: Map<string, Set<(payload: any) => void>> = new Map();

  // register event handler
  on<K extends keyof T>(eventName: K, handler: (payload: T[K]) => void): void {
    // if eventName doesn't exits, create a new set for it
    if (!this.handlers.has(eventName as string)) {
      this.handlers.set(eventName as string, new Set());
    }

    // add handler to the set for the eventName
    const set = this.handlers.get(eventName as string)!;

    set.add(handler);
  }

  // unregister event handler
  off<K extends keyof T>(eventName: K, handler: (payload: T[K]) => void): void {
    // if eventName doesn't exist, return
    if (!this.handlers.has(eventName as string)) return;

    // remove handler from the set of the eventName
    const set = this.handlers.get(eventName as string)!;
    set!.delete(handler);

    // remove the eventName key if there are no more handler to prevent momery leak
    if (set!.size === 0) {
      this.handlers.delete(eventName as string);
    }
  }

  // trigger event handler
  emit<K extends keyof T>(eventName: K, payload: T[K]): void {
    // if eventName doesn't exist, return
    if (!this.handlers.has(eventName as string)) return;

    // call all handlers for the eventName
    const handlers = this.handlers.get(eventName as string)!;
    handlers.forEach((handlers) => handlers(payload));
  }
}
