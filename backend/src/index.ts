import { runtime } from './runtime';
const { app, close } = await runtime();
app.use((_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});
const port = Number(process.env.PORT || 4000);
const server = app.listen(port, '0.0.0.0', () => console.log(`TPC listening on port ${port}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () =>
    server.close(async () => {
      await close();
      process.exit(0);
    }),
  );
