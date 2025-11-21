const T = globalThis, H = T.ShadowRoot && (T.ShadyCSS === void 0 || T.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, D = Symbol(), B = /* @__PURE__ */ new WeakMap();
let X = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== D) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (H && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = B.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && B.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const re = (r) => new X(typeof r == "string" ? r : r + "", void 0, D), oe = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce(((i, s, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + r[o + 1]), r[0]);
  return new X(t, r, D);
}, ne = (r, e) => {
  if (H) r.adoptedStyleSheets = e.map(((t) => t instanceof CSSStyleSheet ? t : t.styleSheet));
  else for (const t of e) {
    const i = document.createElement("style"), s = T.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, r.appendChild(i);
  }
}, F = H ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return re(t);
})(r) : r;
const { is: ae, defineProperty: le, getOwnPropertyDescriptor: de, getOwnPropertyNames: he, getOwnPropertySymbols: ce, getPrototypeOf: pe } = Object, R = globalThis, q = R.trustedTypes, ue = q ? q.emptyScript : "", me = R.reactiveElementPolyfillSupport, S = (r, e) => r, N = { toAttribute(r, e) {
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
} }, Y = (r, e) => !ae(r, e), W = { attribute: !0, type: String, converter: N, reflect: !1, useDefault: !1, hasChanged: Y };
Symbol.metadata ??= Symbol("metadata"), R.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let _ = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = W) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && le(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: o } = de(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: s, set(n) {
      const d = s?.call(this);
      o?.call(this, n), this.requestUpdate(e, d, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? W;
  }
  static _$Ei() {
    if (this.hasOwnProperty(S("elementProperties"))) return;
    const e = pe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(S("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(S("properties"))) {
      const t = this.properties, i = [...he(t), ...ce(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(F(s));
    } else e !== void 0 && t.push(F(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
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
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : N).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : N;
      this._$Em = s;
      const d = n.fromAttribute(t, o.type);
      this[s] = d ?? this._$Ej?.get(s) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, t, i) {
    if (e !== void 0) {
      const s = this.constructor, o = this[e];
      if (i ??= s.getPropertyOptions(e), !((i.hasChanged ?? Y)(o, t) || i.useDefault && i.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(s._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: o }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [s, o] of this._$Ep) this[s] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, o] of i) {
        const { wrapped: n } = o, d = this[s];
        n !== !0 || this._$AL.has(s) || d === void 0 || this.C(s, void 0, o, d);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach(((i) => i.hostUpdate?.())), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
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
_.elementStyles = [], _.shadowRootOptions = { mode: "open" }, _[S("elementProperties")] = /* @__PURE__ */ new Map(), _[S("finalized")] = /* @__PURE__ */ new Map(), me?.({ ReactiveElement: _ }), (R.reactiveElementVersions ??= []).push("2.1.1");
const j = globalThis, O = j.trustedTypes, V = O ? O.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, ee = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, te = "?" + $, fe = `<${te}>`, b = document, x = () => b.createComment(""), P = (r) => r === null || typeof r != "object" && typeof r != "function", L = Array.isArray, $e = (r) => L(r) || typeof r?.[Symbol.iterator] == "function", z = `[ 	
\f\r]`, E = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, J = /-->/g, K = />/g, g = RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Z = /'/g, G = /"/g, ie = /^(?:script|style|textarea|title)$/i, ge = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), u = ge(1), v = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), Q = /* @__PURE__ */ new WeakMap(), y = b.createTreeWalker(b, 129);
function se(r, e) {
  if (!L(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return V !== void 0 ? V.createHTML(e) : e;
}
const ye = (r, e) => {
  const t = r.length - 1, i = [];
  let s, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = E;
  for (let d = 0; d < t; d++) {
    const a = r[d];
    let h, p, l = -1, m = 0;
    for (; m < a.length && (n.lastIndex = m, p = n.exec(a), p !== null); ) m = n.lastIndex, n === E ? p[1] === "!--" ? n = J : p[1] !== void 0 ? n = K : p[2] !== void 0 ? (ie.test(p[2]) && (s = RegExp("</" + p[2], "g")), n = g) : p[3] !== void 0 && (n = g) : n === g ? p[0] === ">" ? (n = s ?? E, l = -1) : p[1] === void 0 ? l = -2 : (l = n.lastIndex - p[2].length, h = p[1], n = p[3] === void 0 ? g : p[3] === '"' ? G : Z) : n === G || n === Z ? n = g : n === J || n === K ? n = E : (n = g, s = void 0);
    const f = n === g && r[d + 1].startsWith("/>") ? " " : "";
    o += n === E ? a + fe : l >= 0 ? (i.push(h), a.slice(0, l) + ee + a.slice(l) + $ + f) : a + $ + (l === -2 ? d : f);
  }
  return [se(r, o + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class C {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let o = 0, n = 0;
    const d = e.length - 1, a = this.parts, [h, p] = ye(e, t);
    if (this.el = C.createElement(h, i), y.currentNode = this.el.content, t === 2 || t === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (s = y.nextNode()) !== null && a.length < d; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const l of s.getAttributeNames()) if (l.endsWith(ee)) {
          const m = p[n++], f = s.getAttribute(l).split($), k = /([.?@])?(.*)/.exec(m);
          a.push({ type: 1, index: o, name: k[2], strings: f, ctor: k[1] === "." ? _e : k[1] === "?" ? ve : k[1] === "@" ? Ae : M }), s.removeAttribute(l);
        } else l.startsWith($) && (a.push({ type: 6, index: o }), s.removeAttribute(l));
        if (ie.test(s.tagName)) {
          const l = s.textContent.split($), m = l.length - 1;
          if (m > 0) {
            s.textContent = O ? O.emptyScript : "";
            for (let f = 0; f < m; f++) s.append(l[f], x()), y.nextNode(), a.push({ type: 2, index: ++o });
            s.append(l[m], x());
          }
        }
      } else if (s.nodeType === 8) if (s.data === te) a.push({ type: 2, index: o });
      else {
        let l = -1;
        for (; (l = s.data.indexOf($, l + 1)) !== -1; ) a.push({ type: 7, index: o }), l += $.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = b.createElement("template");
    return i.innerHTML = e, i;
  }
}
function A(r, e, t = r, i) {
  if (e === v) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const o = P(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(r), s._$AT(r, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = A(r, s._$AS(r, e.values), s, i)), e;
}
class be {
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
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? b).importNode(t, !0);
    y.currentNode = s;
    let o = y.nextNode(), n = 0, d = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let h;
        a.type === 2 ? h = new U(o, o.nextSibling, this, e) : a.type === 1 ? h = new a.ctor(o, a.name, a.strings, this, e) : a.type === 6 && (h = new Ee(o, this, e)), this._$AV.push(h), a = i[++d];
      }
      n !== a?.index && (o = y.nextNode(), n++);
    }
    return y.currentNode = b, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class U {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = A(this, e, t), P(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== v && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : $e(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && P(this._$AH) ? this._$AA.nextSibling.data = e : this.T(b.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = C.createElement(se(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const o = new be(s, this), n = o.u(this.options);
      o.p(t), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Q.get(e.strings);
    return t === void 0 && Q.set(e.strings, t = new C(e)), t;
  }
  k(e) {
    L(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const o of e) s === t.length ? t.push(i = new U(this.O(x()), this.O(x()), this, this.options)) : i = t[s], i._$AI(o), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = e.nextSibling;
      e.remove(), e = i;
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
  constructor(e, t, i, s, o) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = c;
  }
  _$AI(e, t = this, i, s) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = A(this, e, t, 0), n = !P(e) || e !== this._$AH && e !== v, n && (this._$AH = e);
    else {
      const d = e;
      let a, h;
      for (e = o[0], a = 0; a < o.length - 1; a++) h = A(this, d[i + a], t, a), h === v && (h = this._$AH[a]), n ||= !P(h) || h !== this._$AH[a], h === c ? e = c : e !== c && (e += (h ?? "") + o[a + 1]), this._$AH[a] = h;
    }
    n && !s && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class _e extends M {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class ve extends M {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class Ae extends M {
  constructor(e, t, i, s, o) {
    super(e, t, i, s, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = A(this, e, t, 0) ?? c) === v) return;
    const i = this._$AH, s = e === c && i !== c || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== c && (i === c || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ee {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    A(this, e);
  }
}
const Se = j.litHtmlPolyfillSupport;
Se?.(C, U), (j.litHtmlVersions ??= []).push("3.3.1");
const we = (r, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = t?.renderBefore ?? null;
    i._$litPart$ = s = new U(e.insertBefore(x(), o), o, void 0, t ?? {});
  }
  return s._$AI(r), s;
};
const I = globalThis;
class w extends _ {
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
    return v;
  }
}
w._$litElement$ = !0, w.finalized = !0, I.litElementHydrateSupport?.({ LitElement: w });
const xe = I.litElementPolyfillSupport;
xe?.({ LitElement: w });
(I.litElementVersions ??= []).push("4.2.1");
class Pe extends w {
  static properties = {
    api: { type: Object },
    emails: { type: Array, state: !0 },
    config: { type: Object, state: !0 },
    loading: { type: Boolean, state: !0 },
    error: { type: String, state: !0 },
    selectedEmail: { type: String, state: !0 },
    emailDetails: { type: Object, state: !0 },
    replyText: { type: String, state: !0 },
    repliedEmails: { type: Object, state: !0 },
    sending: { type: Boolean, state: !0 }
  };
  api;
  emails = [];
  config = null;
  loading = !0;
  error = null;
  selectedEmail = null;
  emailDetails = null;
  replyText = "";
  repliedEmails = /* @__PURE__ */ new Set();
  sending = !1;
  static styles = oe`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      background: white;
      padding: 20px;
    }

    .container { padding: 1.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }

    .header { display: flex; justify-content: space-between; align-items: center; }
    .header h2 { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0; }
    .header p { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
    .header .mono { font-family: monospace; }

    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; }
    .stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.025em; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #111827; margin-top: 0.25rem; }
    .stat-value-sm { font-size: 0.875rem; font-weight: 500; color: #111827; margin-top: 0.25rem; }

    .inbox { background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; }
    .inbox-header { padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
    .inbox-header h3 { font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0; }

    .email-item { border-bottom: 1px solid #e5e7eb; background: white; }
    .email-item:hover { background: #f9fafb; }
    .email-header { padding: 0.75rem 1rem; cursor: pointer; }
    .email-title { font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0 0 0.25rem 0; display: flex; align-items: center; gap: 0.5rem; }
    .email-meta { font-size: 0.75rem; color: #6b7280; }
    .email-snippet { font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem; }

    .badge { padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 500; background: #d1fae5; color: #065f46; border-radius: 0.25rem; }

    .email-details { padding: 0 1rem 1rem 1rem; border-top: 1px solid #f3f4f6; }
    .detail-box { background: #f9fafb; border-radius: 0.5rem; padding: 0.75rem; margin-top: 0.75rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.75rem; }
    .detail-content { background: #f9fafb; border-radius: 0.5rem; padding: 0.75rem; margin-top: 0.75rem; }
    .detail-content pre { margin: 0; font-size: 0.75rem; white-space: pre-wrap; font-family: sans-serif; color: #111827; }

    .reply-form { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .reply-form textarea { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-family: inherit; resize: vertical; }
    .reply-form textarea:focus { outline: none; ring: 2px; ring-color: #3b82f6; border-color: #3b82f6; }
    .reply-buttons { display: flex; gap: 0.5rem; }

    button { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 0.375rem; cursor: pointer; font-family: inherit; transition: background 0.2s; }
    button.primary { background: #2563eb; color: white; }
    button.primary:hover { background: #1d4ed8; }
    button.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secondary { background: #e5e7eb; color: #374151; }
    button.secondary:hover { background: #d1d5db; }
    button.danger { background: #dc2626; color: white; }
    button.danger:hover { background: #b91c1c; }

    .loading, .error, .empty { text-align: center; padding: 3rem 1.5rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; }
    .error h3 { font-size: 0.875rem; font-weight: 500; color: #991b1b; margin: 0 0 0.5rem 0; }
    .error p { font-size: 0.75rem; color: #b91c1c; margin: 0 0 1rem 0; }
    .empty { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
    .empty p { margin: 0; font-size: 0.875rem; color: #4b5563; }
    .empty p.small { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
  `;
  firstUpdated() {
    console.log("[Email Plugin] firstUpdated called, api:", this.api), this.loadEmails();
  }
  async loadEmails() {
    if (console.log("[Email Plugin] loadEmails called, api:", this.api), !this.api) {
      console.error("[Email Plugin] API not initialized"), this.error = "API not initialized", this.loading = !1;
      return;
    }
    try {
      this.loading = !0, this.error = null, console.log("[Email Plugin] Calling api.action...");
      const e = await this.api.action("load_emails", "all");
      if (console.log("[Email Plugin] Got result:", e), !e.success)
        throw new Error(e.message || "Failed to load emails");
      this.emails = e.result?.emails || e.emails || [], this.config = e.result?.config || e.config, this.repliedEmails = new Set(e.result?.replied_ids || e.replied_ids || []), console.log("[Email Plugin] Loaded", this.emails.length, "emails");
    } catch (e) {
      console.error("[Email Plugin] Error:", e), this.error = e instanceof Error ? e.message : "Failed to load emails";
    } finally {
      this.loading = !1, console.log("[Email Plugin] Loading finished, loading:", this.loading, "error:", this.error), this.requestUpdate();
    }
  }
  async viewEmail(e) {
    this.selectedEmail = e, this.emailDetails = null, this.requestUpdate();
    try {
      const t = await this.api.action("view_email", `email_${e}`);
      t.success && (t.result?.data || t.data) && (this.emailDetails = t.result?.data || t.data, this.requestUpdate());
    } catch (t) {
      console.error("Failed to load email details:", t);
    }
  }
  async handleReply(e) {
    if (this.replyText.trim())
      try {
        this.sending = !0;
        const t = await this.api.action("reply_email", `email_${e}`, {
          text: this.replyText
        }), i = t.result || t;
        i.success ? (this.repliedEmails.add(e), this.replyText = "", this.selectedEmail = null, this.emailDetails = null, await this.loadEmails()) : alert(i.message || "Failed to send reply");
      } catch (t) {
        alert(t instanceof Error ? t.message : "Failed to send reply");
      } finally {
        this.sending = !1;
      }
  }
  render() {
    return this.loading ? u`<div class="loading">Loading emails...</div>` : this.error ? u`
        <div class="error">
          <h3>Error</h3>
          <p>${this.error}</p>
          <button class="danger" @click=${() => this.loadEmails()}>Retry</button>
        </div>
      ` : u`
      <div class="container">
        <div class="header">
          <div>
            <h2>Email Plugin (Mailpit)</h2>
            ${this.config ? u`
              <p>
                Mailpit: <span class="mono">${this.config.host}:${this.config.port}</span> •
                From: <span class="mono">${this.config.fromEmail}</span>
              </p>
            ` : ""}
          </div>
          <button class="primary" @click=${() => this.loadEmails()}>Refresh</button>
        </div>

        ${this.config ? u`
          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Emails</div>
              <div class="stat-value">${this.config.emailCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Replies Sent</div>
              <div class="stat-value">${this.config.repliesCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Workspace</div>
              <div class="stat-value-sm">${this.api.workspace}</div>
            </div>
          </div>
        ` : ""}

        ${this.emails.length === 0 ? u`
          <div class="empty">
            <p>No emails found</p>
            <p class="small">Make sure Mailpit is running and accessible</p>
          </div>
        ` : u`
          <div class="inbox">
            <div class="inbox-header">
              <h3>Inbox (${this.emails.length} ${this.emails.length === 1 ? "email" : "emails"})</h3>
            </div>

            ${this.emails.map((e) => {
      const t = e.From?.Name || e.From?.Address || "Unknown", i = e.Subject || "(No Subject)", s = this.repliedEmails.has(e.ID), o = this.selectedEmail === e.ID;
      return u`
                <div class="email-item">
                  <div class="email-header" @click=${() => this.viewEmail(e.ID)}>
                    <div class="email-title">
                      <span>${i}</span>
                      ${s ? u`<span class="badge">REPLIED</span>` : ""}
                    </div>
                    <div class="email-meta">
                      From: ${t} • ${e.Created || e.Date || "Unknown date"}
                    </div>
                    ${e.Snippet ? u`<div class="email-snippet">${e.Snippet}</div>` : ""}
                  </div>

                  ${o ? u`
                    <div class="email-details">
                      ${this.emailDetails ? u`
                        <div class="detail-box">
                          <div class="detail-grid">
                            <div><span style="color: #6b7280">From:</span> ${this.emailDetails.from.Name || this.emailDetails.from.Address}</div>
                            <div><span style="color: #6b7280">Date:</span> ${this.emailDetails.date}</div>
                          </div>
                        </div>

                        <div class="detail-content">
                          <pre>${this.emailDetails.text || this.emailDetails.html || "No content"}</pre>
                        </div>

                        ${s ? "" : u`
                          <div class="reply-form">
                            <textarea
                              rows="4"
                              placeholder="Type your reply..."
                              .value=${this.replyText}
                              @input=${(n) => {
        this.replyText = n.target.value, this.requestUpdate();
      }}
                            ></textarea>
                            <div class="reply-buttons">
                              <button
                                class="primary"
                                ?disabled=${!this.replyText.trim() || this.sending}
                                @click=${() => this.handleReply(e.ID)}
                              >
                                ${this.sending ? "Sending..." : "Send Reply"}
                              </button>
                              <button
                                class="secondary"
                                @click=${() => {
        this.selectedEmail = null, this.emailDetails = null, this.replyText = "";
      }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        `}
                      ` : u`<div style="text-align: center; padding: 1rem; font-size: 0.75rem; color: #6b7280">Loading details...</div>`}
                    </div>
                  ` : ""}
                </div>
              `;
    })}
          </div>
        `}
      </div>
    `;
  }
}
customElements.get("email-plugin") || customElements.define("email-plugin", Pe);
export {
  Pe as EmailPlugin,
  Pe as default
};
