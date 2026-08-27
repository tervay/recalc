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
      if (c.wa) return;
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
    Ba = (a, b, c) => {
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
      throw new M(a.T.W.U.name + ' instance already deleted');
    },
    Da = !1,
    Ea = () => {},
    P = (a) => {
      if (!globalThis.FinalizationRegistry) return ((P = (b) => b), a);
      Da = new FinalizationRegistry((b) => {
        b = b.T;
        --b.count.value;
        0 === b.count.value && (b.Y ? b.aa.fa(b.Y) : b.W.U.fa(b.V));
      });
      P = (b) => {
        var c = b.T;
        c.Y && Da.register(b, { T: c }, b);
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
      if (void 0 === a[b].X) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].X.hasOwnProperty(e.length))
            throw new M(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].X})!`,
            );
          return a[b].X[e.length].apply(this, e);
        };
        a[b].X = [];
        a[b].X[d.ia] = d;
      }
    },
    Ja = (a, b, c) => {
      if (Module.hasOwnProperty(a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].X && void 0 !== Module[a].X[c])
        )
          throw new M(`Cannot register public name '${a}' twice`);
        Ia(Module, a, a);
        if (Module[a].X.hasOwnProperty(c))
          throw new M(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].X[c] = b;
      } else ((Module[a] = b), (Module[a].ia = c));
    },
    Ka = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    };
  function La(a, b, c, d, e, f, g, h) {
    this.name = a;
    this.constructor = b;
    this.ha = c;
    this.fa = d;
    this.$ = e;
    this.ua = f;
    this.la = g;
    this.ta = h;
    this.za = [];
  }
  var Ma = (a, b, c) => {
      for (; b !== c;) {
        if (!b.la)
          throw new M(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.la(a);
        b = b.$;
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
      if (this.oa) throw new M(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.T) throw new M(`Cannot pass "${Na(b)}" as a ${this.name}`);
    if (!b.T.V)
      throw new M(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return Ma(b.T.V, b.T.W.U, this.U);
  }
  function Pa(a, b) {
    if (b === null) {
      if (this.oa) throw new M(`null is not a valid ${this.name}`);
      if (this.na) {
        var c = this.Aa();
        a !== null && a.push(this.fa, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.T) throw new M(`Cannot pass "${Na(b)}" as a ${this.name}`);
    if (!b.T.V)
      throw new M(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.ma && b.T.W.ma)
      throw new M(
        `Cannot convert argument of type ${
          b.T.aa ? b.T.aa.name : b.T.W.name
        } to parameter type ${this.name}`,
      );
    c = Ma(b.T.V, b.T.W.U, this.U);
    if (this.na) {
      if (void 0 === b.T.Y)
        throw new M('Passing raw pointer to smart pointer is illegal');
      switch (this.Ca) {
        case 0:
          if (b.T.aa === this) c = b.T.Y;
          else
            throw new M(
              `Cannot convert argument of type ${b.T.aa ? b.T.aa.name : b.T.W.name} to parameter type ${this.name}`,
            );
          break;
        case 1:
          c = b.T.Y;
          break;
        case 2:
          if (b.T.aa === this) c = b.T.Y;
          else {
            var d = b.clone();
            c = this.Ba(
              c,
              R(() => d['delete']()),
            );
            a !== null && a.push(this.fa, c);
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
      if (this.oa) throw new M(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.T) throw new M(`Cannot pass "${Na(b)}" as a ${this.name}`);
    if (!b.T.V)
      throw new M(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.T.W.ma)
      throw new M(
        `Cannot convert argument of type ${b.T.W.name} to parameter type ${this.name}`,
      );
    return Ma(b.T.V, b.T.W.U, this.U);
  }
  function S(a) {
    return this.Z(G[a >> 2]);
  }
  var Ra = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.$) return null;
      a = Ra(a, b, c.$);
      return a === null ? null : c.ta(a);
    },
    Sa = {},
    Ta = (a, b) => {
      if (b === void 0) throw new M('ptr should not be undefined');
      for (; a.$;) ((b = a.la(b)), (a = a.$));
      return Sa[b];
    };
  class Ua extends Error {
    constructor(a) {
      super(a);
      this.name = 'InternalError';
    }
  }
  var Va = (a, b) => {
    if (!b.W || !b.V) throw new Ua('makeClassHandle requires ptr and ptrType');
    if (!!b.aa !== !!b.Y)
      throw new Ua('Both smartPtrType and smartPtr must be specified');
    b.count = { value: 1 };
    return P(Object.create(a, { T: { value: b, writable: !0 } }));
  };
  function Wa(a, b, c, d, e, f, g, h, k, n, m) {
    this.name = a;
    this.U = b;
    this.oa = c;
    this.ma = d;
    this.na = e;
    this.ya = f;
    this.Ca = g;
    this.ra = h;
    this.Aa = k;
    this.Ba = n;
    this.fa = m;
    e || b.$ !== void 0
      ? (this.ba = Pa)
      : ((this.ba = d ? Oa : Qa), (this.da = null));
  }
  var Xa = (a, b, c) => {
      if (!Module.hasOwnProperty(a))
        throw new Ua('Replacing nonexistent public symbol');
      void 0 !== Module[a].X && void 0 !== c
        ? (Module[a].X[c] = b)
        : ((Module[a] = b), (Module[a].ia = c));
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
      if (a[b] !== null && a[b].da === void 0) return !0;
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
      k = !b[0].xa,
      n = f - 2,
      m = Array(n),
      q = [],
      p = [];
    return Ga(a, function (...u) {
      p.length = 0;
      q.length = g ? 2 : 1;
      q[0] = e;
      if (g) {
        var r = b[1].ba(p, this);
        q[1] = r;
      }
      for (var v = 0; v < n; ++v) ((m[v] = b[v + 2].ba(p, u[v])), q.push(m[v]));
      u = d(...q);
      if (h) for (; p.length;) ((r = p.pop()), p.pop()(r));
      else
        for (v = g ? 1 : 2; v < b.length; v++) {
          var H = v === 1 ? r : m[v - 2];
          b[v].da !== null && b[v].da(H);
        }
      r = k ? b[0].Z(u) : void 0;
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
      Z: (a) => {
        var b = X(a);
        jb(a);
        return b;
      },
      ba: (a, b) => R(b),
      ea: S,
      da: null,
    },
    na,
    oa,
    lb = (a, b) => {
      switch (b) {
        case 4:
          return function (c) {
            return this.Z(na[c >> 2]);
          };
        case 8:
          return function (c) {
            return this.Z(oa[c >> 3]);
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
        var d = this.T.W.U,
          e = this.T.V;
        c.T = c.T;
        var f = c.T.W.U;
        for (c = c.T.V; d.$;) ((e = d.la(e)), (d = d.$));
        for (; f.$;) ((c = f.la(c)), (f = f.$));
        return d === f && e === c;
      },
      clone: function () {
        this.T.V || Ca(this);
        if (this.T.ka) return ((this.T.count.value += 1), this);
        var c = P,
          d = Object,
          e = d.create,
          f = Object.getPrototypeOf(this),
          g = this.T;
        c = c(
          e.call(d, f, {
            T: {
              value: {
                count: g.count,
                ja: g.ja,
                ka: g.ka,
                V: g.V,
                W: g.W,
                Y: g.Y,
                aa: g.aa,
              },
            },
          }),
        );
        c.T.count.value += 1;
        c.T.ja = !1;
        return c;
      },
      ['delete']() {
        this.T.V || Ca(this);
        if (this.T.ja && !this.T.ka)
          throw new M('Object already scheduled for deletion');
        Ea(this);
        var c = this.T;
        --c.count.value;
        0 === c.count.value && (c.Y ? c.aa.fa(c.Y) : c.W.U.fa(c.V));
        this.T.ka || ((this.T.Y = void 0), (this.T.V = void 0));
      },
      isDeleted: function () {
        return !this.T.V;
      },
      deleteLater: function () {
        this.T.V || Ca(this);
        if (this.T.ja && !this.T.ka)
          throw new M('Object already scheduled for deletion');
        Fa.push(this);
        this.T.ja = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Wa.prototype, {
    va(a) {
      this.ra && (a = this.ra(a));
      return a;
    },
    qa(a) {
      this.fa?.(a);
    },
    ea: S,
    Z: function (a) {
      function b() {
        return this.na
          ? Va(this.U.ha, { W: this.ya, V: c, aa: this, Y: a })
          : Va(this.U.ha, { W: this, V: a });
      }
      var c = this.va(a);
      if (!c) return (this.qa(a), null);
      var d = Ta(this.U, c);
      if (void 0 !== d) {
        if (0 === d.T.count.value) return ((d.T.V = c), (d.T.Y = a), d.clone());
        d = d.clone();
        this.qa(a);
        return d;
      }
      d = this.U.ua(c);
      d = Ha[d];
      if (!d) return b.call(this);
      d = this.ma ? d.sa : d.pointerType;
      var e = Ra(c, this.U, d.U);
      return e === null
        ? b.call(this)
        : this.na
          ? Va(d.U.ha, { W: d, V: e, aa: this, Y: a })
          : Va(d.U.ha, { W: d, V: e });
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
      D: () => ra(''),
      p: (a, b, c, d, e) => {
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
          Z: f,
          ba: (g, h) => {
            typeof h == 'number' && (h = BigInt(h));
            return h;
          },
          ea: Ba(b, c, !d),
          da: null,
        });
      },
      G: (a, b, c, d) => {
        b = I(b);
        N(a, {
          name: b,
          Z: function (e) {
            return !!e;
          },
          ba: function (e, f) {
            return f ? c : d;
          },
          ea: function (e) {
            return this.Z(D[e]);
          },
          da: null,
        });
      },
      n: (a, b, c, d, e, f, g, h, k, n, m, q, p) => {
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
            var v = r.U;
            var H = v.ha;
          } else H = Q.prototype;
          r = Ga(m, function (...za) {
            if (Object.getPrototypeOf(this) !== Aa)
              throw new M(`Use 'new' to construct ${m}`);
            if (void 0 === z.ga)
              throw new M(`${m} has no accessible constructor`);
            var gb = z.ga[za.length];
            if (void 0 === gb)
              throw new M(
                `Tried to invoke ctor of ${m} with invalid number of parameters (${za.length}) - expected (${Object.keys(z.ga).toString()}) parameters instead!`,
              );
            return gb.apply(this, za);
          });
          var Aa = Object.create(H, { constructor: { value: r } });
          r.prototype = Aa;
          var z = new La(m, r, Aa, p, v, f, h, n);
          if (z.$) {
            var O;
            (O = z.$).pa ?? (O.pa = []);
            z.$.pa.push(z);
          }
          v = new Wa(m, z, !0, !1, !1);
          O = new Wa(m + '*', z, !1, !1, !1);
          H = new Wa(m + ' const*', z, !1, !0, !1);
          Ha[a] = { pointerType: O, sa: H };
          Xa(u, r);
          return [v, O, H];
        });
      },
      l: (a, b, c, d, e, f) => {
        var g = cb(b, c);
        e = T(d, e);
        V([], [a], (h) => {
          h = h[0];
          var k = `constructor ${h.name}`;
          void 0 === h.U.ga && (h.U.ga = []);
          if (void 0 !== h.U.ga[b - 1])
            throw new M(
              `Cannot register multiple constructors with identical number of parameters (${b - 1}) for class '${h.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          h.U.ga[b - 1] = () => {
            bb(`Cannot construct ${h.name} due to unbound types`, g);
          };
          V([], g, (n) => {
            n.splice(1, 0, null);
            h.U.ga[b - 1] = eb(k, n, null, e, f);
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
          h && n.U.za.push(b);
          var p = n.U.ha,
            u = p[b];
          void 0 === u ||
          (void 0 === u.X && u.className !== n.name && u.ia === c - 2)
            ? ((m.ia = c - 2), (m.className = n.name), (p[b] = m))
            : (Ia(p, b, q), (p[b].X[c - 2] = m));
          V([], k, (r) => {
            r = eb(q, r, n, f, g);
            void 0 === p[b].X
              ? ((r.ia = c - 2), (p[b] = r))
              : (p[b].X[c - 2] = r);
            return [];
          });
          return [];
        });
      },
      E: (a) => N(a, kb),
      o: (a, b, c) => {
        b = I(b);
        N(a, { name: b, Z: (d) => d, ba: (d, e) => e, ea: lb(b, c), da: null });
      },
      c: (a, b, c, d, e, f) => {
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
          Z: f,
          ba: (h, k) => k,
          ea: Ba(b, c, d !== 0),
          da: null,
        });
      },
      q: (a, b, c, d) => {
        c = I(c);
        d = I(d);
        V([], [a, b], (e) => {
          mb(e[0].U.ha, c, d);
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
        N(a, { name: c, Z: d, ea: d }, { wa: !0 });
      },
      K: (a) => {
        N(a, nb);
      },
      F: (a, b) => {
        b = I(b);
        N(a, {
          name: b,
          Z(c) {
            var d = (d = c + 4)
              ? pb.decode(D.subarray(d, qb(D, d, G[c >> 2], !0)))
              : '';
            U(c);
            return d;
          },
          ba(c, d) {
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
          ea: S,
          da(c) {
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
          Z: (g) => {
            var h = d(g + 4, G[g >> 2] * b, !0);
            U(g);
            return h;
          },
          ba: (g, h) => {
            if (typeof h != 'string')
              throw new M(`Cannot pass non-string to C++ string type ${c}`);
            var k = f(h),
              n = Kb(4 + k + b);
            G[n >> 2] = k / b;
            e(h, n + 4, k + b);
            g !== null && g.push(U, n);
            return n;
          },
          ea: S,
          da(g) {
            U(g);
          },
        });
      },
      H: (a, b) => {
        b = I(b);
        N(a, { xa: !0, name: b, Z: () => {}, ba: () => {} });
      },
      A: () => {},
      k: (a, b, c) => {
        var d;
        [b, ...d] = Ab(a, b);
        var e = b.ba.bind(b),
          f = d.map((h) => h.ea.bind(h));
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
      r: jb,
      I: (a) => {
        if (!a) return R(globalThis);
        a = Cb(a);
        return R(globalThis[a]);
      },
      J: (a) => {
        a > 9 && (W[a + 1] += 1);
      },
      j: (a, b, c, d, e) => yb[a](b, c, d, e),
      b: () => R([]),
      g: (a) => R(Cb(a)),
      i: () => R({}),
      s: (a) => {
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
      t: (a, b) => {
        Z[a] && (clearTimeout(Z[a].id), delete Z[a]);
        if (!b) return 0;
        var c = setTimeout(() => {
          delete Z[a];
          Db(() => Lb(a, performance.now()));
        }, b);
        Z[a] = { id: c, Da: b };
        return 0;
      },
      v: (a, b, c, d) => {
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
      w: function (a, b, c) {
        if (!(a >= 0 && a <= 3)) return 28;
        pa[c >> 3] = BigInt(
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e3 * 1e3),
        );
        return 0;
      },
      d: () => performance.now(),
      x: (a) => {
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
      B: (a, b) => {
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
      C: (a, b) => {
        var c = Gb();
        G[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += ob(d) + 1;
        G[b >> 2] = a;
        return 0;
      },
      y: (a, b, c, d) => {
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
      z: (a) => {
        da(a, new xa(a));
      },
      u: (a, b) => Jb(D.subarray(a, a + b)),
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
    $a = a.N;
    Kb = Module._malloc = a.O;
    U = Module._free = a.P;
    Lb = a.R;
    sa = a.S;
    B = a.L;
    Ya = a.Q;
    ma();
    return Nb;
  })();
  await (async function () {
    ka || ((la = !0), Nb.M());
  })();
  return Module;
}
export default createWpilibcModule;
