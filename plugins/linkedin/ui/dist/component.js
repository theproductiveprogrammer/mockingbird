const P = globalThis, R = P.ShadowRoot && (P.ShadyCSS === void 0 || P.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, O = Symbol(), j = /* @__PURE__ */ new WeakMap();
let X = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== O) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (R && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = j.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && j.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const re = (a) => new X(typeof a == "string" ? a : a + "", void 0, O), ae = (a, ...e) => {
  const t = a.length === 1 ? a[0] : e.reduce(((s, i, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + a[o + 1]), a[0]);
  return new X(t, a, O);
}, oe = (a, e) => {
  if (R) a.adoptedStyleSheets = e.map(((t) => t instanceof CSSStyleSheet ? t : t.styleSheet));
  else for (const t of e) {
    const s = document.createElement("style"), i = P.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = t.cssText, a.appendChild(s);
  }
}, B = R ? (a) => a : (a) => a instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return re(t);
})(a) : a;
const { is: ne, defineProperty: le, getOwnPropertyDescriptor: de, getOwnPropertyNames: ce, getOwnPropertySymbols: he, getPrototypeOf: pe } = Object, z = globalThis, q = z.trustedTypes, me = q ? q.emptyScript : "", ue = z.reactiveElementPolyfillSupport, w = (a, e) => a, M = { toAttribute(a, e) {
  switch (e) {
    case Boolean:
      a = a ? me : null;
      break;
    case Object:
    case Array:
      a = a == null ? a : JSON.stringify(a);
  }
  return a;
}, fromAttribute(a, e) {
  let t = a;
  switch (e) {
    case Boolean:
      t = a !== null;
      break;
    case Number:
      t = a === null ? null : Number(a);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(a);
      } catch {
        t = null;
      }
  }
  return t;
} }, Y = (a, e) => !ne(a, e), V = { attribute: !0, type: String, converter: M, reflect: !1, useDefault: !1, hasChanged: Y };
Symbol.metadata ??= Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let _ = class extends HTMLElement {
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
    const { get: i, set: o } = de(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: i, set(n) {
      const p = i?.call(this);
      o?.call(this, n), this.requestUpdate(e, p, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? V;
  }
  static _$Ei() {
    if (this.hasOwnProperty(w("elementProperties"))) return;
    const e = pe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(w("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(w("properties"))) {
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
      for (const i of s) t.unshift(B(i));
    } else e !== void 0 && t.push(B(e));
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
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : M).toAttribute(t, s.type);
      this._$Em = e, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, i = s._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const o = s.getPropertyOptions(i), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : M;
      this._$Em = i;
      const p = n.fromAttribute(t, o.type);
      this[i] = p ?? this._$Ej?.get(i) ?? p, this._$Em = null;
    }
  }
  requestUpdate(e, t, s) {
    if (e !== void 0) {
      const i = this.constructor, o = this[e];
      if (s ??= i.getPropertyOptions(e), !((s.hasChanged ?? Y)(o, t) || s.useDefault && s.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(i._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: i, wrapped: o }, n) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [i, o] of this._$Ep) this[i] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, o] of s) {
        const { wrapped: n } = o, p = this[i];
        n !== !0 || this._$AL.has(i) || p === void 0 || this.C(i, void 0, o, p);
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
_.elementStyles = [], _.shadowRootOptions = { mode: "open" }, _[w("elementProperties")] = /* @__PURE__ */ new Map(), _[w("finalized")] = /* @__PURE__ */ new Map(), ue?.({ ReactiveElement: _ }), (z.reactiveElementVersions ??= []).push("2.1.1");
const H = globalThis, U = H.trustedTypes, W = U ? U.createPolicy("lit-html", { createHTML: (a) => a }) : void 0, ee = "$lit$", f = `lit$${Math.random().toFixed(9).slice(2)}$`, te = "?" + f, ge = `<${te}>`, y = document, E = () => y.createComment(""), C = (a) => a === null || typeof a != "object" && typeof a != "function", N = Array.isArray, fe = (a) => N(a) || typeof a?.[Symbol.iterator] == "function", T = `[ 	
\f\r]`, x = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, K = /-->/g, G = />/g, $ = RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), J = /'/g, Z = /"/g, se = /^(?:script|style|textarea|title)$/i, $e = (a) => (e, ...t) => ({ _$litType$: a, strings: e, values: t }), d = $e(1), b = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), Q = /* @__PURE__ */ new WeakMap(), v = y.createTreeWalker(y, 129);
function ie(a, e) {
  if (!N(a) || !a.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return W !== void 0 ? W.createHTML(e) : e;
}
const ve = (a, e) => {
  const t = a.length - 1, s = [];
  let i, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = x;
  for (let p = 0; p < t; p++) {
    const r = a[p];
    let c, m, l = -1, h = 0;
    for (; h < r.length && (n.lastIndex = h, m = n.exec(r), m !== null); ) h = n.lastIndex, n === x ? m[1] === "!--" ? n = K : m[1] !== void 0 ? n = G : m[2] !== void 0 ? (se.test(m[2]) && (i = RegExp("</" + m[2], "g")), n = $) : m[3] !== void 0 && (n = $) : n === $ ? m[0] === ">" ? (n = i ?? x, l = -1) : m[1] === void 0 ? l = -2 : (l = n.lastIndex - m[2].length, c = m[1], n = m[3] === void 0 ? $ : m[3] === '"' ? Z : J) : n === Z || n === J ? n = $ : n === K || n === G ? n = x : (n = $, i = void 0);
    const g = n === $ && a[p + 1].startsWith("/>") ? " " : "";
    o += n === x ? r + ge : l >= 0 ? (s.push(c), r.slice(0, l) + ee + r.slice(l) + f + g) : r + f + (l === -2 ? p : g);
  }
  return [ie(a, o + (a[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class S {
  constructor({ strings: e, _$litType$: t }, s) {
    let i;
    this.parts = [];
    let o = 0, n = 0;
    const p = e.length - 1, r = this.parts, [c, m] = ve(e, t);
    if (this.el = S.createElement(c, s), v.currentNode = this.el.content, t === 2 || t === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (i = v.nextNode()) !== null && r.length < p; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const l of i.getAttributeNames()) if (l.endsWith(ee)) {
          const h = m[n++], g = i.getAttribute(l).split(f), k = /([.?@])?(.*)/.exec(h);
          r.push({ type: 1, index: o, name: k[2], strings: g, ctor: k[1] === "." ? _e : k[1] === "?" ? be : k[1] === "@" ? Ae : I }), i.removeAttribute(l);
        } else l.startsWith(f) && (r.push({ type: 6, index: o }), i.removeAttribute(l));
        if (se.test(i.tagName)) {
          const l = i.textContent.split(f), h = l.length - 1;
          if (h > 0) {
            i.textContent = U ? U.emptyScript : "";
            for (let g = 0; g < h; g++) i.append(l[g], E()), v.nextNode(), r.push({ type: 2, index: ++o });
            i.append(l[h], E());
          }
        }
      } else if (i.nodeType === 8) if (i.data === te) r.push({ type: 2, index: o });
      else {
        let l = -1;
        for (; (l = i.data.indexOf(f, l + 1)) !== -1; ) r.push({ type: 7, index: o }), l += f.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const s = y.createElement("template");
    return s.innerHTML = e, s;
  }
}
function A(a, e, t = a, s) {
  if (e === b) return e;
  let i = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const o = C(e) ? void 0 : e._$litDirective$;
  return i?.constructor !== o && (i?._$AO?.(!1), o === void 0 ? i = void 0 : (i = new o(a), i._$AT(a, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = i : t._$Cl = i), i !== void 0 && (e = A(a, i._$AS(a, e.values), i, s)), e;
}
class ye {
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
    const { el: { content: t }, parts: s } = this._$AD, i = (e?.creationScope ?? y).importNode(t, !0);
    v.currentNode = i;
    let o = v.nextNode(), n = 0, p = 0, r = s[0];
    for (; r !== void 0; ) {
      if (n === r.index) {
        let c;
        r.type === 2 ? c = new D(o, o.nextSibling, this, e) : r.type === 1 ? c = new r.ctor(o, r.name, r.strings, this, e) : r.type === 6 && (c = new xe(o, this, e)), this._$AV.push(c), r = s[++p];
      }
      n !== r?.index && (o = v.nextNode(), n++);
    }
    return v.currentNode = y, i;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class D {
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
    e = A(this, e, t), C(e) ? e === u || e == null || e === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : e !== this._$AH && e !== b && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : fe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== u && C(this._$AH) ? this._$AA.nextSibling.data = e : this.T(y.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, i = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = S.createElement(ie(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(t);
    else {
      const o = new ye(i, this), n = o.u(this.options);
      o.p(t), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Q.get(e.strings);
    return t === void 0 && Q.set(e.strings, t = new S(e)), t;
  }
  k(e) {
    N(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, i = 0;
    for (const o of e) i === t.length ? t.push(s = new D(this.O(E()), this.O(E()), this, this.options)) : s = t[i], s._$AI(o), i++;
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
class I {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, i, o) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = u;
  }
  _$AI(e, t = this, s, i) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = A(this, e, t, 0), n = !C(e) || e !== this._$AH && e !== b, n && (this._$AH = e);
    else {
      const p = e;
      let r, c;
      for (e = o[0], r = 0; r < o.length - 1; r++) c = A(this, p[s + r], t, r), c === b && (c = this._$AH[r]), n ||= !C(c) || c !== this._$AH[r], c === u ? e = u : e !== u && (e += (c ?? "") + o[r + 1]), this._$AH[r] = c;
    }
    n && !i && this.j(e);
  }
  j(e) {
    e === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class _e extends I {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === u ? void 0 : e;
  }
}
class be extends I {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== u);
  }
}
class Ae extends I {
  constructor(e, t, s, i, o) {
    super(e, t, s, i, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = A(this, e, t, 0) ?? u) === b) return;
    const s = this._$AH, i = e === u && s !== u || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, o = e !== u && (s === u || i);
    i && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
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
const we = H.litHtmlPolyfillSupport;
we?.(S, D), (H.litHtmlVersions ??= []).push("3.3.1");
const Fe = (a, e, t) => {
  const s = t?.renderBefore ?? e;
  let i = s._$litPart$;
  if (i === void 0) {
    const o = t?.renderBefore ?? null;
    s._$litPart$ = i = new D(e.insertBefore(E(), o), o, void 0, t ?? {});
  }
  return i._$AI(a), i;
};
const L = globalThis;
class F extends _ {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Fe(t, this.renderRoot, this.renderOptions);
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
F._$litElement$ = !0, F.finalized = !0, L.litElementHydrateSupport?.({ LitElement: F });
const Ee = L.litElementPolyfillSupport;
Ee?.({ LitElement: F });
(L.litElementVersions ??= []).push("4.2.1");
class Ce extends F {
  static properties = {
    api: { type: Object },
    userData: { type: Object, state: !0 },
    selectedUserId: { type: String, state: !0 },
    expandedPostId: { type: String, state: !0 },
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
  expandedPostId = null;
  // Track which post is expanded
  showAllUsers = !1;
  // By default, show only users with invites or messages
  loading = !0;
  error = null;
  messageText = "";
  sending = !1;
  deleteFullCache = !1;
  // Checkbox state for full delete
  deleting = !1;
  static styles = ae`
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
    .message.received { border-left-color: #057642; background: #F0FFF4; }
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

    /* Tabs */
    .tabs { display: flex; gap: 0; margin-bottom: 1.5rem; background: #FFFFFF; border-radius: 8px; border: 1px solid #E0DFDC; overflow: hidden; }
    .tab { flex: 1; padding: 1rem; text-align: center; cursor: pointer; font-weight: 600; font-size: 0.875rem; color: #666666; border: none; background: transparent; transition: all 0.2s; }
    .tab:hover { background: #F3F2EF; }
    .tab.active { background: #0A66C2; color: white; }

    /* Posts */
    .post-item { padding: 1rem; border-bottom: 1px solid #E0DFDC; cursor: pointer; transition: background 0.2s; }
    .post-item:hover { background: #F3F2EF; }
    .post-item.selected { background: #E7F3FF; border-left: 3px solid #0A66C2; }
    .post-text { font-size: 0.875rem; color: #000000; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .post-meta { font-size: 0.75rem; color: #666666; display: flex; gap: 1rem; align-items: center; }
    .post-stats { display: flex; gap: 0.75rem; }
    .post-stat { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; }
    .post-stat.reactions { color: #0A66C2; }
    .post-stat.comments { color: #057642; }

    .activity-card { background: #F3F2EF; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; }
    .activity-card.reaction { border-left: 3px solid #0A66C2; }
    .activity-card.comment { border-left: 3px solid #057642; }
    .activity-type { font-size: 0.75rem; font-weight: 600; color: #666666; margin-bottom: 0.25rem; text-transform: uppercase; }
    .activity-text { font-size: 0.875rem; color: #000000; }
    .activity-meta { font-size: 0.75rem; color: #999999; margin-top: 0.25rem; }
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
        throw new Error(e.message || "Failed to load user data");
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
        const o = await this.api.action("delete_user_data", e, {
          fullDelete: this.deleteFullCache
        });
        if (o.success) {
          const n = o.result?.deleted || {}, p = `Deleted:
- ${n.invitations || 0} invitation(s)
- ${n.chats || 0} chat(s)
- ${n.messages || 0} message(s)` + (this.deleteFullCache ? `
- ${n.profile || 0} cached profile(s)` : "");
          alert(p), this.selectedUserId = null, this.deleteFullCache = !1, await this.loadData();
        } else
          alert(o.message || "Failed to delete user data");
      } catch (o) {
        alert(o instanceof Error ? o.message : "Failed to delete user data");
      } finally {
        this.deleting = !1;
      }
  }
  async handleDeleteReaction(e) {
    try {
      const t = await this.api.action("delete_reaction", e);
      t.success ? await this.loadData() : alert(t.message || "Failed to delete reaction");
    } catch (t) {
      alert(t instanceof Error ? t.message : "Failed to delete reaction");
    }
  }
  async handleDeleteComment(e) {
    try {
      const t = await this.api.action("delete_comment", e);
      t.success ? await this.loadData() : alert(t.message || "Failed to delete comment");
    } catch (t) {
      alert(t instanceof Error ? t.message : "Failed to delete comment");
    }
  }
  async handleClearPostsCache() {
    if (confirm(`Are you sure you want to clear all posts data?

This will remove:
- All cached posts
- All intercepted reactions
- All intercepted comments`))
      try {
        const e = await this.api.action("clear_posts_cache", "all");
        e.success ? (this.selectedPostId = null, await this.loadData()) : alert(e.message || "Failed to clear posts cache");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to clear posts cache");
      }
  }
  render() {
    if (this.loading)
      return d`<div class="loading">Loading LinkedIn data...</div>`;
    if (this.error)
      return d`
        <div class="error">
          <h3>Error</h3>
          <p>${this.error}</p>
          <button class="danger" @click=${() => this.loadData()}>Retry</button>
        </div>
      `;
    if (!this.userData)
      return d`<div class="empty"><h3>No data available</h3></div>`;
    const e = this.selectedUserId ? this.userData?.users?.find((r) => r.id === this.selectedUserId || r.provider_id === this.selectedUserId) : null, t = e ? this.userData?.invitations?.find((r) => r.recipient_id === e.provider_id || r.recipient_id === e.id) : null, s = e ? this.userData?.chats?.find(
      (r) => r.attendee_provider_id === e.provider_id || r.attendee_provider_id === e.id
    ) : null, i = s ? (this.userData?.messages || []).filter((r) => r.chat_id === s.id) : [], o = e?.posts || [], n = this.userData?.users || [], p = this.showAllUsers ? n : n.filter((r) => {
      const c = this.userData?.invitations?.some(
        (h) => h.recipient_id === r.provider_id || h.recipient_id === r.id
      ), m = this.userData?.chats?.some(
        (h) => h.attendee_provider_id === r.provider_id || h.attendee_provider_id === r.id
      ), l = r.posts?.some(
        (h) => (h.intercepted_reaction_count || 0) > 0 || (h.intercepted_comment_count || 0) > 0
      );
      return c || m || l;
    });
    return d`
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1>LinkedIn Plugin</h1>
              <p>Manage connections, invitations, messages, and post activity</p>
            </div>
            <button
              class="secondary"
              @click=${() => this.loadData()}
              ?disabled=${this.loading}
            >
              ${this.loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats" style="grid-template-columns: repeat(6, 1fr);">
          <div class="stat-card">
            <div class="stat-label">Users</div>
            <div class="stat-value">${this.userData?.stats?.total_users || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Connections</div>
            <div class="stat-value">${this.userData?.stats?.connections || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Invites</div>
            <div class="stat-value">${this.userData?.stats?.pending_invites || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Messages</div>
            <div class="stat-value">${this.userData?.stats?.total_messages || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Reactions</div>
            <div class="stat-value">${this.userData?.stats?.total_reactions || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Comments</div>
            <div class="stat-value">${this.userData?.stats?.total_comments || 0}</div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- User List -->
          <div class="user-list">
            <div class="user-list-header" style="display: flex; justify-content: space-between; align-items: center;">
              <span>Users (${p.length})</span>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: normal; cursor: pointer; opacity: 0.6;">
                <input
                  type="checkbox"
                  .checked=${this.showAllUsers}
                  @change=${(r) => {
      this.showAllUsers = r.target.checked, this.requestUpdate();
    }}
                  style="cursor: pointer;"
                />
                Show cached
              </label>
            </div>
            ${p.map((r) => {
      const c = this.selectedUserId === r.id || this.selectedUserId === r.provider_id, m = (r.posts || []).reduce((l, h) => l + (h.intercepted_reaction_count || 0) + (h.intercepted_comment_count || 0), 0);
      return d`
                <div
                  class="user-item ${c ? "selected" : ""}"
                  @click=${() => {
        this.selectedUserId = r.id, this.expandedPostId = null, this.requestUpdate();
      }}
                >
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    ${r.profile_picture_url ? d`
                      <img src="${r.profile_picture_url}" alt="${r.first_name} ${r.last_name}"
                           style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                    ` : d`
                      <div style="width: 40px; height: 40px; border-radius: 50%; background: #0A66C2; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
                        ${r.first_name?.charAt(0)}${r.last_name?.charAt(0)}
                      </div>
                    `}
                    <div style="flex: 1; min-width: 0;">
                      <div class="user-name">${r.first_name} ${r.last_name}</div>
                      ${r.headline ? d`<div class="user-headline">${r.headline}</div>` : ""}
                      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                        ${r.location ? d`<span class="user-location">📍 ${r.location}</span>` : ""}
                        ${(r.posts?.length || 0) > 0 ? d`
                          <span style="font-size: 0.7rem; color: #666;">📝 ${r.posts?.length} posts</span>
                        ` : ""}
                        ${m > 0 ? d`
                          <span style="font-size: 0.7rem; color: #0A66C2;">⚡ ${m} activity</span>
                        ` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>

          <!-- User Detail -->
          <div class="user-detail" style="overflow-y: auto; max-height: 600px;">
            ${e ? d`
              <!-- Profile Header -->
              <div class="profile-header">
                <div class="profile-avatar">
                  ${e.first_name.charAt(0)}${e.last_name.charAt(0)}
                </div>
                <div class="profile-info">
                  <h2 class="profile-name">${e.first_name} ${e.last_name}</h2>
                  ${e.headline ? d`<p class="profile-headline">${e.headline}</p>` : ""}
                  <div class="profile-meta">
                    ${e.location ? d`<span>📍 ${e.location}</span>` : ""}
                    ${e.connections_count ? d`<span>🤝 ${e.connections_count} connections</span>` : ""}
                    ${e.network_distance ? d`<span>🌐 ${e.network_distance}</span>` : ""}
                  </div>
                </div>
              </div>

              <!-- Invitation Section -->
              ${t ? d`
                <div class="section">
                  <h3 class="section-title">Connection Request</h3>
                  <div class="invitation-card">
                    ${t.message ? d`<div class="invitation-message">"${t.message}"</div>` : ""}
                    <div style="font-size: 0.75rem; color: #666666; margin-bottom: 0.75rem;">
                      Status: <strong style="text-transform: capitalize">${t.status}</strong> •
                      Sent: ${new Date(t.sent_at).toLocaleDateString()}
                    </div>
                    ${t.status === "pending" ? d`
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
              ${e.network_distance === "FIRST_DEGREE" ? d`
                <div class="section">
                  <h3 class="section-title">Messages (${i.length})</h3>

                  ${i.length > 0 ? d`
                    <div class="messages-container">
                      ${i.map((r) => {
      const c = r.is_sender === 1;
      return d`
                          <div class="message ${c ? "sent" : "received"}">
                            <div class="message-meta">
                              ${c ? `To: ${e.first_name} ${e.last_name}` : `From: ${e.first_name} ${e.last_name}`} •
                              ${new Date(r.timestamp).toLocaleString()}
                            </div>
                            <div class="message-text">${r.text}</div>
                          </div>
                        `;
    })}
                    </div>
                  ` : d`
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
                      @input=${(r) => {
      this.messageText = r.target.value, this.requestUpdate();
    }}
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
              ` : ""}

              <!-- Posts Section -->
              ${o.length > 0 ? d`
                <div class="section">
                  <h3 class="section-title">Posts (${o.length})</h3>
                  ${o.map((r) => {
      const c = this.expandedPostId === (r.id || r.social_id), m = (r.intercepted_reaction_count || 0) > 0 || (r.intercepted_comment_count || 0) > 0;
      return d`
                      <div
                        class="post-item"
                        style="cursor: pointer; border: 1px solid #E0DFDC; border-radius: 8px; margin-bottom: 0.75rem; ${c ? "border-color: #0A66C2;" : ""}"
                        @click=${() => {
        this.expandedPostId = c ? null : r.id || r.social_id || null, this.requestUpdate();
      }}
                      >
                        <div class="post-text" style="${c ? "-webkit-line-clamp: unset;" : ""}">${r.text || "(No text)"}</div>
                        <div class="post-meta">
                          ${r.created_at ? d`<span>${new Date(r.created_at).toLocaleDateString()}</span>` : ""}
                          <span style="opacity: 0.6;">Original: ${r.reaction_counter || 0} reactions, ${r.comment_counter || 0} comments</span>
                        </div>
                        ${m ? d`
                          <div class="post-stats" style="margin-top: 0.5rem;">
                            ${(r.intercepted_reaction_count || 0) > 0 ? d`
                              <span class="post-stat reactions">👍 ${r.intercepted_reaction_count} intercepted</span>
                            ` : ""}
                            ${(r.intercepted_comment_count || 0) > 0 ? d`
                              <span class="post-stat comments">💬 ${r.intercepted_comment_count} intercepted</span>
                            ` : ""}
                          </div>
                        ` : ""}

                        <!-- Expanded View: Reactions and Comments -->
                        ${c && m ? d`
                          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E0DFDC;">
                            <!-- Intercepted Reactions -->
                            ${(r.intercepted_reactions?.length || 0) > 0 ? d`
                              <div style="margin-bottom: 1rem;">
                                <h4 style="font-size: 0.75rem; color: #666; margin: 0 0 0.5rem 0; text-transform: uppercase;">Reactions</h4>
                                ${r.intercepted_reactions?.map((l) => d`
                                  <div class="activity-card reaction">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                      <div>
                                        <div class="activity-type">${l.reaction_type || "LIKE"}</div>
                                        <div class="activity-meta">
                                          ${new Date(l.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        class="secondary"
                                        style="font-size: 0.625rem; padding: 0.25rem 0.5rem;"
                                        @click=${(h) => {
        h.stopPropagation(), this.handleDeleteReaction(l.id);
      }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                `)}
                              </div>
                            ` : ""}

                            <!-- Intercepted Comments -->
                            ${(r.intercepted_comments?.length || 0) > 0 ? d`
                              <div>
                                <h4 style="font-size: 0.75rem; color: #666; margin: 0 0 0.5rem 0; text-transform: uppercase;">Comments</h4>
                                ${r.intercepted_comments?.map((l) => d`
                                  <div class="activity-card comment">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                      <div style="flex: 1;">
                                        <div class="activity-text">${l.text}</div>
                                        <div class="activity-meta">
                                          ${new Date(l.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        class="secondary"
                                        style="font-size: 0.625rem; padding: 0.25rem 0.5rem;"
                                        @click=${(h) => {
        h.stopPropagation(), this.handleDeleteComment(l.id);
      }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                `)}
                              </div>
                            ` : ""}
                          </div>
                        ` : ""}
                      </div>
                    `;
    })}
                </div>
              ` : ""}

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
                          @change=${(r) => {
      this.deleteFullCache = r.target.checked, this.requestUpdate();
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
            ` : d`
              <div class="empty">
                <h3>Select a user to view their profile</h3>
                <p style="color: #666666; font-size: 0.875rem; margin-top: 0.5rem;">
                  Users with invites, messages, or post activity will be shown.
                </p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }
}
customElements.get("linkedin-plugin") || customElements.define("linkedin-plugin", Ce);
export {
  Ce as LinkedInPlugin,
  Ce as default
};
