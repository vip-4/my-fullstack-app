import { Hono } from 'hono';
import { Client } from 'pg';
import { cors } from 'hono/cors';

interface Env {
  HYPERDRIVE: {
    connectionString: string;
  };
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('/api/*', cors({
  origin: ['http://localhost:8787', 'https://my-fullstack-app.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/api/health', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: c.env.ENVIRONMENT,
  });
});

// Get all posts
app.get('/api/posts', async (c) => {
  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    return c.json(result.rows);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  } finally {
    await client.end();
  }
});

// Create a post
app.post('/api/posts', async (c) => {
  const body = await c.req.json<{ title: string; content?: string }>();

  if (!body.title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });

  try {
    await client.connect();
    const result = await client.query(
      'INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *',
      [body.title, body.content || null]
    );
    return c.json(result.rows[0], 201);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  } finally {
    await client.end();
  }
});

// Get single post
app.get('/api/posts/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  } finally {
    await client.end();
  }
});

// Delete post
app.delete('/api/posts/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });

  try {
    await client.connect();
    const result = await client.query(
      'DELETE FROM posts WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json({ message: 'Post deleted', post: result.rows[0] });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  } finally {
    await client.end();
  }
});

// Serve static HTML
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Full-Stack App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #0a0a0a; color: #fff; }
    h1 { color: #f0883e; margin-bottom: 1.5rem; }
    .card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; color: #aaa; }
    input, textarea { width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 8px; background: #0a0a0a; color: #fff; font-size: 1rem; }
    button { background: #f0883e; color: #000; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
    button:hover { background: #e07a30; }
    .post { border-bottom: 1px solid #333; padding: 1rem 0; }
    .post:last-child { border-bottom: none; }
    .post h3 { color: #f0883e; }
    .post p { color: #aaa; margin-top: 0.5rem; }
    .post small { color: #666; }
    .status { padding: 0.5rem 1rem; border-radius: 6px; display: inline-block; margin-bottom: 1rem; }
    .status.ok { background: #1a3a1a; color: #5f5; }
    .status.error { background: #3a1a1a; color: #f55; }
  </style>
</head>
<body>
  <h1>🚀 My Full-Stack App</h1>
  <div id="health" class="status">Checking...</div>

  <div class="card">
    <h2>Create Post</h2>
    <form id="postForm">
      <div class="form-group">
        <label for="title">Title</label>
        <input type="text" id="title" required placeholder="Enter post title">
      </div>
      <div class="form-group">
        <label for="content">Content</label>
        <textarea id="content" rows="3" placeholder="Enter content..."></textarea>
      </div>
      <button type="submit">Create Post</button>
    </form>
  </div>

  <div class="card">
    <h2>Posts</h2>
    <div id="posts">Loading...</div>
  </div>

  <script>
    const API_URL = window.location.origin;

    async function checkHealth() {
      try {
        const res = await fetch(API_URL + '/api/health');
        const data = await res.json();
        document.getElementById('health').className = 'status ok';
        document.getElementById('health').textContent = '✓ Healthy - ' + data.version;
      } catch (e) {
        document.getElementById('health').className = 'status error';
        document.getElementById('health').textContent = '✗ Unhealthy';
      }
    }

    async function loadPosts() {
      try {
        const res = await fetch(API_URL + '/api/posts');
        const posts = await res.json();
        const container = document.getElementById('posts');
        if (posts.length === 0) {
          container.innerHTML = '<p style="color:#666">No posts yet. Create one above!</p>';
        } else {
          container.innerHTML = posts.map(p => '<div class="post"><h3>' + p.title + '</h3>' + (p.content ? '<p>' + p.content + '</p>' : '') + '<small>#' + p.id + ' - ' + new Date(p.created_at).toLocaleString() + '</small></div>').join('');
        }
      } catch (e) {
        document.getElementById('posts').innerHTML = '<p style="color:#f55">Failed to load posts</p>';
      }
    }

    document.getElementById('postForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value;
      const content = document.getElementById('content').value;
      try {
        await fetch(API_URL + '/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });
        document.getElementById('title').value = '';
        document.getElementById('content').value = '';
        loadPosts();
      } catch (e) {
        alert('Failed to create post');
      }
    });

    checkHealth();
    loadPosts();
  </script>
</body>
</html>
  `);
});

export default app;
