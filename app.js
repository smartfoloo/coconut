const { createBareServer } = require("@tomphttp/bare-server-node");
const express = require("express");
const { createServer } = require("node:http");
const { hostname } = require("node:os");
const { join } = require("path");

const bare = createBareServer("/bare/");
const app = express();

// Serve static files from the public directory
app.use(express.static("./public"));

// Serve 404 page for all other routes
app.get('*', (req, res) => {
  res.status(404).sendFile(join(__dirname, "public", "404.html"));
});

const server = createServer();

// Handle HTTP requests
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Handle WebSocket upgrades
server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

// Set up port
let port = parseInt(process.env.PORT, 10);
if (isNaN(port)) port = 8000;

// Start the server
server.listen({ port }, () => {
  const address = server.address();
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
  console.log(`\thttp://${address.family === "IPv6" ? `[${address.address}]` : address.address}:${address.port}`);
});

// Graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close();
  bare.close();
  process.exit(0);
}
