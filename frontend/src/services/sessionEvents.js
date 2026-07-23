const sessionEvents = new EventTarget();

export function notifySessionExpired() {
  sessionEvents.dispatchEvent(new Event('expired'));
}

export function subscribeSessionExpired(listener) {
  sessionEvents.addEventListener('expired', listener);
  return () => sessionEvents.removeEventListener('expired', listener);
}
