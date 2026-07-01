async function createWpilibcModule(moduleArg = {}) {
  var moduleRtn;
  var m = moduleArg,
    aa = !!globalThis.window,
    ba = !!globalThis.WorkerGlobalScope,
    p =
      globalThis.process?.versions?.node &&
      globalThis.process?.type != 'renderer';
  if (p) {
    let { createRequire: a } = await import('node:module');
    var require = a(import.meta.url);
  }
  var ca = './this.program',
    da = (a, b) => {
      throw b;
    },
    ea = import.meta.url,
    q = '',
    fa,
    r;
  if (p) {
    var fs = require('node:fs');
    ea.startsWith('file:') &&
      (q =
        require('node:path').dirname(require('node:url').fileURLToPath(ea)) +
        '/');
    r = (a) => {
      a = ha(a) ? new URL(a) : a;
      return fs.readFileSync(a);
    };
    fa = async (a) => {
      a = ha(a) ? new URL(a) : a;
      return fs.readFileSync(a, void 0);
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
      (r = (a) => {
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
  var ia = console.log.bind(console),
    w = console.error.bind(console),
    ja = !1,
    ha = (a) => a.startsWith('file://'),
    ka,
    la,
    ma = !1;
  function na() {
    var a = y.buffer;
    oa = new Int8Array(a);
    B = new Int16Array(a);
    C = new Uint8Array(a);
    D = new Uint16Array(a);
    E = new Int32Array(a);
    F = new Uint32Array(a);
    pa = new Float32Array(a);
    qa = new Float64Array(a);
    ra = new BigInt64Array(a);
    sa = new BigUint64Array(a);
  }
  function ta(a) {
    a = `Aborted(${a})`;
    w(a);
    ja = !0;
    a += '. Build with -sASSERTIONS for more info.';
    ma && ua();
    a = new WebAssembly.RuntimeError(a);
    la?.(a);
    throw a;
  }
  var va;
  async function wa(a) {
    try {
      var b = await fa(a);
      return new Uint8Array(b);
    } catch {}
    if (r) a = r(a);
    else throw 'both async and sync fetching of the wasm failed';
    return a;
  }
  async function xa(a, b) {
    try {
      var c = await wa(a);
      return await WebAssembly.instantiate(c, b);
    } catch (d) {
      (w(`failed to asynchronously prepare wasm: ${d}`), ta(d));
    }
  }
  async function ya(a) {
    var b = va;
    if (!p)
      try {
        var c = fetch(b, { credentials: 'same-origin' });
        return await WebAssembly.instantiateStreaming(c, a);
      } catch (d) {
        (w(`wasm streaming compile failed: ${d}`),
          w('falling back to ArrayBuffer instantiation'));
      }
    return xa(b, a);
  }
  class Ba {
    name = 'ExitStatus';
    constructor(a) {
      this.message = `Program terminated with exit(${a})`;
      this.status = a;
    }
  }
  var B,
    E,
    ra,
    oa,
    pa,
    qa,
    D,
    F,
    sa,
    C,
    G = (a) => {
      for (var b = ''; ; ) {
        var c = C[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
      }
    },
    H = {},
    I = {},
    J = {},
    K = class extends Error {
      constructor(a) {
        super(a);
        this.name = 'BindingError';
      }
    },
    Ca = (a) => {
      throw new K(a);
    };
  function Da(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new K(`type "${d}" must have a positive integer typeid pointer`);
    if (I.hasOwnProperty(a)) {
      if (c.za) return;
      throw new K(`Cannot register type '${d}' twice`);
    }
    I[a] = b;
    delete J[a];
    H.hasOwnProperty(a) && ((b = H[a]), delete H[a], b.forEach((e) => e()));
  }
  function L(a, b, c = {}) {
    return Da(a, b, c);
  }
  var Ea = (a, b, c) => {
      switch (b) {
        case 1:
          return c ? (d) => oa[d] : (d) => C[d];
        case 2:
          return c ? (d) => B[d >> 1] : (d) => D[d >> 1];
        case 4:
          return c ? (d) => E[d >> 2] : (d) => F[d >> 2];
        case 8:
          return c ? (d) => ra[d >> 3] : (d) => sa[d >> 3];
        default:
          throw new TypeError(`invalid integer width (${b}): ${a}`);
      }
    },
    Fa = (a) => {
      throw new K(a.V.Y.W.name + ' instance already deleted');
    },
    Ga = !1,
    Ha = () => {},
    M = (a) => {
      if (!globalThis.FinalizationRegistry) return ((M = (b) => b), a);
      Ga = new FinalizationRegistry((b) => {
        b = b.V;
        --b.count.value;
        0 === b.count.value && (b.$ ? b.da.ha(b.$) : b.Y.W.ha(b.X));
      });
      M = (b) => {
        var c = b.V;
        c.$ && Ga.register(b, { V: c }, b);
        return b;
      };
      Ha = (b) => {
        Ga.unregister(b);
      };
      return M(a);
    },
    Ia = [];
  function N() {}
  var Ja = (a, b) => Object.defineProperty(b, 'name', { value: a }),
    Ka = {},
    La = (a, b, c) => {
      if (void 0 === a[b].Z) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].Z.hasOwnProperty(e.length))
            throw new K(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].Z})!`,
            );
          return a[b].Z[e.length].apply(this, e);
        };
        a[b].Z = [];
        a[b].Z[d.ka] = d;
      }
    },
    Ma = (a, b, c) => {
      if (m.hasOwnProperty(a)) {
        if (void 0 === c || (void 0 !== m[a].Z && void 0 !== m[a].Z[c]))
          throw new K(`Cannot register public name '${a}' twice`);
        La(m, a, a);
        if (m[a].Z.hasOwnProperty(c))
          throw new K(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        m[a].Z[c] = b;
      } else ((m[a] = b), (m[a].ka = c));
    },
    Na = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    };
  function Oa(a, b, c, d, e, g, f, h) {
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
  var Pa = (a, b, c) => {
      for (; b !== c; ) {
        if (!b.na)
          throw new K(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.na(a);
        b = b.ba;
      }
      return a;
    },
    Qa = (a) => {
      if (a === null) return 'null';
      var b = typeof a;
      return b === 'object' || b === 'array' || b === 'function'
        ? a.toString()
        : '' + a;
    };
  function Ra(a, b) {
    if (b === null) {
      if (this.qa) throw new K(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.V) throw new K(`Cannot pass "${Qa(b)}" as a ${this.name}`);
    if (!b.V.X)
      throw new K(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return Pa(b.V.X, b.V.Y.W, this.W);
  }
  function Sa(a, b) {
    if (b === null) {
      if (this.qa) throw new K(`null is not a valid ${this.name}`);
      if (this.pa) {
        var c = this.Ca();
        a !== null && a.push(this.ha, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.V) throw new K(`Cannot pass "${Qa(b)}" as a ${this.name}`);
    if (!b.V.X)
      throw new K(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.oa && b.V.Y.oa)
      throw new K(
        `Cannot convert argument of type ${b.V.da ? b.V.da.name : b.V.Y.name} to parameter type ${this.name}`,
      );
    c = Pa(b.V.X, b.V.Y.W, this.W);
    if (this.pa) {
      if (void 0 === b.V.$)
        throw new K('Passing raw pointer to smart pointer is illegal');
      switch (this.Ea) {
        case 0:
          if (b.V.da === this) c = b.V.$;
          else
            throw new K(
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
              O(() => d['delete']()),
            );
            a !== null && a.push(this.ha, c);
          }
          break;
        default:
          throw new K('Unsupported sharing policy');
      }
    }
    return c;
  }
  function Ta(a, b) {
    if (b === null) {
      if (this.qa) throw new K(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.V) throw new K(`Cannot pass "${Qa(b)}" as a ${this.name}`);
    if (!b.V.X)
      throw new K(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.V.Y.oa)
      throw new K(
        `Cannot convert argument of type ${b.V.Y.name} to parameter type ${this.name}`,
      );
    return Pa(b.V.X, b.V.Y.W, this.W);
  }
  function R(a) {
    return this.aa(F[a >> 2]);
  }
  var Ua = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.ba) return null;
      a = Ua(a, b, c.ba);
      return a === null ? null : c.wa(a);
    },
    Va = {},
    Wa = (a, b) => {
      if (b === void 0) throw new K('ptr should not be undefined');
      for (; a.ba; ) ((b = a.na(b)), (a = a.ba));
      return Va[b];
    },
    S = class extends Error {
      constructor(a) {
        super(a);
        this.name = 'InternalError';
      }
    },
    Xa = (a, b) => {
      if (!b.Y || !b.X) throw new S('makeClassHandle requires ptr and ptrType');
      if (!!b.da !== !!b.$)
        throw new S('Both smartPtrType and smartPtr must be specified');
      b.count = { value: 1 };
      return M(Object.create(a, { V: { value: b, writable: !0 } }));
    };
  function Ya(a, b, c, d, e, g, f, h, k, n, l) {
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
      ? (this.ea = Sa)
      : ((this.ea = d ? Ra : Ta), (this.fa = null));
  }
  var Za = (a, b, c) => {
      if (!m.hasOwnProperty(a))
        throw new S('Replacing nonexistent public symbol');
      void 0 !== m[a].Z && void 0 !== c
        ? (m[a].Z[c] = b)
        : ((m[a] = b), (m[a].ka = c));
    },
    $a = [],
    T = (a, b) => {
      a = G(a);
      var c;
      (c = $a[b]) || ($a[b] = c = ab.get(b));
      if (typeof c != 'function')
        throw new K(`unknown function pointer with signature ${a}: ${b}`);
      return c;
    };
  class bb extends Error {}
  var db = (a) => {
      a = cb(a);
      var b = G(a);
      U(a);
      return b;
    },
    eb = (a, b) => {
      function c(g) {
        e[g] || I[g] || (J[g] ? J[g].forEach(c) : (d.push(g), (e[g] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new bb(`${a}: ` + d.map(db).join([', ']));
    },
    V = (a, b, c) => {
      function d(h) {
        h = c(h);
        if (h.length !== a.length)
          throw new S('Mismatched type converter count');
        for (var k = 0; k < a.length; ++k) L(a[k], h[k]);
      }
      a.forEach((h) => (J[h] = b));
      var e = Array(b.length),
        g = [],
        f = 0;
      for (let [h, k] of b.entries())
        I.hasOwnProperty(k)
          ? (e[h] = I[k])
          : (g.push(k),
            H.hasOwnProperty(k) || (H[k] = []),
            H[k].push(() => {
              e[h] = I[k];
              ++f;
              f === g.length && d(e);
            }));
      0 === g.length && d(e);
    },
    fb = (a, b) => {
      for (var c = [], d = 0; d < a; d++) c.push(F[(b + d * 4) >> 2]);
      return c;
    },
    gb = (a) => {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    };
  function hb(a) {
    for (var b = 1; b < a.length; ++b)
      if (a[b] !== null && a[b].fa === void 0) return !0;
    return !1;
  }
  function ib(a, b, c, d, e, g) {
    var f = b.length;
    if (f < 2)
      throw new K(
        "argTypes array size mismatch! Must at least get return value and 'this' types!",
      );
    var h = b[1] !== null && c !== null,
      k = hb(b);
    c = !b[0].ta;
    var n = b[0],
      l = b[1];
    d = [a, Ca, d, e, gb, n.aa.bind(n), l?.ea.bind(l)];
    for (e = 2; e < f; ++e) ((n = b[e]), d.push(n.ea.bind(n)));
    if (!k)
      for (e = h ? 1 : 2; e < b.length; ++e)
        b[e].fa !== null && d.push(b[e].fa);
    k = hb(b);
    e = b.length - 2;
    l = [];
    n = ['fn'];
    h && n.push('thisWired');
    for (f = 0; f < e; ++f) (l.push(`arg${f}`), n.push(`arg${f}Wired`));
    l = l.join(',');
    n = n.join(',');
    l = `return function (${l}) {\n`;
    k && (l += 'var destructors = [];\n');
    var t = k ? 'destructors' : 'null',
      x =
        'humanName throwBindingError invoker fn runDestructors fromRetWire toClassParamWire'.split(
          ' ',
        );
    h && (l += `var thisWired = toClassParamWire(${t}, this);\n`);
    for (f = 0; f < e; ++f) {
      var u = `toArg${f}Wire`;
      l += `var arg${f}Wired = ${u}(${t}, arg${f});\n`;
      x.push(u);
    }
    l += (c || g ? 'var rv = ' : '') + `invoker(${n});\n`;
    if (k) l += 'runDestructors(destructors);\n';
    else
      for (f = h ? 1 : 2; f < b.length; ++f)
        ((g = f === 1 ? 'thisWired' : 'arg' + (f - 2) + 'Wired'),
          b[f].fa !== null &&
            ((l += `${g}_dtor(${g});\n`), x.push(`${g}_dtor`)));
    c && (l += 'var ret = fromRetWire(rv);\nreturn ret;\n');
    b = new Function(x, l + '}\n')(...d);
    return Ja(a, b);
  }
  var jb = (a) => {
      a = a.trim();
      var b = a.indexOf('(');
      return b === -1 ? a : a.slice(0, b);
    },
    kb = [],
    W = [0, 1, , 1, null, 1, !0, 1, !1, 1],
    lb = [],
    nb = (a) => {
      if (a > 9 && 0 === --W[a + 1]) {
        var b = W[a];
        W[a] = void 0;
        var c = lb[a];
        c && ((lb[a] = void 0), c(b));
        kb.push(a);
      }
    },
    X = (a) => {
      if (!a) throw new K(`Cannot use deleted val. handle = ${a}`);
      return W[a];
    },
    O = (a) => {
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
    ob = {
      name: 'emscripten::val',
      aa: (a) => {
        var b = X(a);
        nb(a);
        return b;
      },
      ea: (a, b) => O(b),
      ga: R,
      fa: null,
    },
    pb = (a, b) => {
      switch (b) {
        case 4:
          return function (c) {
            return this.aa(pa[c >> 2]);
          };
        case 8:
          return function (c) {
            return this.aa(qa[c >> 3]);
          };
        default:
          throw new TypeError(`invalid float width (${b}): ${a}`);
      }
    },
    qb = (a, b, c) => {
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
    rb = Object.assign({ optional: !0 }, ob),
    Y = (a, b, c) => {
      var d = C;
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
    sb = (a) => {
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
    tb = globalThis.TextDecoder && new TextDecoder(),
    ub = (a, b, c, d) => {
      c = b + c;
      if (d) return c;
      for (; a[b] && !(b >= c); ) ++b;
      return b;
    },
    vb = (a, b = 0, c, d) => {
      c = ub(a, b, c, d);
      if (c - b > 16 && a.buffer && tb) return tb.decode(a.subarray(b, c));
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
    wb = globalThis.TextDecoder ? new TextDecoder('utf-16le') : void 0,
    xb = (a, b, c) => {
      a >>= 1;
      b = ub(D, a, b / 2, c);
      if (b - a > 16 && wb) return wb.decode(D.subarray(a, b));
      for (c = ''; a < b; ++a) c += String.fromCharCode(D[a]);
      return c;
    },
    yb = (a, b, c) => {
      c ??= 2147483647;
      if (c < 2) return 0;
      c -= 2;
      var d = b;
      c = c < a.length * 2 ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) ((B[b >> 1] = a.charCodeAt(e)), (b += 2));
      B[b >> 1] = 0;
      return b - d;
    },
    zb = (a) => a.length * 2,
    Ab = (a, b, c) => {
      var d = '';
      a >>= 2;
      for (var e = 0; !(e >= b / 4); e++) {
        var g = F[a + e];
        if (!g && !c) break;
        d += String.fromCodePoint(g);
      }
      return d;
    },
    Bb = (a, b, c) => {
      c ??= 2147483647;
      if (c < 4) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var g = a.codePointAt(e);
        g > 65535 && e++;
        E[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      E[b >> 2] = 0;
      return b - d;
    },
    Cb = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c)
        (a.codePointAt(c) > 65535 && c++, (b += 4));
      return b;
    },
    Db = [],
    Eb = (a) => {
      var b = Db.length;
      Db.push(a);
      return b;
    },
    Fb = (a, b) => {
      for (var c = Array(a), d = 0; d < a; ++d) {
        var e = d,
          g = F[(b + d * 4) >> 2],
          f = I[g];
        if (void 0 === f)
          throw (
            (a = `${`parameter ${d}`} has unknown type ${db(g)}`), new K(a)
          );
        c[e] = f;
      }
      return c;
    },
    Gb = (a, b, c) => {
      var d = [];
      a = a(d, c);
      d.length && (F[b >> 2] = O(d));
      return a;
    },
    Hb = {},
    Ib = (a) => {
      var b = Hb[a];
      return b === void 0 ? G(a) : b;
    },
    Z = {},
    Jb = (a) => {
      if (!ja)
        try {
          a();
        } catch (b) {
          b instanceof Ba || b == 'unwind' || da(1, b);
        } finally {
        }
    },
    Kb = {},
    Mb = () => {
      if (!Lb) {
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
        for (b in Kb) Kb[b] === void 0 ? delete a[b] : (a[b] = Kb[b]);
        var c = [];
        for (b in a) c.push(`${b}=${a[b]}`);
        Lb = c;
      }
      return Lb;
    },
    Lb,
    Nb = [null, [], []],
    Ob = () => {
      if (p) {
        var a = require('node:crypto');
        return (b) => a.randomFillSync(b);
      }
      return (b) => (crypto.getRandomValues(b), 0);
    },
    Pb = (a) => (Pb = Ob())(a);
  (() => {
    var a = N.prototype;
    Object.assign(a, {
      isAliasOf: function (c) {
        if (!(this instanceof N && c instanceof N)) return !1;
        var d = this.V.Y.W,
          e = this.V.X;
        c.V = c.V;
        var g = c.V.Y.W;
        for (c = c.V.X; d.ba; ) ((e = d.na(e)), (d = d.ba));
        for (; g.ba; ) ((c = g.na(c)), (g = g.ba));
        return d === g && e === c;
      },
      clone: function () {
        this.V.X || Fa(this);
        if (this.V.ma) return ((this.V.count.value += 1), this);
        var c = M,
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
        this.V.X || Fa(this);
        if (this.V.la && !this.V.ma)
          throw new K('Object already scheduled for deletion');
        Ha(this);
        var c = this.V;
        --c.count.value;
        0 === c.count.value && (c.$ ? c.da.ha(c.$) : c.Y.W.ha(c.X));
        this.V.ma || ((this.V.$ = void 0), (this.V.X = void 0));
      },
      isDeleted: function () {
        return !this.V.X;
      },
      deleteLater: function () {
        this.V.X || Fa(this);
        if (this.V.la && !this.V.ma)
          throw new K('Object already scheduled for deletion');
        Ia.push(this);
        this.V.la = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Ya.prototype, {
    ya(a) {
      this.ua && (a = this.ua(a));
      return a;
    },
    sa(a) {
      this.ha?.(a);
    },
    ga: R,
    aa: function (a) {
      function b() {
        return this.pa
          ? Xa(this.W.ja, { Y: this.Aa, X: c, da: this, $: a })
          : Xa(this.W.ja, { Y: this, X: a });
      }
      var c = this.ya(a);
      if (!c) return (this.sa(a), null);
      var d = Wa(this.W, c);
      if (void 0 !== d) {
        if (0 === d.V.count.value) return ((d.V.X = c), (d.V.$ = a), d.clone());
        d = d.clone();
        this.sa(a);
        return d;
      }
      d = this.W.xa(c);
      d = Ka[d];
      if (!d) return b.call(this);
      d = this.oa ? d.va : d.pointerType;
      var e = Ua(c, this.W, d.W);
      return e === null
        ? b.call(this)
        : this.pa
          ? Xa(d.W.ja, { Y: d, X: e, da: this, $: a })
          : Xa(d.W.ja, { Y: d, X: e });
    },
  });
  var cb,
    Qb,
    U,
    Rb,
    ua,
    y,
    ab,
    Sb = {
      G: () => ta(''),
      s: (a, b, c, d, e) => {
        b = G(b);
        d = d === 0n;
        var g = (f) => f;
        if (d) {
          let f = c * 8;
          g = (h) => BigInt.asUintN(f, h);
          e = g(e);
        }
        L(a, {
          name: b,
          aa: g,
          ea: (f, h) => {
            typeof h == 'number' && (h = BigInt(h));
            return h;
          },
          ga: Ea(b, c, !d),
          fa: null,
        });
      },
      J: (a, b, c, d) => {
        b = G(b);
        L(a, {
          name: b,
          aa: function (e) {
            return !!e;
          },
          ea: function (e, g) {
            return g ? c : d;
          },
          ga: function (e) {
            return this.aa(C[e]);
          },
          fa: null,
        });
      },
      m: (a, b, c, d, e, g, f, h, k, n, l, t, x) => {
        l = G(l);
        g = T(e, g);
        h &&= T(f, h);
        n &&= T(k, n);
        x = T(t, x);
        var u = Na(l);
        Ma(u, function () {
          eb(`Cannot construct ${l} due to unbound types`, [d]);
        });
        V([a, b, c], d ? [d] : [], (v) => {
          v = v[0];
          if (d) {
            var z = v.W;
            var P = z.ja;
          } else P = N.prototype;
          v = Ja(l, function (...za) {
            if (Object.getPrototypeOf(this) !== Aa)
              throw new K(`Use 'new' to construct ${l}`);
            if (void 0 === A.ia)
              throw new K(`${l} has no accessible constructor`);
            var mb = A.ia[za.length];
            if (void 0 === mb)
              throw new K(
                `Tried to invoke ctor of ${l} with invalid number of parameters (${za.length}) - expected (${Object.keys(A.ia).toString()}) parameters instead!`,
              );
            return mb.apply(this, za);
          });
          var Aa = Object.create(P, { constructor: { value: v } });
          v.prototype = Aa;
          var A = new Oa(l, v, Aa, x, z, g, h, n);
          if (A.ba) {
            var Q;
            (Q = A.ba).ra ?? (Q.ra = []);
            A.ba.ra.push(A);
          }
          z = new Ya(l, A, !0, !1, !1);
          Q = new Ya(l + '*', A, !1, !1, !1);
          P = new Ya(l + ' const*', A, !1, !0, !1);
          Ka[a] = { pointerType: Q, va: P };
          Za(u, v);
          return [z, Q, P];
        });
      },
      l: (a, b, c, d, e, g) => {
        var f = fb(b, c);
        e = T(d, e);
        V([], [a], (h) => {
          h = h[0];
          var k = `constructor ${h.name}`;
          void 0 === h.W.ia && (h.W.ia = []);
          if (void 0 !== h.W.ia[b - 1])
            throw new K(
              `Cannot register multiple constructors with identical number of parameters (${b - 1}) for class '${h.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          h.W.ia[b - 1] = () => {
            eb(`Cannot construct ${h.name} due to unbound types`, f);
          };
          V([], f, (n) => {
            n.splice(1, 0, null);
            h.W.ia[b - 1] = ib(k, n, null, e, g);
            return [];
          });
          return [];
        });
      },
      a: (a, b, c, d, e, g, f, h, k) => {
        var n = fb(c, d);
        b = G(b);
        b = jb(b);
        g = T(e, g);
        V([], [a], (l) => {
          function t() {
            eb(`Cannot call ${x} due to unbound types`, n);
          }
          l = l[0];
          var x = `${l.name}.${b}`;
          b.startsWith('@@') && (b = Symbol[b.substring(2)]);
          h && l.W.Ba.push(b);
          var u = l.W.ja,
            v = u[b];
          void 0 === v ||
          (void 0 === v.Z && v.className !== l.name && v.ka === c - 2)
            ? ((t.ka = c - 2), (t.className = l.name), (u[b] = t))
            : (La(u, b, x), (u[b].Z[c - 2] = t));
          V([], n, (z) => {
            z = ib(x, z, l, g, f, k);
            void 0 === u[b].Z
              ? ((z.ka = c - 2), (u[b] = z))
              : (u[b].Z[c - 2] = z);
            return [];
          });
          return [];
        });
      },
      H: (a) => L(a, ob),
      r: (a, b, c) => {
        b = G(b);
        L(a, {
          name: b,
          aa: (d) => d,
          ea: (d, e) => e,
          ga: pb(b, c),
          fa: null,
        });
      },
      h: (a, b, c, d, e, g, f) => {
        var h = fb(b, c);
        a = G(a);
        a = jb(a);
        e = T(d, e);
        Ma(
          a,
          function () {
            eb(`Cannot call ${a} due to unbound types`, h);
          },
          b - 1,
        );
        V([], h, (k) => {
          k = [k[0], null].concat(k.slice(1));
          Za(a, ib(a, k, null, e, g, f), b - 1);
          return [];
        });
      },
      g: (a, b, c, d, e) => {
        b = G(b);
        var g = (h) => h;
        if (d === 0) {
          var f = 32 - 8 * c;
          g = (h) => (h << f) >>> f;
          e = g(e);
        }
        L(a, {
          name: b,
          aa: g,
          ea: (h, k) => k,
          ga: Ea(b, c, d !== 0),
          fa: null,
        });
      },
      u: (a, b, c, d) => {
        c = G(c);
        d = G(d);
        V([], [a, b], (e) => {
          qb(e[0].W.ja, c, d);
          return [];
        });
      },
      b: (a, b, c) => {
        function d(g) {
          return new e(oa.buffer, F[(g + 4) >> 2], F[g >> 2]);
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
        c = G(c);
        L(a, { name: c, aa: d, ga: d }, { za: !0 });
      },
      M: (a) => {
        L(a, rb);
      },
      I: (a, b) => {
        b = G(b);
        L(a, {
          name: b,
          aa(c) {
            var d = (d = c + 4) ? vb(C, d, F[c >> 2], !0) : '';
            U(c);
            return d;
          },
          ea(c, d) {
            d instanceof ArrayBuffer && (d = new Uint8Array(d));
            var e = typeof d == 'string';
            if (!(e || (ArrayBuffer.isView(d) && d.BYTES_PER_ELEMENT == 1)))
              throw new K('Cannot pass non-string to std::string');
            var g = e ? sb(d) : d.length;
            var f = Qb(4 + g + 1),
              h = f + 4;
            F[f >> 2] = g;
            e ? Y(d, h, g + 1) : C.set(d, h);
            c !== null && c.push(U, f);
            return f;
          },
          ga: R,
          fa(c) {
            U(c);
          },
        });
      },
      o: (a, b, c) => {
        c = G(c);
        if (b === 2) {
          var d = xb;
          var e = yb;
          var g = zb;
        } else ((d = Ab), (e = Bb), (g = Cb));
        L(a, {
          name: c,
          aa: (f) => {
            var h = d(f + 4, F[f >> 2] * b, !0);
            U(f);
            return h;
          },
          ea: (f, h) => {
            if (typeof h != 'string')
              throw new K(`Cannot pass non-string to C++ string type ${c}`);
            var k = g(h),
              n = Qb(4 + k + b);
            F[n >> 2] = k / b;
            e(h, n + 4, k + b);
            f !== null && f.push(U, n);
            return n;
          },
          ga: R,
          fa(f) {
            U(f);
          },
        });
      },
      K: (a, b) => {
        b = G(b);
        L(a, { ta: !0, name: b, aa: () => {}, ea: () => {} });
      },
      B: () => {},
      f: (a, b, c) => {
        var d;
        [b, ...d] = Fb(a, b);
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
            ((f.getStringOrSymbol = Ib),
              (h = 'toValue(handle)[getStringOrSymbol(methodName)]'));
        }
        h += `(${a})`;
        b.ta ||
          ((f.toReturnWire = e),
          (f.emval_returnValue = Gb),
          (h = `return emval_returnValue(toReturnWire, destructorsRef, ${h})`));
        h = `return function (handle, methodName, destructorsRef, args) {\n${h}\n}`;
        c = new Function(Object.keys(f), h)(...Object.values(f));
        b = `methodCaller<(${d.map((k) => k.name)}) => ${b.name}>`;
        return Eb(Ja(b, c));
      },
      c: nb,
      t: (a) => {
        if (!a) return O(globalThis);
        a = Ib(a);
        return O(globalThis[a]);
      },
      L: (a) => {
        a > 9 && (W[a + 1] += 1);
      },
      e: (a, b, c, d, e) => Db[a](b, c, d, e),
      k: () => O([]),
      i: (a) => O(Ib(a)),
      p: () => O({}),
      d: (a) => {
        var b = X(a);
        gb(b);
        nb(a);
      },
      j: (a, b, c) => {
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
          Jb(() => Rb(a, performance.now()));
        }, b);
        Z[a] = { id: c, Fa: b };
        return 0;
      },
      x: (a, b, c, d) => {
        var e = new Date().getFullYear(),
          g = new Date(e, 0, 1).getTimezoneOffset();
        e = new Date(e, 6, 1).getTimezoneOffset();
        F[a >> 2] = Math.max(g, e) * 60;
        E[b >> 2] = Number(g != e);
        b = (f) => {
          var h = Math.abs(f);
          return `UTC${f >= 0 ? '-' : '+'}${String(Math.floor(h / 60)).padStart(2, '0')}${String(
            h % 60,
          ).padStart(2, '0')}`;
        };
        a = b(g);
        b = b(e);
        e < g ? (Y(a, c, 17), Y(b, d, 17)) : (Y(a, d, 17), Y(b, c, 17));
      },
      y: function (a, b, c) {
        if (!(a >= 0 && a <= 3)) return 28;
        ra[c >> 3] = BigInt(
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e3 * 1e3),
        );
        return 0;
      },
      n: () => performance.now(),
      z: (a) => {
        var b = C.length;
        a >>>= 0;
        if (a > 268435456) return !1;
        for (var c = 1; c <= 4; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          a: {
            d =
              ((Math.min(268435456, Math.ceil(Math.max(a, d) / 65536) * 65536) -
                y.buffer.byteLength +
                65535) /
                65536) |
              0;
            try {
              y.grow(d);
              na();
              var e = 1;
              break a;
            } catch (g) {}
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
        for (e of Mb()) {
          var g = b + c;
          F[(a + d) >> 2] = g;
          c += Y(e, g, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      E: (a, b) => {
        var c = Mb();
        F[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += sb(d) + 1;
        F[b >> 2] = a;
        return 0;
      },
      F: () => 52,
      C: function () {
        return 70;
      },
      q: (a, b, c, d) => {
        for (var e = 0, g = 0; g < c; g++) {
          var f = F[b >> 2],
            h = F[(b + 4) >> 2];
          b += 8;
          for (var k = 0; k < h; k++) {
            var n = a,
              l = C[f + k],
              t = Nb[n];
            l === 0 || l === 10
              ? ((n === 1 ? ia : w)(vb(t)), (t.length = 0))
              : t.push(l);
          }
          e += h;
        }
        F[d >> 2] = e;
        return 0;
      },
      A: (a) => {
        da(a, new Ba(a));
      },
      w: (a, b) => Pb(C.subarray(a, a + b)),
    },
    Tb;
  Tb = await (async function () {
    var a = { a: Sb };
    va ??= m.locateFile
      ? m.locateFile
        ? m.locateFile('wpilibc_wasm.wasm', q)
        : q + 'wpilibc_wasm.wasm'
      : new URL('wpilibc_wasm.wasm', import.meta.url).href;
    a = Tb = (await ya(a)).instance.exports;
    cb = a.P;
    Qb = m._malloc = a.Q;
    U = m._free = a.R;
    Rb = a.T;
    ua = a.U;
    y = a.N;
    ab = a.S;
    na();
    return Tb;
  })();
  m.calledRun = !0;
  ja || ((ma = !0), Tb.O(), ka?.(m));
  ma
    ? (moduleRtn = m)
    : (moduleRtn = new Promise((a, b) => {
        ka = a;
        la = b;
      }));
  return moduleRtn;
}
export default createWpilibcModule;
