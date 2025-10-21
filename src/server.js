import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mime from 'mime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SRC_DIR = path.resolve(__dirname, '..');

const DEFAULT_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Referrer-Policy': 'no-referrer',
};

const AUDIO_CACHE_HEADERS = {
  ...DEFAULT_HEADERS,
  'Cache-Control': 'public, max-age=31536000, immutable',
};

const STATIC_CACHE_HEADERS = {
  ...DEFAULT_HEADERS,
  'Cache-Control': 'public, max-age=3600',
};

const PORT = Number(process.env.PORT ?? 3000);

const toFilePath = (baseDir, pathname) => {
  const safePath = path
    .normalize(pathname)
    .replace(/^(\.\.[/\\])+/, '')
    .replace(/^[/\\]+/, '');
  return path.join(baseDir, safePath);
};

const serveFile = async (req, res, filePath, headers = DEFAULT_HEADERS) => {
  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      res.writeHead(404, DEFAULT_HEADERS);
      res.end('Not Found');
      return;
    }

    const contentType = mime.getType(filePath) ?? 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileStat.size,
      'Last-Modified': fileStat.mtime.toUTCString(),
      ...headers,
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const data = await readFile(filePath);
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, DEFAULT_HEADERS);
      res.end('Not Found');
      return;
    }

    console.error('Static file server error:', error);
    res.writeHead(500, DEFAULT_HEADERS);
    res.end('Internal Server Error');
  }
};

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, DEFAULT_HEADERS);
    res.end('Bad Request');
    return;
  }

  if (!['GET', 'HEAD'].includes(req.method ?? 'GET')) {
    res.writeHead(405, { ...DEFAULT_HEADERS, Allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const { pathname } = requestUrl;

  if (pathname === '/' || pathname === '') {
    await serveFile(req, res, path.join(PUBLIC_DIR, 'index.html'), STATIC_CACHE_HEADERS);
    return;
  }

  if (pathname.startsWith('/sounds/')) {
    const filePath = toFilePath(PUBLIC_DIR, pathname);
    await serveFile(req, res, filePath, AUDIO_CACHE_HEADERS);
    return;
  }

  if (pathname.startsWith('/src/')) {
    const filePath = toFilePath(SRC_DIR, pathname);
    await serveFile(req, res, filePath, STATIC_CACHE_HEADERS);
    return;
  }

  const publicFilePath = toFilePath(PUBLIC_DIR, pathname);
  await serveFile(req, res, publicFilePath, STATIC_CACHE_HEADERS);
});

server.listen(PORT, () => {
  console.log(`Soundboard server running at http://localhost:${PORT}`);
});
