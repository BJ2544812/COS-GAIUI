import type { Worker } from 'bullmq';

const workers: Worker[] = [];

export function registerWorker(worker: Worker): void {
  workers.push(worker);
}

export async function closeAllWorkers(): Promise<void> {
  await Promise.all(
    workers.map(async (w) => {
      try {
        await w.close();
      } catch (e) {
        console.warn('[shutdown] worker close warning:', e);
      }
    }),
  );
  workers.length = 0;
}
