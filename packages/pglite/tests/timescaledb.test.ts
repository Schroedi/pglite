import { describe, it, expect } from 'vitest'
import { testEsmCjsAndDTC } from './test-utils.ts'

await testEsmCjsAndDTC(async (importType) => {
  const { PGlite } =
    importType === 'esm'
      ? await import('../dist/index.js')
      : ((await import(
          '../dist/index.cjs'
        )) as unknown as typeof import('../dist/index.js'))

  const { timescaledb } =
    importType === 'esm'
      ? await import('../dist/timescaledb/index.js')
      : ((await import(
          '../dist/timescaledb/index.cjs'
        )) as unknown as typeof import('../dist/timescaledb/index.js'))

  describe('timescaledb', () => {
    it('debug info', async () => {
      const pg = new PGlite()
      try {
        const res = await pg.query("SELECT current_setting('dynamic_library_path') as path")
        console.log('dynamic_library_path:', res.rows[0])
        const res2 = await pg.query("SELECT pg_ls_dir('lib') as files")
        console.log('files in lib:', res2.rows)
      } catch (e) {
        console.error('Debug query failed:', e)
      }
    })

    it('can load extension', async () => {
      const pg = new PGlite({
        extensions: {
          timescaledb,
        },
      })

      await pg.exec('CREATE EXTENSION IF NOT EXISTS timescaledb;')

      const res = await pg.query<{ extname: string }>(`
        SELECT extname 
        FROM pg_extension 
        WHERE extname = 'timescaledb'
      `)

      expect(res.rows).toHaveLength(1)
      expect(res.rows[0].extname).toBe('timescaledb')
    })

    it('creates a hypertable and buckets data', async () => {
      const pg = new PGlite({
        extensions: {
          timescaledb,
        },
      })

      await pg.exec('CREATE EXTENSION IF NOT EXISTS timescaledb;')

      await pg.exec(`
        CREATE TABLE metrics (
          id SERIAL,
          ts TIMESTAMPTZ NOT NULL,
          value INTEGER NOT NULL,
          PRIMARY KEY (id, ts)
        );
        SELECT create_hypertable('metrics', 'ts');
      `)

      await pg.exec(`
        INSERT INTO metrics (ts, value) VALUES
          ('2024-01-01T00:00:00Z', 20),
          ('2024-01-01T06:00:00Z', 22),
          ('2024-01-02T00:00:00Z', 19),
          ('2024-01-02T12:00:00Z', 23);
      `)

      const hypertables = await pg.query<{ hypertable_name: string }>(`
        SELECT hypertable_name
        FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'metrics'
      `)
      expect(hypertables.rows).toHaveLength(1)

      const buckets = await pg.query<{ bucket: string; avg_value: string }>(`
        SELECT
          time_bucket('1 day', ts) AS bucket,
          AVG(value) AS avg_value
        FROM metrics
        GROUP BY bucket
        ORDER BY bucket;
      `)

      expect(buckets.rows).toHaveLength(2)
      expect(new Date(buckets.rows[0].bucket).toISOString()).toBe(
        '2024-01-01T00:00:00.000Z',
      )
      expect(Number(buckets.rows[0].avg_value)).toBe(21)
      expect(new Date(buckets.rows[1].bucket).toISOString()).toBe(
        '2024-01-02T00:00:00.000Z',
      )
      expect(Number(buckets.rows[1].avg_value)).toBe(21)
    })
  })
})
