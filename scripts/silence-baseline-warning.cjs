/**
 * Silences noisy baseline-browser-mapping staleness warnings during builds.
 * Keep other warnings intact.
 */
const originalWarn = console.warn;

console.warn = (...args) => {
  const [message] = args;
  if (
    typeof message === "string" &&
    message.includes("[baseline-browser-mapping]")
  ) {
    return;
  }

  return originalWarn(...args);
};
