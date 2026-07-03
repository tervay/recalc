async function createWpilibcModule(moduleArg = {}) {
  var Module = moduleArg;
  var aa = !!globalThis.window,
    ba = !!globalThis.WorkerGlobalScope,
    m =
      globalThis.process?.versions?.node &&
      globalThis.process?.type != 'renderer';
  if (m) {
    let { createRequire: a } = await import('node:module');
    var p = a(import.meta.url);
  }
  var ca = './this.program',
    da = (a, b) => {
      throw b;
    },
    ea = import.meta.url,
    q = '',
    fa,
    v;
  if (m) {
    var ha = p('node:fs');
    ea.startsWith('file:') &&
      (q = p('node:path').dirname(p('node:url').fileURLToPath(ea)) + '/');
    v = (a) => {
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
      q = new URL('.', ea).href;
    } catch {}
    ba &&
      (v = (a) => {
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
    x = console.error.bind(console),
    ka = !1,
    ia = (a) => a.startsWith('file://'),
    la = !1;
  function ma() {
    if (!A?.buffer?.Fa) {
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
    x(a);
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
    if (v) a = v(a);
    else throw 'both async and sync fetching of the wasm failed';
    return a;
  }
  async function va(a, b) {
    try {
      var c = await ua(a);
      return await WebAssembly.instantiate(c, b);
    } catch (d) {
      (x(`failed to asynchronously prepare wasm: ${d}`), ra(d));
    }
  }
  async function wa(a) {
    var b = ta;
    if (!m)
      try {
        var c = fetch(b, { credentials: 'same-origin' });
        return await WebAssembly.instantiateStreaming(c, a);
      } catch (d) {
        (x(`wasm streaming compile failed: ${d}`),
          x('falling back to ArrayBuffer instantiation'));
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
    pa,
    A,
    na,
    oa,
    E,
    G,
    qa,
    D,
    H = (a) => {
      for (var b = ''; ; ) {
        var c = D[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
      }
    },
    I = {},
    J = {},
    K = {},
    L = class extends Error {
      constructor(a) {
        super(a);
        this.name = 'BindingError';
      }
    },
    Aa = (a) => {
      throw new L(a);
    };
  function Ba(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new L(`type "${d}" must have a positive integer typeid pointer`);
    if (J.hasOwnProperty(a)) {
      if (c.za) return;
      throw new L(`Cannot register type '${d}' twice`);
    }
    J[a] = b;
    delete K[a];
    I.hasOwnProperty(a) && ((b = I[a]), delete I[a], b.forEach((e) => e()));
  }
  function M(a, b, c = {}) {
    return Ba(a, b, c);
  }
  var Ca = (a, b, c) => {
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
    Da = (a) => {
      throw new L(a.V.Y.W.name + ' instance already deleted');
    },
    Ea = !1,
    Fa = () => {},
    N = (a) => {
      if (!globalThis.FinalizationRegistry) return ((N = (b) => b), a);
      Ea = new FinalizationRegistry((b) => {
        b = b.V;
        --b.count.value;
        0 === b.count.value && (b.$ ? b.da.ha(b.$) : b.Y.W.ha(b.X));
      });
      N = (b) => {
        var c = b.V;
        c.$ && Ea.register(b, { V: c }, b);
        return b;
      };
      Fa = (b) => {
        Ea.unregister(b);
      };
      return N(a);
    },
    Ga = [];
  function Q() {}
  var Ha = (a, b) => Object.defineProperty(b, 'name', { value: a }),
    Ia = {},
    Ja = (a, b, c) => {
      if (void 0 === a[b].Z) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].Z.hasOwnProperty(e.length))
            throw new L(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].Z})!`,
            );
          return a[b].Z[e.length].apply(this, e);
        };
        a[b].Z = [];
        a[b].Z[d.ka] = d;
      }
    },
    Ka = (a, b, c) => {
      if (Module.hasOwnProperty(a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].Z && void 0 !== Module[a].Z[c])
        )
          throw new L(`Cannot register public name '${a}' twice`);
        Ja(Module, a, a);
        if (Module[a].Z.hasOwnProperty(c))
          throw new L(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].Z[c] = b;
      } else ((Module[a] = b), (Module[a].ka = c));
    },
    La = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    };
  function Ma(a, b, c, d, e, g, f, h) {
    this.name = a;
    this.constructor = b;
    this.ja = c;
    this.ha = d;
    this.ba = e;
    this.xa = g;
    this.na = f;
    this.wa = h;
    this.Ba = [];
  }
  var Na = (a, b, c) => {
      for (; b !== c; ) {
        if (!b.na)
          throw new L(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.na(a);
        b = b.ba;
      }
      return a;
    },
    Oa = (a) => {
      if (a === null) return 'null';
      var b = typeof a;
      return b === 'object' || b === 'array' || b === 'function'
        ? a.toString()
        : '' + a;
    };
  function Pa(a, b) {
    if (b === null) {
      if (this.qa) throw new L(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.V) throw new L(`Cannot pass "${Oa(b)}" as a ${this.name}`);
    if (!b.V.X)
      throw new L(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return Na(b.V.X, b.V.Y.W, this.W);
  }
  function Qa(a, b) {
    if (b === null) {
      if (this.qa) throw new L(`null is not a valid ${this.name}`);
      if (this.pa) {
        var c = this.Ca();
        a !== null && a.push(this.ha, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.V) throw new L(`Cannot pass "${Oa(b)}" as a ${this.name}`);
    if (!b.V.X)
      throw new L(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.oa && b.V.Y.oa)
      throw new L(
        `Cannot convert argument of type ${
          b.V.da ? b.V.da.name : b.V.Y.name
        } to parameter type ${this.name}`,
      );
    c = Na(b.V.X, b.V.Y.W, this.W);
    if (this.pa) {
      if (void 0 === b.V.$)
        throw new L('Passing raw pointer to smart pointer is illegal');
      switch (this.Ea) {
        case 0:
          if (b.V.da === this) c = b.V.$;
          else
            throw new L(
              `Cannot convert argument of type ${b.V.da ? b.V.da.name : b.V.Y.name} to parameter type ${this.name}`,
            );
          break;
        case 1:
          c = b.V.$;
          break;
        case 2:
          if (b.V.da === this) c = b.V.$;
          else {
            var d = b.clone();
            c = this.Da(
              c,
              R(() => d['delete']()),
            );
            a !== null && a.push(this.ha, c);
          }
          break;
        default:
          throw new L('Unsupported sharing policy');
      }
    }
    return c;
  }
  function Ra(a, b) {
    if (b === null) {
      if (this.qa) throw new L(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.V) throw new L(`Cannot pass "${Oa(b)}" as a ${this.name}`);
    if (!b.V.X)
      throw new L(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.V.Y.oa)
      throw new L(
        `Cannot convert argument of type ${b.V.Y.name} to parameter type ${this.name}`,
      );
    return Na(b.V.X, b.V.Y.W, this.W);
  }
  function S(a) {
    return this.aa(G[a >> 2]);
  }
  var Sa = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.ba) return null;
      a = Sa(a, b, c.ba);
      return a === null ? null : c.wa(a);
    },
    Ta = {},
    Ua = (a, b) => {
      if (b === void 0) throw new L('ptr should not be undefined');
      for (; a.ba; ) ((b = a.na(b)), (a = a.ba));
      return Ta[b];
    },
    Va = class extends Error {
      constructor(a) {
        super(a);
        this.name = 'InternalError';
      }
    },
    Wa = (a, b) => {
      if (!b.Y || !b.X)
        throw new Va('makeClassHandle requires ptr and ptrType');
      if (!!b.da !== !!b.$)
        throw new Va('Both smartPtrType and smartPtr must be specified');
      b.count = { value: 1 };
      return N(Object.create(a, { V: { value: b, writable: !0 } }));
    };
  function Xa(a, b, c, d, e, g, f, h, k, n, l) {
    this.name = a;
    this.W = b;
    this.qa = c;
    this.oa = d;
    this.pa = e;
    this.Aa = g;
    this.Ea = f;
    this.ua = h;
    this.Ca = k;
    this.Da = n;
    this.ha = l;
    e || b.ba !== void 0
      ? (this.ea = Qa)
      : ((this.ea = d ? Pa : Ra), (this.fa = null));
  }
  var Ya = (a, b, c) => {
      if (!Module.hasOwnProperty(a))
        throw new Va('Replacing nonexistent public symbol');
      void 0 !== Module[a].Z && void 0 !== c
        ? (Module[a].Z[c] = b)
        : ((Module[a] = b), (Module[a].ka = c));
    },
    Za = [],
    T = (a, b) => {
      a = H(a);
      var c;
      (c = Za[b]) || (Za[b] = c = $a.get(b));
      if (typeof c != 'function')
        throw new L(`unknown function pointer with signature ${a}: ${b}`);
      return c;
    };
  class ab extends Error {}
  var cb = (a) => {
      a = bb(a);
      var b = H(a);
      U(a);
      return b;
    },
    db = (a, b) => {
      function c(g) {
        e[g] || J[g] || (K[g] ? K[g].forEach(c) : (d.push(g), (e[g] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new ab(`${a}: ` + d.map(cb).join([', ']));
    },
    V = (a, b, c) => {
      function d(h) {
        h = c(h);
        if (h.length !== a.length)
          throw new Va('Mismatched type converter count');
        for (var k = 0; k < a.length; ++k) M(a[k], h[k]);
      }
      a.forEach((h) => (K[h] = b));
      var e = Array(b.length),
        g = [],
        f = 0;
      for (let [h, k] of b.entries())
        J.hasOwnProperty(k)
          ? (e[h] = J[k])
          : (g.push(k),
            I.hasOwnProperty(k) || (I[k] = []),
            I[k].push(() => {
              e[h] = J[k];
              ++f;
              f === g.length && d(e);
            }));
      0 === g.length && d(e);
    },
    eb = (a, b) => {
      for (var c = [], d = 0; d < a; d++) c.push(G[(b + d * 4) >> 2]);
      return c;
    },
    fb = (a) => {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    };
  function gb(a) {
    for (var b = 1; b < a.length; ++b)
      if (a[b] !== null && a[b].fa === void 0) return !0;
    return !1;
  }
  function hb(a, b, c, d, e, g) {
    var f = b.length;
    if (f < 2)
      throw new L(
        "argTypes array size mismatch! Must at least get return value and 'this' types!",
      );
    var h = b[1] !== null && c !== null,
      k = gb(b);
    c = !b[0].ta;
    var n = b[0],
      l = b[1];
    d = [a, Aa, d, e, fb, n.aa.bind(n), l?.ea.bind(l)];
    for (e = 2; e < f; ++e) ((n = b[e]), d.push(n.ea.bind(n)));
    if (!k)
      for (e = h ? 1 : 2; e < b.length; ++e)
        b[e].fa !== null && d.push(b[e].fa);
    k = gb(b);
    e = b.length - 2;
    l = [];
    n = ['fn'];
    h && n.push('thisWired');
    for (f = 0; f < e; ++f) (l.push(`arg${f}`), n.push(`arg${f}Wired`));
    l = l.join();
    n = n.join();
    l = `return function (${l}) {\n`;
    k && (l += 'var destructors = [];\n');
    var r = k ? 'destructors' : 'null',
      w =
        'humanName throwBindingError invoker fn runDestructors fromRetWire toClassParamWire'.split(
          ' ',
        );
    h && (l += `var thisWired = toClassParamWire(${r}, this);\n`);
    for (f = 0; f < e; ++f) {
      var t = `toArg${f}Wire`;
      l += `var arg${f}Wired = ${t}(${r}, arg${f});\n`;
      w.push(t);
    }
    l += (c || g ? 'var rv = ' : '') + `invoker(${n});\n`;
    if (k) l += 'runDestructors(destructors);\n';
    else
      for (f = h ? 1 : 2; f < b.length; ++f)
        ((g = f === 1 ? 'thisWired' : 'arg' + (f - 2) + 'Wired'),
          b[f].fa !== null &&
            ((l += `${g}_dtor(${g});\n`), w.push(`${g}_dtor`)));
    c && (l += 'var ret = fromRetWire(rv);\nreturn ret;\n');
    b = new Function(w, l + '}\n')(...d);
    return Ha(a, b);
  }
  var ib = (a) => {
      a = a.trim();
      var b = a.indexOf('(');
      return b === -1 ? a : a.slice(0, b);
    },
    jb = [],
    W = [0, 1, , 1, null, 1, !0, 1, !1, 1],
    kb = [],
    mb = (a) => {
      if (a > 9 && 0 === --W[a + 1]) {
        var b = W[a];
        W[a] = void 0;
        var c = kb[a];
        c && ((kb[a] = void 0), c(b));
        jb.push(a);
      }
    },
    X = (a) => {
      if (!a) throw new L(`Cannot use deleted val. handle = ${a}`);
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
          let b = jb.pop() || W.length;
          W[b] = a;
          W[b + 1] = 1;
          return b;
      }
    },
    nb = {
      name: 'emscripten::val',
      aa: (a) => {
        var b = X(a);
        mb(a);
        return b;
      },
      ea: (a, b) => R(b),
      ga: S,
      fa: null,
    },
    ob = (a, b) => {
      switch (b) {
        case 4:
          return function (c) {
            return this.aa(na[c >> 2]);
          };
        case 8:
          return function (c) {
            return this.aa(oa[c >> 3]);
          };
        default:
          throw new TypeError(`invalid float width (${b}): ${a}`);
      }
    },
    pb = (a, b, c) => {
      var d = (e, g) => {
        var f = 0;
        return {
          next() {
            if (f >= e) return { done: !0 };
            var h = f;
            f++;
            return { value: g(h), done: !1 };
          },
          [Symbol.iterator]() {
            return this;
          },
        };
      };
      a[Symbol.iterator] ||
        (a[Symbol.iterator] = function () {
          var e = this[b]();
          return d(e, (g) => this[c](g));
        });
    },
    qb = Object.assign({ optional: !0 }, nb),
    Y = (a, b, c) => {
      var d = D;
      if (!(c > 0)) return 0;
      var e = b;
      c = b + c - 1;
      for (var g = 0; g < a.length; ++g) {
        var f = a.codePointAt(g);
        if (f <= 127) {
          if (b >= c) break;
          d[b++] = f;
        } else if (f <= 2047) {
          if (b + 1 >= c) break;
          d[b++] = 192 | (f >> 6);
          d[b++] = 128 | (f & 63);
        } else if (f <= 65535) {
          if (b + 2 >= c) break;
          d[b++] = 224 | (f >> 12);
          d[b++] = 128 | ((f >> 6) & 63);
          d[b++] = 128 | (f & 63);
        } else {
          if (b + 3 >= c) break;
          d[b++] = 240 | (f >> 18);
          d[b++] = 128 | ((f >> 12) & 63);
          d[b++] = 128 | ((f >> 6) & 63);
          d[b++] = 128 | (f & 63);
          g++;
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
    sb = globalThis.TextDecoder && new TextDecoder(),
    tb = (a, b, c, d) => {
      c = b + c;
      if (d) return c;
      for (; a[b] && !(b >= c); ) ++b;
      return b;
    },
    ub = (a, b = 0, c, d) => {
      c = tb(a, b, c, d);
      if (c - b > 16 && a.buffer && sb) return sb.decode(a.subarray(b, c));
      for (d = ''; b < c; ) {
        var e = a[b++];
        if (e & 128) {
          var g = a[b++] & 63;
          if ((e & 224) == 192) d += String.fromCharCode(((e & 31) << 6) | g);
          else {
            var f = a[b++] & 63;
            e =
              (e & 240) == 224
                ? ((e & 15) << 12) | (g << 6) | f
                : ((e & 7) << 18) | (g << 12) | (f << 6) | (a[b++] & 63);
            e < 65536
              ? (d += String.fromCharCode(e))
              : ((e -= 65536),
                (d += String.fromCharCode(
                  55296 | (e >> 10),
                  56320 | (e & 1023),
                )));
          }
        } else d += String.fromCharCode(e);
      }
      return d;
    },
    vb = globalThis.TextDecoder ? new TextDecoder('utf-16le') : void 0,
    wb = (a, b, c) => {
      a >>= 1;
      b = tb(E, a, b / 2, c);
      if (b - a > 16 && vb) return vb.decode(E.subarray(a, b));
      for (c = ''; a < b; ++a) c += String.fromCharCode(E[a]);
      return c;
    },
    xb = (a, b, c = 2147483647) => {
      if (c < 2) return 0;
      c -= 2;
      var d = b;
      c = c < a.length * 2 ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) ((C[b >> 1] = a.charCodeAt(e)), (b += 2));
      C[b >> 1] = 0;
      return b - d;
    },
    yb = (a) => a.length * 2,
    zb = (a, b, c) => {
      var d = '';
      a >>= 2;
      for (var e = 0; !(e >= b / 4); e++) {
        var g = G[a + e];
        if (!g && !c) break;
        d += String.fromCodePoint(g);
      }
      return d;
    },
    Ab = (a, b, c = 2147483647) => {
      if (c < 4) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var g = a.codePointAt(e);
        g > 65535 && e++;
        F[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      F[b >> 2] = 0;
      return b - d;
    },
    Bb = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c)
        (a.codePointAt(c) > 65535 && c++, (b += 4));
      return b;
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
          g = G[(b + d * 4) >> 2],
          f = J[g];
        if (void 0 === f)
          throw (
            (a = `${`parameter ${d}`} has unknown type ${cb(g)}`), new L(a)
          );
        c[e] = f;
      }
      return c;
    },
    Fb = (a, b, c) => {
      var d = [];
      a = a(d, c);
      d.length && (G[b >> 2] = R(d));
      return a;
    },
    Gb = {},
    Hb = (a) => {
      var b = Gb[a];
      return b === void 0 ? H(a) : b;
    },
    Z = {},
    Ib = (a) => {
      if (!ka)
        try {
          a();
        } catch (b) {
          b instanceof xa || b == 'unwind' || da(1, b);
        } finally {
        }
    },
    Jb = {},
    Lb = () => {
      if (!Kb) {
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
        for (b in Jb) Jb[b] === void 0 ? delete a[b] : (a[b] = Jb[b]);
        var c = [];
        for (b in a) c.push(`${b}=${a[b]}`);
        Kb = c;
      }
      return Kb;
    },
    Kb,
    Mb = [null, [], []],
    Nb = () => {
      if (m) {
        var a = p('node:crypto');
        return (b) => (a.randomFillSync(b), 0);
      }
      return (b) => (crypto.getRandomValues(b), 0);
    },
    Ob = (a) => (Ob = Nb())(a);
  (() => {
    var a = Q.prototype;
    Object.assign(a, {
      isAliasOf: function (c) {
        if (!(this instanceof Q && c instanceof Q)) return !1;
        var d = this.V.Y.W,
          e = this.V.X;
        c.V = c.V;
        var g = c.V.Y.W;
        for (c = c.V.X; d.ba; ) ((e = d.na(e)), (d = d.ba));
        for (; g.ba; ) ((c = g.na(c)), (g = g.ba));
        return d === g && e === c;
      },
      clone: function () {
        this.V.X || Da(this);
        if (this.V.ma) return ((this.V.count.value += 1), this);
        var c = N,
          d = Object,
          e = d.create,
          g = Object.getPrototypeOf(this),
          f = this.V;
        c = c(
          e.call(d, g, {
            V: {
              value: {
                count: f.count,
                la: f.la,
                ma: f.ma,
                X: f.X,
                Y: f.Y,
                $: f.$,
                da: f.da,
              },
            },
          }),
        );
        c.V.count.value += 1;
        c.V.la = !1;
        return c;
      },
      ['delete']() {
        this.V.X || Da(this);
        if (this.V.la && !this.V.ma)
          throw new L('Object already scheduled for deletion');
        Fa(this);
        var c = this.V;
        --c.count.value;
        0 === c.count.value && (c.$ ? c.da.ha(c.$) : c.Y.W.ha(c.X));
        this.V.ma || ((this.V.$ = void 0), (this.V.X = void 0));
      },
      isDeleted: function () {
        return !this.V.X;
      },
      deleteLater: function () {
        this.V.X || Da(this);
        if (this.V.la && !this.V.ma)
          throw new L('Object already scheduled for deletion');
        Ga.push(this);
        this.V.la = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Xa.prototype, {
    ya(a) {
      this.ua && (a = this.ua(a));
      return a;
    },
    sa(a) {
      this.ha?.(a);
    },
    ga: S,
    aa: function (a) {
      function b() {
        return this.pa
          ? Wa(this.W.ja, { Y: this.Aa, X: c, da: this, $: a })
          : Wa(this.W.ja, { Y: this, X: a });
      }
      var c = this.ya(a);
      if (!c) return (this.sa(a), null);
      var d = Ua(this.W, c);
      if (void 0 !== d) {
        if (0 === d.V.count.value) return ((d.V.X = c), (d.V.$ = a), d.clone());
        d = d.clone();
        this.sa(a);
        return d;
      }
      d = this.W.xa(c);
      d = Ia[d];
      if (!d) return b.call(this);
      d = this.oa ? d.va : d.pointerType;
      var e = Sa(c, this.W, d.W);
      return e === null
        ? b.call(this)
        : this.pa
          ? Wa(d.W.ja, { Y: d, X: e, da: this, $: a })
          : Wa(d.W.ja, { Y: d, X: e });
    },
  });
  var bb,
    Pb,
    U,
    Qb,
    sa,
    B,
    $a,
    Rb = {
      F: () => ra(''),
      s: (a, b, c, d, e) => {
        b = H(b);
        d = d === 0n;
        var g = (f) => f;
        if (d) {
          let f = c * 8;
          g = (h) => BigInt.asUintN(f, h);
          e = g(e);
        }
        M(a, {
          name: b,
          aa: g,
          ea: (f, h) => {
            typeof h == 'number' && (h = BigInt(h));
            return h;
          },
          ga: Ca(b, c, !d),
          fa: null,
        });
      },
      I: (a, b, c, d) => {
        b = H(b);
        M(a, {
          name: b,
          aa: function (e) {
            return !!e;
          },
          ea: function (e, g) {
            return g ? c : d;
          },
          ga: function (e) {
            return this.aa(D[e]);
          },
          fa: null,
        });
      },
      n: (a, b, c, d, e, g, f, h, k, n, l, r, w) => {
        l = H(l);
        g = T(e, g);
        h &&= T(f, h);
        n &&= T(k, n);
        w = T(r, w);
        var t = La(l);
        Ka(t, function () {
          db(`Cannot construct ${l} due to unbound types`, [d]);
        });
        V([a, b, c], d ? [d] : [], (u) => {
          u = u[0];
          if (d) {
            var y = u.W;
            var O = y.ja;
          } else O = Q.prototype;
          u = Ha(l, function (...ya) {
            if (Object.getPrototypeOf(this) !== za)
              throw new L(`Use 'new' to construct ${l}`);
            if (void 0 === z.ia)
              throw new L(`${l} has no accessible constructor`);
            var lb = z.ia[ya.length];
            if (void 0 === lb)
              throw new L(
                `Tried to invoke ctor of ${l} with invalid number of parameters (${ya.length}) - expected (${Object.keys(z.ia).toString()}) parameters instead!`,
              );
            return lb.apply(this, ya);
          });
          var za = Object.create(O, { constructor: { value: u } });
          u.prototype = za;
          var z = new Ma(l, u, za, w, y, g, h, n);
          if (z.ba) {
            var P;
            (P = z.ba).ra ?? (P.ra = []);
            z.ba.ra.push(z);
          }
          y = new Xa(l, z, !0, !1, !1);
          P = new Xa(l + '*', z, !1, !1, !1);
          O = new Xa(l + ' const*', z, !1, !0, !1);
          Ia[a] = { pointerType: P, va: O };
          Ya(t, u);
          return [y, P, O];
        });
      },
      m: (a, b, c, d, e, g) => {
        var f = eb(b, c);
        e = T(d, e);
        V([], [a], (h) => {
          h = h[0];
          var k = `constructor ${h.name}`;
          void 0 === h.W.ia && (h.W.ia = []);
          if (void 0 !== h.W.ia[b - 1])
            throw new L(
              `Cannot register multiple constructors with identical number of parameters (${
                b - 1
              }) for class '${h.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          h.W.ia[b - 1] = () => {
            db(`Cannot construct ${h.name} due to unbound types`, f);
          };
          V([], f, (n) => {
            n.splice(1, 0, null);
            h.W.ia[b - 1] = hb(k, n, null, e, g);
            return [];
          });
          return [];
        });
      },
      a: (a, b, c, d, e, g, f, h, k) => {
        var n = eb(c, d);
        b = H(b);
        b = ib(b);
        g = T(e, g);
        V([], [a], (l) => {
          function r() {
            db(`Cannot call ${w} due to unbound types`, n);
          }
          l = l[0];
          var w = `${l.name}.${b}`;
          b.startsWith('@@') && (b = Symbol[b.substring(2)]);
          h && l.W.Ba.push(b);
          var t = l.W.ja,
            u = t[b];
          void 0 === u ||
          (void 0 === u.Z && u.className !== l.name && u.ka === c - 2)
            ? ((r.ka = c - 2), (r.className = l.name), (t[b] = r))
            : (Ja(t, b, w), (t[b].Z[c - 2] = r));
          V([], n, (y) => {
            y = hb(w, y, l, g, f, k);
            void 0 === t[b].Z
              ? ((y.ka = c - 2), (t[b] = y))
              : (t[b].Z[c - 2] = y);
            return [];
          });
          return [];
        });
      },
      G: (a) => M(a, nb),
      r: (a, b, c) => {
        b = H(b);
        M(a, {
          name: b,
          aa: (d) => d,
          ea: (d, e) => e,
          ga: ob(b, c),
          fa: null,
        });
      },
      e: (a, b, c, d, e, g, f) => {
        var h = eb(b, c);
        a = H(a);
        a = ib(a);
        e = T(d, e);
        Ka(
          a,
          function () {
            db(`Cannot call ${a} due to unbound types`, h);
          },
          b - 1,
        );
        V([], h, (k) => {
          k = [k[0], null].concat(k.slice(1));
          Ya(a, hb(a, k, null, e, g, f), b - 1);
          return [];
        });
      },
      i: (a, b, c, d, e) => {
        b = H(b);
        var g = (h) => h;
        if (d === 0) {
          var f = 32 - 8 * c;
          g = (h) => (h << f) >>> f;
          e = g(e);
        }
        M(a, {
          name: b,
          aa: g,
          ea: (h, k) => k,
          ga: Ca(b, c, d !== 0),
          fa: null,
        });
      },
      t: (a, b, c, d) => {
        c = H(c);
        d = H(d);
        V([], [a, b], (e) => {
          pb(e[0].W.ja, c, d);
          return [];
        });
      },
      c: (a, b, c) => {
        function d(g) {
          return new e(A.buffer, G[(g + 4) >> 2], G[g >> 2]);
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
        c = H(c);
        M(a, { name: c, aa: d, ga: d }, { za: !0 });
      },
      M: (a) => {
        M(a, qb);
      },
      H: (a, b) => {
        b = H(b);
        M(a, {
          name: b,
          aa(c) {
            var d = (d = c + 4) ? ub(D, d, G[c >> 2], !0) : '';
            U(c);
            return d;
          },
          ea(c, d) {
            d instanceof ArrayBuffer && (d = new Uint8Array(d));
            var e = typeof d == 'string';
            if (!(e || (ArrayBuffer.isView(d) && d.BYTES_PER_ELEMENT == 1)))
              throw new L('Cannot pass non-string to std::string');
            var g = e ? rb(d) : d.length;
            var f = Pb(4 + g + 1),
              h = f + 4;
            G[f >> 2] = g;
            e ? Y(d, h, g + 1) : D.set(d, h);
            c !== null && c.push(U, f);
            return f;
          },
          ga: S,
          fa(c) {
            U(c);
          },
        });
      },
      p: (a, b, c) => {
        c = H(c);
        if (b === 2) {
          var d = wb;
          var e = xb;
          var g = yb;
        } else ((d = zb), (e = Ab), (g = Bb));
        M(a, {
          name: c,
          aa: (f) => {
            var h = d(f + 4, G[f >> 2] * b, !0);
            U(f);
            return h;
          },
          ea: (f, h) => {
            if (typeof h != 'string')
              throw new L(`Cannot pass non-string to C++ string type ${c}`);
            var k = g(h),
              n = Pb(4 + k + b);
            G[n >> 2] = k / b;
            e(h, n + 4, k + b);
            f !== null && f.push(U, n);
            return n;
          },
          ga: S,
          fa(f) {
            U(f);
          },
        });
      },
      J: (a, b) => {
        b = H(b);
        M(a, { ta: !0, name: b, aa: () => {}, ea: () => {} });
      },
      A: () => {},
      h: (a, b, c) => {
        var d;
        [b, ...d] = Eb(a, b);
        var e = b.ea.bind(b),
          g = d.map((k) => k.ga.bind(k));
        a--;
        var f = { toValue: X };
        a = g.map((k, n) => {
          var l = `argFromPtr${n}`;
          f[l] = k;
          return `${l}(args${n ? '+' + n * 8 : ''})`;
        });
        switch (c) {
          case 0:
            var h = 'toValue(handle)';
            break;
          case 2:
            h = 'new (toValue(handle))';
            break;
          case 3:
            h = '';
            break;
          case 1:
            ((f.getStringOrSymbol = Hb),
              (h = 'toValue(handle)[getStringOrSymbol(methodName)]'));
        }
        h += `(${a})`;
        b.ta ||
          ((f.toReturnWire = e),
          (f.emval_returnValue = Fb),
          (h = `return emval_returnValue(toReturnWire, destructorsRef, ${h})`));
        h = `return function (handle, methodName, destructorsRef, args) {\n${h}\n}`;
        c = new Function(Object.keys(f), h)(...Object.values(f));
        b = `methodCaller<(${d.map((k) => k.name)}) => ${b.name}>`;
        return Db(Ha(b, c));
      },
      b: mb,
      K: (a) => {
        if (!a) return R(globalThis);
        a = Hb(a);
        return R(globalThis[a]);
      },
      L: (a) => {
        a > 9 && (W[a + 1] += 1);
      },
      g: (a, b, c, d, e) => Cb[a](b, c, d, e),
      l: () => R([]),
      j: (a) => R(Hb(a)),
      d: () => R({}),
      f: (a) => {
        var b = X(a);
        fb(b);
        mb(a);
      },
      k: (a, b, c) => {
        a = X(a);
        b = X(b);
        c = X(c);
        a[b] = c;
      },
      u: (a, b) => {
        Z[a] && (clearTimeout(Z[a].id), delete Z[a]);
        if (!b) return 0;
        var c = setTimeout(() => {
          delete Z[a];
          Ib(() => Qb(a, performance.now()));
        }, b);
        Z[a] = { id: c, Ga: b };
        return 0;
      },
      w: (a, b, c, d) => {
        var e = new Date().getFullYear(),
          g = new Date(e, 0, 1).getTimezoneOffset();
        e = new Date(e, 6, 1).getTimezoneOffset();
        G[a >> 2] = Math.max(g, e) * 60;
        F[b >> 2] = Number(g != e);
        b = (f) => {
          var h = Math.abs(f);
          return `UTC${f >= 0 ? '-' : '+'}${String(Math.floor(h / 60)).padStart(2, '0')}${String(h % 60).padStart(2, '0')}`;
        };
        a = b(g);
        b = b(e);
        e < g ? (Y(a, c, 17), Y(b, d, 17)) : (Y(a, d, 17), Y(b, c, 17));
      },
      x: function (a, b, c) {
        if (!(a >= 0 && a <= 3)) return 28;
        pa[c >> 3] = BigInt(
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e3 * 1e3),
        );
        return 0;
      },
      o: () => performance.now(),
      y: (a) => {
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
            } catch (g) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      C: (a, b) => {
        var c = 0,
          d = 0,
          e;
        for (e of Lb()) {
          var g = b + c;
          G[(a + d) >> 2] = g;
          c += Y(e, g, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      D: (a, b) => {
        var c = Lb();
        G[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += rb(d) + 1;
        G[b >> 2] = a;
        return 0;
      },
      E: () => 52,
      B: function () {
        return 70;
      },
      q: (a, b, c, d) => {
        for (var e = 0, g = 0; g < c; g++) {
          var f = G[b >> 2],
            h = G[(b + 4) >> 2];
          b += 8;
          for (var k = 0; k < h; k++) {
            var n = a,
              l = D[f + k],
              r = Mb[n];
            l === 0 || l === 10
              ? ((n === 1 ? ja : x)(ub(r)), (r.length = 0))
              : r.push(l);
          }
          e += h;
        }
        G[d >> 2] = e;
        return 0;
      },
      z: (a) => {
        da(a, new xa(a));
      },
      v: (a, b) => Ob(D.subarray(a, a + b)),
    },
    Sb;
  Sb = await (async function () {
    var a = { a: Rb };
    ta ??= Module.locateFile
      ? Module.locateFile
        ? Module.locateFile('wpilibc_wasm.wasm', q)
        : q + 'wpilibc_wasm.wasm'
      : new URL('wpilibc_wasm.wasm', import.meta.url).href;
    a = Sb = (await wa(a)).instance.exports;
    bb = a.P;
    Pb = Module._malloc = a.Q;
    U = Module._free = a.R;
    Qb = a.T;
    sa = a.U;
    B = a.N;
    $a = a.S;
    ma();
    return Sb;
  })();
  await (async function () {
    ka || ((la = !0), Sb.O());
  })();
  return Module;
}
export default createWpilibcModule;
