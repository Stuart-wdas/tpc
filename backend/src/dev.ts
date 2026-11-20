import { runtime } from './runtime';
const { app, close } = await runtime();
const port = Number(process.env.PORT || 4000);
const server = app.listen(port, '127.0.0.1', () =>
  console.log(`TPC API ready: http://localhost:${port}`),
);
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await close();
    process.exit(0);
  });
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, shutdown);
}
process.on('message', (message) => {
  if ((message as { type?: string })?.type === 'shutdown') shutdown();
});
