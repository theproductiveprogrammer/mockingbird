const D = globalThis, H = D.ShadowRoot && (D.ShadyCSS === void 0 || D.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, O = Symbol(), B = /* @__PURE__ */ new WeakMap();
let X = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== O) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (H && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = B.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && B.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const re = (r) => new X(typeof r == "string" ? r : r + "", void 0, O), ne = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce(((s, i, n) => s + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[n + 1]), r[0]);
  return new X(t, r, O);
}, oe = (r, e) => {
  if (H) r.adoptedStyleSheets = e.map(((t) => t instanceof CSSStyleSheet ? t : t.styleSheet));
  else for (const t of e) {
    const s = document.createElement("style"), i = D.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = t.cssText, r.appendChild(s);
  }
}, j = H ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return re(t);
})(r) : r;
const { is: ae, defineProperty: le, getOwnPropertyDescriptor: de, getOwnPropertyNames: ce, getOwnPropertySymbols: he, getPrototypeOf: pe } = Object, z = globalThis, q = z.trustedTypes, ue = q ? q.emptyScript : "", me = z.reactiveElementPolyfillSupport, E = (r, e) => r, I = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? ue : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, Y = (r, e) => !ae(r, e), V = { attribute: !0, type: String, converter: I, reflect: !1, useDefault: !1, hasChanged: Y };
Symbol.metadata ??= Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let y = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = V) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(e, s, t);
      i !== void 0 && le(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: i, set: n } = de(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: i, set(a) {
      const o = i?.call(this);
      n?.call(this, a), this.requestUpdate(e, o, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? V;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const e = pe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const t = this.properties, s = [...ce(t), ...he(t)];
      for (const i of s) this.createProperty(i, t[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, i] of t) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const i = this._$Eu(t, s);
      i !== void 0 && this._$Eh.set(i, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const i of s) t.unshift(j(i));
    } else e !== void 0 && t.push(j(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise(((e) => this.enableUpdating = e)), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach(((e) => e(this)));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return oe(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach(((e) => e.hostConnected?.()));
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach(((e) => e.hostDisconnected?.()));
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    const s = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, s);
    if (i !== void 0 && s.reflect === !0) {
      const n = (s.converter?.toAttribute !== void 0 ? s.converter : I).toAttribute(t, s.type);
      this._$Em = e, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, i = s._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const n = s.getPropertyOptions(i), a = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : I;
      this._$Em = i;
      const o = a.fromAttribute(t, n.type);
      this[i] = o ?? this._$Ej?.get(i) ?? o, this._$Em = null;
    }
  }
  requestUpdate(e, t, s) {
    if (e !== void 0) {
      const i = this.constructor, n = this[e];
      if (s ??= i.getPropertyOptions(e), !((s.hasChanged ?? Y)(n, t) || s.useDefault && s.reflect && n === this._$Ej?.get(e) && !this.hasAttribute(i._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: i, wrapped: n }, a) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), n !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [i, n] of this._$Ep) this[i] = n;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, n] of s) {
        const { wrapped: a } = n, o = this[i];
        a !== !0 || this._$AL.has(i) || o === void 0 || this.C(i, void 0, n, o);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach(((s) => s.hostUpdate?.())), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach(((t) => t.hostUpdated?.())), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach(((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[E("elementProperties")] = /* @__PURE__ */ new Map(), y[E("finalized")] = /* @__PURE__ */ new Map(), me?.({ ReactiveElement: y }), (z.reactiveElementVersions ??= []).push("2.1.1");
const R = globalThis, P = R.trustedTypes, W = P ? P.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, ee = "$lit$", f = `lit$${Math.random().toFixed(9).slice(2)}$`, te = "?" + f, ge = `<${te}>`, _ = document, F = () => _.createComment(""), S = (r) => r === null || typeof r != "object" && typeof r != "function", N = Array.isArray, fe = (r) => N(r) || typeof r?.[Symbol.iterator] == "function", T = `[ 	
\f\r]`, x = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, G = /-->/g, J = />/g, $ = RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), K = /'/g, Z = /"/g, se = /^(?:script|style|textarea|title)$/i, $e = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), c = $e(1), b = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), Q = /* @__PURE__ */ new WeakMap(), v = _.createTreeWalker(_, 129);
function ie(r, e) {
  if (!N(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return W !== void 0 ? W.createHTML(e) : e;
}
const ve = (r, e) => {
  const t = r.length - 1, s = [];
  let i, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = x;
  for (let o = 0; o < t; o++) {
    const l = r[o];
    let p, h, d = -1, m = 0;
    for (; m < l.length && (a.lastIndex = m, h = a.exec(l), h !== null); ) m = a.lastIndex, a === x ? h[1] === "!--" ? a = G : h[1] !== void 0 ? a = J : h[2] !== void 0 ? (se.test(h[2]) && (i = RegExp("</" + h[2], "g")), a = $) : h[3] !== void 0 && (a = $) : a === $ ? h[0] === ">" ? (a = i ?? x, d = -1) : h[1] === void 0 ? d = -2 : (d = a.lastIndex - h[2].length, p = h[1], a = h[3] === void 0 ? $ : h[3] === '"' ? Z : K) : a === Z || a === K ? a = $ : a === G || a === J ? a = x : (a = $, i = void 0);
    const g = a === $ && r[o + 1].startsWith("/>") ? " " : "";
    n += a === x ? l + ge : d >= 0 ? (s.push(p), l.slice(0, d) + ee + l.slice(d) + f + g) : l + f + (d === -2 ? o : g);
  }
  return [ie(r, n + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class C {
  constructor({ strings: e, _$litType$: t }, s) {
    let i;
    this.parts = [];
    let n = 0, a = 0;
    const o = e.length - 1, l = this.parts, [p, h] = ve(e, t);
    if (this.el = C.createElement(p, s), v.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (i = v.nextNode()) !== null && l.length < o; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const d of i.getAttributeNames()) if (d.endsWith(ee)) {
          const m = h[a++], g = i.getAttribute(d).split(f), U = /([.?@])?(.*)/.exec(m);
          l.push({ type: 1, index: n, name: U[2], strings: g, ctor: U[1] === "." ? ye : U[1] === "?" ? be : U[1] === "@" ? Ae : M }), i.removeAttribute(d);
        } else d.startsWith(f) && (l.push({ type: 6, index: n }), i.removeAttribute(d));
        if (se.test(i.tagName)) {
          const d = i.textContent.split(f), m = d.length - 1;
          if (m > 0) {
            i.textContent = P ? P.emptyScript : "";
            for (let g = 0; g < m; g++) i.append(d[g], F()), v.nextNode(), l.push({ type: 2, index: ++n });
            i.append(d[m], F());
          }
        }
      } else if (i.nodeType === 8) if (i.data === te) l.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = i.data.indexOf(f, d + 1)) !== -1; ) l.push({ type: 7, index: n }), d += f.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const s = _.createElement("template");
    return s.innerHTML = e, s;
  }
}
function A(r, e, t = r, s) {
  if (e === b) return e;
  let i = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const n = S(e) ? void 0 : e._$litDirective$;
  return i?.constructor !== n && (i?._$AO?.(!1), n === void 0 ? i = void 0 : (i = new n(r), i._$AT(r, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = i : t._$Cl = i), i !== void 0 && (e = A(r, i._$AS(r, e.values), i, s)), e;
}
class _e {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, i = (e?.creationScope ?? _).importNode(t, !0);
    v.currentNode = i;
    let n = v.nextNode(), a = 0, o = 0, l = s[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let p;
        l.type === 2 ? p = new k(n, n.nextSibling, this, e) : l.type === 1 ? p = new l.ctor(n, l.name, l.strings, this, e) : l.type === 6 && (p = new xe(n, this, e)), this._$AV.push(p), l = s[++o];
      }
      a !== l?.index && (n = v.nextNode(), a++);
    }
    return v.currentNode = _, i;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, s, i) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = A(this, e, t), S(e) ? e === u || e == null || e === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : e !== this._$AH && e !== b && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : fe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== u && S(this._$AH) ? this._$AA.nextSibling.data = e : this.T(_.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, i = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = C.createElement(ie(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(t);
    else {
      const n = new _e(i, this), a = n.u(this.options);
      n.p(t), this.T(a), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = Q.get(e.strings);
    return t === void 0 && Q.set(e.strings, t = new C(e)), t;
  }
  k(e) {
    N(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, i = 0;
    for (const n of e) i === t.length ? t.push(s = new k(this.O(F()), this.O(F()), this, this.options)) : s = t[i], s._$AI(n), i++;
    i < t.length && (this._$AR(s && s._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const s = e.nextSibling;
      e.remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class M {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, i, n) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = u;
  }
  _$AI(e, t = this, s, i) {
    const n = this.strings;
    let a = !1;
    if (n === void 0) e = A(this, e, t, 0), a = !S(e) || e !== this._$AH && e !== b, a && (this._$AH = e);
    else {
      const o = e;
      let l, p;
      for (e = n[0], l = 0; l < n.length - 1; l++) p = A(this, o[s + l], t, l), p === b && (p = this._$AH[l]), a ||= !S(p) || p !== this._$AH[l], p === u ? e = u : e !== u && (e += (p ?? "") + n[l + 1]), this._$AH[l] = p;
    }
    a && !i && this.j(e);
  }
  j(e) {
    e === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ye extends M {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === u ? void 0 : e;
  }
}
class be extends M {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== u);
  }
}
class Ae extends M {
  constructor(e, t, s, i, n) {
    super(e, t, s, i, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = A(this, e, t, 0) ?? u) === b) return;
    const s = this._$AH, i = e === u && s !== u || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, n = e !== u && (s === u || i);
    i && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class xe {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    A(this, e);
  }
}
const Ee = R.litHtmlPolyfillSupport;
Ee?.(C, k), (R.litHtmlVersions ??= []).push("3.3.1");
const we = (r, e, t) => {
  const s = t?.renderBefore ?? e;
  let i = s._$litPart$;
  if (i === void 0) {
    const n = t?.renderBefore ?? null;
    s._$litPart$ = i = new k(e.insertBefore(F(), n), n, void 0, t ?? {});
  }
  return i._$AI(r), i;
};
const L = globalThis;
class w extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = we(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return b;
  }
}
w._$litElement$ = !0, w.finalized = !0, L.litElementHydrateSupport?.({ LitElement: w });
const Fe = L.litElementPolyfillSupport;
Fe?.({ LitElement: w });
(L.litElementVersions ??= []).push("4.2.1");
class Se extends w {
  static properties = {
    api: { type: Object },
    userData: { type: Object, state: !0 },
    selectedUserId: { type: String, state: !0 },
    loading: { type: Boolean, state: !0 },
    error: { type: String, state: !0 },
    messageText: { type: String, state: !0 },
    sending: { type: Boolean, state: !0 },
    showAllUsers: { type: Boolean, state: !0 },
    deleteFullCache: { type: Boolean, state: !0 },
    deleting: { type: Boolean, state: !0 }
  };
  api;
  userData = null;
  selectedUserId = null;
  showAllUsers = !1;
  // By default, show only users with invites or messages
  loading = !0;
  error = null;
  messageText = "";
  sending = !1;
  deleteFullCache = !1;
  // Checkbox state for full delete
  deleting = !1;
  static styles = ne`
    :host {
      display: block;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F3F2EF;
    }

    .container { padding: 1.5rem; min-height: 600px; }
    .header { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .header h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #000000; font-weight: 600; }
    .header p { margin: 0; font-size: 0.875rem; color: #666666; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1rem; }
    .stat-label { font-size: 0.75rem; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 600; color: #000000; }

    .main-content { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }

    .user-list { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; max-height: 600px; overflow-y: auto; }
    .user-list-header { padding: 1rem; border-bottom: 1px solid #E0DFDC; background: #F3F2EF; font-weight: 600; font-size: 0.875rem; color: #000000; }

    .user-item { padding: 1rem; border-bottom: 1px solid #E0DFDC; cursor: pointer; transition: background 0.2s; }
    .user-item:hover { background: #F3F2EF; }
    .user-item.selected { background: #E7F3FF; border-left: 3px solid #0A66C2; }
    .user-name { font-weight: 600; color: #000000; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .user-headline { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-location { font-size: 0.75rem; color: #666666; display: flex; align-items: center; gap: 0.25rem; }

    .user-detail { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1.5rem; }
    .profile-header { display: flex; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid #E0DFDC; margin-bottom: 1.5rem; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: #F3F2EF; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; color: #0A66C2; }
    .profile-info { flex: 1; }
    .profile-name { font-size: 1.5rem; font-weight: 600; color: #000000; margin: 0 0 0.25rem 0; }
    .profile-headline { font-size: 1rem; color: #666666; margin: 0 0 0.5rem 0; }
    .profile-meta { display: flex; gap: 1rem; font-size: 0.875rem; color: #666666; }

    .section { margin-bottom: 1.5rem; }
    .section-title { font-size: 1rem; font-weight: 600; color: #000000; margin: 0 0 1rem 0; }

    .invitation-card { background: #FFF9E6; border: 1px solid #F5C75D; border-radius: 8px; padding: 1rem; }
    .invitation-message { font-size: 0.875rem; color: #666666; margin-bottom: 0.75rem; font-style: italic; }
    .invitation-actions { display: flex; gap: 0.5rem; }

    .messages-container { background: #F3F2EF; border-radius: 8px; padding: 1rem; max-height: 300px; overflow-y: auto; margin-bottom: 1rem; }
    .message { background: #FFFFFF; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; border-left: 3px solid #E0DFDC; }
    .message.sent { border-left-color: #0A66C2; background: #E7F3FF; }
    .message-meta { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; }
    .message-text { font-size: 0.875rem; color: #000000; }

    .message-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .message-form textarea { padding: 0.75rem; font-size: 0.875rem; border: 1px solid #E0DFDC; border-radius: 8px; font-family: inherit; resize: vertical; }
    .message-form textarea:focus { outline: none; border-color: #0A66C2; }

    button { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 24px; cursor: pointer; font-family: inherit; font-weight: 600; transition: all 0.2s; }
    button.primary { background: #0A66C2; color: white; }
    button.primary:hover { background: #004182; }
    button.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secondary { background: #FFFFFF; color: #0A66C2; border: 1px solid #0A66C2; }
    button.secondary:hover { background: #E7F3FF; }
    button.success { background: #057642; color: white; }
    button.success:hover { background: #045A32; }
    button.danger { background: #CC1016; color: white; }
    button.danger:hover { background: #A00D12; }

    .loading, .error, .empty { text-align: center; padding: 3rem 1.5rem; background: #FFFFFF; border-radius: 8px; }
    .error { background: #FEF2F2; border: 1px solid #FCA5A5; }
    .error h3 { font-size: 1rem; font-weight: 600; color: #991B1B; margin: 0 0 0.5rem 0; }
    .error p { font-size: 0.875rem; color: #B91C1C; margin: 0 0 1rem 0; }
    .empty h3 { font-size: 1rem; color: #666666; margin: 0; }
  `;
  firstUpdated() {
    console.log("[LinkedIn Plugin] firstUpdated called, api:", this.api), this.loadData();
  }
  async loadData() {
    if (console.log("[LinkedIn Plugin] loadData called, api:", this.api), !this.api) {
      console.error("[LinkedIn Plugin] API not initialized"), this.error = "API not initialized", this.loading = !1, this.requestUpdate();
      return;
    }
    try {
      this.loading = !0, this.error = null, console.log("[LinkedIn Plugin] Calling api.action...");
      const e = await this.api.action("load_user_data", "all");
      if (console.log("[LinkedIn Plugin] Got result:", e), !e.success)
        throw new Error(e.message || "Failed to load data");
      this.userData = e.result?.data || e.data;
    } catch (e) {
      console.error("[LinkedIn Plugin] Error:", e), this.error = e instanceof Error ? e.message : "Failed to load data";
    } finally {
      this.loading = !1, console.log("[LinkedIn Plugin] Loading finished, loading:", this.loading, "error:", this.error), this.requestUpdate();
    }
  }
  async handleInviteAction(e, t) {
    try {
      const s = await this.api.action(t, e);
      s.success ? await this.loadData() : alert(s.message || "Action failed");
    } catch (s) {
      alert(s instanceof Error ? s.message : "Action failed");
    }
  }
  async handleSendMessage(e) {
    if (this.messageText.trim())
      try {
        this.sending = !0;
        const t = await this.api.action("send_message", e, {
          text: this.messageText
        });
        t.success ? (this.messageText = "", await this.loadData()) : alert(t.message || "Failed to send message");
      } catch (t) {
        alert(t instanceof Error ? t.message : "Failed to send message");
      } finally {
        this.sending = !1;
      }
  }
  async handleDeleteUser(e, t) {
    const i = `Are you sure you want to ${this.deleteFullCache ? "full delete (including cache)" : "delete data (keep cache)"} for ${t}?

This will remove:
- Invitations
- Messages
- Chats${this.deleteFullCache ? `
- Cached profile` : ""}`;
    if (confirm(i))
      try {
        this.deleting = !0;
        const n = await this.api.action("delete_user_data", e, {
          fullDelete: this.deleteFullCache
        });
        if (n.success) {
          const a = n.result?.deleted || {}, o = `Deleted:
- ${a.invitations || 0} invitation(s)
- ${a.chats || 0} chat(s)
- ${a.messages || 0} message(s)` + (this.deleteFullCache ? `
- ${a.profile || 0} cached profile(s)` : "");
          alert(o), this.selectedUserId = null, this.deleteFullCache = !1, await this.loadData();
        } else
          alert(n.message || "Failed to delete user data");
      } catch (n) {
        alert(n instanceof Error ? n.message : "Failed to delete user data");
      } finally {
        this.deleting = !1;
      }
  }
  render() {
    if (this.loading)
      return c`<div class="loading">Loading LinkedIn data...</div>`;
    if (this.error)
      return c`
        <div class="error">
          <h3>Error</h3>
          <p>${this.error}</p>
          <button class="danger" @click=${() => this.loadData()}>Retry</button>
        </div>
      `;
    if (!this.userData)
      return c`<div class="empty"><h3>No data available</h3></div>`;
    const e = this.selectedUserId ? this.userData?.users?.find((o) => o.id === this.selectedUserId || o.provider_id === this.selectedUserId) : null, t = e ? this.userData?.invitations?.find((o) => o.recipient_id === e.provider_id || o.recipient_id === e.id) : null, s = e ? this.userData?.chats?.find(
      (o) => o.attendee_provider_id === e.provider_id || o.attendee_provider_id === e.id
    ) : null, i = s ? (this.userData?.messages || []).filter((o) => o.chat_id === s.id) : [], n = this.userData?.users || [], a = this.showAllUsers ? n : n.filter((o) => {
      const l = this.userData?.invitations?.some(
        (h) => h.recipient_id === o.provider_id || h.recipient_id === o.id
      ), p = this.userData?.chats?.some(
        (h) => h.attendee_provider_id === o.provider_id || h.attendee_provider_id === o.id
      );
      return l || p;
    });
    return c`
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>LinkedIn Plugin</h1>
          <p>Manage connections, invitations, and messages</p>
        </div>

        <!-- Stats -->
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">${this.userData?.stats?.total_users || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Connections</div>
            <div class="stat-value">${this.userData?.stats?.connections || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Invites</div>
            <div class="stat-value">${this.userData?.stats?.pending_invites || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Messages</div>
            <div class="stat-value">${this.userData?.stats?.total_messages || 0}</div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- User List -->
          <div class="user-list">
            <div class="user-list-header" style="display: flex; justify-content: space-between; align-items: center;">
              <span>Users (${a.length})</span>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: normal; cursor: pointer; opacity: 0.6;">
                <input
                  type="checkbox"
                  .checked=${this.showAllUsers}
                  @change=${(o) => {
      this.showAllUsers = o.target.checked, this.requestUpdate();
    }}
                  style="cursor: pointer;"
                />
                Show cached
              </label>
            </div>
            ${a.map((o) => {
      const l = this.selectedUserId === o.id || this.selectedUserId === o.provider_id;
      return c`
                <div
                  class="user-item ${l ? "selected" : ""}"
                  @click=${() => {
        this.selectedUserId = o.id, this.requestUpdate();
      }}
                >
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    ${o.profile_picture_url ? c`
                      <img src="${o.profile_picture_url}" alt="${o.first_name} ${o.last_name}"
                           style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                    ` : c`
                      <div style="width: 40px; height: 40px; border-radius: 50%; background: #0A66C2; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
                        ${o.first_name?.charAt(0)}${o.last_name?.charAt(0)}
                      </div>
                    `}
                    <div style="flex: 1; min-width: 0;">
                      <div class="user-name">${o.first_name} ${o.last_name}</div>
                      ${o.headline ? c`<div class="user-headline">${o.headline}</div>` : ""}
                      ${o.location ? c`<div class="user-location">📍 ${o.location}</div>` : ""}
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>

          <!-- User Detail -->
          <div class="user-detail">
            ${e ? c`
              <!-- Profile Header -->
              <div class="profile-header">
                <div class="profile-avatar">
                  ${e.first_name.charAt(0)}${e.last_name.charAt(0)}
                </div>
                <div class="profile-info">
                  <h2 class="profile-name">${e.first_name} ${e.last_name}</h2>
                  ${e.headline ? c`<p class="profile-headline">${e.headline}</p>` : ""}
                  <div class="profile-meta">
                    ${e.location ? c`<span>📍 ${e.location}</span>` : ""}
                    ${e.connections_count ? c`<span>🤝 ${e.connections_count} connections</span>` : ""}
                    ${e.network_distance ? c`<span>🌐 ${e.network_distance}</span>` : ""}
                  </div>
                </div>
              </div>

              <!-- Invitation Section -->
              ${t ? c`
                <div class="section">
                  <h3 class="section-title">Connection Request</h3>
                  <div class="invitation-card">
                    ${t.message ? c`<div class="invitation-message">"${t.message}"</div>` : ""}
                    <div style="font-size: 0.75rem; color: #666666; margin-bottom: 0.75rem;">
                      Status: <strong style="text-transform: capitalize">${t.status}</strong> •
                      Sent: ${new Date(t.sent_at).toLocaleDateString()}
                    </div>
                    ${t.status === "pending" ? c`
                      <div class="invitation-actions">
                        <button class="success" @click=${() => this.handleInviteAction(t.id, "accept_invite")}>
                          ${e.first_name} accepts
                        </button>
                        <button class="danger" @click=${() => this.handleInviteAction(t.id, "decline_invite")}>
                          ${e.first_name} declines
                        </button>
                      </div>
                    ` : ""}
                  </div>
                </div>
              ` : ""}

              <!-- Messages Section (only visible for accepted connections) -->
              ${e.network_distance === "FIRST_DEGREE" ? c`
                <div class="section">
                  <h3 class="section-title">Messages (${i.length})</h3>

                  ${i.length > 0 ? c`
                    <div class="messages-container">
                      ${i.map((o) => c`
                        <div class="message sent">
                          <div class="message-meta">
                            To: ${e.first_name} ${e.last_name} •
                            ${new Date(o.timestamp).toLocaleString()}
                          </div>
                          <div class="message-text">${o.text}</div>
                        </div>
                      `)}
                    </div>
                  ` : c`
                    <p style="color: #666666; font-size: 0.875rem; margin-bottom: 1rem;">
                      No messages yet. Start a conversation!
                    </p>
                  `}

                  <!-- Message Form -->
                  <div class="message-form">
                    <textarea
                      rows="3"
                      placeholder="${e.first_name} replies"
                      .value=${this.messageText}
                      @input=${(o) => this.messageText = o.target.value}
                    ></textarea>
                    <button
                      class="primary"
                      ?disabled=${!this.messageText.trim() || this.sending}
                      @click=${() => this.handleSendMessage(e.id)}
                    >
                      ${this.sending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              ` : c`
                <div class="section">
                  <h3 class="section-title">Messages</h3>
                  <p style="color: #666666; font-size: 0.875rem;">
                    Message thread with ${e.first_name} will show here
                  </p>
                </div>
              `}

              <!-- Delete Section (subtle, at bottom) -->
              <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #F3F2EF;">
                <details>
                  <summary style="font-size: 0.75rem; color: #999999; cursor: pointer; list-style: none; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.625rem;">▶</span> Delete user data
                  </summary>
                  <div style="margin-top: 0.75rem; padding-left: 1rem;">
                    <p style="font-size: 0.75rem; color: #999999; margin: 0 0 0.5rem 0;">
                      Remove invitations, messages, and chats for testing.
                    </p>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #999999; cursor: pointer;">
                        <input
                          type="checkbox"
                          .checked=${this.deleteFullCache}
                          @change=${(o) => {
      this.deleteFullCache = o.target.checked, this.requestUpdate();
    }}
                          style="cursor: pointer;"
                        />
                        Also delete cached profile
                      </label>
                      <button
                        class="secondary"
                        ?disabled=${this.deleting}
                        @click=${() => this.handleDeleteUser(e.id, `${e.first_name} ${e.last_name}`)}
                        style="font-size: 0.75rem; padding: 0.35rem 0.75rem;"
                      >
                        ${this.deleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            ` : c`
              <div class="empty">
                <h3>Select a user to view their profile</h3>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }
}
customElements.get("linkedin-plugin") || customElements.define("linkedin-plugin", Se);
export {
  Se as LinkedInPlugin,
  Se as default
};
