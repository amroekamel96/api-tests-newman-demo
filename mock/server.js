// A tiny local stand-in for the JSONPlaceholder API (no dependencies).
// It reproduces the response shapes the test suite relies on, so the suite can
// run anywhere, including offline and in CI, without depending on a public site.
const http = require("http");

const posts = Array.from({ length: 100 }, (_, i) => ({
  userId: Math.floor(i / 10) + 1,
  id: i + 1,
  title: `post title ${i + 1}`,
  body: `post body ${i + 1}`,
}));

const user1 = {
  id: 1,
  name: "Leanne Graham",
  username: "Bret",
  email: "Sincere@april.biz",
  address: {
    street: "Kulas Light",
    suite: "Apt. 556",
    city: "Gwenborough",
    zipcode: "92998-3874",
    geo: { lat: "-37.3159", lng: "81.1496" },
  },
  phone: "1-770-736-8031 x56442",
  website: "hildegard.org",
  company: {
    name: "Romaguera-Crona",
    catchPhrase: "Multi-layered client-server neural-net",
    bs: "harness real-time e-markets",
  },
};

function send(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function handler(req, res) {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    const url = new URL(req.url, "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);

    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return send(res, 400, {});
    }

    const id = Number(parts[1]);
    const validPost = Number.isInteger(id) && id >= 1 && id <= 100;

    if (parts[0] === "posts" && parts.length === 1) {
      if (req.method === "GET") {
        const userId = url.searchParams.get("userId");
        return send(res, 200, userId ? posts.filter((p) => String(p.userId) === userId) : posts);
      }
      if (req.method === "POST") return send(res, 201, { ...body, id: 101 });
    }

    if (parts[0] === "posts" && parts.length === 2 && validPost) {
      if (req.method === "GET") return send(res, 200, posts[id - 1]);
      if (req.method === "PUT") return send(res, 200, { ...body, id });
      if (req.method === "PATCH") return send(res, 200, { ...posts[id - 1], ...body });
      if (req.method === "DELETE") return send(res, 200, {});
    }

    if (parts[0] === "posts" && parts[2] === "comments" && validPost && req.method === "GET") {
      const comments = Array.from({ length: 5 }, (_, i) => ({
        postId: id,
        id: (id - 1) * 5 + i + 1,
        name: `comment ${i + 1}`,
        email: `user${i + 1}@example.com`,
        body: "comment body",
      }));
      return send(res, 200, comments);
    }

    if (parts[0] === "users" && parts[1] === "1" && req.method === "GET") {
      return send(res, 200, user1);
    }

    return send(res, 404, {});
  });
}

function start(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

module.exports = { start };

// Allow running the mock on its own: node mock/server.js
if (require.main === module) {
  const port = Number(process.env.MOCK_PORT) || 3456;
  start(port).then(() => console.log(`Mock API listening on http://127.0.0.1:${port}`));
}
