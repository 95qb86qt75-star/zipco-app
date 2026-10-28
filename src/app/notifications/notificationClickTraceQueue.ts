// Separate from the lazy recorder to avoid a module cycle during startup/copy.
let writes = Promise.resolve();
export function trackNotificationClickWrite(write: Promise<unknown>) {
  writes = Promise.all([writes, write.catch(() => {})]).then(() => {});
}
export const flushNotificationClickTrace = () => writes;
