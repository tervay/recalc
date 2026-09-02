async function createWpilibcModule(moduleArg = {}) {
  var Module = moduleArg;
  var aa = !!globalThis.window,
    ba = !!globalThis.WorkerGlobalScope,
    l =
      globalThis.process?.versions?.node &&
      globalThis.process?.type != 'renderer';
  if (l) {
    let { createRequire: a } = await import('node:module');
    var t = a(import.meta.url);
  }
  var ca = './this.program',
    da = (a, b) => {
      throw b;
    },
    ea = import.meta.url,
    w = '',
    fa,
    x;
  if (l) {
    var ha = t('node:fs');
    ea.startsWith('file:') &&
      (w = t('node:path').dirname(t('node:url').fileURLToPath(ea)) + '/');
    x = (a) => {
      a = ia(a) ? new URL(a) : a;
      return ha.readFileSync(a);
    };
    fa = async (a) => {
      a = ia(a) ? new URL(a) : a;
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
      w = new URL('.', ea).href;
    } catch {}
    ba &&
      (x = (a) => {
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
  var ja = console.log.bind(console),
    y = console.error.bind(console),
    ka = !1,
    ia = (a) => a.startsWith('file://'),
    la = !1;
  function ma() {
    if (!A?.buffer?.resizable) {
      var a = B.buffer;
      A = new Int8Array(a);
      C = new Int16Array(a);
      D = new Uint8Array(a);
      E = new Uint16Array(a);
      F = new Int32Array(a);
      G = new Uint32Array(a);
      na = new Float32Array(a);
      oa = new Float64Array(a);
      pa = new BigInt64Array(a);
      qa = new BigUint64Array(a);
    }
  }
  function ra(a) {
    a = `Aborted(${a})`;
    y(a);
    ka = !0;
    a += '. Build with -sASSERTIONS for more info.';
    la && sa();
    throw new WebAssembly.RuntimeError(a);
  }
  var ta;
  async function ua(a) {
    try {
      var b = await fa(a);
      return new Uint8Array(b);
    } catch {}
    if (x) a = x(a);
    else throw 'both async and sync fetching of the wasm failed';
    return a;
  }
  async function va(a, b) {
    try {
      var c = await ua(a);
      return await WebAssembly.instantiate(c, b);
    } catch (d) {
      (y(`failed to asynchronously prepare wasm: ${d}`), ra(d));
    }
  }
  async function wa(a) {
    var b = ta;
    if (!l)
      try {
        var c = fetch(b, { credentials: 'same-origin' });
        return await WebAssembly.instantiateStreaming(c, a);
      } catch (d) {
        (y(`wasm streaming compile failed: ${d}`),
          y('falling back to ArrayBuffer instantiation'));
      }
    return va(b, a);
  }
  class xa {
    name = 'ExitStatus';
    constructor(a) {
      this.message = `Program terminated with exit(${a})`;
      this.status = a;
    }
  }
  var A,
    D,
    I = (a) => {
      for (var b = ''; ;) {
        var c = D[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
      }
    },
    J = {},
    K = {},
    L = {};
  class M extends Error {
    constructor(a) {
      super(a);
      this.name = 'BindingError';
    }
  }
  function ya(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new M(`type "${d}" must have a positive integer typeid pointer`);
    if (K.hasOwnProperty(a)) {
      if (c.xa) return;
      throw new M(`Cannot register type '${d}' twice`);
    }
    K[a] = b;
    delete L[a];
    J.hasOwnProperty(a) && ((b = J[a]), delete J[a], b.forEach((e) => e()));
  }
  function N(a, b, c = {}) {
    return ya(a, b, c);
  }
  var C,
    E,
    F,
    G,
    pa,
    qa,
    za = (a, b, c) => {
      switch (b) {
        case 1:
          return c ? (d) => A[d] : (d) => D[d];
        case 2:
          return c ? (d) => C[d >> 1] : (d) => E[d >> 1];
        case 4:
          return c ? (d) => F[d >> 2] : (d) => G[d >> 2];
        case 8:
          return c ? (d) => pa[d >> 3] : (d) => qa[d >> 3];
        default:
          throw new TypeError(`invalid integer width (${b}): ${a}`);
      }
    },
    Ca = (a) => {
      throw new M(a.U.X.V.name + ' instance already deleted');
    },
    Da = !1,
    Ea = () => {},
    P = (a) => {
      if (!globalThis.FinalizationRegistry) return ((P = (b) => b), a);
      Da = new FinalizationRegistry((b) => {
        b = b.U;
        --b.count.value;
        0 === b.count.value && (b.Z ? b.ba.ga(b.Z) : b.X.V.ga(b.W));
      });
      P = (b) => {
        var c = b.U;
        c.Z && Da.register(b, { U: c }, b);
        return b;
      };
      Ea = (b) => {
        Da.unregister(b);
      };
      return P(a);
    },
    Fa = [];
  function Q() {}
  var Ga = (a, b) => Object.defineProperty(b, 'name', { value: a }),
    Ha = {},
    Ia = (a, b, c) => {
      if (void 0 === a[b].Y) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].Y.hasOwnProperty(e.length))
            throw new M(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].Y})!`,
            );
          return a[b].Y[e.length].apply(this, e);
        };
        a[b].Y = [];
        a[b].Y[d.ja] = d;
      }
    },
    Ja = (a, b, c) => {
      if (Module.hasOwnProperty(a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].Y && void 0 !== Module[a].Y[c])
        )
          throw new M(`Cannot register public name '${a}' twice`);
        Ia(Module, a, a);
        if (Module[a].Y.hasOwnProperty(c))
          throw new M(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].Y[c] = b;
      } else ((Module[a] = b), (Module[a].ja = c));
    },
    Ka = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    };
  function La(a, b, c, d, e, f, g, h) {
    this.name = a;
    this.constructor = b;
    this.ia = c;
    this.ga = d;
    this.aa = e;
    this.va = f;
    this.ma = g;
    this.ua = h;
    this.Aa = [];
  }
  var Ma = (a, b, c) => {
      for (; b !== c;) {
        if (!b.ma)
          throw new M(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.ma(a);
        b = b.aa;
      }
      return a;
    },
    Na = (a) => {
      if (a === null) return 'null';
      var b = typeof a;
      return b === 'object' || b === 'array' || b === 'function'
        ? a.toString()
        : '' + a;
    };
  function Oa(a, b) {
    if (b === null) {
      if (this.pa) throw new M(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.U) throw new M(`Cannot pass "${Na(b)}" as a ${this.name}`);
    if (!b.U.W)
      throw new M(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return Ma(b.U.W, b.U.X.V, this.V);
  }
  function Pa(a, b) {
    if (b === null) {
      if (this.pa) throw new M(`null is not a valid ${this.name}`);
      if (this.oa) {
        var c = this.Ba();
        a !== null && a.push(this.ga, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.U) throw new M(`Cannot pass "${Na(b)}" as a ${this.name}`);
    if (!b.U.W)
      throw new M(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.na && b.U.X.na)
      throw new M(
        `Cannot convert argument of type ${
          b.U.ba ? b.U.ba.name : b.U.X.name
        } to parameter type ${this.name}`,
      );
    c = Ma(b.U.W, b.U.X.V, this.V);
    if (this.oa) {
      if (void 0 === b.U.Z)
        throw new M('Passing raw pointer to smart pointer is illegal');
      switch (this.Da) {
        case 0:
          if (b.U.ba === this) c = b.U.Z;
          else
            throw new M(
              `Cannot convert argument of type ${b.U.ba ? b.U.ba.name : b.U.X.name} to parameter type ${this.name}`,
            );
          break;
        case 1:
          c = b.U.Z;
          break;
        case 2:
          if (b.U.ba === this) c = b.U.Z;
          else {
            var d = b.clone();
            c = this.Ca(
              c,
              R(() => d['delete']()),
            );
            a !== null && a.push(this.ga, c);
          }
          break;
        default:
          throw new M('Unsupported sharing policy');
      }
    }
    return c;
  }
  function Qa(a, b) {
    if (b === null) {
      if (this.pa) throw new M(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.U) throw new M(`Cannot pass "${Na(b)}" as a ${this.name}`);
    if (!b.U.W)
      throw new M(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.U.X.na)
      throw new M(
        `Cannot convert argument of type ${b.U.X.name} to parameter type ${this.name}`,
      );
    return Ma(b.U.W, b.U.X.V, this.V);
  }
  function S(a) {
    return this.$(G[a >> 2]);
  }
  var Ra = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.aa) return null;
      a = Ra(a, b, c.aa);
      return a === null ? null : c.ua(a);
    },
    Sa = {},
    Ta = (a, b) => {
      if (b === void 0) throw new M('ptr should not be undefined');
      for (; a.aa;) ((b = a.ma(b)), (a = a.aa));
      return Sa[b];
    };
  class Ua extends Error {
    constructor(a) {
      super(a);
      this.name = 'InternalError';
    }
  }
  var Va = (a, b) => {
    if (!b.X || !b.W) throw new Ua('makeClassHandle requires ptr and ptrType');
    if (!!b.ba !== !!b.Z)
      throw new Ua('Both smartPtrType and smartPtr must be specified');
    b.count = { value: 1 };
    return P(Object.create(a, { U: { value: b, writable: !0 } }));
  };
  function Wa(a, b, c, d, e, f, g, h, k, n, m) {
    this.name = a;
    this.V = b;
    this.pa = c;
    this.na = d;
    this.oa = e;
    this.za = f;
    this.Da = g;
    this.sa = h;
    this.Ba = k;
    this.Ca = n;
    this.ga = m;
    e || b.aa !== void 0
      ? (this.da = Pa)
      : ((this.da = d ? Oa : Qa), (this.ea = null));
  }
  var Xa = (a, b, c) => {
      if (!Module.hasOwnProperty(a))
        throw new Ua('Replacing nonexistent public symbol');
      void 0 !== Module[a].Y && void 0 !== c
        ? (Module[a].Y[c] = b)
        : ((Module[a] = b), (Module[a].ja = c));
    },
    T = (a, b) => {
      a = I(a);
      var c = Ya.get(b);
      if (typeof c != 'function')
        throw new M(`unknown function pointer with signature ${a}: ${b}`);
      return c;
    };
  class Za extends Error {}
  var ab = (a) => {
      a = $a(a);
      var b = I(a);
      U(a);
      return b;
    },
    bb = (a, b) => {
      function c(f) {
        e[f] || K[f] || (L[f] ? L[f].forEach(c) : (d.push(f), (e[f] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new Za(`${a}: ` + d.map(ab).join([', ']));
    },
    V = (a, b, c) => {
      function d(h) {
        h = c(h);
        if (h.length !== a.length)
          throw new Ua('Mismatched type converter count');
        for (var k = 0; k < a.length; ++k) N(a[k], h[k]);
      }
      a.forEach((h) => (L[h] = b));
      var e = Array(b.length),
        f = [],
        g = 0;
      for (let [h, k] of b.entries())
        K.hasOwnProperty(k)
          ? (e[h] = K[k])
          : (f.push(k),
            J.hasOwnProperty(k) || (J[k] = []),
            J[k].push(() => {
              e[h] = K[k];
              ++g;
              g === f.length && d(e);
            }));
      0 === f.length && d(e);
    },
    cb = (a, b) => {
      for (var c = [], d = 0; d < a; d++) c.push(G[(b + d * 4) >> 2]);
      return c;
    };
  function db(a) {
    for (var b = 1; b < a.length; ++b)
      if (a[b] !== null && a[b].ea === void 0) return !0;
    return !1;
  }
  function eb(a, b, c, d, e) {
    var f = b.length;
    if (f < 2)
      throw new M(
        'argTypes array size mismatch! Must at least get return value and receiver (this) types!',
      );
    var g = b[1] !== null && c !== null,
      h = db(b),
      k = !b[0].ya,
      n = f - 2,
      m = Array(n),
      q = [],
      p = [];
    return Ga(a, function (...u) {
      p.length = 0;
      q.length = g ? 2 : 1;
      q[0] = e;
      if (g) {
        var r = b[1].da(p, this);
        q[1] = r;
      }
      for (var v = 0; v < n; ++v) ((m[v] = b[v + 2].da(p, u[v])), q.push(m[v]));
      u = d(...q);
      if (h) for (; p.length;) ((r = p.pop()), p.pop()(r));
      else
        for (v = g ? 1 : 2; v < b.length; v++) {
          var H = v === 1 ? r : m[v - 2];
          b[v].ea !== null && b[v].ea(H);
        }
      r = k ? b[0].$(u) : void 0;
      return r;
    });
  }
  var fb = (a) => {
      a = a.trim();
      var b = a.indexOf('(');
      return b === -1 ? a : a.slice(0, b);
    },
    hb = [],
    W = [0, 1, , 1, null, 1, !0, 1, !1, 1],
    ib = [],
    jb = (a) => {
      if (a > 9 && 0 === --W[a + 1]) {
        var b = W[a];
        W[a] = void 0;
        var c = ib[a];
        c && ((ib[a] = void 0), c(b));
        hb.push(a);
      }
    },
    X = (a) => {
      if (!a) throw new M(`Cannot use deleted val. handle = ${a}`);
      return W[a];
    },
    R = (a) => {
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
          let b = hb.pop() || W.length;
          W[b] = a;
          W[b + 1] = 1;
          return b;
      }
    },
    kb = {
      name: 'emscripten::val',
      $: (a) => {
        var b = X(a);
        jb(a);
        return b;
      },
      da: (a, b) => R(b),
      fa: S,
      ea: null,
    },
    na,
    oa,
    lb = (a, b) => {
      switch (b) {
        case 4:
          return function (c) {
            return this.$(na[c >> 2]);
          };
        case 8:
          return function (c) {
            return this.$(oa[c >> 3]);
          };
        default:
          throw new TypeError(`invalid float width (${b}): ${a}`);
      }
    },
    mb = (a, b, c) => {
      var d = (e, f) => {
        var g = 0;
        return {
          next() {
            if (g >= e) return { done: !0 };
            var h = g;
            g++;
            return { value: f(h), done: !1 };
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
    nb = Object.assign({ optional: !0 }, kb),
    Y = (a, b, c) => {
      var d = D;
      if (!(c > 0)) return 0;
      var e = b;
      c = b + c - 1;
      for (var f = 0; f < a.length; ++f) {
        var g = a.codePointAt(f);
        if (g <= 127) {
          if (b >= c) break;
          d[b++] = g;
        } else if (g <= 2047) {
          if (b + 1 >= c) break;
          d[b++] = 192 | (g >> 6);
          d[b++] = 128 | (g & 63);
        } else if (g <= 65535) {
          if (b + 2 >= c) break;
          d[b++] = 224 | (g >> 12);
          d[b++] = 128 | ((g >> 6) & 63);
          d[b++] = 128 | (g & 63);
        } else {
          if (b + 3 >= c) break;
          d[b++] = 240 | (g >> 18);
          d[b++] = 128 | ((g >> 12) & 63);
          d[b++] = 128 | ((g >> 6) & 63);
          d[b++] = 128 | (g & 63);
          f++;
        }
      }
      d[b] = 0;
      return b - e;
    },
    ob = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        d <= 127
          ? b++
          : d <= 2047
            ? (b += 2)
            : d >= 55296 && d <= 57343
              ? ((b += 4), ++c)
              : (b += 3);
      }
      return b;
    },
    pb = new TextDecoder(),
    qb = (a, b, c, d) => {
      c = b + c;
      if (d) return c;
      for (; a[b] && !(b >= c);) ++b;
      return b;
    },
    rb = new TextDecoder('utf-16le'),
    sb = (a, b, c) => {
      a >>= 1;
      return rb.decode(E.subarray(a, qb(E, a, b / 2, c)));
    },
    tb = (a, b, c = 2147483647) => {
      if (c < 2) return 0;
      c -= 2;
      var d = b;
      c = c < a.length * 2 ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) ((C[b >> 1] = a.charCodeAt(e)), (b += 2));
      C[b >> 1] = 0;
      return b - d;
    },
    ub = (a) => a.length * 2,
    vb = (a, b, c) => {
      var d = '';
      a >>= 2;
      for (var e = 0; !(e >= b / 4); e++) {
        var f = G[a + e];
        if (!f && !c) break;
        d += String.fromCodePoint(f);
      }
      return d;
    },
    wb = (a, b, c = 2147483647) => {
      if (c < 4) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.codePointAt(e);
        f > 65535 && e++;
        F[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      F[b >> 2] = 0;
      return b - d;
    },
    xb = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c)
        (a.codePointAt(c) > 65535 && c++, (b += 4));
      return b;
    },
    yb = [],
    zb = (a) => {
      var b = yb.length;
      yb.push(a);
      return b;
    },
    Ab = (a, b) => {
      for (var c = Array(a), d = 0; d < a; ++d) {
        var e = d,
          f = G[(b + d * 4) >> 2],
          g = K[f];
        if (void 0 === g)
          throw (
            (a = `${`parameter ${d}`} has unknown type ${ab(f)}`), new M(a)
          );
        c[e] = g;
      }
      return c;
    },
    Bb = {},
    Cb = (a) => {
      var b = Bb[a];
      return b === void 0 ? I(a) : b;
    },
    Z = {},
    Db = (a) => {
      if (!ka)
        try {
          a();
        } catch (b) {
          b instanceof xa || b == 'unwind' || da(1, b);
        } finally {
        }
    },
    Eb = {},
    Gb = () => {
      if (!Fb) {
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
        for (b in Eb) Eb[b] === void 0 ? delete a[b] : (a[b] = Eb[b]);
        var c = [];
        for (b in a) c.push(`${b}=${a[b]}`);
        Fb = c;
      }
      return Fb;
    },
    Fb,
    Hb = [null, [], []],
    Ib = () => {
      if (l) {
        var a = t('node:crypto');
        return (b) => (a.randomFillSync(b), 0);
      }
      return (b) => (crypto.getRandomValues(b), 0);
    },
    Jb = (a) => (Jb = Ib())(a);
  (() => {
    var a = Q.prototype;
    Object.assign(a, {
      isAliasOf: function (c) {
        if (!(this instanceof Q && c instanceof Q)) return !1;
        var d = this.U.X.V,
          e = this.U.W;
        c.U = c.U;
        var f = c.U.X.V;
        for (c = c.U.W; d.aa;) ((e = d.ma(e)), (d = d.aa));
        for (; f.aa;) ((c = f.ma(c)), (f = f.aa));
        return d === f && e === c;
      },
      clone: function () {
        this.U.W || Ca(this);
        if (this.U.la) return ((this.U.count.value += 1), this);
        var c = P,
          d = Object,
          e = d.create,
          f = Object.getPrototypeOf(this),
          g = this.U;
        c = c(
          e.call(d, f, {
            U: {
              value: {
                count: g.count,
                ka: g.ka,
                la: g.la,
                W: g.W,
                X: g.X,
                Z: g.Z,
                ba: g.ba,
              },
            },
          }),
        );
        c.U.count.value += 1;
        c.U.ka = !1;
        return c;
      },
      ['delete']() {
        this.U.W || Ca(this);
        if (this.U.ka && !this.U.la)
          throw new M('Object already scheduled for deletion');
        Ea(this);
        var c = this.U;
        --c.count.value;
        0 === c.count.value && (c.Z ? c.ba.ga(c.Z) : c.X.V.ga(c.W));
        this.U.la || ((this.U.Z = void 0), (this.U.W = void 0));
      },
      isDeleted: function () {
        return !this.U.W;
      },
      deleteLater: function () {
        this.U.W || Ca(this);
        if (this.U.ka && !this.U.la)
          throw new M('Object already scheduled for deletion');
        Fa.push(this);
        this.U.ka = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Wa.prototype, {
    wa(a) {
      this.sa && (a = this.sa(a));
      return a;
    },
    ra(a) {
      this.ga?.(a);
    },
    fa: S,
    $: function (a) {
      function b() {
        return this.oa
          ? Va(this.V.ia, { X: this.za, W: c, ba: this, Z: a })
          : Va(this.V.ia, { X: this, W: a });
      }
      var c = this.wa(a);
      if (!c) return (this.ra(a), null);
      var d = Ta(this.V, c);
      if (void 0 !== d) {
        if (0 === d.U.count.value) return ((d.U.W = c), (d.U.Z = a), d.clone());
        d = d.clone();
        this.ra(a);
        return d;
      }
      d = this.V.va(c);
      d = Ha[d];
      if (!d) return b.call(this);
      d = this.na ? d.ta : d.pointerType;
      var e = Ra(c, this.V, d.V);
      return e === null
        ? b.call(this)
        : this.oa
          ? Va(d.V.ia, { X: d, W: e, ba: this, Z: a })
          : Va(d.V.ia, { X: d, W: e });
    },
  });
  var $a,
    Kb,
    U,
    Lb,
    sa,
    B,
    Ya,
    Mb = {
      F: () => ra(''),
      q: (a, b, c, d, e) => {
        b = I(b);
        d = d === 0n;
        var f = (g) => g;
        if (d) {
          let g = c * 8;
          f = (h) => BigInt.asUintN(g, h);
          e = f(e);
        }
        N(a, {
          name: b,
          $: f,
          da: (g, h) => {
            typeof h == 'number' && (h = BigInt(h));
            return h;
          },
          fa: za(b, c, !d),
          ea: null,
        });
      },
      I: (a, b, c, d) => {
        b = I(b);
        N(a, {
          name: b,
          $: function (e) {
            return !!e;
          },
          da: function (e, f) {
            return f ? c : d;
          },
          fa: function (e) {
            return this.$(D[e]);
          },
          ea: null,
        });
      },
      o: (a, b, c, d, e, f, g, h, k, n, m, q, p) => {
        m = I(m);
        f = T(e, f);
        h &&= T(g, h);
        n &&= T(k, n);
        p = T(q, p);
        var u = Ka(m);
        Ja(u, function () {
          bb(`Cannot construct ${m} due to unbound types`, [d]);
        });
        V([a, b, c], d ? [d] : [], (r) => {
          r = r[0];
          if (d) {
            var v = r.V;
            var H = v.ia;
          } else H = Q.prototype;
          r = Ga(m, function (...Aa) {
            if (Object.getPrototypeOf(this) !== Ba)
              throw new M(`Use 'new' to construct ${m}`);
            if (void 0 === z.ha)
              throw new M(`${m} has no accessible constructor`);
            var gb = z.ha[Aa.length];
            if (void 0 === gb)
              throw new M(
                `Tried to invoke ctor of ${m} with invalid number of parameters (${Aa.length}) - expected (${Object.keys(z.ha).toString()}) parameters instead!`,
              );
            return gb.apply(this, Aa);
          });
          var Ba = Object.create(H, { constructor: { value: r } });
          r.prototype = Ba;
          var z = new La(m, r, Ba, p, v, f, h, n);
          if (z.aa) {
            var O;
            (O = z.aa).qa ?? (O.qa = []);
            z.aa.qa.push(z);
          }
          v = new Wa(m, z, !0, !1, !1);
          O = new Wa(m + '*', z, !1, !1, !1);
          H = new Wa(m + ' const*', z, !1, !0, !1);
          Ha[a] = { pointerType: O, ta: H };
          Xa(u, r);
          return [v, O, H];
        });
      },
      n: (a, b, c, d, e, f) => {
        var g = cb(b, c);
        e = T(d, e);
        V([], [a], (h) => {
          h = h[0];
          var k = `constructor ${h.name}`;
          void 0 === h.V.ha && (h.V.ha = []);
          if (void 0 !== h.V.ha[b - 1])
            throw new M(
              `Cannot register multiple constructors with identical number of parameters (${b - 1}) for class '${h.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          h.V.ha[b - 1] = () => {
            bb(`Cannot construct ${h.name} due to unbound types`, g);
          };
          V([], g, (n) => {
            n.splice(1, 0, null);
            h.V.ha[b - 1] = eb(k, n, null, e, f);
            return [];
          });
          return [];
        });
      },
      e: (a, b, c, d, e, f, g, h) => {
        var k = cb(c, d);
        b = I(b);
        b = fb(b);
        f = T(e, f);
        V([], [a], (n) => {
          function m() {
            bb(`Cannot call ${q} due to unbound types`, k);
          }
          n = n[0];
          var q = `${n.name}.${b}`;
          b.startsWith('@@') && (b = Symbol[b.substring(2)]);
          h && n.V.Aa.push(b);
          var p = n.V.ia,
            u = p[b];
          void 0 === u ||
          (void 0 === u.Y && u.className !== n.name && u.ja === c - 2)
            ? ((m.ja = c - 2), (m.className = n.name), (p[b] = m))
            : (Ia(p, b, q), (p[b].Y[c - 2] = m));
          V([], k, (r) => {
            r = eb(q, r, n, f, g);
            void 0 === p[b].Y
              ? ((r.ja = c - 2), (p[b] = r))
              : (p[b].Y[c - 2] = r);
            return [];
          });
          return [];
        });
      },
      G: (a) => N(a, kb),
      p: (a, b, c) => {
        b = I(b);
        N(a, { name: b, $: (d) => d, da: (d, e) => e, fa: lb(b, c), ea: null });
      },
      d: (a, b, c, d, e, f) => {
        var g = cb(b, c);
        a = I(a);
        a = fb(a);
        e = T(d, e);
        Ja(
          a,
          function () {
            bb(`Cannot call ${a} due to unbound types`, g);
          },
          b - 1,
        );
        V([], g, (h) => {
          h = [h[0], null].concat(h.slice(1));
          Xa(a, eb(a, h, null, e, f), b - 1);
          return [];
        });
      },
      f: (a, b, c, d, e) => {
        b = I(b);
        var f = (h) => h;
        if (d === 0) {
          var g = 32 - 8 * c;
          f = (h) => (h << g) >>> g;
          e = f(e);
        }
        N(a, {
          name: b,
          $: f,
          da: (h, k) => k,
          fa: za(b, c, d !== 0),
          ea: null,
        });
      },
      s: (a, b, c, d) => {
        c = I(c);
        d = I(d);
        V([], [a, b], (e) => {
          mb(e[0].V.ia, c, d);
          return [];
        });
      },
      a: (a, b, c) => {
        function d(f) {
          return new e(A.buffer, G[(f + 4) >> 2], G[f >> 2]);
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
          BigInt64Array,
          BigUint64Array,
        ][b];
        c = I(c);
        N(a, { name: c, $: d, fa: d }, { xa: !0 });
      },
      L: (a) => {
        N(a, nb);
      },
      H: (a, b) => {
        b = I(b);
        N(a, {
          name: b,
          $(c) {
            var d = (d = c + 4)
              ? pb.decode(D.subarray(d, qb(D, d, G[c >> 2], !0)))
              : '';
            U(c);
            return d;
          },
          da(c, d) {
            d instanceof ArrayBuffer && (d = new Uint8Array(d));
            var e = typeof d == 'string';
            if (!(e || (ArrayBuffer.isView(d) && d.BYTES_PER_ELEMENT == 1)))
              throw new M('Cannot pass non-string to std::string');
            var f = e ? ob(d) : d.length;
            var g = Kb(4 + f + 1),
              h = g + 4;
            G[g >> 2] = f;
            e ? Y(d, h, f + 1) : D.set(d, h);
            c !== null && c.push(U, g);
            return g;
          },
          fa: S,
          ea(c) {
            U(c);
          },
        });
      },
      m: (a, b, c) => {
        c = I(c);
        if (b === 2) {
          var d = sb;
          var e = tb;
          var f = ub;
        } else ((d = vb), (e = wb), (f = xb));
        N(a, {
          name: c,
          $: (g) => {
            var h = d(g + 4, G[g >> 2] * b, !0);
            U(g);
            return h;
          },
          da: (g, h) => {
            if (typeof h != 'string')
              throw new M(`Cannot pass non-string to C++ string type ${c}`);
            var k = f(h),
              n = Kb(4 + k + b);
            G[n >> 2] = k / b;
            e(h, n + 4, k + b);
            g !== null && g.push(U, n);
            return n;
          },
          fa: S,
          ea(g) {
            U(g);
          },
        });
      },
      i: (a) => {
        N(a, kb);
      },
      J: (a, b) => {
        b = I(b);
        N(a, { ya: !0, name: b, $: () => {}, da: () => {} });
      },
      C: () => {},
      l: (a, b, c) => {
        var d;
        [b, ...d] = Ab(a, b);
        var e = b.da.bind(b),
          f = d.map((h) => h.fa.bind(h));
        a--;
        var g = Array(a);
        b = `methodCaller<(${d.map((h) => h.name)}) => ${b.name}>`;
        return zb(
          Ga(b, (h, k, n, m) => {
            for (var q = 0, p = 0; p < a; ++p) ((g[p] = f[p](m + q)), (q += 8));
            switch (c) {
              case 0:
                var u = X(h).apply(null, g);
                break;
              case 2:
                u = Reflect.construct(X(h), g);
                break;
              case 3:
                u = g[0];
                break;
              case 1:
                u = X(h)[Cb(k)](...g);
            }
            h = [];
            u = e(h, u);
            h.length && (G[n >> 2] = R(h));
            return u;
          }),
        );
      },
      t: jb,
      K: (a) => {
        if (!a) return R(globalThis);
        a = Cb(a);
        return R(globalThis[a]);
      },
      r: (a) => {
        a > 9 && (W[a + 1] += 1);
      },
      k: (a, b, c, d, e) => yb[a](b, c, d, e),
      b: () => R([]),
      g: (a) => R(Cb(a)),
      j: () => R({}),
      u: (a) => {
        for (var b = X(a); b.length;) {
          var c = b.pop();
          b.pop()(c);
        }
        jb(a);
      },
      h: (a, b, c) => {
        a = X(a);
        b = X(b);
        c = X(c);
        a[b] = c;
      },
      v: (a, b) => {
        Z[a] && (clearTimeout(Z[a].id), delete Z[a]);
        if (!b) return 0;
        var c = setTimeout(() => {
          delete Z[a];
          Db(() => Lb(a, performance.now()));
        }, b);
        Z[a] = { id: c, Ea: b };
        return 0;
      },
      x: (a, b, c, d) => {
        var e = new Date().getFullYear(),
          f = new Date(e, 0, 1).getTimezoneOffset();
        e = new Date(e, 6, 1).getTimezoneOffset();
        G[a >> 2] = Math.max(f, e) * 60;
        F[b >> 2] = Number(f != e);
        b = (g) => {
          var h = Math.abs(g);
          return `UTC${g >= 0 ? '-' : '+'}${String(Math.floor(h / 60)).padStart(2, '0')}${String(h % 60).padStart(2, '0')}`;
        };
        a = b(f);
        b = b(e);
        e < f ? (Y(a, c, 17), Y(b, d, 17)) : (Y(a, d, 17), Y(b, c, 17));
      },
      y: function (a, b, c) {
        if (!(a >= 0 && a <= 3)) return 28;
        pa[c >> 3] = BigInt(
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e3 * 1e3),
        );
        return 0;
      },
      c: () => performance.now(),
      z: (a) => {
        var b = D.length;
        a >>>= 0;
        if (a > 268435456) return !1;
        for (var c = 1; c <= 4; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          a: {
            d =
              ((Math.min(268435456, Math.ceil(Math.max(a, d) / 65536) * 65536) -
                B.buffer.byteLength +
                65535) /
                65536) |
              0;
            try {
              B.grow(d);
              ma();
              var e = 1;
              break a;
            } catch (f) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      D: (a, b) => {
        var c = 0,
          d = 0,
          e;
        for (e of Gb()) {
          var f = b + c;
          G[(a + d) >> 2] = f;
          c += Y(e, f, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      E: (a, b) => {
        var c = Gb();
        G[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += ob(d) + 1;
        G[b >> 2] = a;
        return 0;
      },
      A: (a, b, c, d) => {
        for (var e = 0, f = 0; f < c; f++) {
          var g = G[b >> 2],
            h = G[(b + 4) >> 2];
          b += 8;
          for (var k = 0; k < h; k++) {
            var n = a,
              m = D[g + k],
              q = Hb[n];
            m && m !== 10
              ? q.push(m)
              : ((m = qb(q, 0)),
                (m = pb.decode(
                  q.buffer ? q.subarray(0, m) : new Uint8Array(q.slice(0, m)),
                )),
                (n === 1 ? ja : y)(m),
                (q.length = 0));
          }
          e += h;
        }
        G[d >> 2] = e;
        return 0;
      },
      B: (a) => {
        da(a, new xa(a));
      },
      w: (a, b) => Jb(D.subarray(a, a + b)),
    },
    Nb;
  Nb = await (async function () {
    var a = { a: Mb };
    ta ??= Module.locateFile
      ? Module.locateFile
        ? Module.locateFile('wpilibc_wasm.wasm', w)
        : w + 'wpilibc_wasm.wasm'
      : new URL('wpilibc_wasm.wasm', import.meta.url).href;
    a = Nb = (await wa(a)).instance.exports;
    $a = a.O;
    Kb = Module._malloc = a.P;
    U = Module._free = a.Q;
    Lb = a.S;
    sa = a.T;
    B = a.M;
    Ya = a.R;
    ma();
    return Nb;
  })();
  await (async function () {
    ka || ((la = !0), Nb.N());
  })();
  return Module;
}
export default createWpilibcModule;
