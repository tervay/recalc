async function createWpilibcModule(moduleArg = {}) {
  var Module = moduleArg;
  var aa = !!globalThis.window,
    ba = !!globalThis.WorkerGlobalScope,
    u =
      globalThis.process?.versions?.node &&
      globalThis.process?.type != 'renderer';
  if (u) {
    let { createRequire: a } = await import('node:module');
    var x = a(import.meta.url);
  }
  var ca = './this.program',
    da = (a, b) => {
      throw b;
    },
    ea = import.meta.url,
    z = '',
    fa,
    B;
  if (u) {
    var ha = x('node:fs');
    ea.startsWith('file:') &&
      (z = x('node:path').dirname(x('node:url').fileURLToPath(ea)) + '/');
    B = (a) => {
      a = ja(a) ? new URL(a) : a;
      return ha.readFileSync(a);
    };
    fa = async (a) => {
      a = ja(a) ? new URL(a) : a;
      return ha.readFileSync(a, void 0);
    };
    process.argv.length > 1 && (ca = process.argv[1].replace(/\\/g, '/'));
    process.argv.slice(2);
    da = (a, b) => {
      process.exitCode = a;
      throw b;
    };
  } else if (aa || ba) {
    try {
      z = new URL('.', ea).href;
    } catch {}
    ba &&
      (B = (a) => {
        var b = new XMLHttpRequest();
        b.open('GET', a, !1);
        b.responseType = 'arraybuffer';
        b.send(null);
        return new Uint8Array(b.response);
      });
    fa = async (a) => {
      a = await fetch(a, { credentials: 'same-origin' });
      if (a.ok) return a.arrayBuffer();
      throw Error(a.status + ' : ' + a.url);
    };
  }
  var ka = console.log.bind(console),
    C = console.error.bind(console),
    la = !1,
    ja = (a) => a.startsWith('file://'),
    ma = !1;
  function na() {
    if (!E?.buffer?.resizable) {
      var a = F.buffer;
      E = new Int8Array(a);
      G = new Int16Array(a);
      H = new Uint8Array(a);
      I = new Uint16Array(a);
      J = new Int32Array(a);
      K = new Uint32Array(a);
      oa = new Float32Array(a);
      pa = new Float64Array(a);
      qa = new BigInt64Array(a);
      ra = new BigUint64Array(a);
    }
  }
  function sa(a) {
    a = `Aborted(${a})`;
    C(a);
    la = !0;
    a += '. Build with -sASSERTIONS for more info.';
    ma && ta();
    throw new WebAssembly.RuntimeError(a);
  }
  var ua;
  async function va(a) {
    try {
      return await fa(a);
    } catch {}
    if (B) a = B(a);
    else throw 'both async and sync fetching of the wasm failed';
    return a;
  }
  async function wa(a, b) {
    try {
      var c = await va(a);
      return await WebAssembly.instantiate(c, b);
    } catch (d) {
      (C(`failed to asynchronously prepare wasm: ${d}`), sa(d));
    }
  }
  async function xa(a) {
    var b = ua;
    if (!u)
      try {
        var c = fetch(b, { credentials: 'same-origin' });
        return await WebAssembly.instantiateStreaming(c, a);
      } catch (d) {
        (C(`wasm streaming compile failed: ${d}`),
          C('falling back to ArrayBuffer instantiation'));
      }
    return wa(b, a);
  }
  class ya {
    name = 'ExitStatus';
    constructor(a) {
      this.message = `Program terminated with exit(${a})`;
      this.status = a;
    }
  }
  var E, K;
  function L(a) {
    return this.ea(K[a >> 2]);
  }
  var za = (a) => {
      for (; a.length;) {
        var b = a.pop();
        a.pop()(b);
      }
    },
    M = {},
    N = {},
    O = {};
  class P extends Error {
    constructor(a) {
      super(a);
      this.name = 'BindingError';
    }
  }
  var Aa = (a) => {
      throw new P(a);
    },
    Ba = {};
  function Ca(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new P(`type "${d}" must have a positive integer typeid pointer`);
    if (O[a]) {
      if (c.La) return;
      throw new P(`Cannot register type '${d}' twice`);
    }
    O[a] = b;
    delete Ba[a];
    N[a] && ((b = N[a]), delete N[a], b.forEach((e) => e()));
  }
  function Q(a, b, c = {}) {
    return Ca(a, b, c);
  }
  class Da extends Error {
    constructor(a) {
      super(a);
      this.name = 'InternalError';
    }
  }
  var R = (a, b, c) => {
      function d(g) {
        g = c(g);
        if (g.length !== a.length)
          throw new Da('Mismatched type converter count');
        for (var h = 0; h < a.length; ++h) Q(a[h], g[h]);
      }
      a.forEach((g) => (Ba[g] = b));
      var e = Array(b.length),
        f = [],
        k = 0;
      for (let [g, h] of b.entries())
        if (O[h]) e[g] = O[h];
        else {
          f.push(h);
          let m;
          (N[(m = h)] ?? (N[m] = [])).push(() => {
            e[g] = O[h];
            ++k;
            k === f.length && d(e);
          });
        }
      0 === f.length && d(e);
    },
    H,
    S = (a) => {
      for (var b = ''; ;) {
        var c = H[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
      }
    },
    G,
    J,
    qa,
    I,
    ra,
    Ea = (a, b, c) => {
      switch (b) {
        case 1:
          return c ? (d) => E[d] : (d) => H[d];
        case 2:
          return c ? (d) => G[d >> 1] : (d) => I[d >> 1];
        case 4:
          return c ? (d) => J[d >> 2] : (d) => K[d >> 2];
        case 8:
          return c ? (d) => qa[d >> 3] : (d) => ra[d >> 3];
        default:
          throw new TypeError(`invalid integer width (${b}): ${a}`);
      }
    },
    Fa = !1,
    Ga = () => {},
    T = (a) => {
      if (!globalThis.FinalizationRegistry) return ((T = (b) => b), a);
      Fa = new FinalizationRegistry((b) => {
        b = b.$;
        --b.count.value;
        0 === b.count.value && (b.ga ? b.ja.ka(b.ga) : b.da.aa.ka(b.ba));
      });
      T = (b) => {
        var c = b.$;
        c.ga && Fa.register(b, { $: c }, b);
        return b;
      };
      Ga = (b) => {
        Fa.unregister(b);
      };
      return T(a);
    },
    Ha = [],
    Ia = (a) => {
      throw new P(a.$.da.aa.name + ' instance already deleted');
    };
  function Ja() {}
  function Ka(a, b, c, d, e, f, k, g) {
    this.name = a;
    this.constructor = b;
    this.na = c;
    this.ka = d;
    this.ia = e;
    this.Ga = f;
    this.ra = k;
    this.Ea = g;
    this.Oa = [];
  }
  var La = (a) => {
      if (a === null) return 'null';
      var b = typeof a;
      return b === 'object' || b === 'array' || b === 'function'
        ? a.toString()
        : '' + a;
    },
    Ma = (a, b, c) => {
      for (; b !== c;) {
        if (!b.ra)
          throw new P(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.ra(a);
        b = b.ia;
      }
      return a;
    };
  function Na(a, b) {
    if (b === null) {
      if (this.ua) throw new P(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.$) throw new P(`Cannot pass "${La(b)}" as a ${this.name}`);
    if (!b.$.ba)
      throw new P(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return Ma(b.$.ba, b.$.da.aa, this.aa);
  }
  var Oa = [],
    U = [0, 1, , 1, null, 1, !0, 1, !1, 1],
    V = (a) => {
      if (!a) throw new P(`Cannot use deleted val. handle = ${a}`);
      return U[a];
    },
    W = (a) => {
      switch (a) {
        case void 0:
          return 2;
        case null:
          return 4;
        case !0:
          return 6;
        case !1:
          return 8;
        default:
          let b = Oa.pop() || U.length;
          U[b] = a;
          U[b + 1] = 1;
          return b;
      }
    };
  function Pa(a, b) {
    if (b === null) {
      if (this.ua) throw new P(`null is not a valid ${this.name}`);
      if (this.ta) {
        var c = this.wa();
        a !== null && a.push(this.ka, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.$) throw new P(`Cannot pass "${La(b)}" as a ${this.name}`);
    if (!b.$.ba)
      throw new P(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.sa && b.$.da.sa)
      throw new P(
        `Cannot convert argument of type ${b.$.ja ? b.$.ja.name : b.$.da.name} to parameter type ${this.name}`,
      );
    c = Ma(b.$.ba, b.$.da.aa, this.aa);
    if (this.ta) {
      if (void 0 === b.$.ga)
        throw new P('Passing raw pointer to smart pointer is illegal');
      switch (this.Ta) {
        case 0:
          if (b.$.ja === this) c = b.$.ga;
          else
            throw new P(
              `Cannot convert argument of type ${b.$.ja ? b.$.ja.name : b.$.da.name} to parameter type ${this.name}`,
            );
          break;
        case 1:
          c = b.$.ga;
          break;
        case 2:
          if (b.$.ja === this) c = b.$.ga;
          else {
            var d = b.clone();
            c = this.Pa(
              c,
              W(() => d['delete']()),
            );
            a !== null && a.push(this.ka, c);
          }
          break;
        default:
          throw new P('Unsupported sharing policy');
      }
    }
    return c;
  }
  var Qa = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.ia) return null;
      a = Qa(a, b, c.ia);
      return a === null ? null : c.Ea(a);
    },
    Ra = new Map(),
    Sa = (a, b) => {
      if (b === void 0) throw new P('ptr should not be undefined');
      for (; a.ia;) ((b = a.ra(b)), (a = a.ia));
      return Ra.get(b);
    },
    Ta = (a, b) => {
      if (!b.da || !b.ba)
        throw new Da('makeClassHandle requires ptr and ptrType');
      if (!!b.ja !== !!b.ga)
        throw new Da('Both smartPtrType and smartPtr must be specified');
      b.count = { value: 1 };
      return T(Object.create(a, { $: { value: b, writable: !0 } }));
    },
    Ua = {};
  function Va(a, b) {
    if (b === null) {
      if (this.ua) throw new P(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.$) throw new P(`Cannot pass "${La(b)}" as a ${this.name}`);
    if (!b.$.ba)
      throw new P(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.$.da.sa)
      throw new P(
        `Cannot convert argument of type ${b.$.da.name} to parameter type ${this.name}`,
      );
    return Ma(b.$.ba, b.$.da.aa, this.aa);
  }
  function Wa(a, b, c, d, e, f, k, g, h, m, l) {
    this.name = a;
    this.aa = b;
    this.ua = c;
    this.sa = d;
    this.ta = e;
    this.Na = f;
    this.Ta = k;
    this.Ca = g;
    this.wa = h;
    this.Pa = m;
    this.ka = l;
    e || b.ia !== void 0
      ? ((this.ha = Pa), e && (this.xa = !0))
      : (this.ha = d ? Na : Va);
  }
  var Xa = (a, b) => Object.defineProperty(b, 'name', { value: a }),
    X = (a, b) => {
      a = S(a);
      var c = Ya.get(b);
      if (typeof c !== 'function')
        throw new P(`unknown function pointer with signature ${a}: ${b}`);
      return c;
    },
    Za = (a, b, c) => {
      if (void 0 === a[b].fa) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].fa[e.length])
            throw new P(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].fa})!`,
            );
          return a[b].fa[e.length].apply(this, e);
        };
        a[b].fa = [];
        a[b].fa[d.oa] = d;
      }
    },
    $a = Object.hasOwn,
    ab = (a, b, c) => {
      if ($a(Module, a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].fa && void 0 !== Module[a].fa[c])
        )
          throw new P(`Cannot register public name '${a}' twice`);
        Za(Module, a, a);
        if (Module[a].fa[c])
          throw new P(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].fa[c] = b;
      } else ((Module[a] = b), (Module[a].oa = c));
    },
    bb = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    },
    cb = (a, b, c) => {
      if (!$a(Module, a)) throw new Da('Replacing nonexistent public symbol');
      void 0 !== Module[a].fa && void 0 !== c
        ? (Module[a].fa[c] = b)
        : ((Module[a] = b), (Module[a].oa = c));
    };
  class db extends Error {}
  var gb = (a) => {
      a = eb(a);
      var b = S(a);
      fb(a);
      return b;
    },
    hb = (a, b) => {
      function c(f) {
        e[f] || O[f] || (Ba[f] ? Ba[f].forEach(c) : (d.push(f), (e[f] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new db(`${a}: ` + d.map(gb).join([', ']));
    },
    jb = (a) => ib(a),
    lb = () => kb(),
    mb = {
      fffd1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          var m = [];
          h = g(m, h);
          c(d, h);
          e(m);
        };
      },
      fffn1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          h = g(null, h);
          c(d, h);
        };
      },
      fffs1: function (a, b, c, d, e, f, k, g, h, m) {
        return function (l) {
          var n = g();
          l = m(null, l);
          c(d, l);
          h(n);
        };
      },
      ftfd1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          var m = [];
          h = g(m, h);
          h = c(d, h);
          e(m);
          return f(h);
        };
      },
      ftfd2: function (a, b, c, d, e, f, k, g, h) {
        return function (m, l) {
          var n = [];
          m = g(n, m);
          l = h(n, l);
          l = c(d, m, l);
          e(n);
          return f(l);
        };
      },
      ftfd3: function (a, b, c, d, e, f, k, g, h, m) {
        return function (l, n, p) {
          var r = [];
          l = g(r, l);
          n = h(r, n);
          p = m(r, p);
          p = c(d, l, n, p);
          e(r);
          return f(p);
        };
      },
      ftfd6: function (a, b, c, d, e, f, k, g, h, m, l, n, p) {
        return function (r, q, t, y, A, v) {
          var w = [];
          r = g(w, r);
          q = h(w, q);
          t = m(w, t);
          y = l(w, y);
          A = n(w, A);
          v = p(w, v);
          v = c(d, r, q, t, y, A, v);
          e(w);
          return f(v);
        };
      },
      ftfn0: function (a, b, c, d, e, f) {
        return function () {
          var k = c(d);
          return f(k);
        };
      },
      ftfn1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          h = g(null, h);
          h = c(d, h);
          return f(h);
        };
      },
      ftfn2: function (a, b, c, d, e, f, k, g, h) {
        return function (m, l) {
          m = g(null, m);
          l = h(null, l);
          l = c(d, m, l);
          return f(l);
        };
      },
      ftfn3: function (a, b, c, d, e, f, k, g, h, m) {
        return function (l, n, p) {
          l = g(null, l);
          n = h(null, n);
          p = m(null, p);
          p = c(d, l, n, p);
          return f(p);
        };
      },
      ftfn6: function (a, b, c, d, e, f, k, g, h, m, l, n, p) {
        return function (r, q, t, y, A, v) {
          r = g(null, r);
          q = h(null, q);
          t = m(null, t);
          y = l(null, y);
          A = n(null, A);
          v = p(null, v);
          v = c(d, r, q, t, y, A, v);
          return f(v);
        };
      },
      ftfs1: function (a, b, c, d, e, f, k, g, h, m) {
        return function (l) {
          var n = g();
          l = m(null, l);
          l = c(d, l);
          h(n);
          return f(l);
        };
      },
      ftfs2: function (a, b, c, d, e, f, k, g, h, m, l) {
        return function (n, p) {
          var r = g();
          n = m(null, n);
          p = l(null, p);
          p = c(d, n, p);
          h(r);
          return f(p);
        };
      },
      ftfs3: function (a, b, c, d, e, f, k, g, h, m, l, n) {
        return function (p, r, q) {
          var t = g();
          p = m(null, p);
          r = l(null, r);
          q = n(null, q);
          q = c(d, p, r, q);
          h(t);
          return f(q);
        };
      },
      ftfs6: function (a, b, c, d, e, f, k, g, h, m, l, n, p, r, q) {
        return function (t, y, A, v, w, D) {
          var ia = g();
          t = m(null, t);
          y = l(null, y);
          A = n(null, A);
          v = p(null, v);
          w = r(null, w);
          D = q(null, D);
          D = c(d, t, y, A, v, w, D);
          h(ia);
          return f(D);
        };
      },
      tffd1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          var m = [],
            l = k(m, this);
          h = g(m, h);
          c(d, l, h);
          e(m);
        };
      },
      tffd2: function (a, b, c, d, e, f, k, g, h) {
        return function (m, l) {
          var n = [],
            p = k(n, this);
          m = g(n, m);
          l = h(n, l);
          c(d, p, m, l);
          e(n);
        };
      },
      tffn1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          var m = k(null, this);
          h = g(null, h);
          c(d, m, h);
        };
      },
      tffn2: function (a, b, c, d, e, f, k, g, h) {
        return function (m, l) {
          var n = k(null, this);
          m = g(null, m);
          l = h(null, l);
          c(d, n, m, l);
        };
      },
      tffs1: function (a, b, c, d, e, f, k, g, h, m) {
        return function (l) {
          var n = g(),
            p = k(null, this);
          l = m(null, l);
          c(d, p, l);
          h(n);
        };
      },
      tffs2: function (a, b, c, d, e, f, k, g, h, m, l) {
        return function (n, p) {
          var r = g(),
            q = k(null, this);
          n = m(null, n);
          p = l(null, p);
          c(d, q, n, p);
          h(r);
        };
      },
      ttfd1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          var m = [],
            l = k(m, this);
          h = g(m, h);
          l = c(d, l, h);
          e(m);
          return f(l);
        };
      },
      ttfd2: function (a, b, c, d, e, f, k, g, h) {
        return function (m, l) {
          var n = [],
            p = k(n, this);
          m = g(n, m);
          l = h(n, l);
          p = c(d, p, m, l);
          e(n);
          return f(p);
        };
      },
      ttfn0: function (a, b, c, d, e, f, k) {
        return function () {
          var g = k(null, this);
          g = c(d, g);
          return f(g);
        };
      },
      ttfn1: function (a, b, c, d, e, f, k, g) {
        return function (h) {
          var m = k(null, this);
          h = g(null, h);
          m = c(d, m, h);
          return f(m);
        };
      },
      ttfn2: function (a, b, c, d, e, f, k, g, h) {
        return function (m, l) {
          var n = k(null, this);
          m = g(null, m);
          l = h(null, l);
          n = c(d, n, m, l);
          return f(n);
        };
      },
      ttfs1: function (a, b, c, d, e, f, k, g, h, m) {
        return function (l) {
          var n = g(),
            p = k(null, this);
          l = m(null, l);
          p = c(d, p, l);
          h(n);
          return f(p);
        };
      },
      ttfs2: function (a, b, c, d, e, f, k, g, h, m, l) {
        return function (n, p) {
          var r = g(),
            q = k(null, this);
          n = m(null, n);
          p = l(null, p);
          q = c(d, q, n, p);
          h(r);
          return f(q);
        };
      },
    };
  function nb(a, b, c, d, e, f) {
    var k = b.length;
    if (k < 2)
      throw new P(
        'argTypes array size mismatch! Must at least get return value and receiver (this) types!',
      );
    c = b[1] !== null && c !== null;
    var g;
    a: {
      for (g = 1; g < b.length; ++g)
        if (b[g]?.xa) {
          g = !0;
          break a;
        }
      g = !1;
    }
    a: {
      for (var h = 1; h < b.length; ++h)
        if (b[h] !== null && b[h].za) {
          var m = !0;
          break a;
        }
      m = !1;
    }
    h = m && !f && !g;
    m && !h && (g = !0);
    m = !b[0].va;
    var l = k - 2,
      n = b[0],
      p = b[1];
    d = [a, Aa, d, e, za, n.ea.bind(n), p?.ha.bind(p)];
    h && d.push(lb, jb);
    for (e = 2; e < k; ++e) ((n = b[e]), d.push(n.ha.bind(n)));
    b = (0,
    mb[
      `${c ? 't' : 'f'}${m ? 't' : 'f'}${f ? 't' : 'f'}${h ? 's' : g ? 'd' : 'n'}${l}`
    ])(...d);
    return Xa(a, b);
  }
  var ob = (a, b) => {
      for (var c = [], d = 0; d < a; d++) c.push(K[(b + d * 4) >> 2]);
      return c;
    },
    pb = (a) => {
      a = a.trim();
      var b = a.indexOf('(');
      return b === -1 ? a : a.slice(0, b);
    },
    qb = [],
    rb = (a) => {
      if (a > 9 && 0 === --U[a + 1]) {
        var b = U[a];
        U[a] = void 0;
        var c = qb[a];
        c && ((qb[a] = void 0), c(b));
        Oa.push(a);
      }
    },
    sb = {
      name: 'emscripten::val',
      ea: (a) => {
        var b = V(a);
        rb(a);
        return b;
      },
      ha: (a, b) => W(b),
      la: L,
    },
    oa,
    pa,
    tb = (a, b) => {
      switch (b) {
        case 4:
          return function (c) {
            return this.ea(oa[c >> 2]);
          };
        case 8:
          return function (c) {
            return this.ea(pa[c >> 3]);
          };
        default:
          throw new TypeError(`invalid float width (${b}): ${a}`);
      }
    },
    ub = (a, b, c) => {
      var d = (e, f) => {
        var k = 0;
        return {
          next() {
            if (k >= e) return { done: !0 };
            var g = k;
            k++;
            return { value: f(g), done: !1 };
          },
          [Symbol.iterator]() {
            return this;
          },
        };
      };
      a[Symbol.iterator] ||
        (a[Symbol.iterator] = function () {
          var e = this[b]();
          return d(e, (f) => this[c](f));
        });
    },
    vb = Object.assign({ optional: !0 }, sb),
    wb = new TextDecoder(),
    xb = (a, b, c, d) => {
      c = b + c;
      if (d) return c;
      for (; a[b] && !(b >= c);) ++b;
      return b;
    },
    yb = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.codePointAt(c);
        d <= 127
          ? b++
          : d <= 2047
            ? (b += 2)
            : d <= 65535
              ? (b += 3)
              : ((b += 4), c++);
      }
      return b;
    },
    Y = (a, b, c) => {
      var d = H;
      if (!(c > 0)) return 0;
      var e = b;
      c = b + c - 1;
      for (var f = 0; f < a.length; ++f) {
        var k = a.codePointAt(f);
        if (k <= 127) {
          if (b >= c) break;
          d[b++] = k;
        } else if (k <= 2047) {
          if (b + 1 >= c) break;
          d[b++] = 192 | (k >> 6);
          d[b++] = 128 | (k & 63);
        } else if (k <= 65535) {
          if (b + 2 >= c) break;
          d[b++] = 224 | (k >> 12);
          d[b++] = 128 | ((k >> 6) & 63);
          d[b++] = 128 | (k & 63);
        } else {
          if (b + 3 >= c) break;
          d[b++] = 240 | (k >> 18);
          d[b++] = 128 | ((k >> 12) & 63);
          d[b++] = 128 | ((k >> 6) & 63);
          d[b++] = 128 | (k & 63);
          f++;
        }
      }
      d[b] = 0;
      return b - e;
    },
    zb = new TextDecoder('utf-16le'),
    Ab = (a, b, c) => {
      a >>= 1;
      return zb.decode(I.subarray(a, xb(I, a, b / 2, c)));
    },
    Bb = (a, b, c) => {
      var d = '';
      a >>= 2;
      for (var e = 0; !(e >= b / 4); e++) {
        var f = K[a + e];
        if (!f && !c) break;
        d += String.fromCodePoint(f);
      }
      return d;
    },
    Cb = (a) => a.length * 2,
    Db = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c)
        (a.codePointAt(c) > 65535 && c++, (b += 4));
      return b;
    },
    Eb = (a, b, c = 2147483647) => {
      if (c < 2) return 0;
      c -= 2;
      var d = b;
      c = c < a.length * 2 ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) ((G[b >> 1] = a.charCodeAt(e)), (b += 2));
      G[b >> 1] = 0;
      return b - d;
    },
    Fb = (a, b, c = 2147483647) => {
      if (c < 4) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.codePointAt(e);
        f > 65535 && e++;
        J[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      J[b >> 2] = 0;
      return b - d;
    },
    Gb = [],
    Hb = (a) => {
      var b = Gb.length;
      Gb.push(a);
      return b;
    },
    Ib = {},
    Jb = (a) => {
      var b = Ib[a];
      return b === void 0 ? S(a) : b;
    },
    Kb = {
      '1f1': (a) => (b, c, d, e) => {
        V(b)[Jb(c)](a(e));
      },
      '3t1': (a, b) => (c, d, e, f) => {
        d = b(f);
        c = [];
        d = a(c, d);
        c.length && (K[e >> 2] = W(c));
        return d;
      },
    },
    Lb = (a, b) => {
      for (var c = Array(a), d = 0; d < a; ++d) {
        var e = d,
          f = K[(b + d * 4) >> 2],
          k = O[f];
        if (void 0 === k)
          throw (
            (a = `${`parameter ${d}`} has unknown type ${gb(f)}`), new P(a)
          );
        c[e] = k;
      }
      return c;
    },
    Z = new Map(),
    Mb = {},
    Ob = () => {
      if (!Nb) {
        var a = {
            USER: 'web_user',
            LOGNAME: 'web_user',
            PATH: '/',
            PWD: '/',
            HOME: '/home/web_user',
            LANG:
              (globalThis.navigator?.language ?? 'C').replace('-', '_') +
              '.UTF-8',
            _: ca,
          },
          b;
        for (b in Mb) Mb[b] === void 0 ? delete a[b] : (a[b] = Mb[b]);
        var c = [];
        for (b in a) c.push(`${b}=${a[b]}`);
        Nb = c;
      }
      return Nb;
    },
    Nb,
    Pb = [null, [], []],
    Qb = () => {
      if (u) {
        var a = x('node:crypto');
        return (b) => (a.randomFillSync(b), 0);
      }
      return (b) => (crypto.getRandomValues(b), 0);
    },
    Rb = (a) => (Rb = Qb())(a);
  (() => {
    var a = Ja.prototype;
    Object.assign(a, {
      isAliasOf: function (c) {
        if (!(this instanceof Ja && c instanceof Ja)) return !1;
        var d = this.$.da.aa,
          e = this.$.ba;
        c.$ = c.$;
        var f = c.$.da.aa;
        for (c = c.$.ba; d.ia;) ((e = d.ra(e)), (d = d.ia));
        for (; f.ia;) ((c = f.ra(c)), (f = f.ia));
        return d === f && e === c;
      },
      clone: function () {
        this.$.ba || Ia(this);
        if (this.$.qa) return ((this.$.count.value += 1), this);
        var c = T,
          d = Object,
          e = d.create,
          f = Object.getPrototypeOf(this),
          k = this.$;
        c = c(
          e.call(d, f, {
            $: {
              value: {
                count: k.count,
                pa: k.pa,
                qa: k.qa,
                ba: k.ba,
                da: k.da,
                ga: k.ga,
                ja: k.ja,
              },
            },
          }),
        );
        c.$.count.value += 1;
        c.$.pa = !1;
        return c;
      },
      ['delete']() {
        this.$.ba || Ia(this);
        if (this.$.pa && !this.$.qa)
          throw new P('Object already scheduled for deletion');
        Ga(this);
        var c = this.$;
        --c.count.value;
        0 === c.count.value && (c.ga ? c.ja.ka(c.ga) : c.da.aa.ka(c.ba));
        this.$.qa || ((this.$.ga = void 0), (this.$.ba = void 0));
      },
      isDeleted: function () {
        return !this.$.ba;
      },
      deleteLater: function () {
        this.$.ba || Ia(this);
        if (this.$.pa && !this.$.qa)
          throw new P('Object already scheduled for deletion');
        Ha.push(this);
        this.$.pa = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Wa.prototype, {
    Ha(a) {
      this.Ca && (a = this.Ca(a));
      return a;
    },
    Aa(a) {
      this.ka?.(a);
    },
    la: L,
    ea: function (a) {
      function b() {
        return this.ta
          ? Ta(this.aa.na, { da: this.Na, ba: c, ja: this, ga: a })
          : Ta(this.aa.na, { da: this, ba: a });
      }
      var c = this.Ha(a);
      if (!c) return (this.Aa(a), null);
      var d = Sa(this.aa, c);
      if (void 0 !== d) {
        if (0 === d.$.count.value)
          return ((d.$.ba = c), (d.$.ga = a), d.clone());
        d = d.clone();
        this.Aa(a);
        return d;
      }
      d = this.aa.Ga(c);
      d = Ua[d];
      if (!d) return b.call(this);
      d = this.sa ? d.Da : d.pointerType;
      var e = Qa(c, this.aa, d.aa);
      return e === null
        ? b.call(this)
        : this.ta
          ? Ta(d.aa.na, { da: d, ba: e, ja: this, ga: a })
          : Ta(d.aa.na, { da: d, ba: e });
    },
  });
  var eb,
    Sb,
    fb,
    Tb,
    ta,
    ib,
    Ub,
    kb,
    F,
    Ya,
    Vb = {
      H: () => sa(''),
      N: (a) => {
        var b = M[a];
        delete M[a];
        var c = b.wa,
          d = b.ka,
          e = b.Ua,
          f = b.Ma,
          k = b.Ba,
          g = k.map((h) => h.Ka).concat(k.map((h) => h.Ra));
        R([a], g, (h) => {
          var m = {},
            l,
            n;
          for ([l, n] of k.entries()) {
            let p = h[l],
              r = n.Ia,
              q = n.Ja,
              t = h[l + k.length],
              y = n.Qa,
              A = n.Sa;
            m[n.Fa] = {
              read: (v) => p.ea(r(q, v)),
              write:
                t.xa || t.za
                  ? (v, w) => {
                      var D = [];
                      y(A, v, t.ha(D, w));
                      za(D);
                    }
                  : (v, w) => y(A, v, t.ha(null, w)),
              optional: p.optional,
            };
          }
          return [
            {
              name: b.name,
              ea: (p) => {
                var r = {},
                  q;
                for (q in m) r[q] = m[q].read(p);
                d(p);
                return r;
              },
              ha: (p, r) => {
                for (var q in m)
                  if (!(q in r || m[q].optional))
                    throw new TypeError(`Missing field: "${q}"`);
                if (f && !p) {
                  var t = Ub(e);
                  H.fill(0, t, t + e);
                } else ((t = c()), p && p.push(d, t));
                for (q in m) m[q].write(t, r[q]);
                return t;
              },
              la: L,
              xa: !f,
              za: f,
            },
          ];
        });
      },
      s: (a, b, c, d, e) => {
        b = S(b);
        d = d === 0n;
        var f = (k) => k;
        if (d) {
          let k = c * 8;
          f = (g) => BigInt.asUintN(k, g);
          e = f(e);
        }
        Q(a, {
          name: b,
          ea: f,
          ha: (k, g) => {
            typeof g === 'number' && (g = BigInt(g));
            return g;
          },
          la: Ea(b, c, !d),
        });
      },
      K: (a, b, c, d) => {
        b = S(b);
        Q(a, {
          name: b,
          ea: function (e) {
            return !!e;
          },
          ha: function (e, f) {
            return f ? c : d;
          },
          la: function (e) {
            return this.ea(H[e]);
          },
        });
      },
      q: (a, b, c, d, e, f, k, g, h, m, l, n, p) => {
        l = S(l);
        f = X(e, f);
        g &&= X(k, g);
        m &&= X(h, m);
        p = X(n, p);
        var r = bb(l);
        ab(r, function () {
          hb(`Cannot construct ${l} due to unbound types`, [d]);
        });
        R([a, b, c], d ? [d] : [], (q) => {
          q = q[0];
          if (d) {
            var t = q.aa;
            var y = t.na;
          } else y = Ja.prototype;
          q = Xa(l, function (...D) {
            if (Object.getPrototypeOf(this) !== A)
              throw new P(`Use 'new' to construct ${l}`);
            if (void 0 === v.ma)
              throw new P(`${l} has no accessible constructor`);
            var ia = v.ma[D.length];
            if (void 0 === ia)
              throw new P(
                `Tried to invoke ctor of ${l} with invalid number of parameters (${D.length}) - expected (${Object.keys(v.ma).toString()}) parameters instead!`,
              );
            return ia.apply(this, D);
          });
          var A = Object.create(y, { constructor: { value: q } });
          q.prototype = A;
          var v = new Ka(l, q, A, p, t, f, g, m);
          if (v.ia) {
            var w;
            (w = v.ia).ya ?? (w.ya = []);
            v.ia.ya.push(v);
          }
          t = new Wa(l, v, !0, !1, !1);
          w = new Wa(l + '*', v, !1, !1, !1);
          y = new Wa(l + ' const*', v, !1, !0, !1);
          Ua[a] = { pointerType: w, Da: y };
          cb(r, q);
          return [t, w, y];
        });
      },
      p: (a, b, c, d, e, f) => {
        var k = ob(b, c);
        e = X(d, e);
        R([], [a], (g) => {
          g = g[0];
          var h = `constructor ${g.name}`;
          void 0 === g.aa.ma && (g.aa.ma = []);
          if (void 0 !== g.aa.ma[b - 1])
            throw new P(
              `Cannot register multiple constructors with identical number of parameters (${b - 1}) for class '${g.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          g.aa.ma[b - 1] = () => {
            hb(`Cannot construct ${g.name} due to unbound types`, k);
          };
          R([], k, (m) => {
            m.splice(1, 0, null);
            g.aa.ma[b - 1] = nb(h, m, null, e, f);
            return [];
          });
          return [];
        });
      },
      f: (a, b, c, d, e, f, k, g, h) => {
        var m = ob(c, d);
        b = S(b);
        b = pb(b);
        f = X(e, f);
        R([], [a], (l) => {
          function n() {
            hb(`Cannot call ${p} due to unbound types`, m);
          }
          l = l[0];
          var p = `${l.name}.${b}`;
          b.startsWith('@@') && (b = Symbol[b.substring(2)]);
          g && l.aa.Oa.push(b);
          var r = l.aa.na,
            q = r[b];
          void 0 === q ||
          (void 0 === q.fa && q.className !== l.name && q.oa === c - 2)
            ? ((n.oa = c - 2), (n.className = l.name), (r[b] = n))
            : (Za(r, b, p), (r[b].fa[c - 2] = n));
          R([], m, (t) => {
            t = nb(p, t, l, f, k, h);
            void 0 === r[b].fa
              ? ((t.oa = c - 2), (r[b] = t))
              : (r[b].fa[c - 2] = t);
            return [];
          });
          return [];
        });
      },
      I: (a) => Q(a, sb),
      r: (a, b, c) => {
        b = S(b);
        Q(a, { name: b, ea: (d) => d, ha: (d, e) => e, la: tb(b, c) });
      },
      d: (a, b, c, d, e, f, k) => {
        var g = ob(b, c);
        a = S(a);
        a = pb(a);
        e = X(d, e);
        ab(
          a,
          function () {
            hb(`Cannot call ${a} due to unbound types`, g);
          },
          b - 1,
        );
        R([], g, (h) => {
          h = [h[0], null].concat(h.slice(1));
          cb(a, nb(a, h, null, e, f, k), b - 1);
          return [];
        });
      },
      h: (a, b, c, d, e) => {
        b = S(b);
        var f = (g) => g;
        if (d === 0) {
          var k = 32 - 8 * c;
          f = (g) => (g << k) >>> k;
          e = f(e);
        }
        Q(a, { name: b, ea: f, ha: (g, h) => h, la: Ea(b, c, d !== 0) });
      },
      u: (a, b, c, d) => {
        c = S(c);
        d = S(d);
        R([], [a, b], (e) => {
          ub(e[0].aa.na, c, d);
          return [];
        });
      },
      a: (a, b, c) => {
        function d(f) {
          return new e(E.buffer, K[(f + 4) >> 2], K[f >> 2]);
        }
        var e = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
          Uint8ClampedArray,
          BigInt64Array,
          BigUint64Array,
        ][b];
        c = S(c);
        Q(a, { name: c, ea: d, la: d }, { La: !0 });
      },
      O: (a) => {
        Q(a, vb);
      },
      J: (a, b) => {
        b = S(b);
        Q(a, {
          name: b,
          ea(c) {
            var d = (d = c + 4)
              ? wb.decode(H.subarray(d, xb(H, d, K[c >> 2], !0)))
              : '';
            fb(c);
            return d;
          },
          ha(c, d) {
            d instanceof ArrayBuffer && (d = new Uint8Array(d));
            var e = typeof d === 'string';
            if (!(e || (ArrayBuffer.isView(d) && d.BYTES_PER_ELEMENT == 1)))
              throw new P('Cannot pass non-string to std::string');
            c = e ? yb(d) : d.length;
            var f = Sb(4 + c + 1),
              k = f + 4;
            K[f >> 2] = c;
            e ? Y(d, k, c + 1) : H.set(d, k);
            return f;
          },
          la: L,
        });
      },
      o: (a, b, c) => {
        c = S(c);
        if (b === 2) {
          var d = Ab;
          var e = Eb;
          var f = Cb;
        } else ((d = Bb), (e = Fb), (f = Db));
        Q(a, {
          name: c,
          ea: (k) => {
            var g = d(k + 4, K[k >> 2] * b, !0);
            fb(k);
            return g;
          },
          ha: (k, g) => {
            if (typeof g !== 'string')
              throw new P(`Cannot pass non-string to C++ string type ${c}`);
            k = f(g);
            var h = Sb(4 + k + b);
            K[h >> 2] = k / b;
            e(g, h + 4, k + b);
            return h;
          },
          la: L,
        });
      },
      k: (a) => {
        Q(a, sb);
      },
      g: (a, b, c, d, e, f, k, g) => {
        M[a] = { name: S(b), wa: X(c, d), ka: X(e, f), Ua: k, Ma: !!g, Ba: [] };
      },
      c: (a, b, c, d, e, f, k, g, h, m) => {
        M[a].Ba.push({
          Fa: S(b),
          Ka: c,
          Ia: X(d, e),
          Ja: f,
          Ra: k,
          Qa: X(g, h),
          Sa: m,
        });
      },
      L: (a, b) => {
        b = S(b);
        Q(a, { va: !0, name: b, ea: () => {}, ha: () => {} });
      },
      E: () => {},
      n: (a, b, c) => {
        var d;
        [b, ...d] = Lb(a, b);
        var e = d.map((f) => f.la.bind(f));
        a--;
        a = Kb[`${c}${b.va ? 'f' : 't'}${a}`];
        c = b.va ? e : [b.ha.bind(b), ...e];
        a = a(...c);
        b = `methodCaller<(${d.map((f) => f.name)}) => ${b.name}>`;
        return Hb(Xa(b, a));
      },
      v: rb,
      M: (a) => {
        if (!a) return W(globalThis);
        a = Jb(a);
        return W(globalThis[a]);
      },
      t: (a) => {
        a > 9 && (U[a + 1] += 1);
      },
      m: (a, b, c, d, e) => Gb[a](b, c, d, e),
      b: () => W([]),
      i: (a) => W(Jb(a)),
      l: () => W({}),
      w: (a) => {
        var b = V(a);
        za(b);
        rb(a);
      },
      j: (a, b, c) => {
        a = V(a);
        b = V(b);
        c = V(c);
        a[b] = c;
      },
      x: (a, b) => {
        Z.has(a) && (clearTimeout(Z.get(a)), Z.delete(a));
        if (!b) return 0;
        b = setTimeout(() => {
          Z.delete(a);
          var c = [a, performance.now()],
            d = Tb;
          if (!la)
            try {
              d(...c);
            } catch (e) {
              e instanceof ya || e == 'unwind' || da(1, e);
            } finally {
            }
        }, b);
        Z.set(a, b);
        return 0;
      },
      z: (a, b, c, d) => {
        var e = new Date().getFullYear(),
          f = new Date(e, 0, 1).getTimezoneOffset();
        e = new Date(e, 6, 1).getTimezoneOffset();
        K[a >> 2] = Math.max(f, e) * 60;
        J[b >> 2] = Number(f != e);
        b = (k) => {
          var g = Math.abs(k);
          return `UTC${k >= 0 ? '-' : '+'}${String(Math.floor(g / 60)).padStart(2, '0')}${String(g % 60).padStart(2, '0')}`;
        };
        a = b(f);
        b = b(e);
        e < f ? (Y(a, c, 17), Y(b, d, 17)) : (Y(a, d, 17), Y(b, c, 17));
      },
      A: function (a, b, c) {
        if (!(a >= 0 && a <= 3)) return 28;
        qa[c >> 3] = BigInt(
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e6),
        );
        return 0;
      },
      e: () => performance.now(),
      B: (a) => {
        var b = H.length;
        a >>>= 0;
        if (a > 268435456) return !1;
        for (var c = 1; c <= 4; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          a: {
            d =
              ((Math.min(268435456, Math.ceil(Math.max(a, d) / 65536) * 65536) -
                F.buffer.byteLength +
                65535) /
                65536) |
              0;
            try {
              F.grow(d);
              na();
              var e = 1;
              break a;
            } catch (f) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      F: (a, b) => {
        var c = 0,
          d = 0,
          e;
        for (e of Ob()) {
          var f = b + c;
          K[(a + d) >> 2] = f;
          c += Y(e, f, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      G: (a, b) => {
        var c = Ob();
        K[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += yb(d) + 1;
        K[b >> 2] = a;
        return 0;
      },
      C: (a, b, c, d) => {
        for (var e = 0, f = 0; f < c; f++) {
          var k = K[b >> 2],
            g = K[(b + 4) >> 2];
          b += 8;
          for (var h = 0; h < g; h++) {
            var m = a,
              l = H[k + h],
              n = Pb[m];
            l && l !== 10
              ? n.push(l)
              : ((l = xb(n, 0)),
                (l = wb.decode(
                  n.buffer ? n.subarray(0, l) : new Uint8Array(n.slice(0, l)),
                )),
                (m === 1 ? ka : C)(l),
                (n.length = 0));
          }
          e += g;
        }
        K[d >> 2] = e;
        return 0;
      },
      D: (a) => {
        da(a, new ya(a));
      },
      y: (a, b) => Rb(H.subarray(a, a + b)),
    },
    Wb;
  Wb = await (async function () {
    var a = { a: Vb };
    ua ??= Module.locateFile
      ? Module.locateFile
        ? Module.locateFile('wpilibc_wasm.wasm', z)
        : z + 'wpilibc_wasm.wasm'
      : new URL('wpilibc_wasm.wasm', import.meta.url).href;
    a = Wb = (await xa(a)).instance.exports;
    eb = a.R;
    Sb = Module._malloc = a.S;
    fb = Module._free = a.T;
    Tb = a.V;
    ta = a.W;
    ib = a.X;
    Ub = a.Y;
    kb = a.Z;
    F = a.P;
    Ya = a.U;
    na();
    return Wb;
  })();
  await (async function () {
    la || ((ma = !0), Wb.Q());
  })();
  return Module;
}
export default createWpilibcModule;
