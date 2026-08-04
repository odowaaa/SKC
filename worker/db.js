export async function all(db, query, ...params) {
  const stmt = params.length ? db.prepare(query).bind(...params) : db.prepare(query);
  const { results } = await stmt.all();
  return results;
}

export async function first(db, query, ...params) {
  const stmt = params.length ? db.prepare(query).bind(...params) : db.prepare(query);
  return stmt.first();
}

export async function run(db, query, ...params) {
  const stmt = params.length ? db.prepare(query).bind(...params) : db.prepare(query);
  return stmt.run();
}
