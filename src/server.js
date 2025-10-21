import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mime from 'mime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

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

const findExistingFile = async (candidates) => {
  for (const candidate of candidates) {
    try {
      const fileStat = await stat(candidate);
      if (fileStat.isFile()) {
        return candidate;
      }
    } catch {
      // ignore missing files and continue
    }
  }

  return undefined;
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
    const indexPath = await findExistingFile([
      path.join(DIST_DIR, 'index.html'),
      path.join(ROOT_DIR, 'index.html'),
    ]);

    if (indexPath) {
      await serveFile(req, res, indexPath, STATIC_CACHE_HEADERS);
      return;
    }

    res.writeHead(404, DEFAULT_HEADERS);
    res.end('Not Found');
    return;
  }

  const candidates = [toFilePath(DIST_DIR, pathname), toFilePath(PUBLIC_DIR, pathname)];

  if (pathname.startsWith('/src/')) {
    candidates.push(toFilePath(ROOT_DIR, pathname));
  }

  if (pathname === '/index.html') {
    candidates.push(path.join(ROOT_DIR, 'index.html'));
  }

  const targetPath = await findExistingFile(candidates);

  if (targetPath) {
    const headers = pathname.includes('/sounds/')
      ? AUDIO_CACHE_HEADERS
      : STATIC_CACHE_HEADERS;
    await serveFile(req, res, targetPath, headers);
    return;
  }

  res.writeHead(404, DEFAULT_HEADERS);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Soundboard server running at http://localhost:${PORT}`);
});
