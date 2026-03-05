// Progress is stored in localStorage only (no cloud sync).
// These functions are kept as no-ops for any remaining call sites.

export async function pullFromCloud(): Promise<void> {
  // No-op: progress is browser-local only
}

export async function pushToCloud(): Promise<void> {
  // No-op: progress is browser-local only
}

export function schedulePush(): void {
  // No-op: progress is browser-local only
}
