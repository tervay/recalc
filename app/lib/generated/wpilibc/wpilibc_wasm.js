async function createWpilibcModule(moduleArg = {}) {
  var Module = moduleArg;
  var fa = !!globalThis.window,
    ha = !!globalThis.WorkerGlobalScope,
    ia =
      globalThis.process?.versions?.node &&
      globalThis.process?.type != 'renderer';
  if (ia) {
    let { createRequire: a } = await import('node:module');
    var ja = a(import.meta.url);
  }
  var ka = './this.program',
    la = (a, b) => {
      throw b;
    },
    na = import.meta.url,
    oa = '',
    pa,
    qa;
  if (ia) {
    var ra = ja('node:fs');
    na.startsWith('file:') &&
      (oa = ja('node:path').dirname(ja('node:url').fileURLToPath(na)) + '/');
    qa = (a) => {
      a = sa(a) ? new URL(a) : a;
      return ra.readFileSync(a);
    };
    pa = async (a) => {
      a = sa(a) ? new URL(a) : a;
      return ra.readFileSync(a, void 0);
    };
    process.argv.length > 1 && (ka = process.argv[1].replace(/\\/g, '/'));
    process.argv.slice(2);
    la = (a, b) => {
      process.exitCode = a;
      throw b;
    };
  } else if (fa || ha) {
    try {
      oa = new URL('.', na).href;
    } catch {}
    ha &&
      (qa = (a) => {
        var b = new XMLHttpRequest();
        b.open('GET', a, !1);
        b.responseType = 'arraybuffer';
        b.send(null);
        return new Uint8Array(b.response);
      });
    pa = async (a) => {
      a = await fetch(a, { credentials: 'same-origin' });
      if (a.ok) return a.arrayBuffer();
      throw Error(a.status + ' : ' + a.url);
    };
  }
  var ta = console.log.bind(console),
    ua = console.error.bind(console),
    va = !1,
    sa = (a) => a.startsWith('file://'),
    wa = !1;
  function xa() {
    if (!ya?.buffer?.resizable) {
      var a = za.buffer;
      ya = new Int8Array(a);
      Aa = new Int16Array(a);
      p = new Uint8Array(a);
      Ba = new Uint16Array(a);
      Ca = new Int32Array(a);
      B = new Uint32Array(a);
      Da = new Float32Array(a);
      Ea = new Float64Array(a);
      Fa = new BigInt64Array(a);
      Ga = new BigUint64Array(a);
    }
  }
  function Ha(a) {
    a = `Aborted(${a})`;
    ua(a);
    va = !0;
    a += '. Build with -sASSERTIONS for more info.';
    wa && Ia();
    throw new WebAssembly.RuntimeError(a);
  }
  var Ja;
  async function Ka(a) {
    try {
      return await pa(a);
    } catch {}
    if (qa) a = qa(a);
    else throw 'both async and sync fetching of the wasm failed';
    return a;
  }
  async function La(a, b) {
    try {
      var c = await Ka(a);
      return await WebAssembly.instantiate(c, b);
    } catch (d) {
      (ua(`failed to asynchronously prepare wasm: ${d}`), Ha(d));
    }
  }
  async function Ma(a) {
    var b = Ja;
    if (!ia)
      try {
        var c = fetch(b, { credentials: 'same-origin' });
        return await WebAssembly.instantiateStreaming(c, a);
      } catch (d) {
        (ua(`wasm streaming compile failed: ${d}`),
          ua('falling back to ArrayBuffer instantiation'));
      }
    return La(b, a);
  }
  class Na {
    name = 'ExitStatus';
    constructor(a) {
      this.message = `Program terminated with exit(${a})`;
      this.status = a;
    }
  }
  var ya,
    p,
    E = (a) => {
      for (var b = ''; ;) {
        var c = p[a++];
        if (!c) return b;
        b += String.fromCharCode(c);
      }
    },
    Aa,
    Ca,
    Fa,
    Ba,
    B,
    Ga,
    Oa = (a, b, c) => {
      switch (b) {
        case 1:
          return c ? (d) => ya[d] : (d) => p[d];
        case 2:
          return c ? (d) => Aa[d >> 1] : (d) => Ba[d >> 1];
        case 4:
          return c ? (d) => Ca[d >> 2] : (d) => B[d >> 2];
        case 8:
          return c ? (d) => Fa[d >> 3] : (d) => Ga[d >> 3];
        default:
          throw new TypeError(`invalid integer width (${b}): ${a}`);
      }
    },
    bb = {},
    J = {};
  class K extends Error {
    constructor(a) {
      super(a);
      this.name = 'BindingError';
    }
  }
  var cb = (a) => {
      throw new K(a);
    },
    db = {};
  function eb(a, b, c = {}) {
    var d = b.name;
    if (!a)
      throw new K(`type "${d}" must have a positive integer typeid pointer`);
    if (J[a]) {
      if (c.za) return;
      throw new K(`Cannot register type '${d}' twice`);
    }
    J[a] = b;
    delete db[a];
    bb[a] && ((b = bb[a]), delete bb[a], b.forEach((e) => e()));
  }
  function P(a, b, c = {}) {
    return eb(a, b, c);
  }
  var fb = !1,
    gb = () => {},
    hb = (a) => {
      if (!globalThis.FinalizationRegistry) return ((hb = (b) => b), a);
      fb = new FinalizationRegistry((b) => {
        b = b.W;
        --b.count.value;
        0 === b.count.value && (b.aa ? b.ea.ha(b.aa) : b.Z.X.ha(b.Y));
      });
      hb = (b) => {
        var c = b.W;
        c.aa && fb.register(b, { W: c }, b);
        return b;
      };
      gb = (b) => {
        fb.unregister(b);
      };
      return hb(a);
    },
    ib = [],
    jb = (a) => {
      throw new K(a.W.Z.X.name + ' instance already deleted');
    };
  function kb() {}
  function lb(a, b, c, d, e, f, h, g) {
    this.name = a;
    this.constructor = b;
    this.ja = c;
    this.ha = d;
    this.da = e;
    this.xa = f;
    this.na = h;
    this.wa = g;
    this.Ba = [];
  }
  var mb = (a) => {
      if (a === null) return 'null';
      var b = typeof a;
      return b === 'object' || b === 'array' || b === 'function'
        ? a.toString()
        : '' + a;
    },
    nb = (a, b, c) => {
      for (; b !== c;) {
        if (!b.na)
          throw new K(
            `Expected null or instance of ${c.name}, got an instance of ${b.name}`,
          );
        a = b.na(a);
        b = b.da;
      }
      return a;
    };
  function ob(a, b) {
    if (b === null) {
      if (this.qa) throw new K(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.W) throw new K(`Cannot pass "${mb(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new K(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    return nb(b.W.Y, b.W.Z.X, this.X);
  }
  var pb = [],
    W = [0, 1, , 1, null, 1, !0, 1, !1, 1],
    qb = (a) => {
      if (!a) throw new K(`Cannot use deleted val. handle = ${a}`);
      return W[a];
    },
    X = (a) => {
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
          let b = pb.pop() || W.length;
          W[b] = a;
          W[b + 1] = 1;
          return b;
      }
    };
  function rb(a, b) {
    if (b === null) {
      if (this.qa) throw new K(`null is not a valid ${this.name}`);
      if (this.pa) {
        var c = this.Ca();
        a !== null && a.push(this.ha, c);
        return c;
      }
      return 0;
    }
    if (!b || !b.W) throw new K(`Cannot pass "${mb(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new K(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (!this.oa && b.W.Z.oa)
      throw new K(
        `Cannot convert argument of type ${b.W.ea ? b.W.ea.name : b.W.Z.name} to parameter type ${this.name}`,
      );
    c = nb(b.W.Y, b.W.Z.X, this.X);
    if (this.pa) {
      if (void 0 === b.W.aa)
        throw new K('Passing raw pointer to smart pointer is illegal');
      switch (this.Ea) {
        case 0:
          if (b.W.ea === this) c = b.W.aa;
          else
            throw new K(
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
            c = this.Da(
              c,
              X(() => d['delete']()),
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
  var sb = (a, b, c) => {
      if (b === c) return a;
      if (void 0 === c.da) return null;
      a = sb(a, b, c.da);
      return a === null ? null : c.wa(a);
    },
    tb = new Map(),
    ub = (a, b) => {
      if (b === void 0) throw new K('ptr should not be undefined');
      for (; a.da;) ((b = a.na(b)), (a = a.da));
      return tb.get(b);
    };
  class vb extends Error {
    constructor(a) {
      super(a);
      this.name = 'InternalError';
    }
  }
  var wb = (a, b) => {
      if (!b.Z || !b.Y)
        throw new vb('makeClassHandle requires ptr and ptrType');
      if (!!b.ea !== !!b.aa)
        throw new vb('Both smartPtrType and smartPtr must be specified');
      b.count = { value: 1 };
      return hb(Object.create(a, { W: { value: b, writable: !0 } }));
    },
    xb = {};
  function yb(a) {
    return this.ba(B[a >> 2]);
  }
  function zb(a, b) {
    if (b === null) {
      if (this.qa) throw new K(`null is not a valid ${this.name}`);
      return 0;
    }
    if (!b.W) throw new K(`Cannot pass "${mb(b)}" as a ${this.name}`);
    if (!b.W.Y)
      throw new K(
        `Cannot pass deleted object as a pointer of type ${this.name}`,
      );
    if (b.W.Z.oa)
      throw new K(
        `Cannot convert argument of type ${b.W.Z.name} to parameter type ${this.name}`,
      );
    return nb(b.W.Y, b.W.Z.X, this.X);
  }
  function Ab(a, b, c, d, e, f, h, g, k, m, l) {
    this.name = a;
    this.X = b;
    this.qa = c;
    this.oa = d;
    this.pa = e;
    this.Aa = f;
    this.Ea = h;
    this.ua = g;
    this.Ca = k;
    this.Da = m;
    this.ha = l;
    e || b.da !== void 0
      ? ((this.fa = rb), e && (this.Fa = !0))
      : (this.fa = d ? ob : zb);
  }
  var Bb = (a, b) => Object.defineProperty(b, 'name', { value: a }),
    Y = (a, b) => {
      a = E(a);
      var c = Cb.get(b);
      if (typeof c !== 'function')
        throw new K(`unknown function pointer with signature ${a}: ${b}`);
      return c;
    },
    Db = (a, b, c) => {
      if (void 0 === a[b].$) {
        var d = a[b];
        a[b] = function (...e) {
          if (!a[b].$[e.length])
            throw new K(
              `Function '${c}' called with an invalid number of arguments (${e.length}) - expects one of (${a[b].$})!`,
            );
          return a[b].$[e.length].apply(this, e);
        };
        a[b].$ = [];
        a[b].$[d.ka] = d;
      }
    },
    Eb = Object.hasOwn,
    Fb = (a, b, c) => {
      if (Eb(Module, a)) {
        if (
          void 0 === c ||
          (void 0 !== Module[a].$ && void 0 !== Module[a].$[c])
        )
          throw new K(`Cannot register public name '${a}' twice`);
        Db(Module, a, a);
        if (Module[a].$[c])
          throw new K(
            `Cannot register multiple overloads of a function with the same number of arguments (${c})!`,
          );
        Module[a].$[c] = b;
      } else ((Module[a] = b), (Module[a].ka = c));
    },
    Gb = (a) => {
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return b >= 48 && b <= 57 ? `_${a}` : a;
    },
    Hb = (a, b, c) => {
      if (!Eb(Module, a)) throw new vb('Replacing nonexistent public symbol');
      void 0 !== Module[a].$ && void 0 !== c
        ? (Module[a].$[c] = b)
        : ((Module[a] = b), (Module[a].ka = c));
    };
  class Ib extends Error {}
  var Lb = (a) => {
      a = Jb(a);
      var b = E(a);
      Kb(a);
      return b;
    },
    Mb = (a, b) => {
      function c(f) {
        e[f] || J[f] || (db[f] ? db[f].forEach(c) : (d.push(f), (e[f] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new Ib(`${a}: ` + d.map(Lb).join([', ']));
    },
    Z = (a, b, c) => {
      function d(g) {
        g = c(g);
        if (g.length !== a.length)
          throw new vb('Mismatched type converter count');
        for (var k = 0; k < a.length; ++k) P(a[k], g[k]);
      }
      a.forEach((g) => (db[g] = b));
      var e = Array(b.length),
        f = [],
        h = 0;
      for (let [g, k] of b.entries())
        if (J[k]) e[g] = J[k];
        else {
          f.push(k);
          let m;
          (bb[(m = k)] ?? (bb[m] = [])).push(() => {
            e[g] = J[k];
            ++h;
            h === f.length && d(e);
          });
        }
      0 === f.length && d(e);
    },
    Nb = (a) => {
      for (; a.length;) {
        var b = a.pop();
        a.pop()(b);
      }
    },
    Ob = {
      fffn1: function (a, b, c, d, e, f, h, g) {
        return function (k) {
          k = g(null, k);
          c(d, k);
        };
      },
      ftfn0: function (a, b, c, d, e, f) {
        return function () {
          var h = c(d);
          return f(h);
        };
      },
      ftfn1: function (a, b, c, d, e, f, h, g) {
        return function (k) {
          k = g(null, k);
          k = c(d, k);
          return f(k);
        };
      },
      ftfn10: function (a, b, c, d, e, f, h, g, k, m, l, n, r, u, q, v, w) {
        return function (x, t, y, z, C, A, F, D, H, G) {
          x = g(null, x);
          t = k(null, t);
          y = m(null, y);
          z = l(null, z);
          C = n(null, C);
          A = r(null, A);
          F = u(null, F);
          D = q(null, D);
          H = v(null, H);
          G = w(null, G);
          G = c(d, x, t, y, z, C, A, F, D, H, G);
          return f(G);
        };
      },
      ftfn15: function (
        a,
        b,
        c,
        d,
        e,
        f,
        h,
        g,
        k,
        m,
        l,
        n,
        r,
        u,
        q,
        v,
        w,
        x,
        t,
        y,
        z,
        C,
      ) {
        return function (A, F, D, H, G, Q, R, S, T, U, L, M, N, O, I) {
          A = g(null, A);
          F = k(null, F);
          D = m(null, D);
          H = l(null, H);
          G = n(null, G);
          Q = r(null, Q);
          R = u(null, R);
          S = q(null, S);
          T = v(null, T);
          U = w(null, U);
          L = x(null, L);
          M = t(null, M);
          N = y(null, N);
          O = z(null, O);
          I = C(null, I);
          I = c(d, A, F, D, H, G, Q, R, S, T, U, L, M, N, O, I);
          return f(I);
        };
      },
      ftfn18: function (
        a,
        b,
        c,
        d,
        e,
        f,
        h,
        g,
        k,
        m,
        l,
        n,
        r,
        u,
        q,
        v,
        w,
        x,
        t,
        y,
        z,
        C,
        A,
        F,
        D,
      ) {
        return function (
          H,
          G,
          Q,
          R,
          S,
          T,
          U,
          L,
          M,
          N,
          O,
          I,
          aa,
          ba,
          ca,
          da,
          ea,
          V,
        ) {
          H = g(null, H);
          G = k(null, G);
          Q = m(null, Q);
          R = l(null, R);
          S = n(null, S);
          T = r(null, T);
          U = u(null, U);
          L = q(null, L);
          M = v(null, M);
          N = w(null, N);
          O = x(null, O);
          I = t(null, I);
          aa = y(null, aa);
          ba = z(null, ba);
          ca = C(null, ca);
          da = A(null, da);
          ea = F(null, ea);
          V = D(null, V);
          V = c(d, H, G, Q, R, S, T, U, L, M, N, O, I, aa, ba, ca, da, ea, V);
          return f(V);
        };
      },
      ftfn25: function (
        a,
        b,
        c,
        d,
        e,
        f,
        h,
        g,
        k,
        m,
        l,
        n,
        r,
        u,
        q,
        v,
        w,
        x,
        t,
        y,
        z,
        C,
        A,
        F,
        D,
        H,
        G,
        Q,
        R,
        S,
        T,
        U,
      ) {
        return function (
          L,
          M,
          N,
          O,
          I,
          aa,
          ba,
          ca,
          da,
          ea,
          V,
          Pa,
          Qa,
          Ra,
          Sa,
          Ta,
          Ua,
          Va,
          Wa,
          Xa,
          Ya,
          Za,
          $a,
          ab,
          ma,
        ) {
          L = g(null, L);
          M = k(null, M);
          N = m(null, N);
          O = l(null, O);
          I = n(null, I);
          aa = r(null, aa);
          ba = u(null, ba);
          ca = q(null, ca);
          da = v(null, da);
          ea = w(null, ea);
          V = x(null, V);
          Pa = t(null, Pa);
          Qa = y(null, Qa);
          Ra = z(null, Ra);
          Sa = C(null, Sa);
          Ta = A(null, Ta);
          Ua = F(null, Ua);
          Va = D(null, Va);
          Wa = H(null, Wa);
          Xa = G(null, Xa);
          Ya = Q(null, Ya);
          Za = R(null, Za);
          $a = S(null, $a);
          ab = T(null, ab);
          ma = U(null, ma);
          ma = c(
            d,
            L,
            M,
            N,
            O,
            I,
            aa,
            ba,
            ca,
            da,
            ea,
            V,
            Pa,
            Qa,
            Ra,
            Sa,
            Ta,
            Ua,
            Va,
            Wa,
            Xa,
            Ya,
            Za,
            $a,
            ab,
            ma,
          );
          return f(ma);
        };
      },
      ftfn3: function (a, b, c, d, e, f, h, g, k, m) {
        return function (l, n, r) {
          l = g(null, l);
          n = k(null, n);
          r = m(null, r);
          r = c(d, l, n, r);
          return f(r);
        };
      },
      ftfn4: function (a, b, c, d, e, f, h, g, k, m, l) {
        return function (n, r, u, q) {
          n = g(null, n);
          r = k(null, r);
          u = m(null, u);
          q = l(null, q);
          q = c(d, n, r, u, q);
          return f(q);
        };
      },
      ftfn6: function (a, b, c, d, e, f, h, g, k, m, l, n, r) {
        return function (u, q, v, w, x, t) {
          u = g(null, u);
          q = k(null, q);
          v = m(null, v);
          w = l(null, w);
          x = n(null, x);
          t = r(null, t);
          t = c(d, u, q, v, w, x, t);
          return f(t);
        };
      },
      ftfn8: function (a, b, c, d, e, f, h, g, k, m, l, n, r, u, q) {
        return function (v, w, x, t, y, z, C, A) {
          v = g(null, v);
          w = k(null, w);
          x = m(null, x);
          t = l(null, t);
          y = n(null, y);
          z = r(null, z);
          C = u(null, C);
          A = q(null, A);
          A = c(d, v, w, x, t, y, z, C, A);
          return f(A);
        };
      },
      ftfn9: function (a, b, c, d, e, f, h, g, k, m, l, n, r, u, q, v) {
        return function (w, x, t, y, z, C, A, F, D) {
          w = g(null, w);
          x = k(null, x);
          t = m(null, t);
          y = l(null, y);
          z = n(null, z);
          C = r(null, C);
          A = u(null, A);
          F = q(null, F);
          D = v(null, D);
          D = c(d, w, x, t, y, z, C, A, F, D);
          return f(D);
        };
      },
      tffn1: function (a, b, c, d, e, f, h, g) {
        return function (k) {
          var m = h(null, this);
          k = g(null, k);
          c(d, m, k);
        };
      },
      tffn2: function (a, b, c, d, e, f, h, g, k) {
        return function (m, l) {
          var n = h(null, this);
          m = g(null, m);
          l = k(null, l);
          c(d, n, m, l);
        };
      },
      ttfn0: function (a, b, c, d, e, f, h) {
        return function () {
          var g = h(null, this);
          g = c(d, g);
          return f(g);
        };
      },
      ttfn1: function (a, b, c, d, e, f, h, g) {
        return function (k) {
          var m = h(null, this);
          k = g(null, k);
          m = c(d, m, k);
          return f(m);
        };
      },
      ttfn2: function (a, b, c, d, e, f, h, g, k) {
        return function (m, l) {
          var n = h(null, this);
          m = g(null, m);
          l = k(null, l);
          n = c(d, n, m, l);
          return f(n);
        };
      },
    },
    Qb = (a) => Pb(a),
    Sb = () => Rb();
  function Tb(a, b, c, d, e, f) {
    var h = b.length;
    if (h < 2)
      throw new K(
        'argTypes array size mismatch! Must at least get return value and receiver (this) types!',
      );
    c = b[1] !== null && c !== null;
    var g;
    a: {
      for (g = 1; g < b.length; ++g)
        if (b[g]?.Fa) {
          g = !0;
          break a;
        }
      g = !1;
    }
    a: {
      for (var k = 1; k < b.length; ++k)
        if (b[k] !== null && b[k].Ga) {
          var m = !0;
          break a;
        }
      m = !1;
    }
    k = m && !f && !g;
    m && !k && (g = !0);
    m = !b[0].ra;
    var l = h - 2,
      n = b[0],
      r = b[1];
    d = [a, cb, d, e, Nb, n.ba.bind(n), r?.fa.bind(r)];
    k && d.push(Sb, Qb);
    for (e = 2; e < h; ++e) ((n = b[e]), d.push(n.fa.bind(n)));
    b = (0,
    Ob[
      `${c ? 't' : 'f'}${m ? 't' : 'f'}${f ? 't' : 'f'}${k ? 's' : g ? 'd' : 'n'}${l}`
    ])(...d);
    return Bb(a, b);
  }
  var Ub = (a, b) => {
      for (var c = [], d = 0; d < a; d++) c.push(B[(b + d * 4) >> 2]);
      return c;
    },
    Vb = (a) => {
      a = a.trim();
      var b = a.indexOf('(');
      return b === -1 ? a : a.slice(0, b);
    },
    Wb = [],
    Xb = (a) => {
      if (a > 9 && 0 === --W[a + 1]) {
        var b = W[a];
        W[a] = void 0;
        var c = Wb[a];
        c && ((Wb[a] = void 0), c(b));
        pb.push(a);
      }
    },
    Yb = {
      name: 'emscripten::val',
      ba: (a) => {
        var b = qb(a);
        Xb(a);
        return b;
      },
      fa: (a, b) => X(b),
      ga: yb,
    },
    Da,
    Ea,
    Zb = (a, b) => {
      switch (b) {
        case 4:
          return function (c) {
            return this.ba(Da[c >> 2]);
          };
        case 8:
          return function (c) {
            return this.ba(Ea[c >> 3]);
          };
        default:
          throw new TypeError(`invalid float width (${b}): ${a}`);
      }
    },
    $b = (a, b, c) => {
      var d = (e, f) => {
        var h = 0;
        return {
          next() {
            if (h >= e) return { done: !0 };
            var g = h;
            h++;
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
    ac = Object.assign({ optional: !0 }, Yb),
    bc = new TextDecoder(),
    cc = (a, b, c, d) => {
      c = b + c;
      if (d) return c;
      for (; a[b] && !(b >= c);) ++b;
      return b;
    },
    dc = (a) => {
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
    ec = (a, b, c) => {
      var d = p;
      if (!(c > 0)) return 0;
      var e = b;
      c = b + c - 1;
      for (var f = 0; f < a.length; ++f) {
        var h = a.codePointAt(f);
        if (h <= 127) {
          if (b >= c) break;
          d[b++] = h;
        } else if (h <= 2047) {
          if (b + 1 >= c) break;
          d[b++] = 192 | (h >> 6);
          d[b++] = 128 | (h & 63);
        } else if (h <= 65535) {
          if (b + 2 >= c) break;
          d[b++] = 224 | (h >> 12);
          d[b++] = 128 | ((h >> 6) & 63);
          d[b++] = 128 | (h & 63);
        } else {
          if (b + 3 >= c) break;
          d[b++] = 240 | (h >> 18);
          d[b++] = 128 | ((h >> 12) & 63);
          d[b++] = 128 | ((h >> 6) & 63);
          d[b++] = 128 | (h & 63);
          f++;
        }
      }
      d[b] = 0;
      return b - e;
    },
    fc = new TextDecoder('utf-16le'),
    hc = (a, b, c) => {
      a >>= 1;
      return fc.decode(Ba.subarray(a, cc(Ba, a, b / 2, c)));
    },
    ic = (a, b, c) => {
      var d = '';
      a >>= 2;
      for (var e = 0; !(e >= b / 4); e++) {
        var f = B[a + e];
        if (!f && !c) break;
        d += String.fromCodePoint(f);
      }
      return d;
    },
    jc = (a) => a.length * 2,
    kc = (a) => {
      for (var b = 0, c = 0; c < a.length; ++c)
        (a.codePointAt(c) > 65535 && c++, (b += 4));
      return b;
    },
    lc = (a, b, c = 2147483647) => {
      if (c < 2) return 0;
      c -= 2;
      var d = b;
      c = c < a.length * 2 ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) ((Aa[b >> 1] = a.charCodeAt(e)), (b += 2));
      Aa[b >> 1] = 0;
      return b - d;
    },
    mc = (a, b, c = 2147483647) => {
      if (c < 4) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.codePointAt(e);
        f > 65535 && e++;
        Ca[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      Ca[b >> 2] = 0;
      return b - d;
    },
    nc = [],
    oc = (a) => {
      var b = nc.length;
      nc.push(a);
      return b;
    },
    pc = {},
    qc = (a) => {
      var b = pc[a];
      return b === void 0 ? E(a) : b;
    },
    rc = {
      '1f1': (a) => (b, c, d, e) => {
        qb(b)[qc(c)](a(e));
      },
      '3t1': (a, b) => (c, d, e, f) => {
        d = b(f);
        c = [];
        d = a(c, d);
        c.length && (B[e >> 2] = X(c));
        return d;
      },
    },
    sc = (a, b) => {
      for (var c = Array(a), d = 0; d < a; ++d) {
        var e = d,
          f = B[(b + d * 4) >> 2],
          h = J[f];
        if (void 0 === h)
          throw (
            (a = `${`parameter ${d}`} has unknown type ${Lb(f)}`), new K(a)
          );
        c[e] = h;
      }
      return c;
    },
    tc = new Map(),
    uc = {},
    wc = () => {
      if (!vc) {
        var a = {
            USER: 'web_user',
            LOGNAME: 'web_user',
            PATH: '/',
            PWD: '/',
            HOME: '/home/web_user',
            LANG:
              (globalThis.navigator?.language ?? 'C').replace('-', '_') +
              '.UTF-8',
            _: ka,
          },
          b;
        for (b in uc) uc[b] === void 0 ? delete a[b] : (a[b] = uc[b]);
        var c = [];
        for (b in a) c.push(`${b}=${a[b]}`);
        vc = c;
      }
      return vc;
    },
    vc,
    xc = [null, [], []],
    yc = () => {
      if (ia) {
        var a = ja('node:crypto');
        return (b) => (a.randomFillSync(b), 0);
      }
      return (b) => (crypto.getRandomValues(b), 0);
    },
    zc = (a) => (zc = yc())(a);
  (() => {
    var a = kb.prototype;
    Object.assign(a, {
      isAliasOf: function (c) {
        if (!(this instanceof kb && c instanceof kb)) return !1;
        var d = this.W.Z.X,
          e = this.W.Y;
        c.W = c.W;
        var f = c.W.Z.X;
        for (c = c.W.Y; d.da;) ((e = d.na(e)), (d = d.da));
        for (; f.da;) ((c = f.na(c)), (f = f.da));
        return d === f && e === c;
      },
      clone: function () {
        this.W.Y || jb(this);
        if (this.W.ma) return ((this.W.count.value += 1), this);
        var c = hb,
          d = Object,
          e = d.create,
          f = Object.getPrototypeOf(this),
          h = this.W;
        c = c(
          e.call(d, f, {
            W: {
              value: {
                count: h.count,
                la: h.la,
                ma: h.ma,
                Y: h.Y,
                Z: h.Z,
                aa: h.aa,
                ea: h.ea,
              },
            },
          }),
        );
        c.W.count.value += 1;
        c.W.la = !1;
        return c;
      },
      ['delete']() {
        this.W.Y || jb(this);
        if (this.W.la && !this.W.ma)
          throw new K('Object already scheduled for deletion');
        gb(this);
        var c = this.W;
        --c.count.value;
        0 === c.count.value && (c.aa ? c.ea.ha(c.aa) : c.Z.X.ha(c.Y));
        this.W.ma || ((this.W.aa = void 0), (this.W.Y = void 0));
      },
      isDeleted: function () {
        return !this.W.Y;
      },
      deleteLater: function () {
        this.W.Y || jb(this);
        if (this.W.la && !this.W.ma)
          throw new K('Object already scheduled for deletion');
        ib.push(this);
        this.W.la = !0;
        return this;
      },
    });
    var b = Symbol.dispose;
    b && (a[b] = a['delete']);
  })();
  Object.assign(Ab.prototype, {
    ya(a) {
      this.ua && (a = this.ua(a));
      return a;
    },
    ta(a) {
      this.ha?.(a);
    },
    ga: yb,
    ba: function (a) {
      function b() {
        return this.pa
          ? wb(this.X.ja, { Z: this.Aa, Y: c, ea: this, aa: a })
          : wb(this.X.ja, { Z: this, Y: a });
      }
      var c = this.ya(a);
      if (!c) return (this.ta(a), null);
      var d = ub(this.X, c);
      if (void 0 !== d) {
        if (0 === d.W.count.value)
          return ((d.W.Y = c), (d.W.aa = a), d.clone());
        d = d.clone();
        this.ta(a);
        return d;
      }
      d = this.X.xa(c);
      d = xb[d];
      if (!d) return b.call(this);
      d = this.oa ? d.va : d.pointerType;
      var e = sb(c, this.X, d.X);
      return e === null
        ? b.call(this)
        : this.pa
          ? wb(d.X.ja, { Z: d, Y: e, ea: this, aa: a })
          : wb(d.X.ja, { Z: d, Y: e });
    },
  });
  var Jb,
    Ac,
    Kb,
    Bc,
    Ia,
    Pb,
    Rb,
    za,
    Cb,
    Cc = {
      F: () => Ha(''),
      q: (a, b, c, d, e) => {
        b = E(b);
        d = d === 0n;
        var f = (h) => h;
        if (d) {
          let h = c * 8;
          f = (g) => BigInt.asUintN(h, g);
          e = f(e);
        }
        P(a, {
          name: b,
          ba: f,
          fa: (h, g) => {
            typeof g === 'number' && (g = BigInt(g));
            return g;
          },
          ga: Oa(b, c, !d),
        });
      },
      I: (a, b, c, d) => {
        b = E(b);
        P(a, {
          name: b,
          ba: function (e) {
            return !!e;
          },
          fa: function (e, f) {
            return f ? c : d;
          },
          ga: function (e) {
            return this.ba(p[e]);
          },
        });
      },
      o: (a, b, c, d, e, f, h, g, k, m, l, n, r) => {
        l = E(l);
        f = Y(e, f);
        g &&= Y(h, g);
        m &&= Y(k, m);
        r = Y(n, r);
        var u = Gb(l);
        Fb(u, function () {
          Mb(`Cannot construct ${l} due to unbound types`, [d]);
        });
        Z([a, b, c], d ? [d] : [], (q) => {
          q = q[0];
          if (d) {
            var v = q.X;
            var w = v.ja;
          } else w = kb.prototype;
          q = Bb(l, function (...z) {
            if (Object.getPrototypeOf(this) !== x)
              throw new K(`Use 'new' to construct ${l}`);
            if (void 0 === t.ia)
              throw new K(`${l} has no accessible constructor`);
            var C = t.ia[z.length];
            if (void 0 === C)
              throw new K(
                `Tried to invoke ctor of ${l} with invalid number of parameters (${z.length}) - expected (${Object.keys(t.ia).toString()}) parameters instead!`,
              );
            return C.apply(this, z);
          });
          var x = Object.create(w, { constructor: { value: q } });
          q.prototype = x;
          var t = new lb(l, q, x, r, v, f, g, m);
          if (t.da) {
            var y;
            (y = t.da).sa ?? (y.sa = []);
            t.da.sa.push(t);
          }
          v = new Ab(l, t, !0, !1, !1);
          y = new Ab(l + '*', t, !1, !1, !1);
          w = new Ab(l + ' const*', t, !1, !0, !1);
          xb[a] = { pointerType: y, va: w };
          Hb(u, q);
          return [v, y, w];
        });
      },
      n: (a, b, c, d, e, f) => {
        var h = Ub(b, c);
        e = Y(d, e);
        Z([], [a], (g) => {
          g = g[0];
          var k = `constructor ${g.name}`;
          void 0 === g.X.ia && (g.X.ia = []);
          if (void 0 !== g.X.ia[b - 1])
            throw new K(
              `Cannot register multiple constructors with identical number of parameters (${b - 1}) for class '${g.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`,
            );
          g.X.ia[b - 1] = () => {
            Mb(`Cannot construct ${g.name} due to unbound types`, h);
          };
          Z([], h, (m) => {
            m.splice(1, 0, null);
            g.X.ia[b - 1] = Tb(k, m, null, e, f);
            return [];
          });
          return [];
        });
      },
      e: (a, b, c, d, e, f, h, g, k) => {
        var m = Ub(c, d);
        b = E(b);
        b = Vb(b);
        f = Y(e, f);
        Z([], [a], (l) => {
          function n() {
            Mb(`Cannot call ${r} due to unbound types`, m);
          }
          l = l[0];
          var r = `${l.name}.${b}`;
          b.startsWith('@@') && (b = Symbol[b.substring(2)]);
          g && l.X.Ba.push(b);
          var u = l.X.ja,
            q = u[b];
          void 0 === q ||
          (void 0 === q.$ && q.className !== l.name && q.ka === c - 2)
            ? ((n.ka = c - 2), (n.className = l.name), (u[b] = n))
            : (Db(u, b, r), (u[b].$[c - 2] = n));
          Z([], m, (v) => {
            v = Tb(r, v, l, f, h, k);
            void 0 === u[b].$
              ? ((v.ka = c - 2), (u[b] = v))
              : (u[b].$[c - 2] = v);
            return [];
          });
          return [];
        });
      },
      G: (a) => P(a, Yb),
      p: (a, b, c) => {
        b = E(b);
        P(a, { name: b, ba: (d) => d, fa: (d, e) => e, ga: Zb(b, c) });
      },
      d: (a, b, c, d, e, f, h) => {
        var g = Ub(b, c);
        a = E(a);
        a = Vb(a);
        e = Y(d, e);
        Fb(
          a,
          function () {
            Mb(`Cannot call ${a} due to unbound types`, g);
          },
          b - 1,
        );
        Z([], g, (k) => {
          k = [k[0], null].concat(k.slice(1));
          Hb(a, Tb(a, k, null, e, f, h), b - 1);
          return [];
        });
      },
      f: (a, b, c, d, e) => {
        b = E(b);
        var f = (g) => g;
        if (d === 0) {
          var h = 32 - 8 * c;
          f = (g) => (g << h) >>> h;
          e = f(e);
        }
        P(a, { name: b, ba: f, fa: (g, k) => k, ga: Oa(b, c, d !== 0) });
      },
      s: (a, b, c, d) => {
        c = E(c);
        d = E(d);
        Z([], [a, b], (e) => {
          $b(e[0].X.ja, c, d);
          return [];
        });
      },
      a: (a, b, c) => {
        function d(f) {
          return new e(ya.buffer, B[(f + 4) >> 2], B[f >> 2]);
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
        c = E(c);
        P(a, { name: c, ba: d, ga: d }, { za: !0 });
      },
      L: (a) => {
        P(a, ac);
      },
      H: (a, b) => {
        b = E(b);
        P(a, {
          name: b,
          ba(c) {
            var d = (d = c + 4)
              ? bc.decode(p.subarray(d, cc(p, d, B[c >> 2], !0)))
              : '';
            Kb(c);
            return d;
          },
          fa(c, d) {
            d instanceof ArrayBuffer && (d = new Uint8Array(d));
            var e = typeof d === 'string';
            if (!(e || (ArrayBuffer.isView(d) && d.BYTES_PER_ELEMENT == 1)))
              throw new K('Cannot pass non-string to std::string');
            c = e ? dc(d) : d.length;
            var f = Ac(4 + c + 1),
              h = f + 4;
            B[f >> 2] = c;
            e ? ec(d, h, c + 1) : p.set(d, h);
            return f;
          },
          ga: yb,
        });
      },
      m: (a, b, c) => {
        c = E(c);
        if (b === 2) {
          var d = hc;
          var e = lc;
          var f = jc;
        } else ((d = ic), (e = mc), (f = kc));
        P(a, {
          name: c,
          ba: (h) => {
            var g = d(h + 4, B[h >> 2] * b, !0);
            Kb(h);
            return g;
          },
          fa: (h, g) => {
            if (typeof g !== 'string')
              throw new K(`Cannot pass non-string to C++ string type ${c}`);
            h = f(g);
            var k = Ac(4 + h + b);
            B[k >> 2] = h / b;
            e(g, k + 4, h + b);
            return k;
          },
          ga: yb,
        });
      },
      i: (a) => {
        P(a, Yb);
      },
      J: (a, b) => {
        b = E(b);
        P(a, { ra: !0, name: b, ba: () => {}, fa: () => {} });
      },
      C: () => {},
      l: (a, b, c) => {
        var d;
        [b, ...d] = sc(a, b);
        var e = d.map((f) => f.ga.bind(f));
        a--;
        a = rc[`${c}${b.ra ? 'f' : 't'}${a}`];
        c = b.ra ? e : [b.fa.bind(b), ...e];
        a = a(...c);
        b = `methodCaller<(${d.map((f) => f.name)}) => ${b.name}>`;
        return oc(Bb(b, a));
      },
      t: Xb,
      K: (a) => {
        if (!a) return X(globalThis);
        a = qc(a);
        return X(globalThis[a]);
      },
      r: (a) => {
        a > 9 && (W[a + 1] += 1);
      },
      k: (a, b, c, d, e) => nc[a](b, c, d, e),
      b: () => X([]),
      g: (a) => X(qc(a)),
      j: () => X({}),
      u: (a) => {
        var b = qb(a);
        Nb(b);
        Xb(a);
      },
      h: (a, b, c) => {
        a = qb(a);
        b = qb(b);
        c = qb(c);
        a[b] = c;
      },
      v: (a, b) => {
        tc.has(a) && (clearTimeout(tc.get(a)), tc.delete(a));
        if (!b) return 0;
        b = setTimeout(() => {
          tc.delete(a);
          var c = [a, performance.now()],
            d = Bc;
          if (!va)
            try {
              d(...c);
            } catch (e) {
              e instanceof Na || e == 'unwind' || la(1, e);
            } finally {
            }
        }, b);
        tc.set(a, b);
        return 0;
      },
      x: (a, b, c, d) => {
        var e = new Date().getFullYear(),
          f = new Date(e, 0, 1).getTimezoneOffset();
        e = new Date(e, 6, 1).getTimezoneOffset();
        B[a >> 2] = Math.max(f, e) * 60;
        Ca[b >> 2] = Number(f != e);
        b = (h) => {
          var g = Math.abs(h);
          return `UTC${h >= 0 ? '-' : '+'}${String(Math.floor(g / 60)).padStart(2, '0')}${String(g % 60).padStart(2, '0')}`;
        };
        a = b(f);
        b = b(e);
        e < f ? (ec(a, c, 17), ec(b, d, 17)) : (ec(a, d, 17), ec(b, c, 17));
      },
      y: function (a, b, c) {
        if (!(a >= 0 && a <= 3)) return 28;
        Fa[c >> 3] = BigInt(
          Math.round((a === 0 ? Date.now() : performance.now()) * 1e6),
        );
        return 0;
      },
      c: () => performance.now(),
      z: (a) => {
        var b = p.length;
        a >>>= 0;
        if (a > 268435456) return !1;
        for (var c = 1; c <= 4; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          a: {
            d =
              ((Math.min(268435456, Math.ceil(Math.max(a, d) / 65536) * 65536) -
                za.buffer.byteLength +
                65535) /
                65536) |
              0;
            try {
              za.grow(d);
              xa();
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
        for (e of wc()) {
          var f = b + c;
          B[(a + d) >> 2] = f;
          c += ec(e, f, Infinity) + 1;
          d += 4;
        }
        return 0;
      },
      E: (a, b) => {
        var c = wc();
        B[a >> 2] = c.length;
        a = 0;
        for (var d of c) a += dc(d) + 1;
        B[b >> 2] = a;
        return 0;
      },
      A: (a, b, c, d) => {
        for (var e = 0, f = 0; f < c; f++) {
          var h = B[b >> 2],
            g = B[(b + 4) >> 2];
          b += 8;
          for (var k = 0; k < g; k++) {
            var m = a,
              l = p[h + k],
              n = xc[m];
            l && l !== 10
              ? n.push(l)
              : ((l = cc(n, 0)),
                (l = bc.decode(
                  n.buffer ? n.subarray(0, l) : new Uint8Array(n.slice(0, l)),
                )),
                (m === 1 ? ta : ua)(l),
                (n.length = 0));
          }
          e += g;
        }
        B[d >> 2] = e;
        return 0;
      },
      B: (a) => {
        la(a, new Na(a));
      },
      w: (a, b) => zc(p.subarray(a, a + b)),
    },
    Dc;
  Dc = await (async function () {
    var a = { a: Cc };
    Ja ??= Module.locateFile
      ? Module.locateFile
        ? Module.locateFile('wpilibc_wasm.wasm', oa)
        : oa + 'wpilibc_wasm.wasm'
      : new URL('wpilibc_wasm.wasm', import.meta.url).href;
    a = Dc = (await Ma(a)).instance.exports;
    Jb = a.O;
    Ac = Module._malloc = a.P;
    Kb = Module._free = a.Q;
    Bc = a.S;
    Ia = a.T;
    Pb = a.U;
    Rb = a.V;
    za = a.M;
    Cb = a.R;
    xa();
    return Dc;
  })();
  await (async function () {
    va || ((wa = !0), Dc.N());
  })();
  return Module;
}
export default createWpilibcModule;
