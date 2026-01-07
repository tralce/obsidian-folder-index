export default class CustomEventTarget extends EventTarget {
	// Map to track all listeners for each event name
	private listenersMap: Map<string, EventListener[]> = new Map();

	emit<T = any>(eventName: string, detail?: T): void {
		const event = new CustomEvent<T>(eventName, {detail});
		this.dispatchEvent(event);
	}

	on<T = any>(eventName: string, callback: (event: CustomEvent<T>) => void): void {
		this.addEventListener(eventName, callback as EventListener);

		// Track the listener in our map
		const listeners = this.listenersMap.get(eventName) || [];
		listeners.push(callback as EventListener);
		this.listenersMap.set(eventName, listeners);
	}

	removeAllListeners(): void {
		for (const [eventName, listeners] of this.listenersMap.entries()) {
			for (const listener of listeners) {
				this.removeEventListener(eventName, listener);
			}
		}

		this.listenersMap.clear();
	}

	off<T = any>(eventName: string, callback: (event: CustomEvent<T>) => void): void {
		const listeners = this.listenersMap.get(eventName);
		// remove the listener we set to "off"
		if (listeners) {
			const listenerIndex = listeners.indexOf(callback as EventListener);
			if (listenerIndex !== -1) {
				this.removeEventListener(eventName, callback as EventListener);

				listeners.splice(listenerIndex, 1);
				this.listenersMap.set(eventName, listeners);
			}
		}
	}
}
