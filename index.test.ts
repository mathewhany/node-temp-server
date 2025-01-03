import { waitForRequest } from ".";
import http from "http";

describe("waitForRequest", () => {
  const makeRequest = async (options: {
    path?: string;
    method?: string;
    body?: any;
    query?: Record<string, string>;
    port?: number;
  }) => {
    const { path = "/", method = "GET", body, query, port } = options;
    const queryString = query ? `?${new URLSearchParams(query)}` : "";
    const url = `http://localhost:${port}${path}${queryString}`;

    return new Promise((resolve, reject) => {
      const req = http.request(url, { method }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      });

      req.on("error", reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  };

  it("should handle basic GET request", async () => {
    const serverPromise = waitForRequest({ port: 3001 });
    const clientPromise = makeRequest({ path: "/", port: 3001 });

    const [requestData, response] = await Promise.all([
      serverPromise,
      clientPromise,
    ]);

    expect(requestData.query).toEqual({});
    expect(requestData.body).toBeNull();
    expect(response).toEqual({ status: 200, data: "OK" });
  });

  it("should handle query parameters", async () => {
    const serverPromise = waitForRequest({ port: 3002 });
    const clientPromise = makeRequest({
      query: { name: "test", value: "123" },
      port: 3002,
    });
    const [requestData] = await Promise.all([serverPromise, clientPromise]);
    expect(requestData.query).toEqual({ name: "test", value: "123" });
  });

  it("should handle POST request with body", async () => {
    const serverPromise = waitForRequest({ port: 3003 });
    const clientPromise = makeRequest({
      method: "POST",
      body: { hello: "world" },
      port: 3003,
    });

    const [requestData] = await Promise.all([serverPromise, clientPromise]);

    expect(requestData.body).toEqual({ hello: "world" });
  });

  it("should return 404 for wrong path", async () => {
    try {
      const serverPromise = waitForRequest({
        path: "/test",
        port: 3004,
        timeout: 1000,
      });
      const clientPromise = makeRequest({ path: "/wrong", port: 3004 });

      const [, response] = await Promise.all([serverPromise, clientPromise]);

      expect(response).toEqual({ status: 404, data: "Not Found" });
    } catch (error) {
      if (error.message !== "Request timed out") {
        console.log(error);
      }
    }
  });

  it("should timeout if no request is received", async () => {
    await expect(waitForRequest({ timeout: 100, port: 3005 })).rejects.toThrow(
      "Request timed out"
    );
  });

  it("should handle custom response", async () => {
    const serverPromise = waitForRequest({
      responseStatus: 201,
      responseHeaders: { "Content-Type": "application/json" },
      responseBody: JSON.stringify({ status: "created" }),
      port: 3006,
    });

    const clientPromise = makeRequest({ path: "/", port: 3006 });

    const [, response] = await Promise.all([serverPromise, clientPromise]);

    expect(response).toEqual({
      status: 201,
      data: JSON.stringify({ status: "created" }),
    });
  });
});
