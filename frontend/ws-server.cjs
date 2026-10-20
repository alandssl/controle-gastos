/**
 * Servidor WebSocket Simples para CON-CHECKLIST
 * Execução: node ws-server.cjs
 * Porta padrão: 3001 (ou 3000 se livre)
 */

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.WS_PORT || 3001;
const clients = new Set();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CON-CHECKLIST WebSocket Server is running.');
});

// WebSocket RFC 6455 Handshake & Framing implementation in pure Node.js
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n'
  ];

  socket.write(headers.join('\r\n'));
  clients.add(socket);
  console.log(`[WS] Novo cliente conectado! Total de clientes: ${clients.size}`);

  socket.on('data', (buffer) => {
    try {
      // Decode WebSocket unmasked/masked payload
      const length = buffer[1] & 127;
      let maskStart = 2;
      let dataStart = maskStart + 4;
      if (length === 126) {
        maskStart = 4;
        dataStart = maskStart + 4;
      } else if (length === 127) {
        maskStart = 10;
        dataStart = maskStart + 4;
      }

      const masks = buffer.slice(maskStart, maskStart + 4);
      const data = buffer.slice(dataStart);
      const decoded = Buffer.alloc(data.length);

      for (let i = 0; i < data.length; i++) {
        decoded[i] = data[i] ^ masks[i % 4];
      }

      const messageStr = decoded.toString('utf8');
      console.log(`[WS Broadcast] Mensagem recebida:`, messageStr);

      // Broadcast to all other connected clients
      broadcast(messageStr);
    } catch (e) {
      // ignore frame errors
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
    console.log(`[WS] Cliente desconectado. Restantes: ${clients.size}`);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });
});

function broadcast(message) {
  const msgBuffer = Buffer.from(message, 'utf8');
  const length = msgBuffer.length;
  let header;

  if (length <= 125) {
    header = Buffer.from([0x81, length]);
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  const packet = Buffer.concat([header, msgBuffer]);

  clients.forEach((client) => {
    if (!client.destroyed) {
      client.write(packet);
    }
  });
}

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Servidor WebSocket CON-CHECKLIST rodando!`);
  console.log(`📡 URL: ws://localhost:${PORT}`);
  console.log(`===============================================`);
});
