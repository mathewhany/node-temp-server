[![npm](https://img.shields.io/npm/v/node-temp-server.svg)](https://www.npmjs.com/package/node-temp-server)
[![GitHub](https://img.shields.io/github/license/mathewhany/node-temp-server.svg)](https://github.com/mathewhany/node-temp-server)

# node-temp-server

A temporary HTTP server that waits for a single request and then shuts down. Useful for testing HTTP clients or implementing mock servers for tests, or waiting for redirects for OAuth flows.

## Installation

```bash
npm install node-temp-server
```

## Usage

```typescript
import { waitForRequest } from "node-temp-server";

// Basic usage
const requestData = await waitForRequest();
// Server will listen on localhost:3000 and shut down after first request

// Custom configuration
const requestData = await waitForRequest({
  host: "localhost",
  port: 3000,
  path: "/api",
  timeout: 5000,
  responseStatus: 200,
  responseHeaders: { "Content-Type": "application/json" },
  responseBody: JSON.stringify({ message: "Success" }),
});

// The returned requestData contains:
// - query: Record<string, string> - parsed query parameters
// - body: any - parsed JSON body (if present)
// - rawRequest: http.IncomingMessage - raw Node.js request object
```

## Options

| Option          | Type   | Default                        | Description                    |
| --------------- | ------ | ------------------------------ | ------------------------------ |
| host            | string | 'localhost'                    | Server host                    |
| port            | number | 3000                           | Server port                    |
| path            | string | '/'                            | Path to match requests against |
| timeout         | number | 60000                          | Timeout in milliseconds        |
| responseStatus  | number | 200                            | Response status code           |
| responseHeaders | object | {'Content-Type': 'text/plain'} | Response headers               |
| responseBody    | string | 'OK'                           | Response body                  |

## Example

```typescript
// Wait for POST request with custom response
const { body, query } = await waitForRequest({
  path: "/webhook",
  port: 3000,
  responseStatus: 201,
  responseHeaders: {
    "Content-Type": "application/json",
  },
  responseBody: JSON.stringify({ received: true }),
});

console.log("Request body:", body);
console.log("Query parameters:", query);
```
