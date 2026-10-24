// Token model: collections (with modes) and tokens (with per-mode values or aliases).
// A value is either raw (number, string, object) or an alias string "{path.to.token}".
// Composite values (typography, shadow) may hold aliases in their fields.

const ALIAS = /^\{([^}]+)\}$/;
export const isAlias = (v) => typeof v === 'string' && ALIAS.test(v);
export const aliasTarget = (v) => v.match(ALIAS)[1];
export const ref = (path) => `{${path}}`;

export class System {
  constructor(name) {
    this.name = name;
    this.collections = new Map(); // name -> { name, modes, description }
    this.tokens = new Map(); // path -> token
    this.pairs = []; // contrast contract: { fg, bg, min, kind, wcag }
    this.notes = []; // build notes shown in the report
  }

  collection(name, modes, description = '') {
    this.collections.set(name, { name, modes, description });
    return this;
  }

  /**
   * Add a token.
   * opts: { collection, type, value } for single-mode, or { collection, type, values: { mode: v } }.
   * meta: free-form (description, wcag, tier, figma scopes, cssOnly...).
   */
  add(path, { collection, type, value, values, description = '', ...meta }) {
    if (this.tokens.has(path)) throw new Error(`Duplicate token ${path}`);
    const col = this.collections.get(collection);
    if (!col) throw new Error(`Unknown collection ${collection} for ${path}`);
    const v = values ?? Object.fromEntries(col.modes.map((m) => [m, value]));
    for (const m of col.modes) if (!(m in v)) throw new Error(`${path}: missing mode ${m}`);
    this.tokens.set(path, { path, collection, type, values: v, description, meta });
    return this;
  }

  get(path) {
    const t = this.tokens.get(path);
    if (!t) throw new Error(`Unknown token ${path}`);
    return t;
  }

  /** Mode of a collection in a context such as { Color: 'Dark', Responsive: 'md' }. */
  modeFor(collection, ctx = {}) {
    return ctx[collection] ?? this.collections.get(collection).modes[0];
  }

  /** Fully resolved value of a token in a context. */
  resolve(path, ctx = {}, seen = new Set()) {
    if (seen.has(path)) throw new Error(`Alias cycle at ${path}`);
    seen.add(path);
    const t = this.get(path);
    return this.resolveValue(t.values[this.modeFor(t.collection, ctx)], ctx, seen);
  }

  resolveValue(v, ctx = {}, seen = new Set()) {
    if (isAlias(v)) return this.resolve(aliasTarget(v), ctx, new Set(seen));
    if (Array.isArray(v)) return v.map((x) => this.resolveValue(x, ctx, seen));
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, this.resolveValue(x, ctx, seen)]));
    }
    return v;
  }

  /** Every combination of modes across all multi-mode collections that matter for `paths`. */
  contexts(collections) {
    let out = [{}];
    for (const c of collections) {
      const modes = this.collections.get(c).modes;
      out = out.flatMap((ctx) => modes.map((m) => ({ ...ctx, [c]: m })));
    }
    return out;
  }

  /** Check every alias points at an existing token one tier down (or an allowed cross-link). */
  validateAliases() {
    const problems = [];
    const walk = (v, from) => {
      if (isAlias(v)) {
        const to = aliasTarget(v);
        if (!this.tokens.has(to)) problems.push(`${from} -> missing ${to}`);
      } else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, from));
    };
    for (const t of this.tokens.values()) Object.values(t.values).forEach((v) => walk(v, t.path));
    return problems;
  }

  byPrefix(prefix) {
    return [...this.tokens.values()].filter((t) => t.path.startsWith(prefix));
  }
}
