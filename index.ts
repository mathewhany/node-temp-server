import http from "http";

interface ServerOptions {
  host: string;
  port: number;
  path: string;
  timeout: number;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
}

interface RequestData {
  query: Record<string, string>;
  body: any;
  rawRequest: http.IncomingMessage;
}

export function waitForRequest({
  host = "localhost",
  port = 3000,
  path = "/",
  timeout = 60_000,
  responseStatus = 200,
  responseHeaders = { "Content-Type": "text/plain" },
  responseBody = "OK",
}: Partial<ServerOptions> = {}): Promise<RequestData> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url?.startsWith(path)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        const url = new URL(req.url || "", `http://${host}:${port}`);
        const query = Object.fromEntries(url.searchParams);

        // Send custom response to the client
        res.writeHead(responseStatus, responseHeaders);
        res.end(responseBody);

        // Close the server and resolve with data
        server.close(() => {
          resolve({
            query,
            body: body ? JSON.parse(body) : null,
            rawRequest: req,
          });
        });
      });
    });

    // Handle server errors
    server.on("error", (err) => reject(err));

    // Start the server
    server.listen(port, host, () => {
      console.log(`Server running at http://${host}:${port}${path}`);
    });

    // Set a timeout to reject if no request is received
    const timeoutId = setTimeout(() => {
      server.close(() => reject(new Error("Request timed out")));
    }, timeout);

    // Ensure timeout is cleared if a request is received
    server.on("close", () => clearTimeout(timeoutId));
  });
}
