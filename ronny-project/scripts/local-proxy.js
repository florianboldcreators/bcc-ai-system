import http from 'http';
import net from 'net';

const UPSTREAM_HOST = 'geo.iproyal.com';
const UPSTREAM_PORT = 12321;
const UPSTREAM_USER = 'cZTQcMdqzo3KrwTA';
const UPSTREAM_PASS = `TkKGrrECccX08emT_country-us_session-${Date.now()}`;
const LOCAL_PORT = 18080;

const authHeader = 'Basic ' + Buffer.from(`${UPSTREAM_USER}:${UPSTREAM_PASS}`).toString('base64');

const server = http.createServer((req, res) => {
  // HTTP requests (non-CONNECT)
  const options = {
    host: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    method: req.method,
    path: req.url,
    headers: { ...req.headers, 'Proxy-Authorization': authHeader }
  };
  
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  req.pipe(proxy);
  proxy.on('error', (e) => { res.writeHead(502); res.end(`Proxy error: ${e.message}`); });
});

server.on('connect', (req, clientSocket, head) => {
  // HTTPS CONNECT tunneling
  const upstreamSocket = net.connect(UPSTREAM_PORT, UPSTREAM_HOST, () => {
    const connectReq = `CONNECT ${req.url} HTTP/1.1\r\nHost: ${req.url}\r\nProxy-Authorization: ${authHeader}\r\n\r\n`;
    upstreamSocket.write(connectReq);
  });
  
  let responded = false;
  upstreamSocket.once('data', (chunk) => {
    if (!responded) {
      responded = true;
      const response = chunk.toString();
      if (response.includes('200')) {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) upstreamSocket.write(head);
        upstreamSocket.pipe(clientSocket);
        clientSocket.pipe(upstreamSocket);
      } else {
        clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        clientSocket.end();
        upstreamSocket.end();
      }
    }
  });
  
  upstreamSocket.on('error', () => { clientSocket.end(); });
  clientSocket.on('error', () => { upstreamSocket.end(); });
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
  console.log(`Local proxy running on 127.0.0.1:${LOCAL_PORT} → ${UPSTREAM_HOST}:${UPSTREAM_PORT}`);
});
