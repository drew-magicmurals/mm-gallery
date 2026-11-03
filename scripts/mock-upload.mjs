import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '..', 'tmp');
const PORT = 3099;

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/upload') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not_found' }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.mkdir(TMP, { recursive: true });
  await fs.writeFile(path.join(TMP, `upload-${stamp}.bin`), body);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock upload server listening on http://127.0.0.1:${PORT}/api/upload`);
});
