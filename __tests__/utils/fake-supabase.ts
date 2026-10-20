/**
 * Tiny in-memory stand-in for the Supabase query builder, enough for the
 * server helpers under test: select / insert / update / upsert with
 * eq / neq / in / is filters and maybeSingle / single / select().
 */
type Row = Record<string, any>;
type Filter = (row: Row) => boolean;

export function createFakeSupabase(initial: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {};
  for (const [name, rows] of Object.entries(initial)) tables[name] = rows.map((r) => ({ ...r }));
  const rpcCalls: { fn: string; args: any }[] = [];
  const rpcHandlers: Record<string, (args: any) => { data?: any; error?: any }> = {};

  function query(table: string) {
    tables[table] ??= [];
    const filters: Filter[] = [];
    let op: 'select' | 'insert' | 'update' | 'upsert' = 'select';
    let payload: any = null;
    let upsertConflict: string | null = null;
    let ignoreDuplicates = false;

    const rows = () => tables[table].filter((r) => filters.every((f) => f(r)));

    const execute = (): { data: any; error: any } => {
      if (op === 'insert' || op === 'upsert') {
        const list = Array.isArray(payload) ? payload : [payload];
        const inserted: Row[] = [];
        for (const item of list) {
          const key = upsertConflict ?? (item.reference_id !== undefined ? 'reference_id' : null);
          if (key && tables[table].some((r) => r[key] === item[key])) {
            if (op === 'upsert' && ignoreDuplicates) continue;
            return { data: null, error: { code: '23505', message: 'duplicate key' } };
          }
          const row = { id: item.id ?? `${table}-${tables[table].length + 1}`, ...item };
          tables[table].push(row);
          inserted.push(row);
        }
        return { data: inserted, error: null };
      }
      if (op === 'update') {
        const matched = rows();
        for (const r of matched) Object.assign(r, payload);
        return { data: matched, error: null };
      }
      return { data: rows(), error: null };
    };

    const builder: any = {
      select: () => builder,
      insert: (p: any) => ((op = 'insert'), (payload = p), builder),
      upsert: (p: any, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
        op = 'upsert';
        payload = p;
        upsertConflict = opts?.onConflict ?? null;
        ignoreDuplicates = !!opts?.ignoreDuplicates;
        return builder;
      },
      update: (p: any) => ((op = 'update'), (payload = p), builder),
      eq: (col: string, val: any) => (filters.push((r) => r[col] === val), builder),
      neq: (col: string, val: any) => (filters.push((r) => r[col] !== val), builder),
      in: (col: string, vals: any[]) => (filters.push((r) => vals.includes(r[col])), builder),
      is: (col: string, val: any) => (filters.push((r) => (r[col] ?? null) === val), builder),
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => {
        const { data, error } = execute();
        return { data: Array.isArray(data) ? data[0] ?? null : data, error };
      },
      single: async () => {
        const { data, error } = execute();
        const row = Array.isArray(data) ? data[0] ?? null : data;
        return { data: row, error: error ?? (row ? null : { code: 'PGRST116', message: 'no rows' }) };
      },
      then: (resolve: any, reject: any) => Promise.resolve(execute()).then(resolve, reject),
    };
    return builder;
  }

  return {
    tables,
    rpcCalls,
    onRpc(fn: string, handler: (args: any) => { data?: any; error?: any }) {
      rpcHandlers[fn] = handler;
    },
    client: {
      from: (table: string) => query(table),
      rpc: async (fn: string, args: any) => {
        rpcCalls.push({ fn, args });
        const handler = rpcHandlers[fn];
        return handler ? { data: null, error: null, ...handler(args) } : { data: null, error: null };
      },
    },
  };
}
