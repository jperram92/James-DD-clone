const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Test Server</title>
      </head>
      <body>
        <h1>Hello from Test Server!</h1>
        <p>If you can see this, the server is working correctly.</p>
        <p>Current time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

const PORT = 9090;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}/`);
});
