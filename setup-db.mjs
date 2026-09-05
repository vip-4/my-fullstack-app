import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_rWOvA5QU9pFe@ep-square-boat-auqrsoiu.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const sql = neon(connectionString);
  
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  console.log('✅ Posts table created successfully!');
  
  // Insert sample data
  await sql`
    INSERT INTO posts (title, content) VALUES 
      ('Welcome!', 'This is your first post.'),
      ('Cloudflare + Neon', 'Full-stack deployment is working!')
    ON CONFLICT DO NOTHING;
  `;
  
  console.log('✅ Sample data inserted!');
  
  const result = await sql`SELECT * FROM posts`;
  console.log('📊 Posts:', result);
}

main().catch(console.error);
