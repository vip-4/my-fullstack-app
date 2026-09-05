import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => {
  return c.json({
    message: "Edge API with Hyperdrive + Neon",
    endpoints: ["/health", "/api/posts", "/api/users"],
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/posts", async (c) => {
  try {
    const connection = c.env.HYPERDRIVE.connection;
    const result = await connection`SELECT id, title, content, published, created_at FROM posts LIMIT 10`;
    return c.json({ posts: result });
  } catch (error) {
    return c.json({ error: "Failed to fetch posts" }, 500);
  }
});

app.get("/api/users", async (c) => {
  try {
    const connection = c.env.HYPERDRIVE.connection;
    const result = await connection`SELECT id, email, name, created_at FROM users LIMIT 10`;
    return c.json({ users: result });
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

app.post("/api/posts", async (c) => {
  try {
    const body = await c.req.json();
    const { title, content, authorId } = body;

    if (!title || !content || !authorId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const id = crypto.randomUUID();
    const connection = c.env.HYPERDRIVE.connection;
    const result = await connection`
      INSERT INTO posts (id, title, content, author_id, published)
      VALUES (${id}, ${title}, ${content}, ${authorId}, false)
      RETURNING id, title, content, published, created_at
    `;
    return c.json({ post: result[0] }, 201);
  } catch (error) {
    return c.json({ error: "Failed to create post" }, 500);
  }
});

export default app;
