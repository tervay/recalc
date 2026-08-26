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
  var A,
    D,
    H = (a) => {
      for (var b = ''; ;) {
        var c = D[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
      }
    },
    I = {},
    J = {},
    K = {};
  class L extends Error {
    constructor(a) {
      super(a);
      this.name = 'BindingError';
    }
  }
  var Aa = (a) => {
    throw new L(a);
  };
  function Ba(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new L(`type "${d}" must have a positive integer typeid pointer`);
    if (J.hasOwnProperty(a)) {
      if (c.xa) return;
      throw new L(`Cannot register type '${d}' twice`);
    }
    J[a] = b;
    delete K[a];
    I.hasOwnProperty(a) && ((b = I[a]), delete I[a], b.forEach((e) => e()));
  }
  function M(a, b, c = {}) {
    return Ba(a, b, c);
  }
  var C,
    E,
    F,
    G,
    pa,
    qa,
    Ca = (a, b, c) => {
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
      throw new L(a.T.W.U.name + ' instance already deleted');
    },
    Ea = !1,
    Fa = () => {},
    N = (a) => {
      if (!globalThis.FinalizationRegistry) return ((N = (b) => b), a);
      Ea = new FinalizationRegistry((b) => {
        b = b.T;
        --b.count.value;
        0 === b.count.value && (b.Y ? b.aa.fa(b.Y) : b.W.U.fa(b.V));
      });
      N = (b) => {
        var c = b.T;
        c.Y && Ea.register(b, { T: c }, b);
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
      if (void 0 === a[b].X) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].X.hasOwnProperty(e.length))
            throw new L(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].X})!`,
            );
          return a[b].X[e.length].apply(this, e);
        };
        a[b].X = [];
        a[b].X[d.ia] = d;
      }
    },
    Ka = (a, b, c) => {
      if (Module.hasOwnProperty(a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].X && void 0 !== Module[a].X[c])
        )
          throw new L(`Cannot register public name '${a}' twice`);
        Ja(Module, a, a);
        if (Module[a].X.hasOwnProperty(c))
          throw new L(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].X[c] = b;
      } else ((Module[a] = b), (Module[a].ia = c));
    },
    La = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    };
  function Ma(a, b, c, d, e, g, f, h) {
    this.name = a;
    this.constructor = b;
    this.ha = c;
    this.fa = d;
    this.$ = e;
    this.va = g;
    this.la = f;
    this.ua = h;
    this.za = [];
  }
  var Na = (a, b, c) => {
      for (; b !== c;) {
        if (!b.la)
          throw new L(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.la(a);
        b = b.$;
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
      if (this.oa) throw new L(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.T) throw new L(`Cannot pass "${Oa(b)}" as a ${this.name}`);
    if (!b.T.V)
      throw new L(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return Na(b.T.V, b.T.W.U, this.U);
  }
  function Qa(a, b) {
    if (b === null) {
      if (this.oa) throw new L(`null is not a valid ${this.name}`);
      if (this.na) {
        var c = this.Aa();
        a !== null && a.push(this.fa, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.T) throw new L(`Cannot pass "${Oa(b)}" as a ${this.name}`);
    if (!b.T.V)
      throw new L(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.ma && b.T.W.ma)
      throw new L(
        `Cannot convert argument of type ${b.T.aa ? b.T.aa.name : b.T.W.name} to parameter type ${this.name}`,
      );
    c = Na(b.T.V, b.T.W.U, this.U);
    if (this.na) {
      if (void 0 === b.T.Y)
        throw new L('Passing raw pointer to smart pointer is illegal');
      switch (this.Ca) {
        case 0:
          if (b.T.aa === this) c = b.T.Y;
          else
            throw new L(
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
          throw new L('Unsupported sharing policy');
      }
    }
    return c;
  }
  function Ra(a, b) {
    if (b === null) {
      if (this.oa) throw new L(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.T) throw new L(`Cannot pass "${Oa(b)}" as a ${this.name}`);
    if (!b.T.V)
      throw new L(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.T.W.ma)
      throw new L(
        `Cannot convert argument of type ${b.T.W.name} to parameter type ${this.name}`,
      );
    return Na(b.T.V, b.T.W.U, this.U);
  }
  function S(a) {
    return this.Z(G[a >> 2]);
  }
  var Sa = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.$) return null;
      a = Sa(a, b, c.$);
      return a === null ? null : c.ua(a);
    },
    Ta = {},
    Ua = (a, b) => {
      if (b === void 0) throw new L('ptr should not be undefined');
      for (; a.$;) ((b = a.la(b)), (a = a.$));
      return Ta[b];
    };
  class Va extends Error {
    constructor(a) {
      super(a);
      this.name = 'InternalError';
    }
  }
  var Wa = (a, b) => {
    if (!b.W || !b.V) throw new Va('makeClassHandle requires ptr and ptrType');
    if (!!b.aa !== !!b.Y)
      throw new Va('Both smartPtrType and smartPtr must be specified');
    b.count = { value: 1 };
    return N(Object.create(a, { T: { value: b, writable: !0 } }));
  };
  function Xa(a, b, c, d, e, g, f, h, k, n, l) {
    this.name = a;
    this.U = b;
    this.oa = c;
    this.ma = d;
    this.na = e;
    this.ya = g;
    this.Ca = f;
    this.sa = h;
    this.Aa = k;
    this.Ba = n;
    this.fa = l;
    e || b.$ !== void 0
      ? (this.ba = Qa)
      : ((this.ba = d ? Pa : Ra), (this.da = null));
  }
  var Ya = (a, b, c) => {
      if (!Module.hasOwnProperty(a))
        throw new Va('Replacing nonexistent public symbol');
      void 0 !== Module[a].X && void 0 !== c
        ? (Module[a].X[c] = b)
        : ((Module[a] = b), (Module[a].ia = c));
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
      for (; a.length;) {
        var b = a.pop();
        a.pop()(b);
      }
    };
  function gb(a) {
    for (var b = 1; b < a.length; ++b)
      if (a[b] !== null && a[b].da === void 0) return !0;
    return !1;
  }
  function hb(a, b, c, d, e, g) {
    var f = b.length;
    if (f < 2)
      throw new L(
        'argTypes array size mismatch! Must at least get return value and receiver (this) types!',
      );
    var h = b[1] !== null && c !== null,
      k = gb(b);
    c = !b[0].ra;
    var n = b[0],
      l = b[1];
    d = [a, Aa, d, e, fb, n.Z.bind(n), l?.ba.bind(l)];
    for (e = 2; e < f; ++e) ((n = b[e]), d.push(n.ba.bind(n)));
    if (!k)
      for (e = h ? 1 : 2; e < b.length; ++e)
        b[e].da !== null && d.push(b[e].da);
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
        ((g = f === 1 ? 'thisWired' : `arg${f - 2}Wired`),
          b[f].da !== null &&
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
      Z: (a) => {
        var b = X(a);
        mb(a);
        return b;
      },
      ba: (a, b) => R(b),
      ea: S,
      da: null,
    },
    na,
    oa,
    ob = (a, b) => {
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
      for (; a[b] && !(b >= c);) ++b;
      return b;
    },
    ub = (a, b = 0, c, d) => {
      c = tb(a, b, c, d);
      if (c - b > 16 && a.buffer && sb) return sb.decode(a.subarray(b, c));
      for (d = ''; b < c;) {
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
        var d = this.T.W.U,
          e = this.T.V;
        c.T = c.T;
        var g = c.T.W.U;
        for (c = c.T.V; d.$;) ((e = d.la(e)), (d = d.$));
        for (; g.$;) ((c = g.la(c)), (g = g.$));
        return d === g && e === c;
      },
      clone: function () {
        this.T.V || Da(this);
        if (this.T.ka) return ((this.T.count.value += 1), this);
        var c = N,
          d = Object,
          e = d.create,
          g = Object.getPrototypeOf(this),
          f = this.T;
        c = c(
          e.call(d, g, {
            T: {
              value: {
                count: f.count,
                ja: f.ja,
                ka: f.ka,
                V: f.V,
                W: f.W,
                Y: f.Y,
                aa: f.aa,
              },
            },
          }),
        );
        c.T.count.value += 1;
        c.T.ja = !1;
        return c;
      },
      ['delete']() {
        this.T.V || Da(this);
        if (this.T.ja && !this.T.ka)
          throw new L('Object already scheduled for deletion');
        Fa(this);
        var c = this.T;
        --c.count.value;
        0 === c.count.value && (c.Y ? c.aa.fa(c.Y) : c.W.U.fa(c.V));
        this.T.ka || ((this.T.Y = void 0), (this.T.V = void 0));
      },
      isDeleted: function () {
        return !this.T.V;
      },
      deleteLater: function () {
        this.T.V || Da(this);
        if (this.T.ja && !this.T.ka)
          throw new L('Object already scheduled for deletion');
        Ga.push(this);
        this.T.ja = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Xa.prototype, {
    wa(a) {
      this.sa && (a = this.sa(a));
      return a;
    },
    qa(a) {
      this.fa?.(a);
    },
    ea: S,
    Z: function (a) {
      function b() {
        return this.na
          ? Wa(this.U.ha, { W: this.ya, V: c, aa: this, Y: a })
          : Wa(this.U.ha, { W: this, V: a });
      }
      var c = this.wa(a);
      if (!c) return (this.qa(a), null);
      var d = Ua(this.U, c);
      if (void 0 !== d) {
        if (0 === d.T.count.value) return ((d.T.V = c), (d.T.Y = a), d.clone());
        d = d.clone();
        this.qa(a);
        return d;
      }
      d = this.U.va(c);
      d = Ia[d];
      if (!d) return b.call(this);
      d = this.ma ? d.ta : d.pointerType;
      var e = Sa(c, this.U, d.U);
      return e === null
        ? b.call(this)
        : this.na
          ? Wa(d.U.ha, { W: d, V: e, aa: this, Y: a })
          : Wa(d.U.ha, { W: d, V: e });
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
      D: () => ra(''),
      r: (a, b, c, d, e) => {
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
          Z: g,
          ba: (f, h) => {
            typeof h == 'number' && (h = BigInt(h));
            return h;
          },
          ea: Ca(b, c, !d),
          da: null,
        });
      },
      G: (a, b, c, d) => {
        b = H(b);
        M(a, {
          name: b,
          Z: function (e) {
            return !!e;
          },
          ba: function (e, g) {
            return g ? c : d;
          },
          ea: function (e) {
            return this.Z(D[e]);
          },
          da: null,
        });
      },
      p: (a, b, c, d, e, g, f, h, k, n, l, r, w) => {
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
            var y = u.U;
            var O = y.ha;
          } else O = Q.prototype;
          u = Ha(l, function (...ya) {
            if (Object.getPrototypeOf(this) !== za)
              throw new L(`Use 'new' to construct ${l}`);
            if (void 0 === z.ga)
              throw new L(`${l} has no accessible constructor`);
            var lb = z.ga[ya.length];
            if (void 0 === lb)
              throw new L(
                `Tried to invoke ctor of ${l} with invalid number of parameters (${ya.length}) - expected (${Object.keys(z.ga).toString()}) parameters instead!`,
              );
            return lb.apply(this, ya);
          });
          var za = Object.create(O, { constructor: { value: u } });
          u.prototype = za;
          var z = new Ma(l, u, za, w, y, g, h, n);
          if (z.$) {
            var P;
            (P = z.$).pa ?? (P.pa = []);
            z.$.pa.push(z);
          }
          y = new Xa(l, z, !0, !1, !1);
          P = new Xa(l + '*', z, !1, !1, !1);
          O = new Xa(l + ' const*', z, !1, !0, !1);
          Ia[a] = { pointerType: P, ta: O };
          Ya(t, u);
          return [y, P, O];
        });
      },
      n: (a, b, c, d, e, g) => {
        var f = eb(b, c);
        e = T(d, e);
        V([], [a], (h) => {
          h = h[0];
          var k = `constructor ${h.name}`;
          void 0 === h.U.ga && (h.U.ga = []);
          if (void 0 !== h.U.ga[b - 1])
            throw new L(
              `Cannot register multiple constructors with identical number of parameters (${
                b - 1
              }) for class '${h.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          h.U.ga[b - 1] = () => {
            db(`Cannot construct ${h.name} due to unbound types`, f);
          };
          V([], f, (n) => {
            n.splice(1, 0, null);
            h.U.ga[b - 1] = hb(k, n, null, e, g);
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
          h && l.U.za.push(b);
          var t = l.U.ha,
            u = t[b];
          void 0 === u ||
          (void 0 === u.X && u.className !== l.name && u.ia === c - 2)
            ? ((r.ia = c - 2), (r.className = l.name), (t[b] = r))
            : (Ja(t, b, w), (t[b].X[c - 2] = r));
          V([], n, (y) => {
            y = hb(w, y, l, g, f, k);
            void 0 === t[b].X
              ? ((y.ia = c - 2), (t[b] = y))
              : (t[b].X[c - 2] = y);
            return [];
          });
          return [];
        });
      },
      E: (a) => M(a, nb),
      q: (a, b, c) => {
        b = H(b);
        M(a, { name: b, Z: (d) => d, ba: (d, e) => e, ea: ob(b, c), da: null });
      },
      f: (a, b, c, d, e, g, f) => {
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
      m: (a, b, c, d, e) => {
        b = H(b);
        var g = (h) => h;
        if (d === 0) {
          var f = 32 - 8 * c;
          g = (h) => (h << f) >>> f;
          e = g(e);
        }
        M(a, {
          name: b,
          Z: g,
          ba: (h, k) => k,
          ea: Ca(b, c, d !== 0),
          da: null,
        });
      },
      s: (a, b, c, d) => {
        c = H(c);
        d = H(d);
        V([], [a, b], (e) => {
          pb(e[0].U.ha, c, d);
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
        M(a, { name: c, Z: d, ea: d }, { xa: !0 });
      },
      K: (a) => {
        M(a, qb);
      },
      F: (a, b) => {
        b = H(b);
        M(a, {
          name: b,
          Z(c) {
            var d = (d = c + 4) ? ub(D, d, G[c >> 2], !0) : '';
            U(c);
            return d;
          },
          ba(c, d) {
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
          ea: S,
          da(c) {
            U(c);
          },
        });
      },
      o: (a, b, c) => {
        c = H(c);
        if (b === 2) {
          var d = wb;
          var e = xb;
          var g = yb;
        } else ((d = zb), (e = Ab), (g = Bb));
        M(a, {
          name: c,
          Z: (f) => {
            var h = d(f + 4, G[f >> 2] * b, !0);
            U(f);
            return h;
          },
          ba: (f, h) => {
            if (typeof h != 'string')
              throw new L(`Cannot pass non-string to C++ string type ${c}`);
            var k = g(h),
              n = Pb(4 + k + b);
            G[n >> 2] = k / b;
            e(h, n + 4, k + b);
            f !== null && f.push(U, n);
            return n;
          },
          ea: S,
          da(f) {
            U(f);
          },
        });
      },
      H: (a, b) => {
        b = H(b);
        M(a, { ra: !0, name: b, Z: () => {}, ba: () => {} });
      },
      A: () => {},
      i: (a, b, c) => {
        var d;
        [b, ...d] = Eb(a, b);
        var e = b.ba.bind(b),
          g = d.map((k) => k.ea.bind(k));
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
        b.ra ||
          ((f.toReturnWire = e),
          (f.emval_returnValue = Fb),
          (h = `return emval_returnValue(toReturnWire, destructorsRef, ${h})`));
        h = `return function (handle, methodName, destructorsRef, args) {\n${h}\n}`;
        c = new Function(Object.keys(f), h)(...Object.values(f));
        b = `methodCaller<(${d.map((k) => k.name)}) => ${b.name}>`;
        return Db(Ha(b, c));
      },
      b: mb,
      I: (a) => {
        if (!a) return R(globalThis);
        a = Hb(a);
        return R(globalThis[a]);
      },
      J: (a) => {
        a > 9 && (W[a + 1] += 1);
      },
      h: (a, b, c, d, e) => Cb[a](b, c, d, e),
      e: () => R([]),
      k: (a) => R(Hb(a)),
      d: () => R({}),
      g: (a) => {
        var b = X(a);
        fb(b);
        mb(a);
      },
      l: (a, b, c) => {
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
          Ib(() => Qb(a, performance.now()));
        }, b);
        Z[a] = { id: c, Da: b };
        return 0;
      },
      v: (a, b, c, d) => {
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
      w: function (a, b, c) {
        if (!(a >= 0 && a <= 3)) return 28;
        pa[c >> 3] = BigInt(
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e3 * 1e3),
        );
        return 0;
      },
      j: () => performance.now(),
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
            } catch (g) {}
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
        for (e of Lb()) {
          var g = b + c;
          G[(a + d) >> 2] = g;
          c += Y(e, g, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      C: (a, b) => {
        var c = Lb();
        G[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += rb(d) + 1;
        G[b >> 2] = a;
        return 0;
      },
      y: (a, b, c, d) => {
        for (var e = 0, g = 0; g < c; g++) {
          var f = G[b >> 2],
            h = G[(b + 4) >> 2];
          b += 8;
          for (var k = 0; k < h; k++) {
            var n = a,
              l = D[f + k],
              r = Mb[n];
            l && l !== 10
              ? r.push(l)
              : ((n === 1 ? ja : x)(ub(r)), (r.length = 0));
          }
          e += h;
        }
        G[d >> 2] = e;
        return 0;
      },
      z: (a) => {
        da(a, new xa(a));
      },
      u: (a, b) => Ob(D.subarray(a, a + b)),
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
    bb = a.N;
    Pb = Module._malloc = a.O;
    U = Module._free = a.P;
    Qb = a.R;
    sa = a.S;
    B = a.L;
    $a = a.Q;
    ma();
    return Sb;
  })();
  await (async function () {
    ka || ((la = !0), Sb.M());
  })();
  return Module;
}
export default createWpilibcModule;
