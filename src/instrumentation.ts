// Runs once when the server starts (Node.js runtime only).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
