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
      F = new Uint8Array(a);
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
      return await fa(a);
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
    F,
    K = (a) => {
      for (var b = ''; ;) {
        var c = F[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
      }
    },
    E,
    I,
    pa,
    H,
    J,
    qa,
    ya = (a, b, c) => {
      switch (b) {
        case 1:
          return c ? (d) => C[d] : (d) => F[d];
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
    L = {},
    M = {};
  class N extends Error {
    constructor(a) {
      super(a);
      this.name = 'BindingError';
    }
  }
  var O = {};
  function za(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new N(`type "${d}" must have a positive integer typeid pointer`);
    if (M[a]) {
      if (c.Aa) return;
      throw new N(`Cannot register type '${d}' twice`);
    }
    M[a] = b;
    delete O[a];
    L[a] && ((b = L[a]), delete L[a], b.forEach((e) => e()));
  }
  function P(a, b, c = {}) {
    return za(a, b, c);
  }
  var Aa = !1,
    Ca = () => {},
    Q = (a) => {
      if (!globalThis.FinalizationRegistry) return ((Q = (b) => b), a);
      Aa = new FinalizationRegistry((b) => {
        b = b.W;
        --b.count.value;
        0 === b.count.value && (b.aa ? b.ea.ia(b.aa) : b.Z.X.ia(b.Y));
      });
      Q = (b) => {
        var c = b.W;
        c.aa && Aa.register(b, { W: c }, b);
        return b;
      };
      Ca = (b) => {
        Aa.unregister(b);
      };
      return Q(a);
    },
    Da = [],
    Ea = (a) => {
      throw new N(a.W.Z.X.name + ' instance already deleted');
    };
  function R() {}
  function Fa(a, b, c, d, e, f, g, h) {
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
  var Ga = (a) => {
      if (a === null) return 'null';
      var b = typeof a;
      return b === 'object' || b === 'array' || b === 'function'
        ? a.toString()
        : '' + a;
    },
    Ha = (a, b, c) => {
      for (; b !== c;) {
        if (!b.oa)
          throw new N(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.oa(a);
        b = b.da;
      }
      return a;
    };
  function Ia(a, b) {
    if (b === null) {
      if (this.ra) throw new N(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.W) throw new N(`Cannot pass "${Ga(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new N(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return Ha(b.W.Y, b.W.Z.X, this.X);
  }
  var Ja = [],
    S = [0, 1, , 1, null, 1, !0, 1, !1, 1],
    T = (a) => {
      if (!a) throw new N(`Cannot use deleted val. handle = ${a}`);
      return S[a];
    },
    U = (a) => {
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
          let b = Ja.pop() || S.length;
          S[b] = a;
          S[b + 1] = 1;
          return b;
      }
    };
  function Ka(a, b) {
    if (b === null) {
      if (this.ra) throw new N(`null is not a valid ${this.name}`);
      if (this.qa) {
        var c = this.Ea();
        a !== null && a.push(this.ia, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.W) throw new N(`Cannot pass "${Ga(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new N(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.pa && b.W.Z.pa)
      throw new N(
        `Cannot convert argument of type ${b.W.ea ? b.W.ea.name : b.W.Z.name} to parameter type ${this.name}`,
      );
    c = Ha(b.W.Y, b.W.Z.X, this.X);
    if (this.qa) {
      if (void 0 === b.W.aa)
        throw new N('Passing raw pointer to smart pointer is illegal');
      switch (this.Ga) {
        case 0:
          if (b.W.ea === this) c = b.W.aa;
          else
            throw new N(
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
              U(() => d['delete']()),
            );
            a !== null && a.push(this.ia, c);
          }
          break;
        default:
          throw new N('Unsupported sharing policy');
      }
    }
    return c;
  }
  var La = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.da) return null;
      a = La(a, b, c.da);
      return a === null ? null : c.xa(a);
    },
    Ma = {},
    Na = (a, b) => {
      if (b === void 0) throw new N('ptr should not be undefined');
      for (; a.da;) ((b = a.oa(b)), (a = a.da));
      return Ma[b];
    };
  class Oa extends Error {
    constructor(a) {
      super(a);
      this.name = 'InternalError';
    }
  }
  var Pa = (a, b) => {
      if (!b.Z || !b.Y)
        throw new Oa('makeClassHandle requires ptr and ptrType');
      if (!!b.ea !== !!b.aa)
        throw new Oa('Both smartPtrType and smartPtr must be specified');
      b.count = { value: 1 };
      return Q(Object.create(a, { W: { value: b, writable: !0 } }));
    },
    Qa = {};
  function Ra(a) {
    return this.ba(J[a >> 2]);
  }
  function Sa(a, b) {
    if (b === null) {
      if (this.ra) throw new N(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.W) throw new N(`Cannot pass "${Ga(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new N(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.W.Z.pa)
      throw new N(
        `Cannot convert argument of type ${b.W.Z.name} to parameter type ${this.name}`,
      );
    return Ha(b.W.Y, b.W.Z.X, this.X);
  }
  function Ta(a, b, c, d, e, f, g, h, k, n, l) {
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
      ? (this.fa = Ka)
      : ((this.fa = d ? Ia : Sa), (this.ga = null));
  }
  var Ua = (a, b) => Object.defineProperty(b, 'name', { value: a }),
    V = (a, b) => {
      a = K(a);
      var c = Va.get(b);
      if (typeof c !== 'function')
        throw new N(`unknown function pointer with signature ${a}: ${b}`);
      return c;
    },
    Wa = (a, b, c) => {
      if (void 0 === a[b].$) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].$[e.length])
            throw new N(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].$})!`,
            );
          return a[b].$[e.length].apply(this, e);
        };
        a[b].$ = [];
        a[b].$[d.la] = d;
      }
    },
    Xa = Object.hasOwn,
    Ya = (a, b, c) => {
      if (Xa(Module, a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].$ && void 0 !== Module[a].$[c])
        )
          throw new N(`Cannot register public name '${a}' twice`);
        Wa(Module, a, a);
        if (Module[a].$[c])
          throw new N(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].$[c] = b;
      } else ((Module[a] = b), (Module[a].la = c));
    },
    Za = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    },
    $a = (a, b, c) => {
      if (!Xa(Module, a)) throw new Oa('Replacing nonexistent public symbol');
      void 0 !== Module[a].$ && void 0 !== c
        ? (Module[a].$[c] = b)
        : ((Module[a] = b), (Module[a].la = c));
    };
  class ab extends Error {}
  var cb = (a) => {
      a = bb(a);
      var b = K(a);
      W(a);
      return b;
    },
    db = (a, b) => {
      function c(f) {
        e[f] || M[f] || (O[f] ? O[f].forEach(c) : (d.push(f), (e[f] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new ab(`${a}: ` + d.map(cb).join([', ']));
    },
    X = (a, b, c) => {
      function d(h) {
        h = c(h);
        if (h.length !== a.length)
          throw new Oa('Mismatched type converter count');
        for (var k = 0; k < a.length; ++k) P(a[k], h[k]);
      }
      a.forEach((h) => (O[h] = b));
      var e = Array(b.length),
        f = [],
        g = 0;
      for (let [h, k] of b.entries())
        if (M[k]) e[h] = M[k];
        else {
          f.push(k);
          let n;
          (L[(n = k)] ?? (L[n] = [])).push(() => {
            e[h] = M[k];
            ++g;
            g === f.length && d(e);
          });
        }
      0 === f.length && d(e);
    };
  function eb(a) {
    for (var b = 1; b < a.length; ++b) if (a[b] !== null && a[b].va) return !0;
    return !1;
  }
  function fb(a) {
    for (var b = 1; b < a.length; ++b)
      if (a[b] !== null && a[b].ga === void 0) return !0;
    return !1;
  }
  function gb(a, b, c, d, e, f) {
    var g = b.length;
    if (g < 2)
      throw new N(
        'argTypes array size mismatch! Must at least get return value and receiver (this) types!',
      );
    var h = b[1] !== null && c !== null,
      k = fb(b),
      n = (c = eb(b)) && !f && !k;
    c && !n && (k = !0);
    var l = !b[0].Ba,
      t = g - 2,
      w = Array(t),
      p = [],
      r = [];
    return Ua(a, function (...y) {
      r.length = 0;
      var x;
      n && (x = hb());
      p.length = h ? 2 : 1;
      p[0] = e;
      if (h) {
        var B = b[1].fa(r, this);
        p[1] = B;
      }
      for (var u = 0; u < t; ++u) {
        var G = b[u + 2];
        w[u] = G.fa(n && G.va ? null : r, y[u]);
        p.push(w[u]);
      }
      y = d(...p);
      n && ib(x);
      if (k) for (; r.length;) ((B = r.pop()), r.pop()(B));
      else
        for (x = h ? 1 : 2; x < b.length; x++)
          ((u = x === 1 ? B : w[x - 2]), b[x].ga !== null && b[x].ga(u));
      B = l ? b[0].ba(y) : void 0;
      return B;
    });
  }
  var kb = (a, b) => {
      for (var c = [], d = 0; d < a; d++) c.push(J[(b + d * 4) >> 2]);
      return c;
    },
    lb = (a) => {
      a = a.trim();
      var b = a.indexOf('(');
      return b === -1 ? a : a.slice(0, b);
    },
    mb = [],
    nb = (a) => {
      if (a > 9 && 0 === --S[a + 1]) {
        var b = S[a];
        S[a] = void 0;
        var c = mb[a];
        c && ((mb[a] = void 0), c(b));
        Ja.push(a);
      }
    },
    ob = {
      name: 'emscripten::val',
      ba: (a) => {
        var b = T(a);
        nb(a);
        return b;
      },
      fa: (a, b) => U(b),
      ha: Ra,
      ga: null,
    },
    na,
    oa,
    pb = (a, b) => {
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
    qb = (a, b, c) => {
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
    rb = Object.assign({ optional: !0 }, ob),
    sb = new TextDecoder(),
    tb = (a, b, c, d) => {
      c = b + c;
      if (d) return c;
      for (; a[b] && !(b >= c);) ++b;
      return b;
    },
    ub = (a) => {
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
      var d = F;
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
    vb = new TextDecoder('utf-16le'),
    wb = (a, b, c) => {
      a >>= 1;
      return vb.decode(H.subarray(a, tb(H, a, b / 2, c)));
    },
    xb = (a, b, c) => {
      var d = '';
      a >>= 2;
      for (var e = 0; !(e >= b / 4); e++) {
        var f = J[a + e];
        if (!f && !c) break;
        d += String.fromCodePoint(f);
      }
      return d;
    },
    yb = (a) => a.length * 2,
    zb = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c)
        (a.codePointAt(c) > 65535 && c++, (b += 4));
      return b;
    },
    Ab = (a, b, c = 2147483647) => {
      if (c < 2) return 0;
      c -= 2;
      var d = b;
      c = c < a.length * 2 ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) ((E[b >> 1] = a.charCodeAt(e)), (b += 2));
      E[b >> 1] = 0;
      return b - d;
    },
    Bb = (a, b, c = 2147483647) => {
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
    Cb = [],
    Db = (a) => {
      var b = Cb.length;
      Cb.push(a);
      return b;
    },
    Eb = (a, b) => {
      for (var c = Array(a), d = 0; d < a; ++d) {
        var e = d,
          f = J[(b + d * 4) >> 2],
          g = M[f];
        if (void 0 === g)
          throw (
            (a = `${`parameter ${d}`} has unknown type ${cb(f)}`), new N(a)
          );
        c[e] = g;
      }
      return c;
    },
    Fb = {},
    Gb = (a) => {
      var b = Fb[a];
      return b === void 0 ? K(a) : b;
    },
    Z = {},
    Hb = {},
    Jb = () => {
      if (!Ib) {
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
        for (b in Hb) Hb[b] === void 0 ? delete a[b] : (a[b] = Hb[b]);
        var c = [];
        for (b in a) c.push(`${b}=${a[b]}`);
        Ib = c;
      }
      return Ib;
    },
    Ib,
    Kb = [null, [], []],
    Lb = () => {
      if (m) {
        var a = q('node:crypto');
        return (b) => (a.randomFillSync(b), 0);
      }
      return (b) => (crypto.getRandomValues(b), 0);
    },
    Mb = (a) => (Mb = Lb())(a);
  (() => {
    var a = R.prototype;
    Object.assign(a, {
      isAliasOf: function (c) {
        if (!(this instanceof R && c instanceof R)) return !1;
        var d = this.W.Z.X,
          e = this.W.Y;
        c.W = c.W;
        var f = c.W.Z.X;
        for (c = c.W.Y; d.da;) ((e = d.oa(e)), (d = d.da));
        for (; f.da;) ((c = f.oa(c)), (f = f.da));
        return d === f && e === c;
      },
      clone: function () {
        this.W.Y || Ea(this);
        if (this.W.na) return ((this.W.count.value += 1), this);
        var c = Q,
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
        this.W.Y || Ea(this);
        if (this.W.ma && !this.W.na)
          throw new N('Object already scheduled for deletion');
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
        this.W.Y || Ea(this);
        if (this.W.ma && !this.W.na)
          throw new N('Object already scheduled for deletion');
        Da.push(this);
        this.W.ma = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Ta.prototype, {
    za(a) {
      this.ua && (a = this.ua(a));
      return a;
    },
    ta(a) {
      this.ia?.(a);
    },
    ha: Ra,
    ba: function (a) {
      function b() {
        return this.qa
          ? Pa(this.X.ka, { Z: this.Ca, Y: c, ea: this, aa: a })
          : Pa(this.X.ka, { Z: this, Y: a });
      }
      var c = this.za(a);
      if (!c) return (this.ta(a), null);
      var d = Na(this.X, c);
      if (void 0 !== d) {
        if (0 === d.W.count.value)
          return ((d.W.Y = c), (d.W.aa = a), d.clone());
        d = d.clone();
        this.ta(a);
        return d;
      }
      d = this.X.ya(c);
      d = Qa[d];
      if (!d) return b.call(this);
      d = this.pa ? d.wa : d.pointerType;
      var e = La(c, this.X, d.X);
      return e === null
        ? b.call(this)
        : this.qa
          ? Pa(d.X.ka, { Z: d, Y: e, ea: this, aa: a })
          : Pa(d.X.ka, { Z: d, Y: e });
    },
  });
  var bb,
    Nb,
    W,
    Ob,
    sa,
    ib,
    hb,
    D,
    Va,
    Pb = {
      F: () => ra(''),
      q: (a, b, c, d, e) => {
        b = K(b);
        d = d === 0n;
        var f = (g) => g;
        if (d) {
          let g = c * 8;
          f = (h) => BigInt.asUintN(g, h);
          e = f(e);
        }
        P(a, {
          name: b,
          ba: f,
          fa: (g, h) => {
            typeof h === 'number' && (h = BigInt(h));
            return h;
          },
          ha: ya(b, c, !d),
          ga: null,
        });
      },
      I: (a, b, c, d) => {
        b = K(b);
        P(a, {
          name: b,
          ba: function (e) {
            return !!e;
          },
          fa: function (e, f) {
            return f ? c : d;
          },
          ha: function (e) {
            return this.ba(F[e]);
          },
          ga: null,
        });
      },
      o: (a, b, c, d, e, f, g, h, k, n, l, t, w) => {
        l = K(l);
        f = V(e, f);
        h &&= V(g, h);
        n &&= V(k, n);
        w = V(t, w);
        var p = Za(l);
        Ya(p, function () {
          db(`Cannot construct ${l} due to unbound types`, [d]);
        });
        X([a, b, c], d ? [d] : [], (r) => {
          r = r[0];
          if (d) {
            var y = r.X;
            var x = y.ka;
          } else x = R.prototype;
          r = Ua(l, function (...Ba) {
            if (Object.getPrototypeOf(this) !== B)
              throw new N(`Use 'new' to construct ${l}`);
            if (void 0 === u.ja)
              throw new N(`${l} has no accessible constructor`);
            var jb = u.ja[Ba.length];
            if (void 0 === jb)
              throw new N(
                `Tried to invoke ctor of ${l} with invalid number of parameters (${Ba.length}) - expected (${Object.keys(u.ja).toString()}) parameters instead!`,
              );
            return jb.apply(this, Ba);
          });
          var B = Object.create(x, { constructor: { value: r } });
          r.prototype = B;
          var u = new Fa(l, r, B, w, y, f, h, n);
          if (u.da) {
            var G;
            (G = u.da).sa ?? (G.sa = []);
            u.da.sa.push(u);
          }
          y = new Ta(l, u, !0, !1, !1);
          G = new Ta(l + '*', u, !1, !1, !1);
          x = new Ta(l + ' const*', u, !1, !0, !1);
          Qa[a] = { pointerType: G, wa: x };
          $a(p, r);
          return [y, G, x];
        });
      },
      n: (a, b, c, d, e, f) => {
        var g = kb(b, c);
        e = V(d, e);
        X([], [a], (h) => {
          h = h[0];
          var k = `constructor ${h.name}`;
          void 0 === h.X.ja && (h.X.ja = []);
          if (void 0 !== h.X.ja[b - 1])
            throw new N(
              `Cannot register multiple constructors with identical number of parameters (${b - 1}) for class '${h.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          h.X.ja[b - 1] = () => {
            db(`Cannot construct ${h.name} due to unbound types`, g);
          };
          X([], g, (n) => {
            n.splice(1, 0, null);
            h.X.ja[b - 1] = gb(k, n, null, e, f);
            return [];
          });
          return [];
        });
      },
      e: (a, b, c, d, e, f, g, h, k) => {
        var n = kb(c, d);
        b = K(b);
        b = lb(b);
        f = V(e, f);
        X([], [a], (l) => {
          function t() {
            db(`Cannot call ${w} due to unbound types`, n);
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
            : (Wa(p, b, w), (p[b].$[c - 2] = t));
          X([], n, (y) => {
            y = gb(w, y, l, f, g, k);
            void 0 === p[b].$
              ? ((y.la = c - 2), (p[b] = y))
              : (p[b].$[c - 2] = y);
            return [];
          });
          return [];
        });
      },
      G: (a) => P(a, ob),
      p: (a, b, c) => {
        b = K(b);
        P(a, {
          name: b,
          ba: (d) => d,
          fa: (d, e) => e,
          ha: pb(b, c),
          ga: null,
        });
      },
      d: (a, b, c, d, e, f, g) => {
        var h = kb(b, c);
        a = K(a);
        a = lb(a);
        e = V(d, e);
        Ya(
          a,
          function () {
            db(`Cannot call ${a} due to unbound types`, h);
          },
          b - 1,
        );
        X([], h, (k) => {
          k = [k[0], null].concat(k.slice(1));
          $a(a, gb(a, k, null, e, f, g), b - 1);
          return [];
        });
      },
      f: (a, b, c, d, e) => {
        b = K(b);
        var f = (h) => h;
        if (d === 0) {
          var g = 32 - 8 * c;
          f = (h) => (h << g) >>> g;
          e = f(e);
        }
        P(a, {
          name: b,
          ba: f,
          fa: (h, k) => k,
          ha: ya(b, c, d !== 0),
          ga: null,
        });
      },
      s: (a, b, c, d) => {
        c = K(c);
        d = K(d);
        X([], [a, b], (e) => {
          qb(e[0].X.ka, c, d);
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
        c = K(c);
        P(a, { name: c, ba: d, ha: d }, { Aa: !0 });
      },
      L: (a) => {
        P(a, rb);
      },
      H: (a, b) => {
        b = K(b);
        P(a, {
          name: b,
          ba(c) {
            var d = (d = c + 4)
              ? sb.decode(F.subarray(d, tb(F, d, J[c >> 2], !0)))
              : '';
            W(c);
            return d;
          },
          fa(c, d) {
            d instanceof ArrayBuffer && (d = new Uint8Array(d));
            var e = typeof d === 'string';
            if (!(e || (ArrayBuffer.isView(d) && d.BYTES_PER_ELEMENT == 1)))
              throw new N('Cannot pass non-string to std::string');
            var f = e ? ub(d) : d.length;
            var g = Nb(4 + f + 1),
              h = g + 4;
            J[g >> 2] = f;
            e ? Y(d, h, f + 1) : F.set(d, h);
            c !== null && c.push(W, g);
            return g;
          },
          ha: Ra,
          ga(c) {
            W(c);
          },
        });
      },
      m: (a, b, c) => {
        c = K(c);
        if (b === 2) {
          var d = wb;
          var e = Ab;
          var f = yb;
        } else ((d = xb), (e = Bb), (f = zb));
        P(a, {
          name: c,
          ba: (g) => {
            var h = d(g + 4, J[g >> 2] * b, !0);
            W(g);
            return h;
          },
          fa: (g, h) => {
            if (typeof h !== 'string')
              throw new N(`Cannot pass non-string to C++ string type ${c}`);
            var k = f(h),
              n = Nb(4 + k + b);
            J[n >> 2] = k / b;
            e(h, n + 4, k + b);
            g !== null && g.push(W, n);
            return n;
          },
          ha: Ra,
          ga(g) {
            W(g);
          },
        });
      },
      i: (a) => {
        P(a, ob);
      },
      J: (a, b) => {
        b = K(b);
        P(a, { Ba: !0, name: b, ba: () => {}, fa: () => {} });
      },
      C: () => {},
      l: (a, b, c) => {
        var d;
        [b, ...d] = Eb(a, b);
        var e = b.fa.bind(b),
          f = d.map((h) => h.ha.bind(h));
        a--;
        var g = Array(a);
        b = `methodCaller<(${d.map((h) => h.name)}) => ${b.name}>`;
        return Db(
          Ua(b, (h, k, n, l) => {
            for (var t = 0, w = 0; w < a; ++w) ((g[w] = f[w](l + t)), (t += 8));
            switch (c) {
              case 0:
                var p = T(h)(...g);
                break;
              case 2:
                p = Reflect.construct(T(h), g);
                break;
              case 3:
                p = g[0];
                break;
              case 1:
                p = T(h)[Gb(k)](...g);
            }
            h = [];
            p = e(h, p);
            h.length && (J[n >> 2] = U(h));
            return p;
          }),
        );
      },
      t: nb,
      K: (a) => {
        if (!a) return U(globalThis);
        a = Gb(a);
        return U(globalThis[a]);
      },
      r: (a) => {
        a > 9 && (S[a + 1] += 1);
      },
      k: (a, b, c, d, e) => Cb[a](b, c, d, e),
      b: () => U([]),
      g: (a) => U(Gb(a)),
      j: () => U({}),
      u: (a) => {
        for (var b = T(a); b.length;) {
          var c = b.pop();
          b.pop()(c);
        }
        nb(a);
      },
      h: (a, b, c) => {
        a = T(a);
        b = T(b);
        c = T(c);
        a[b] = c;
      },
      v: (a, b) => {
        Z[a] && (clearTimeout(Z[a].id), delete Z[a]);
        if (!b) return 0;
        var c = setTimeout(() => {
          delete Z[a];
          var d = [a, performance.now()],
            e = Ob;
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
        var b = F.length;
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
        for (e of Jb()) {
          var f = b + c;
          J[(a + d) >> 2] = f;
          c += Y(e, f, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      E: (a, b) => {
        var c = Jb();
        J[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += ub(d) + 1;
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
              l = F[g + k],
              t = Kb[n];
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
      w: (a, b) => Mb(F.subarray(a, a + b)),
    },
    Qb;
  Qb = await (async function () {
    var a = { a: Pb };
    ta ??= Module.locateFile
      ? Module.locateFile
        ? Module.locateFile('wpilibc_wasm.wasm', v)
        : v + 'wpilibc_wasm.wasm'
      : new URL('wpilibc_wasm.wasm', import.meta.url).href;
    a = Qb = (await wa(a)).instance.exports;
    bb = a.O;
    Nb = Module._malloc = a.P;
    W = Module._free = a.Q;
    Ob = a.S;
    sa = a.T;
    ib = a.U;
    hb = a.V;
    D = a.M;
    Va = a.R;
    ma();
    return Qb;
  })();
  await (async function () {
    ka || ((la = !0), Qb.N());
  })();
  return Module;
}
export default createWpilibcModule;
