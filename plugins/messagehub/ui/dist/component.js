const U = globalThis, H = U.ShadowRoot && (U.ShadyCSS === void 0 || U.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, N = Symbol(), j = /* @__PURE__ */ new WeakMap();
let X = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== N) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (H && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = j.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && j.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ae = (n) => new X(typeof n == "string" ? n : n + "", void 0, N), re = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce(((s, i, r) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + n[r + 1]), n[0]);
  return new X(t, n, N);
}, ne = (n, e) => {
  if (H) n.adoptedStyleSheets = e.map(((t) => t instanceof CSSStyleSheet ? t : t.styleSheet));
  else for (const t of e) {
    const s = document.createElement("style"), i = U.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = t.cssText, n.appendChild(s);
  }
}, W = H ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return ae(t);
})(n) : n;
const { is: oe, defineProperty: le, getOwnPropertyDescriptor: de, getOwnPropertyNames: ce, getOwnPropertySymbols: he, getPrototypeOf: pe } = Object, z = globalThis, B = z.trustedTypes, me = B ? B.emptyScript : "", ue = z.reactiveElementPolyfillSupport, A = (n, e) => n, I = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? me : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, e) {
  let t = n;
  switch (e) {
    case Boolean:
      t = n !== null;
      break;
    case Number:
      t = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(n);
      } catch {
        t = null;
      }
  }
  return t;
} }, Y = (n, e) => !oe(n, e), q = { attribute: !0, type: String, converter: I, reflect: !1, useDefault: !1, hasChanged: Y };
Symbol.metadata ??= Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let b = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = q) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(e, s, t);
      i !== void 0 && le(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: i, set: r } = de(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: i, set(o) {
      const m = i?.call(this);
      r?.call(this, o), this.requestUpdate(e, m, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? q;
  }
  static _$Ei() {
    if (this.hasOwnProperty(A("elementProperties"))) return;
    const e = pe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(A("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(A("properties"))) {
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
      for (const i of s) t.unshift(W(i));
    } else e !== void 0 && t.push(W(e));
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
    return ne(e, this.constructor.elementStyles), e;
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
      const r = (s.converter?.toAttribute !== void 0 ? s.converter : I).toAttribute(t, s.type);
      this._$Em = e, r == null ? this.removeAttribute(i) : this.setAttribute(i, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, i = s._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const r = s.getPropertyOptions(i), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : I;
      this._$Em = i;
      const m = o.fromAttribute(t, r.type);
      this[i] = m ?? this._$Ej?.get(i) ?? m, this._$Em = null;
    }
  }
  requestUpdate(e, t, s) {
    if (e !== void 0) {
      const i = this.constructor, r = this[e];
      if (s ??= i.getPropertyOptions(e), !((s.hasChanged ?? Y)(r, t) || s.useDefault && s.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(i._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: i, wrapped: r }, o) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [i, r] of this._$Ep) this[i] = r;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, r] of s) {
        const { wrapped: o } = r, m = this[i];
        o !== !0 || this._$AL.has(i) || m === void 0 || this.C(i, void 0, r, m);
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
b.elementStyles = [], b.shadowRootOptions = { mode: "open" }, b[A("elementProperties")] = /* @__PURE__ */ new Map(), b[A("finalized")] = /* @__PURE__ */ new Map(), ue?.({ ReactiveElement: b }), (z.reactiveElementVersions ??= []).push("2.1.1");
const R = globalThis, P = R.trustedTypes, V = P ? P.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, ee = "$lit$", f = `lit$${Math.random().toFixed(9).slice(2)}$`, te = "?" + f, ge = `<${te}>`, y = document, F = () => y.createComment(""), E = (n) => n === null || typeof n != "object" && typeof n != "function", O = Array.isArray, fe = (n) => O(n) || typeof n?.[Symbol.iterator] == "function", M = `[ 	
\f\r]`, x = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, K = /-->/g, J = />/g, v = RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Z = /'/g, G = /"/g, se = /^(?:script|style|textarea|title)$/i, ve = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), l = ve(1), _ = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), Q = /* @__PURE__ */ new WeakMap(), $ = y.createTreeWalker(y, 129);
function ie(n, e) {
  if (!O(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return V !== void 0 ? V.createHTML(e) : e;
}
const $e = (n, e) => {
  const t = n.length - 1, s = [];
  let i, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = x;
  for (let m = 0; m < t; m++) {
    const a = n[m];
    let c, p, d = -1, h = 0;
    for (; h < a.length && (o.lastIndex = h, p = o.exec(a), p !== null); ) h = o.lastIndex, o === x ? p[1] === "!--" ? o = K : p[1] !== void 0 ? o = J : p[2] !== void 0 ? (se.test(p[2]) && (i = RegExp("</" + p[2], "g")), o = v) : p[3] !== void 0 && (o = v) : o === v ? p[0] === ">" ? (o = i ?? x, d = -1) : p[1] === void 0 ? d = -2 : (d = o.lastIndex - p[2].length, c = p[1], o = p[3] === void 0 ? v : p[3] === '"' ? G : Z) : o === G || o === Z ? o = v : o === K || o === J ? o = x : (o = v, i = void 0);
    const g = o === v && n[m + 1].startsWith("/>") ? " " : "";
    r += o === x ? a + ge : d >= 0 ? (s.push(c), a.slice(0, d) + ee + a.slice(d) + f + g) : a + f + (d === -2 ? m : g);
  }
  return [ie(n, r + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class D {
  constructor({ strings: e, _$litType$: t }, s) {
    let i;
    this.parts = [];
    let r = 0, o = 0;
    const m = e.length - 1, a = this.parts, [c, p] = $e(e, t);
    if (this.el = D.createElement(c, s), $.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (i = $.nextNode()) !== null && a.length < m; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const d of i.getAttributeNames()) if (d.endsWith(ee)) {
          const h = p[o++], g = i.getAttribute(d).split(f), k = /([.?@])?(.*)/.exec(h);
          a.push({ type: 1, index: r, name: k[2], strings: g, ctor: k[1] === "." ? be : k[1] === "?" ? _e : k[1] === "@" ? we : T }), i.removeAttribute(d);
        } else d.startsWith(f) && (a.push({ type: 6, index: r }), i.removeAttribute(d));
        if (se.test(i.tagName)) {
          const d = i.textContent.split(f), h = d.length - 1;
          if (h > 0) {
            i.textContent = P ? P.emptyScript : "";
            for (let g = 0; g < h; g++) i.append(d[g], F()), $.nextNode(), a.push({ type: 2, index: ++r });
            i.append(d[h], F());
          }
        }
      } else if (i.nodeType === 8) if (i.data === te) a.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = i.data.indexOf(f, d + 1)) !== -1; ) a.push({ type: 7, index: r }), d += f.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const s = y.createElement("template");
    return s.innerHTML = e, s;
  }
}
function w(n, e, t = n, s) {
  if (e === _) return e;
  let i = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const r = E(e) ? void 0 : e._$litDirective$;
  return i?.constructor !== r && (i?._$AO?.(!1), r === void 0 ? i = void 0 : (i = new r(n), i._$AT(n, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = i : t._$Cl = i), i !== void 0 && (e = w(n, i._$AS(n, e.values), i, s)), e;
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
    $.currentNode = i;
    let r = $.nextNode(), o = 0, m = 0, a = s[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let c;
        a.type === 2 ? c = new S(r, r.nextSibling, this, e) : a.type === 1 ? c = new a.ctor(r, a.name, a.strings, this, e) : a.type === 6 && (c = new xe(r, this, e)), this._$AV.push(c), a = s[++m];
      }
      o !== a?.index && (r = $.nextNode(), o++);
    }
    return $.currentNode = y, i;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class S {
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
    e = w(this, e, t), E(e) ? e === u || e == null || e === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : e !== this._$AH && e !== _ && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : fe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== u && E(this._$AH) ? this._$AA.nextSibling.data = e : this.T(y.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, i = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = D.createElement(ie(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(t);
    else {
      const r = new ye(i, this), o = r.u(this.options);
      r.p(t), this.T(o), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = Q.get(e.strings);
    return t === void 0 && Q.set(e.strings, t = new D(e)), t;
  }
  k(e) {
    O(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, i = 0;
    for (const r of e) i === t.length ? t.push(s = new S(this.O(F()), this.O(F()), this, this.options)) : s = t[i], s._$AI(r), i++;
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
class T {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, i, r) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = r, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = u;
  }
  _$AI(e, t = this, s, i) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = w(this, e, t, 0), o = !E(e) || e !== this._$AH && e !== _, o && (this._$AH = e);
    else {
      const m = e;
      let a, c;
      for (e = r[0], a = 0; a < r.length - 1; a++) c = w(this, m[s + a], t, a), c === _ && (c = this._$AH[a]), o ||= !E(c) || c !== this._$AH[a], c === u ? e = u : e !== u && (e += (c ?? "") + r[a + 1]), this._$AH[a] = c;
    }
    o && !i && this.j(e);
  }
  j(e) {
    e === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class be extends T {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === u ? void 0 : e;
  }
}
class _e extends T {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== u);
  }
}
class we extends T {
  constructor(e, t, s, i, r) {
    super(e, t, s, i, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = w(this, e, t, 0) ?? u) === _) return;
    const s = this._$AH, i = e === u && s !== u || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, r = e !== u && (s === u || i);
    i && this.element.removeEventListener(this.name, this, s), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
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
    w(this, e);
  }
}
const Ae = R.litHtmlPolyfillSupport;
Ae?.(D, S), (R.litHtmlVersions ??= []).push("3.3.1");
const Ce = (n, e, t) => {
  const s = t?.renderBefore ?? e;
  let i = s._$litPart$;
  if (i === void 0) {
    const r = t?.renderBefore ?? null;
    s._$litPart$ = i = new S(e.insertBefore(F(), r), r, void 0, t ?? {});
  }
  return i._$AI(n), i;
};
const L = globalThis;
class C extends b {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ce(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return _;
  }
}
C._$litElement$ = !0, C.finalized = !0, L.litElementHydrateSupport?.({ LitElement: C });
const Fe = L.litElementPolyfillSupport;
Fe?.({ LitElement: C });
(L.litElementVersions ??= []).push("4.2.1");
class Ee extends C {
  static properties = {
    api: { type: Object },
    activeTab: { type: String, state: !0 },
    // LinkedIn state
    userData: { type: Object, state: !0 },
    selectedUserId: { type: String, state: !0 },
    expandedPostId: { type: String, state: !0 },
    showAllUsers: { type: Boolean, state: !0 },
    deleteFullCache: { type: Boolean, state: !0 },
    // WhatsApp state
    whatsappData: { type: Object, state: !0 },
    selectedChatId: { type: String, state: !0 },
    newContactPhone: { type: String, state: !0 },
    newContactName: { type: String, state: !0 },
    // Common state
    loading: { type: Boolean, state: !0 },
    error: { type: String, state: !0 },
    messageText: { type: String, state: !0 },
    sending: { type: Boolean, state: !0 },
    deleting: { type: Boolean, state: !0 }
  };
  api;
  activeTab = "linkedin";
  // LinkedIn state
  userData = null;
  selectedUserId = null;
  expandedPostId = null;
  showAllUsers = !1;
  deleteFullCache = !1;
  // WhatsApp state
  whatsappData = null;
  selectedChatId = null;
  newContactPhone = "";
  newContactName = "";
  // Common state
  loading = !0;
  error = null;
  messageText = "";
  sending = !1;
  deleting = !1;
  static styles = re`
    :host {
      display: block;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F3F2EF;
    }

    .container { padding: 1.5rem; min-height: 600px; }
    .header { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .header h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #000000; font-weight: 600; }
    .header p { margin: 0; font-size: 0.875rem; color: #666666; }

    /* Tab styles */
    .tabs { display: flex; gap: 0; margin-bottom: 1.5rem; background: #FFFFFF; border-radius: 8px; border: 1px solid #E0DFDC; overflow: hidden; }
    .tab { flex: 1; padding: 1rem; text-align: center; cursor: pointer; font-weight: 600; font-size: 0.875rem; color: #666666; border: none; background: transparent; transition: all 0.2s; }
    .tab:hover { background: #F3F2EF; }
    .tab.active.linkedin { background: #0A66C2; color: white; }
    .tab.active.whatsapp { background: #25D366; color: white; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1rem; }
    .stat-label { font-size: 0.75rem; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 600; color: #000000; }

    .main-content { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }

    .user-list, .chat-list { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; max-height: 600px; overflow-y: auto; }
    .user-list-header, .chat-list-header { padding: 1rem; border-bottom: 1px solid #E0DFDC; background: #F3F2EF; font-weight: 600; font-size: 0.875rem; color: #000000; }

    .user-item, .chat-item { padding: 1rem; border-bottom: 1px solid #E0DFDC; cursor: pointer; transition: background 0.2s; }
    .user-item:hover, .chat-item:hover { background: #F3F2EF; }
    .user-item.selected { background: #E7F3FF; border-left: 3px solid #0A66C2; }
    .chat-item.selected { background: #DCF8C6; border-left: 3px solid #25D366; }
    .user-name, .chat-name { font-weight: 600; color: #000000; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .user-headline, .chat-phone { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-location { font-size: 0.75rem; color: #666666; display: flex; align-items: center; gap: 0.25rem; }
    .chat-preview { font-size: 0.75rem; color: #999999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .user-detail, .chat-detail { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1.5rem; }
    .profile-header { display: flex; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid #E0DFDC; margin-bottom: 1.5rem; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: #F3F2EF; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; color: #0A66C2; }
    .profile-avatar.whatsapp { color: #25D366; }
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
    .messages-container.whatsapp { background: #ECE5DD; }
    .message { background: #FFFFFF; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; border-left: 3px solid #E0DFDC; }
    .message.sent { border-left-color: #0A66C2; background: #E7F3FF; }
    .message.received { border-left-color: #057642; background: #F0FFF4; }
    .message.wa-sent { border-left: none; background: #DCF8C6; margin-left: 2rem; border-radius: 8px 0 8px 8px; }
    .message.wa-received { border-left: none; background: #FFFFFF; margin-right: 2rem; border-radius: 0 8px 8px 8px; }
    .message-meta { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; }
    .message-text { font-size: 0.875rem; color: #000000; }
    .message-time { font-size: 0.625rem; color: #999999; text-align: right; margin-top: 0.25rem; }

    .message-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .message-form textarea { padding: 0.75rem; font-size: 0.875rem; border: 1px solid #E0DFDC; border-radius: 8px; font-family: inherit; resize: vertical; }
    .message-form textarea:focus { outline: none; border-color: #0A66C2; }
    .message-form.whatsapp textarea:focus { border-color: #25D366; }

    .new-contact-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .new-contact-form input { padding: 0.5rem; font-size: 0.875rem; border: 1px solid #E0DFDC; border-radius: 4px; font-family: inherit; }
    .new-contact-form input:focus { outline: none; border-color: #25D366; }

    button { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 24px; cursor: pointer; font-family: inherit; font-weight: 600; transition: all 0.2s; }
    button.primary { background: #0A66C2; color: white; }
    button.primary:hover { background: #004182; }
    button.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    button.primary.whatsapp { background: #25D366; }
    button.primary.whatsapp:hover { background: #128C7E; }
    button.secondary { background: #FFFFFF; color: #0A66C2; border: 1px solid #0A66C2; }
    button.secondary:hover { background: #E7F3FF; }
    button.secondary.whatsapp { color: #25D366; border-color: #25D366; }
    button.secondary.whatsapp:hover { background: #DCF8C6; }
    button.success { background: #057642; color: white; }
    button.success:hover { background: #045A32; }
    button.danger { background: #CC1016; color: white; }
    button.danger:hover { background: #A00D12; }

    .loading, .error, .empty { text-align: center; padding: 3rem 1.5rem; background: #FFFFFF; border-radius: 8px; }
    .error { background: #FEF2F2; border: 1px solid #FCA5A5; }
    .error h3 { font-size: 1rem; font-weight: 600; color: #991B1B; margin: 0 0 0.5rem 0; }
    .error p { font-size: 0.875rem; color: #B91C1C; margin: 0 0 1rem 0; }
    .empty h3 { font-size: 1rem; color: #666666; margin: 0; }

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
    console.log("[MessageHub Plugin] firstUpdated called, api:", this.api), this.loadData();
  }
  async loadData() {
    if (console.log("[MessageHub Plugin] loadData called"), !this.api) {
      console.error("[MessageHub Plugin] API not initialized"), this.error = "API not initialized", this.loading = !1, this.requestUpdate();
      return;
    }
    try {
      this.loading = !0, this.error = null;
      const [e, t] = await Promise.all([
        this.api.action("load_user_data", "all"),
        this.api.action("load_whatsapp_data", "all")
      ]);
      console.log("[MessageHub Plugin] LinkedIn result:", e), console.log("[MessageHub Plugin] WhatsApp result:", t), e.success && (this.userData = e.result?.data || e.data), t.success && (this.whatsappData = t.result?.data || t.data);
    } catch (e) {
      console.error("[MessageHub Plugin] Error:", e), this.error = e instanceof Error ? e.message : "Failed to load data";
    } finally {
      this.loading = !1, this.requestUpdate();
    }
  }
  // LinkedIn handlers
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
        const r = await this.api.action("delete_user_data", e, {
          fullDelete: this.deleteFullCache
        });
        r.success ? (this.selectedUserId = null, this.deleteFullCache = !1, await this.loadData()) : alert(r.message || "Failed to delete user data");
      } catch (r) {
        alert(r instanceof Error ? r.message : "Failed to delete user data");
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
  // WhatsApp handlers
  async handleStartWhatsAppChat() {
    if (!this.newContactPhone.trim()) {
      alert("Phone number is required");
      return;
    }
    try {
      this.sending = !0;
      const e = await this.api.action("start_whatsapp_chat", "new", {
        phone: this.newContactPhone,
        name: this.newContactName || this.newContactPhone
      });
      e.success ? (this.newContactPhone = "", this.newContactName = "", this.selectedChatId = e.result?.chat_id || e.chat_id, await this.loadData()) : alert(e.message || "Failed to start chat");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to start chat");
    } finally {
      this.sending = !1;
    }
  }
  async handleSendWhatsAppMessage() {
    if (!(!this.messageText.trim() || !this.selectedChatId))
      try {
        this.sending = !0;
        const e = await this.api.action("send_whatsapp_message", this.selectedChatId, {
          text: this.messageText
        });
        e.success ? (this.messageText = "", await this.loadData()) : alert(e.message || "Failed to send message");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to send message");
      } finally {
        this.sending = !1;
      }
  }
  async handleSimulateIncomingMessage() {
    if (!(!this.messageText.trim() || !this.selectedChatId))
      try {
        this.sending = !0;
        const e = await this.api.action("simulate_incoming_message", this.selectedChatId, {
          text: this.messageText
        });
        e.success ? (this.messageText = "", await this.loadData()) : alert(e.message || "Failed to simulate message");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to simulate message");
      } finally {
        this.sending = !1;
      }
  }
  async handleDeleteWhatsAppChat(e) {
    if (confirm("Are you sure you want to delete this chat and all its messages?"))
      try {
        const t = await this.api.action("delete_whatsapp_chat", e);
        t.success ? (this.selectedChatId = null, await this.loadData()) : alert(t.message || "Failed to delete chat");
      } catch (t) {
        alert(t instanceof Error ? t.message : "Failed to delete chat");
      }
  }
  async handleClearWhatsAppData() {
    if (confirm(`Are you sure you want to clear ALL WhatsApp data?

This will remove:
- All contacts
- All chats
- All messages`))
      try {
        const e = await this.api.action("clear_whatsapp_data", "all");
        e.success ? (this.selectedChatId = null, await this.loadData()) : alert(e.message || "Failed to clear WhatsApp data");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to clear WhatsApp data");
      }
  }
  render() {
    return this.loading ? l`<div class="loading">Loading MessageHub data...</div>` : this.error ? l`
        <div class="error">
          <h3>Error</h3>
          <p>${this.error}</p>
          <button class="danger" @click=${() => this.loadData()}>Retry</button>
        </div>
      ` : l`
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1>MessageHub</h1>
              <p>Multi-platform messaging: LinkedIn + WhatsApp</p>
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

        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab ${this.activeTab === "linkedin" ? "active linkedin" : ""}"
            @click=${() => {
      this.activeTab = "linkedin", this.requestUpdate();
    }}
          >
            LinkedIn
          </button>
          <button
            class="tab ${this.activeTab === "whatsapp" ? "active whatsapp" : ""}"
            @click=${() => {
      this.activeTab = "whatsapp", this.requestUpdate();
    }}
          >
            WhatsApp
          </button>
        </div>

        ${this.activeTab === "linkedin" ? this.renderLinkedIn() : this.renderWhatsApp()}
      </div>
    `;
  }
  renderLinkedIn() {
    if (!this.userData)
      return l`<div class="empty"><h3>No LinkedIn data available</h3></div>`;
    const e = this.selectedUserId ? this.userData?.users?.find((a) => a.id === this.selectedUserId || a.provider_id === this.selectedUserId) : null, t = e ? this.userData?.invitations?.find((a) => a.recipient_id === e.provider_id || a.recipient_id === e.id) : null, s = e ? this.userData?.chats?.find(
      (a) => a.attendee_provider_id === e.provider_id || a.attendee_provider_id === e.id
    ) : null, i = s ? (this.userData?.messages || []).filter((a) => a.chat_id === s.id) : [], r = e?.posts || [], o = this.userData?.users || [], m = this.showAllUsers ? o : o.filter((a) => {
      const c = this.userData?.invitations?.some(
        (h) => h.recipient_id === a.provider_id || h.recipient_id === a.id
      ), p = this.userData?.chats?.some(
        (h) => h.attendee_provider_id === a.provider_id || h.attendee_provider_id === a.id
      ), d = a.posts?.some(
        (h) => (h.intercepted_reaction_count || 0) > 0 || (h.intercepted_comment_count || 0) > 0
      );
      return c || p || d;
    });
    return l`
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
            <span>Users (${m.length})</span>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: normal; cursor: pointer; opacity: 0.6;">
              <input
                type="checkbox"
                .checked=${this.showAllUsers}
                @change=${(a) => {
      this.showAllUsers = a.target.checked, this.requestUpdate();
    }}
                style="cursor: pointer;"
              />
              Show cached
            </label>
          </div>
          ${m.map((a) => {
      const c = this.selectedUserId === a.id || this.selectedUserId === a.provider_id, p = (a.posts || []).reduce((h, g) => h + (g.intercepted_reaction_count || 0), 0), d = (a.posts || []).reduce((h, g) => h + (g.intercepted_comment_count || 0), 0);
      return l`
              <div
                class="user-item ${c ? "selected" : ""}"
                @click=${() => {
        this.selectedUserId = a.id, this.expandedPostId = null, this.requestUpdate();
      }}
              >
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  ${a.profile_picture_url ? l`
                    <img src="${a.profile_picture_url}" alt="${a.first_name} ${a.last_name}"
                         style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                  ` : l`
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #0A66C2; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
                      ${a.first_name?.charAt(0)}${a.last_name?.charAt(0)}
                    </div>
                  `}
                  <div style="flex: 1; min-width: 0;">
                    <div class="user-name">${a.first_name} ${a.last_name}</div>
                    ${a.headline ? l`<div class="user-headline">${a.headline}</div>` : ""}
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                      ${a.location ? l`<span class="user-location">${a.location}</span>` : ""}
                      ${(a.posts?.length || 0) > 0 ? l`
                        <span style="font-size: 0.7rem; color: #666;">${a.posts?.length} ${a.posts?.length === 1 ? "post" : "posts"}</span>
                      ` : ""}
                      ${p > 0 ? l`
                        <span style="font-size: 0.7rem; color: #0A66C2;">${p} likes</span>
                      ` : ""}
                      ${d > 0 ? l`
                        <span style="font-size: 0.7rem; color: #057642;">${d} comments</span>
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
          ${e ? l`
            <!-- Profile Header -->
            <div class="profile-header">
              <div class="profile-avatar">
                ${e.first_name.charAt(0)}${e.last_name.charAt(0)}
              </div>
              <div class="profile-info">
                <h2 class="profile-name">${e.first_name} ${e.last_name}</h2>
                ${e.headline ? l`<p class="profile-headline">${e.headline}</p>` : ""}
                <div class="profile-meta">
                  ${e.location ? l`<span>${e.location}</span>` : ""}
                  ${e.connections_count ? l`<span>${e.connections_count} connections</span>` : ""}
                  ${e.network_distance ? l`<span>${e.network_distance}</span>` : ""}
                </div>
              </div>
            </div>

            <!-- Invitation Section -->
            ${t ? l`
              <div class="section">
                <h3 class="section-title">Connection Request</h3>
                <div class="invitation-card">
                  ${t.message ? l`<div class="invitation-message">"${t.message}"</div>` : ""}
                  <div style="font-size: 0.75rem; color: #666666; margin-bottom: 0.75rem;">
                    Status: <strong style="text-transform: capitalize">${t.status}</strong> |
                    Sent: ${new Date(t.sent_at).toLocaleDateString()}
                  </div>
                  ${t.status === "pending" ? l`
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
            ${e.network_distance === "FIRST_DEGREE" ? l`
              <div class="section">
                <h3 class="section-title">Messages (${i.length})</h3>

                ${i.length > 0 ? l`
                  <div class="messages-container">
                    ${i.map((a) => {
      const c = a.is_sender === 1;
      return l`
                        <div class="message ${c ? "sent" : "received"}">
                          <div class="message-meta">
                            ${c ? `To: ${e.first_name}` : `From: ${e.first_name}`} |
                            ${new Date(a.timestamp).toLocaleString()}
                          </div>
                          <div class="message-text">${a.text}</div>
                        </div>
                      `;
    })}
                  </div>
                ` : l`
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
                    @input=${(a) => {
      this.messageText = a.target.value, this.requestUpdate();
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
            ${r.length > 0 ? l`
              <div class="section">
                <h3 class="section-title">Posts (${r.length})</h3>
                ${r.map((a) => {
      const c = this.expandedPostId === (a.id || a.social_id), p = (a.intercepted_reaction_count || 0) > 0 || (a.intercepted_comment_count || 0) > 0;
      return l`
                    <div
                      class="post-item"
                      style="cursor: pointer; border: 1px solid #E0DFDC; border-radius: 8px; margin-bottom: 0.75rem; ${c ? "border-color: #0A66C2;" : ""}"
                      @click=${() => {
        this.expandedPostId = c ? null : a.id || a.social_id || null, this.requestUpdate();
      }}
                    >
                      <div class="post-text" style="${c ? "-webkit-line-clamp: unset;" : ""}">${a.text || "(No text)"}</div>
                      <div class="post-meta">
                        ${a.created_at ? l`<span>${new Date(a.created_at).toLocaleDateString()}</span>` : ""}
                        <span style="opacity: 0.6;">Original: ${a.reaction_counter || 0} reactions, ${a.comment_counter || 0} comments</span>
                      </div>
                      ${p ? l`
                        ${(a.intercepted_reaction_count || 0) > 0 ? l`
                          <div class="post-stats" style="margin-top: 0.5rem;">
                            <span class="post-stat reactions">${a.intercepted_reaction_count} ${a.intercepted_reaction_count === 1 ? "like" : "likes"}</span>
                          </div>
                        ` : ""}
                        ${(a.intercepted_comments?.length || 0) > 0 ? l`
                          <div style="margin-top: 0.5rem;">
                            ${a.intercepted_comments?.map((d) => l`
                              <div style="display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.5rem; background: #F3F2EF; border-radius: 6px; margin-bottom: 0.25rem;">
                                <div style="flex: 1; font-size: 0.8rem; color: #333;">${d.text}</div>
                                <button
                                  class="secondary"
                                  style="font-size: 0.6rem; padding: 0.15rem 0.4rem; flex-shrink: 0;"
                                  @click=${(h) => {
        h.stopPropagation(), this.handleDeleteComment(d.id);
      }}
                                >
                                  x
                                </button>
                              </div>
                            `)}
                          </div>
                        ` : ""}
                      ` : ""}

                      ${c && (a.intercepted_reactions?.length || 0) > 0 ? l`
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E0DFDC;">
                          <h4 style="font-size: 0.75rem; color: #666; margin: 0 0 0.5rem 0;">Likes</h4>
                          ${a.intercepted_reactions?.map((d) => l`
                            <div class="activity-card reaction">
                              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                  <div class="activity-type">${d.reaction_type || "LIKE"}</div>
                                  <div class="activity-meta">
                                    ${new Date(d.created_at).toLocaleString()}
                                  </div>
                                </div>
                                <button
                                  class="secondary"
                                  style="font-size: 0.625rem; padding: 0.25rem 0.5rem;"
                                  @click=${(h) => {
        h.stopPropagation(), this.handleDeleteReaction(d.id);
      }}
                                >
                                  x
                                </button>
                              </div>
                            </div>
                          `)}
                        </div>
                      ` : ""}
                    </div>
                  `;
    })}
              </div>
            ` : ""}

            <!-- Delete Section -->
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #F3F2EF;">
              <details>
                <summary style="font-size: 0.75rem; color: #999999; cursor: pointer;">Delete user data</summary>
                <div style="margin-top: 0.75rem; padding-left: 1rem;">
                  <p style="font-size: 0.75rem; color: #999999; margin: 0 0 0.5rem 0;">
                    Remove invitations, messages, and chats for testing.
                  </p>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #999999; cursor: pointer;">
                      <input
                        type="checkbox"
                        .checked=${this.deleteFullCache}
                        @change=${(a) => {
      this.deleteFullCache = a.target.checked, this.requestUpdate();
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
          ` : l`
            <div class="empty">
              <h3>Select a user to view their profile</h3>
              <p style="color: #666666; font-size: 0.875rem; margin-top: 0.5rem;">
                Users with invites, messages, or post activity will be shown.
              </p>
            </div>
          `}
        </div>
      </div>
    `;
  }
  renderWhatsApp() {
    const e = this.whatsappData?.chats || [], t = this.selectedChatId ? e.find((i) => i.id === this.selectedChatId) : null, s = t ? (this.whatsappData?.messages || []).filter((i) => i.chat_id === t.id) : [];
    return l`
      <!-- Stats -->
      <div class="stats" style="grid-template-columns: repeat(3, 1fr);">
        <div class="stat-card">
          <div class="stat-label">Contacts</div>
          <div class="stat-value">${this.whatsappData?.stats?.total_contacts || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Chats</div>
          <div class="stat-value">${this.whatsappData?.stats?.total_chats || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Messages</div>
          <div class="stat-value">${this.whatsappData?.stats?.total_messages || 0}</div>
        </div>
      </div>

      <!-- New Chat Form -->
      <div style="background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
        <h3 style="font-size: 0.875rem; font-weight: 600; color: #000000; margin: 0 0 0.75rem 0;">Start New Chat</h3>
        <div class="new-contact-form">
          <input
            type="text"
            placeholder="Phone (e.g., +61412345678)"
            .value=${this.newContactPhone}
            @input=${(i) => {
      this.newContactPhone = i.target.value, this.requestUpdate();
    }}
            style="flex: 1; min-width: 150px;"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            .value=${this.newContactName}
            @input=${(i) => {
      this.newContactName = i.target.value, this.requestUpdate();
    }}
            style="flex: 1; min-width: 120px;"
          />
          <button
            class="primary whatsapp"
            ?disabled=${!this.newContactPhone.trim() || this.sending}
            @click=${() => this.handleStartWhatsAppChat()}
          >
            Start Chat
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Chat List -->
        <div class="chat-list">
          <div class="chat-list-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Chats (${e.length})</span>
            ${e.length > 0 ? l`
              <button
                class="secondary whatsapp"
                style="font-size: 0.625rem; padding: 0.25rem 0.5rem;"
                @click=${() => this.handleClearWhatsAppData()}
              >
                Clear All
              </button>
            ` : ""}
          </div>
          ${e.length === 0 ? l`
            <div style="padding: 2rem; text-align: center; color: #666666;">
              <p style="margin: 0; font-size: 0.875rem;">No chats yet</p>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem;">Start a new chat above</p>
            </div>
          ` : ""}
          ${e.map((i) => {
      const r = this.selectedChatId === i.id;
      return l`
              <div
                class="chat-item ${r ? "selected" : ""}"
                @click=${() => {
        this.selectedChatId = i.id, this.messageText = "", this.requestUpdate();
      }}
              >
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: #25D366; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
                    ${i.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div class="chat-name">${i.name || i.contact_phone}</div>
                    <div class="chat-phone">${i.contact_phone}</div>
                    ${i.last_message ? l`
                      <div class="chat-preview">${i.last_message.text}</div>
                    ` : ""}
                  </div>
                  <div style="text-align: right; font-size: 0.625rem; color: #999;">
                    ${i.message_count || 0} msgs
                  </div>
                </div>
              </div>
            `;
    })}
        </div>

        <!-- Chat Detail -->
        <div class="chat-detail" style="overflow-y: auto; max-height: 600px;">
          ${t ? l`
            <!-- Chat Header -->
            <div class="profile-header">
              <div class="profile-avatar whatsapp">
                ${t.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div class="profile-info">
                <h2 class="profile-name">${t.name || t.contact_phone}</h2>
                <p class="profile-headline">${t.contact_phone}</p>
                <div class="profile-meta">
                  <span>${s.length} messages</span>
                </div>
              </div>
              <button
                class="danger"
                style="font-size: 0.75rem; padding: 0.35rem 0.75rem;"
                @click=${() => this.handleDeleteWhatsAppChat(t.id)}
              >
                Delete Chat
              </button>
            </div>

            <!-- Messages -->
            <div class="section">
              <h3 class="section-title">Conversation</h3>

              <div class="messages-container whatsapp" style="max-height: 350px;">
                ${s.length === 0 ? l`
                  <p style="color: #666666; font-size: 0.875rem; text-align: center; padding: 2rem;">
                    No messages yet. Send or simulate a message below.
                  </p>
                ` : ""}
                ${s.map((i) => {
      const r = i.is_sender === 1;
      return l`
                    <div class="message ${r ? "wa-sent" : "wa-received"}">
                      <div class="message-text">${i.text}</div>
                      <div class="message-time">${new Date(i.timestamp).toLocaleTimeString()}</div>
                    </div>
                  `;
    })}
              </div>

              <!-- Message Form -->
              <div class="message-form whatsapp">
                <textarea
                  rows="2"
                  placeholder="Type a message..."
                  .value=${this.messageText}
                  @input=${(i) => {
      this.messageText = i.target.value, this.requestUpdate();
    }}
                ></textarea>
                <div style="display: flex; gap: 0.5rem;">
                  <button
                    class="primary whatsapp"
                    style="flex: 1;"
                    ?disabled=${!this.messageText.trim() || this.sending}
                    @click=${() => this.handleSendWhatsAppMessage()}
                  >
                    ${this.sending ? "Sending..." : "Send (as App)"}
                  </button>
                  <button
                    class="secondary whatsapp"
                    style="flex: 1;"
                    ?disabled=${!this.messageText.trim() || this.sending}
                    @click=${() => this.handleSimulateIncomingMessage()}
                  >
                    ${this.sending ? "Sending..." : "Receive (from Contact)"}
                  </button>
                </div>
              </div>
            </div>
          ` : l`
            <div class="empty">
              <h3>Select a chat to view messages</h3>
              <p style="color: #666666; font-size: 0.875rem; margin-top: 0.5rem;">
                WhatsApp messages are fully mocked locally.
              </p>
              <p style="color: #999999; font-size: 0.75rem; margin-top: 0.25rem;">
                No data is sent to Unipile for WhatsApp.
              </p>
            </div>
          `}
        </div>
      </div>
    `;
  }
}
customElements.get("messagehub-plugin") || customElements.define("messagehub-plugin", Ee);
export {
  Ee as MessageHubPlugin,
  Ee as default
};
