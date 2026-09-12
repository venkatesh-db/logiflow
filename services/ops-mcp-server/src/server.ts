import readline from "node:readline";
import { callTool } from "./tools.js";
import type { ToolCall } from "./hooks/permission-gate.js";

/** Simplified stand-in for a real MCP stdio server: one JSON ToolCall per line in, one JSON result per line out. */
const rl = readline.createInterface({ input: process.stdin });
console.error("ops-mcp-server ready — send one JSON ToolCall per line");

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const response = callTool(JSON.parse(line) as ToolCall);
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: (err as Error).message }) + "\n");
  }
});
