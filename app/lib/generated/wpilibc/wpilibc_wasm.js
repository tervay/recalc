async function createWpilibcModule(moduleArg = {}) {
  var Module = moduleArg;
  var aa = !!globalThis.window,
    ba = !!globalThis.WorkerGlobalScope,
    m =
      globalThis.process?.versions?.node &&
      globalThis.process?.type != 'renderer';
  if (m) {
    let { createRequire: a } = await import('node:module');
    var q = a(import.meta.url);
  }
  var ca = './this.program',
    da = (a, b) => {
      throw b;
    },
    ea = import.meta.url,
    v = '',
    fa,
    z;
  if (m) {
    var ha = q('node:fs');
    ea.startsWith('file:') &&
      (v = q('node:path').dirname(q('node:url').fileURLToPath(ea)) + '/');
    z = (a) => {
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
      v = new URL('.', ea).href;
    } catch {}
    ba &&
      (z = (a) => {
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
    A = console.error.bind(console),
    ka = !1,
    ia = (a) => a.startsWith('file://'),
    la = !1;
  function ma() {
    if (!C?.buffer?.resizable) {
      var a = D.buffer;
      C = new Int8Array(a);
      E = new Int16Array(a);
      G = new Uint8Array(a);
      H = new Uint16Array(a);
      I = new Int32Array(a);
      J = new Uint32Array(a);
      na = new Float32Array(a);
      oa = new Float64Array(a);
      pa = new BigInt64Array(a);
      qa = new BigUint64Array(a);
    }
  }
  function ra(a) {
    a = `Aborted(${a})`;
    A(a);
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
    if (z) a = z(a);
    else throw 'both async and sync fetching of the wasm failed';
    return a;
  }
  async function va(a, b) {
    try {
      var c = await ua(a);
      return await WebAssembly.instantiate(c, b);
    } catch (d) {
      (A(`failed to asynchronously prepare wasm: ${d}`), ra(d));
    }
  }
  async function wa(a) {
    var b = ta;
    if (!m)
      try {
        var c = fetch(b, { credentials: 'same-origin' });
        return await WebAssembly.instantiateStreaming(c, a);
      } catch (d) {
        (A(`wasm streaming compile failed: ${d}`),
          A('falling back to ArrayBuffer instantiation'));
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
  var C,
    G,
    L = (a) => {
      for (var b = ''; ;) {
        var c = G[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
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
  function ya(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new P(`type "${d}" must have a positive integer typeid pointer`);
    if (N.hasOwnProperty(a)) {
      if (c.Aa) return;
      throw new P(`Cannot register type '${d}' twice`);
    }
    N[a] = b;
    delete O[a];
    M.hasOwnProperty(a) && ((b = M[a]), delete M[a], b.forEach((e) => e()));
  }
  function Q(a, b, c = {}) {
    return ya(a, b, c);
  }
  var E,
    H,
    I,
    J,
    pa,
    qa,
    za = (a, b, c) => {
      switch (b) {
        case 1:
          return c ? (d) => C[d] : (d) => G[d];
        case 2:
          return c ? (d) => E[d >> 1] : (d) => H[d >> 1];
        case 4:
          return c ? (d) => I[d >> 2] : (d) => J[d >> 2];
        case 8:
          return c ? (d) => pa[d >> 3] : (d) => qa[d >> 3];
        default:
          throw new TypeError(`invalid integer width (${b}): ${a}`);
      }
    },
    Aa = (a) => {
      throw new P(a.W.Z.X.name + ' instance already deleted');
    },
    Ba = !1,
    Ca = () => {},
    R = (a) => {
      if (!globalThis.FinalizationRegistry) return ((R = (b) => b), a);
      Ba = new FinalizationRegistry((b) => {
        b = b.W;
        --b.count.value;
        0 === b.count.value && (b.aa ? b.ea.ia(b.aa) : b.Z.X.ia(b.Y));
      });
      R = (b) => {
        var c = b.W;
        c.aa && Ba.register(b, { W: c }, b);
        return b;
      };
      Ca = (b) => {
        Ba.unregister(b);
      };
      return R(a);
    },
    Da = [];
  function Ea() {}
  var Fa = (a, b) => Object.defineProperty(b, 'name', { value: a }),
    Ga = {},
    Ha = (a, b, c) => {
      if (void 0 === a[b].$) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].$.hasOwnProperty(e.length))
            throw new P(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].$})!`,
            );
          return a[b].$[e.length].apply(this, e);
        };
        a[b].$ = [];
        a[b].$[d.la] = d;
      }
    },
    Ia = (a, b, c) => {
      if (Module.hasOwnProperty(a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].$ && void 0 !== Module[a].$[c])
        )
          throw new P(`Cannot register public name '${a}' twice`);
        Ha(Module, a, a);
        if (Module[a].$.hasOwnProperty(c))
          throw new P(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].$[c] = b;
      } else ((Module[a] = b), (Module[a].la = c));
    },
    Ja = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    };
  function Ka(a, b, c, d, e, f, g, h) {
    this.name = a;
    this.constructor = b;
    this.ka = c;
    this.ia = d;
    this.da = e;
    this.ya = f;
    this.oa = g;
    this.xa = h;
    this.Da = [];
  }
  var La = (a, b, c) => {
      for (; b !== c;) {
        if (!b.oa)
          throw new P(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.oa(a);
        b = b.da;
      }
      return a;
    },
    Ma = (a) => {
      if (a === null) return 'null';
      var b = typeof a;
      return b === 'object' || b === 'array' || b === 'function'
        ? a.toString()
        : '' + a;
    };
  function Na(a, b) {
    if (b === null) {
      if (this.ra) throw new P(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.W) throw new P(`Cannot pass "${Ma(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new P(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return La(b.W.Y, b.W.Z.X, this.X);
  }
  function Oa(a, b) {
    if (b === null) {
      if (this.ra) throw new P(`null is not a valid ${this.name}`);
      if (this.qa) {
        var c = this.Ea();
        a !== null && a.push(this.ia, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.W) throw new P(`Cannot pass "${Ma(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new P(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.pa && b.W.Z.pa)
      throw new P(
        `Cannot convert argument of type ${
          b.W.ea ? b.W.ea.name : b.W.Z.name
        } to parameter type ${this.name}`,
      );
    c = La(b.W.Y, b.W.Z.X, this.X);
    if (this.qa) {
      if (void 0 === b.W.aa)
        throw new P('Passing raw pointer to smart pointer is illegal');
      switch (this.Ga) {
        case 0:
          if (b.W.ea === this) c = b.W.aa;
          else
            throw new P(
              `Cannot convert argument of type ${b.W.ea ? b.W.ea.name : b.W.Z.name} to parameter type ${this.name}`,
            );
          break;
        case 1:
          c = b.W.aa;
          break;
        case 2:
          if (b.W.ea === this) c = b.W.aa;
          else {
            var d = b.clone();
            c = this.Fa(
              c,
              S(() => d['delete']()),
            );
            a !== null && a.push(this.ia, c);
          }
          break;
        default:
          throw new P('Unsupported sharing policy');
      }
    }
    return c;
  }
  function Pa(a, b) {
    if (b === null) {
      if (this.ra) throw new P(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.W) throw new P(`Cannot pass "${Ma(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new P(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.W.Z.pa)
      throw new P(
        `Cannot convert argument of type ${b.W.Z.name} to parameter type ${this.name}`,
      );
    return La(b.W.Y, b.W.Z.X, this.X);
  }
  function Qa(a) {
    return this.ba(J[a >> 2]);
  }
  var Ra = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.da) return null;
      a = Ra(a, b, c.da);
      return a === null ? null : c.xa(a);
    },
    Sa = {},
    Ta = (a, b) => {
      if (b === void 0) throw new P('ptr should not be undefined');
      for (; a.da;) ((b = a.oa(b)), (a = a.da));
      return Sa[b];
    };
  class Ua extends Error {
    constructor(a) {
      super(a);
      this.name = 'InternalError';
    }
  }
  var Va = (a, b) => {
    if (!b.Z || !b.Y) throw new Ua('makeClassHandle requires ptr and ptrType');
    if (!!b.ea !== !!b.aa)
      throw new Ua('Both smartPtrType and smartPtr must be specified');
    b.count = { value: 1 };
    return R(Object.create(a, { W: { value: b, writable: !0 } }));
  };
  function Wa(a, b, c, d, e, f, g, h, k, n, l) {
    this.name = a;
    this.X = b;
    this.ra = c;
    this.pa = d;
    this.qa = e;
    this.Ca = f;
    this.Ga = g;
    this.ua = h;
    this.Ea = k;
    this.Fa = n;
    this.ia = l;
    e || b.da !== void 0
      ? (this.fa = Oa)
      : ((this.fa = d ? Na : Pa), (this.ga = null));
  }
  var Xa = (a, b, c) => {
      if (!Module.hasOwnProperty(a))
        throw new Ua('Replacing nonexistent public symbol');
      void 0 !== Module[a].$ && void 0 !== c
        ? (Module[a].$[c] = b)
        : ((Module[a] = b), (Module[a].la = c));
    },
    T = (a, b) => {
      a = L(a);
      var c = Ya.get(b);
      if (typeof c != 'function')
        throw new P(`unknown function pointer with signature ${a}: ${b}`);
      return c;
    };
  class Za extends Error {}
  var ab = (a) => {
      a = $a(a);
      var b = L(a);
      U(a);
      return b;
    },
    bb = (a, b) => {
      function c(f) {
        e[f] || N[f] || (O[f] ? O[f].forEach(c) : (d.push(f), (e[f] = !0)));
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
        for (var k = 0; k < a.length; ++k) Q(a[k], h[k]);
      }
      a.forEach((h) => (O[h] = b));
      var e = Array(b.length),
        f = [],
        g = 0;
      for (let [h, k] of b.entries())
        N.hasOwnProperty(k)
          ? (e[h] = N[k])
          : (f.push(k),
            M.hasOwnProperty(k) || (M[k] = []),
            M[k].push(() => {
              e[h] = N[k];
              ++g;
              g === f.length && d(e);
            }));
      0 === f.length && d(e);
    },
    cb = (a, b) => {
      for (var c = [], d = 0; d < a; d++) c.push(J[(b + d * 4) >> 2]);
      return c;
    };
  function db(a) {
    for (var b = 1; b < a.length; ++b)
      if (a[b] !== null && a[b].ga === void 0) return !0;
    return !1;
  }
  function eb(a) {
    for (var b = 1; b < a.length; ++b) if (a[b] !== null && a[b].va) return !0;
    return !1;
  }
  function fb(a, b, c, d, e, f) {
    var g = b.length;
    if (g < 2)
      throw new P(
        'argTypes array size mismatch! Must at least get return value and receiver (this) types!',
      );
    var h = b[1] !== null && c !== null,
      k = db(b),
      n = (c = eb(b)) && !f && !k;
    c && !n && (k = !0);
    var l = !b[0].Ba,
      t = g - 2,
      w = Array(t),
      p = [],
      r = [];
    return Fa(a, function (...y) {
      r.length = 0;
      var x;
      n && (x = gb());
      try {
        p.length = h ? 2 : 1;
        p[0] = e;
        if (h) {
          var B = b[1].fa(r, this);
          p[1] = B;
        }
        for (var u = 0; u < t; ++u) {
          var F = b[u + 2];
          w[u] = F.fa(n && F.va ? null : r, y[u]);
          p.push(w[u]);
        }
        var K = d(...p);
      } finally {
        n && hb(x);
      }
      y = K;
      if (k) for (; r.length;) ((B = r.pop()), r.pop()(B));
      else
        for (x = h ? 1 : 2; x < b.length; x++)
          ((K = x === 1 ? B : w[x - 2]), b[x].ga !== null && b[x].ga(K));
      B = l ? b[0].ba(y) : void 0;
      return B;
    });
  }
  var jb = (a) => {
      a = a.trim();
      var b = a.indexOf('(');
      return b === -1 ? a : a.slice(0, b);
    },
    kb = [],
    W = [0, 1, , 1, null, 1, !0, 1, !1, 1],
    lb = [],
    mb = (a) => {
      if (a > 9 && 0 === --W[a + 1]) {
        var b = W[a];
        W[a] = void 0;
        var c = lb[a];
        c && ((lb[a] = void 0), c(b));
        kb.push(a);
      }
    },
    X = (a) => {
      if (!a) throw new P(`Cannot use deleted val. handle = ${a}`);
      return W[a];
    },
    S = (a) => {
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
          let b = kb.pop() || W.length;
          W[b] = a;
          W[b + 1] = 1;
          return b;
      }
    },
    nb = {
      name: 'emscripten::val',
      ba: (a) => {
        var b = X(a);
        mb(a);
        return b;
      },
      fa: (a, b) => S(b),
      ha: Qa,
      ga: null,
    },
    na,
    oa,
    ob = (a, b) => {
      switch (b) {
        case 4:
          return function (c) {
            return this.ba(na[c >> 2]);
          };
        case 8:
          return function (c) {
            return this.ba(oa[c >> 3]);
          };
        default:
          throw new TypeError(`invalid float width (${b}): ${a}`);
      }
    },
    pb = (a, b, c) => {
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
    qb = Object.assign({ optional: !0 }, nb),
    Y = (a, b, c) => {
      var d = G;
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
    rb = (a) => {
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
    sb = new TextDecoder(),
    tb = (a, b, c, d) => {
      c = b + c;
      if (d) return c;
      for (; a[b] && !(b >= c);) ++b;
      return b;
    },
    ub = new TextDecoder('utf-16le'),
    vb = (a, b, c) => {
      a >>= 1;
      return ub.decode(H.subarray(a, tb(H, a, b / 2, c)));
    },
    wb = (a, b, c = 2147483647) => {
      if (c < 2) return 0;
      c -= 2;
      var d = b;
      c = c < a.length * 2 ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) ((E[b >> 1] = a.charCodeAt(e)), (b += 2));
      E[b >> 1] = 0;
      return b - d;
    },
    xb = (a) => a.length * 2,
    yb = (a, b, c) => {
      var d = '';
      a >>= 2;
      for (var e = 0; !(e >= b / 4); e++) {
        var f = J[a + e];
        if (!f && !c) break;
        d += String.fromCodePoint(f);
      }
      return d;
    },
    zb = (a, b, c = 2147483647) => {
      if (c < 4) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.codePointAt(e);
        f > 65535 && e++;
        I[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      I[b >> 2] = 0;
      return b - d;
    },
    Ab = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c)
        (a.codePointAt(c) > 65535 && c++, (b += 4));
      return b;
    },
    Bb = [],
    Cb = (a) => {
      var b = Bb.length;
      Bb.push(a);
      return b;
    },
    Db = (a, b) => {
      for (var c = Array(a), d = 0; d < a; ++d) {
        var e = d,
          f = J[(b + d * 4) >> 2],
          g = N[f];
        if (void 0 === g)
          throw (
            (a = `${`parameter ${d}`} has unknown type ${ab(f)}`), new P(a)
          );
        c[e] = g;
      }
      return c;
    },
    Eb = {},
    Fb = (a) => {
      var b = Eb[a];
      return b === void 0 ? L(a) : b;
    },
    Z = {},
    Gb = {},
    Ib = () => {
      if (!Hb) {
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
        for (b in Gb) Gb[b] === void 0 ? delete a[b] : (a[b] = Gb[b]);
        var c = [];
        for (b in a) c.push(`${b}=${a[b]}`);
        Hb = c;
      }
      return Hb;
    },
    Hb,
    Jb = [null, [], []],
    Kb = () => {
      if (m) {
        var a = q('node:crypto');
        return (b) => (a.randomFillSync(b), 0);
      }
      return (b) => (crypto.getRandomValues(b), 0);
    },
    Lb = (a) => (Lb = Kb())(a);
  (() => {
    var a = Ea.prototype;
    Object.assign(a, {
      isAliasOf: function (c) {
        if (!(this instanceof Ea && c instanceof Ea)) return !1;
        var d = this.W.Z.X,
          e = this.W.Y;
        c.W = c.W;
        var f = c.W.Z.X;
        for (c = c.W.Y; d.da;) ((e = d.oa(e)), (d = d.da));
        for (; f.da;) ((c = f.oa(c)), (f = f.da));
        return d === f && e === c;
      },
      clone: function () {
        this.W.Y || Aa(this);
        if (this.W.na) return ((this.W.count.value += 1), this);
        var c = R,
          d = Object,
          e = d.create,
          f = Object.getPrototypeOf(this),
          g = this.W;
        c = c(
          e.call(d, f, {
            W: {
              value: {
                count: g.count,
                ma: g.ma,
                na: g.na,
                Y: g.Y,
                Z: g.Z,
                aa: g.aa,
                ea: g.ea,
              },
            },
          }),
        );
        c.W.count.value += 1;
        c.W.ma = !1;
        return c;
      },
      ['delete']() {
        this.W.Y || Aa(this);
        if (this.W.ma && !this.W.na)
          throw new P('Object already scheduled for deletion');
        Ca(this);
        var c = this.W;
        --c.count.value;
        0 === c.count.value && (c.aa ? c.ea.ia(c.aa) : c.Z.X.ia(c.Y));
        this.W.na || ((this.W.aa = void 0), (this.W.Y = void 0));
      },
      isDeleted: function () {
        return !this.W.Y;
      },
      deleteLater: function () {
        this.W.Y || Aa(this);
        if (this.W.ma && !this.W.na)
          throw new P('Object already scheduled for deletion');
        Da.push(this);
        this.W.ma = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Wa.prototype, {
    za(a) {
      this.ua && (a = this.ua(a));
      return a;
    },
    ta(a) {
      this.ia?.(a);
    },
    ha: Qa,
    ba: function (a) {
      function b() {
        return this.qa
          ? Va(this.X.ka, { Z: this.Ca, Y: c, ea: this, aa: a })
          : Va(this.X.ka, { Z: this, Y: a });
      }
      var c = this.za(a);
      if (!c) return (this.ta(a), null);
      var d = Ta(this.X, c);
      if (void 0 !== d) {
        if (0 === d.W.count.value)
          return ((d.W.Y = c), (d.W.aa = a), d.clone());
        d = d.clone();
        this.ta(a);
        return d;
      }
      d = this.X.ya(c);
      d = Ga[d];
      if (!d) return b.call(this);
      d = this.pa ? d.wa : d.pointerType;
      var e = Ra(c, this.X, d.X);
      return e === null
        ? b.call(this)
        : this.qa
          ? Va(d.X.ka, { Z: d, Y: e, ea: this, aa: a })
          : Va(d.X.ka, { Z: d, Y: e });
    },
  });
  var $a,
    Mb,
    U,
    Nb,
    sa,
    hb,
    gb,
    D,
    Ya,
    Ob = {
      F: () => ra(''),
      q: (a, b, c, d, e) => {
        b = L(b);
        d = d === 0n;
        var f = (g) => g;
        if (d) {
          let g = c * 8;
          f = (h) => BigInt.asUintN(g, h);
          e = f(e);
        }
        Q(a, {
          name: b,
          ba: f,
          fa: (g, h) => {
            typeof h == 'number' && (h = BigInt(h));
            return h;
          },
          ha: za(b, c, !d),
          ga: null,
        });
      },
      I: (a, b, c, d) => {
        b = L(b);
        Q(a, {
          name: b,
          ba: function (e) {
            return !!e;
          },
          fa: function (e, f) {
            return f ? c : d;
          },
          ha: function (e) {
            return this.ba(G[e]);
          },
          ga: null,
        });
      },
      o: (a, b, c, d, e, f, g, h, k, n, l, t, w) => {
        l = L(l);
        f = T(e, f);
        h &&= T(g, h);
        n &&= T(k, n);
        w = T(t, w);
        var p = Ja(l);
        Ia(p, function () {
          bb(`Cannot construct ${l} due to unbound types`, [d]);
        });
        V([a, b, c], d ? [d] : [], (r) => {
          r = r[0];
          if (d) {
            var y = r.X;
            var x = y.ka;
          } else x = Ea.prototype;
          r = Fa(l, function (...K) {
            if (Object.getPrototypeOf(this) !== B)
              throw new P(`Use 'new' to construct ${l}`);
            if (void 0 === u.ja)
              throw new P(`${l} has no accessible constructor`);
            var ib = u.ja[K.length];
            if (void 0 === ib)
              throw new P(
                `Tried to invoke ctor of ${l} with invalid number of parameters (${K.length}) - expected (${Object.keys(u.ja).toString()}) parameters instead!`,
              );
            return ib.apply(this, K);
          });
          var B = Object.create(x, { constructor: { value: r } });
          r.prototype = B;
          var u = new Ka(l, r, B, w, y, f, h, n);
          if (u.da) {
            var F;
            (F = u.da).sa ?? (F.sa = []);
            u.da.sa.push(u);
          }
          y = new Wa(l, u, !0, !1, !1);
          F = new Wa(l + '*', u, !1, !1, !1);
          x = new Wa(l + ' const*', u, !1, !0, !1);
          Ga[a] = { pointerType: F, wa: x };
          Xa(p, r);
          return [y, F, x];
        });
      },
      n: (a, b, c, d, e, f) => {
        var g = cb(b, c);
        e = T(d, e);
        V([], [a], (h) => {
          h = h[0];
          var k = `constructor ${h.name}`;
          void 0 === h.X.ja && (h.X.ja = []);
          if (void 0 !== h.X.ja[b - 1])
            throw new P(
              `Cannot register multiple constructors with identical number of parameters (${b - 1}) for class '${h.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          h.X.ja[b - 1] = () => {
            bb(`Cannot construct ${h.name} due to unbound types`, g);
          };
          V([], g, (n) => {
            n.splice(1, 0, null);
            h.X.ja[b - 1] = fb(k, n, null, e, f);
            return [];
          });
          return [];
        });
      },
      e: (a, b, c, d, e, f, g, h, k) => {
        var n = cb(c, d);
        b = L(b);
        b = jb(b);
        f = T(e, f);
        V([], [a], (l) => {
          function t() {
            bb(`Cannot call ${w} due to unbound types`, n);
          }
          l = l[0];
          var w = `${l.name}.${b}`;
          b.startsWith('@@') && (b = Symbol[b.substring(2)]);
          h && l.X.Da.push(b);
          var p = l.X.ka,
            r = p[b];
          void 0 === r ||
          (void 0 === r.$ && r.className !== l.name && r.la === c - 2)
            ? ((t.la = c - 2), (t.className = l.name), (p[b] = t))
            : (Ha(p, b, w), (p[b].$[c - 2] = t));
          V([], n, (y) => {
            y = fb(w, y, l, f, g, k);
            void 0 === p[b].$
              ? ((y.la = c - 2), (p[b] = y))
              : (p[b].$[c - 2] = y);
            return [];
          });
          return [];
        });
      },
      G: (a) => Q(a, nb),
      p: (a, b, c) => {
        b = L(b);
        Q(a, {
          name: b,
          ba: (d) => d,
          fa: (d, e) => e,
          ha: ob(b, c),
          ga: null,
        });
      },
      d: (a, b, c, d, e, f, g) => {
        var h = cb(b, c);
        a = L(a);
        a = jb(a);
        e = T(d, e);
        Ia(
          a,
          function () {
            bb(`Cannot call ${a} due to unbound types`, h);
          },
          b - 1,
        );
        V([], h, (k) => {
          k = [k[0], null].concat(k.slice(1));
          Xa(a, fb(a, k, null, e, f, g), b - 1);
          return [];
        });
      },
      f: (a, b, c, d, e) => {
        b = L(b);
        var f = (h) => h;
        if (d === 0) {
          var g = 32 - 8 * c;
          f = (h) => (h << g) >>> g;
          e = f(e);
        }
        Q(a, {
          name: b,
          ba: f,
          fa: (h, k) => k,
          ha: za(b, c, d !== 0),
          ga: null,
        });
      },
      s: (a, b, c, d) => {
        c = L(c);
        d = L(d);
        V([], [a, b], (e) => {
          pb(e[0].X.ka, c, d);
          return [];
        });
      },
      a: (a, b, c) => {
        function d(f) {
          return new e(C.buffer, J[(f + 4) >> 2], J[f >> 2]);
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
        c = L(c);
        Q(a, { name: c, ba: d, ha: d }, { Aa: !0 });
      },
      L: (a) => {
        Q(a, qb);
      },
      H: (a, b) => {
        b = L(b);
        Q(a, {
          name: b,
          ba(c) {
            var d = (d = c + 4)
              ? sb.decode(G.subarray(d, tb(G, d, J[c >> 2], !0)))
              : '';
            U(c);
            return d;
          },
          fa(c, d) {
            d instanceof ArrayBuffer && (d = new Uint8Array(d));
            var e = typeof d == 'string';
            if (!(e || (ArrayBuffer.isView(d) && d.BYTES_PER_ELEMENT == 1)))
              throw new P('Cannot pass non-string to std::string');
            var f = e ? rb(d) : d.length;
            var g = Mb(4 + f + 1),
              h = g + 4;
            J[g >> 2] = f;
            e ? Y(d, h, f + 1) : G.set(d, h);
            c !== null && c.push(U, g);
            return g;
          },
          ha: Qa,
          ga(c) {
            U(c);
          },
        });
      },
      m: (a, b, c) => {
        c = L(c);
        if (b === 2) {
          var d = vb;
          var e = wb;
          var f = xb;
        } else ((d = yb), (e = zb), (f = Ab));
        Q(a, {
          name: c,
          ba: (g) => {
            var h = d(g + 4, J[g >> 2] * b, !0);
            U(g);
            return h;
          },
          fa: (g, h) => {
            if (typeof h != 'string')
              throw new P(`Cannot pass non-string to C++ string type ${c}`);
            var k = f(h),
              n = Mb(4 + k + b);
            J[n >> 2] = k / b;
            e(h, n + 4, k + b);
            g !== null && g.push(U, n);
            return n;
          },
          ha: Qa,
          ga(g) {
            U(g);
          },
        });
      },
      i: (a) => {
        Q(a, nb);
      },
      J: (a, b) => {
        b = L(b);
        Q(a, { Ba: !0, name: b, ba: () => {}, fa: () => {} });
      },
      C: () => {},
      l: (a, b, c) => {
        var d;
        [b, ...d] = Db(a, b);
        var e = b.fa.bind(b),
          f = d.map((h) => h.ha.bind(h));
        a--;
        var g = Array(a);
        b = `methodCaller<(${d.map((h) => h.name)}) => ${b.name}>`;
        return Cb(
          Fa(b, (h, k, n, l) => {
            for (var t = 0, w = 0; w < a; ++w) ((g[w] = f[w](l + t)), (t += 8));
            switch (c) {
              case 0:
                var p = X(h).apply(null, g);
                break;
              case 2:
                p = Reflect.construct(X(h), g);
                break;
              case 3:
                p = g[0];
                break;
              case 1:
                p = X(h)[Fb(k)](...g);
            }
            h = [];
            p = e(h, p);
            h.length && (J[n >> 2] = S(h));
            return p;
          }),
        );
      },
      t: mb,
      K: (a) => {
        if (!a) return S(globalThis);
        a = Fb(a);
        return S(globalThis[a]);
      },
      r: (a) => {
        a > 9 && (W[a + 1] += 1);
      },
      k: (a, b, c, d, e) => Bb[a](b, c, d, e),
      b: () => S([]),
      g: (a) => S(Fb(a)),
      j: () => S({}),
      u: (a) => {
        for (var b = X(a); b.length;) {
          var c = b.pop();
          b.pop()(c);
        }
        mb(a);
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
          var d = [a, performance.now()],
            e = Nb;
          if (!ka)
            try {
              e(...d);
            } catch (f) {
              f instanceof xa || f == 'unwind' || da(1, f);
            } finally {
            }
        }, b);
        Z[a] = { id: c, Ha: b };
        return 0;
      },
      x: (a, b, c, d) => {
        var e = new Date().getFullYear(),
          f = new Date(e, 0, 1).getTimezoneOffset();
        e = new Date(e, 6, 1).getTimezoneOffset();
        J[a >> 2] = Math.max(f, e) * 60;
        I[b >> 2] = Number(f != e);
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
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e6),
        );
        return 0;
      },
      c: () => performance.now(),
      z: (a) => {
        var b = G.length;
        a >>>= 0;
        if (a > 268435456) return !1;
        for (var c = 1; c <= 4; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          a: {
            d =
              ((Math.min(268435456, Math.ceil(Math.max(a, d) / 65536) * 65536) -
                D.buffer.byteLength +
                65535) /
                65536) |
              0;
            try {
              D.grow(d);
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
        for (e of Ib()) {
          var f = b + c;
          J[(a + d) >> 2] = f;
          c += Y(e, f, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      E: (a, b) => {
        var c = Ib();
        J[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += rb(d) + 1;
        J[b >> 2] = a;
        return 0;
      },
      A: (a, b, c, d) => {
        for (var e = 0, f = 0; f < c; f++) {
          var g = J[b >> 2],
            h = J[(b + 4) >> 2];
          b += 8;
          for (var k = 0; k < h; k++) {
            var n = a,
              l = G[g + k],
              t = Jb[n];
            l && l !== 10
              ? t.push(l)
              : ((l = tb(t, 0)),
                (l = sb.decode(
                  t.buffer ? t.subarray(0, l) : new Uint8Array(t.slice(0, l)),
                )),
                (n === 1 ? ja : A)(l),
                (t.length = 0));
          }
          e += h;
        }
        J[d >> 2] = e;
        return 0;
      },
      B: (a) => {
        da(a, new xa(a));
      },
      w: (a, b) => Lb(G.subarray(a, a + b)),
    },
    Pb;
  Pb = await (async function () {
    var a = { a: Ob };
    ta ??= Module.locateFile
      ? Module.locateFile
        ? Module.locateFile('wpilibc_wasm.wasm', v)
        : v + 'wpilibc_wasm.wasm'
      : new URL('wpilibc_wasm.wasm', import.meta.url).href;
    a = Pb = (await wa(a)).instance.exports;
    $a = a.O;
    Mb = Module._malloc = a.P;
    U = Module._free = a.Q;
    Nb = a.S;
    sa = a.T;
    hb = a.U;
    gb = a.V;
    D = a.M;
    Ya = a.R;
    ma();
    return Pb;
  })();
  await (async function () {
    ka || ((la = !0), Pb.N());
  })();
  return Module;
}
export default createWpilibcModule;
