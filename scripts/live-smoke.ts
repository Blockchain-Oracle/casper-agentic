import { runLivePaidToolCall } from "../src/server/live-paid-call";

async function main() {
  const result = await runLivePaidToolCall();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "settled") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
