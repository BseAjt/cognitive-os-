export async function createPostgresStore(connectionString) {
  let pg;
  try { pg = await import('pg'); } catch { throw new Error('PostgreSQL mode requires optional dependency "pg". Run npm install.'); }
  const pool = new pg.Pool({ connectionString });
  await pool.query('select 1');
  return {
    async readDb() {
      const collections = ['objectives','decisions','memories','agents','tasks','activity'];
      const db = { workspace: { id: 'default', name: 'ExecutiveOS' } };
      for (const name of collections) db[name] = (await pool.query(`select payload from eos_entities where collection=$1 order by created_at desc`, [name])).rows.map(r => r.payload);
      return db;
    },
    async writeDb(db) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query('delete from eos_entities');
        for (const [collection, values] of Object.entries(db)) if (Array.isArray(values)) for (const entity of values) await client.query('insert into eos_entities(id,collection,payload,created_at) values($1,$2,$3,$4)', [entity.id, collection, entity, entity.createdAt || new Date().toISOString()]);
        await client.query('commit');
      } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
      return db;
    },
    close: () => pool.end()
  };
}
