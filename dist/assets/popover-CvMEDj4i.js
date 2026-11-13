var K=Object.defineProperty;var Q=(e,t,o)=>t in e?K(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o;var H=(e,t,o)=>Q(e,typeof t!="symbol"?t+"":t,o);var J=globalThis.Event||class{},k=class extends J{constructor(t,o={}){const n=Object.assign({},o);delete n.oldState,delete n.newState;super(t,n);H(this,"oldState");H(this,"newState");this.oldState=String(o.oldState||""),this.newState=String(o.newState||"")}},_=new WeakMap;function U(e,t,o){_.set(e,setTimeout(()=>{_.has(e)&&e.dispatchEvent(new k("toggle",{cancelable:!1,oldState:t,newState:o}))},0))}var x=globalThis.ShadowRoot||function(){},X=globalThis.HTMLDialogElement||function(){},A=new WeakMap,d=new WeakMap,f=new WeakMap,y=new WeakMap;function P(e){return y.get(e)||"hidden"}var M=new WeakMap;function m(e){return[...e].pop()}function Z(e){const t=e.popoverTargetElement;if(!(t instanceof HTMLElement))return;const o=P(t);e.popoverTargetAction==="show"&&o==="showing"||e.popoverTargetAction==="hide"&&o==="hidden"||(o==="showing"?E(t,!0,!0):g(t,!1)&&(M.set(t,e),R(t)))}function g(e,t){return!(e.popover!=="auto"&&e.popover!=="manual"&&e.popover!=="hint"||!e.isConnected||t&&P(e)!=="showing"||!t&&P(e)!=="hidden"||e instanceof X&&e.hasAttribute("open")||document.fullscreenElement===e)}function q(e){if(!e)return 0;const t=d.get(document)||new Set,o=f.get(document)||new Set;return o.has(e)?[...o].indexOf(e)+t.size+1:t.has(e)?[...t].indexOf(e)+1:0}function ee(e){const t=Y(e),o=te(e);return q(t)>q(o)?t:o}function L(e){let t;const o=f.get(e)||new Set,n=d.get(e)||new Set,r=o.size>0?o:n.size>0?n:null;return r?(t=m(r),t.isConnected?t:(r.delete(t),L(e))):null}function j(e){for(const t of e||[])if(!t.isConnected)e.delete(t);else return t;return null}function S(e){return typeof e.getRootNode=="function"?e.getRootNode():e.parentNode?S(e.parentNode):e}function Y(e){for(;e;){if(e instanceof HTMLElement&&e.popover==="auto"&&y.get(e)==="showing")return e;if(e=e instanceof Element&&e.assignedSlot||e.parentElement||S(e),e instanceof x&&(e=e.host),e instanceof Document)return}}function te(e){for(;e;){const t=e.popoverTargetElement;if(t instanceof HTMLElement)return t;if(e=e.parentElement||S(e),e instanceof x&&(e=e.host),e instanceof Document)return}}function z(e,t){const o=new Map;let n=0;for(const l of t||[])o.set(l,n),n+=1;o.set(e,n),n+=1;let r=null;function a(l){if(!l)return;let p=!1,u=null;for(;!p;){if(u=Y(l)||null,u===null||!o.has(u))return;(e.popover==="hint"||u.popover==="auto")&&(p=!0),p||(l=u.parentElement)}const i=o.get(u)??null;(r===null||o.get(r)<i)&&(r=u)}return a(e.parentElement||S(e)),r}function oe(e){return e.hidden||e instanceof x||(e instanceof HTMLButtonElement||e instanceof HTMLInputElement||e instanceof HTMLSelectElement||e instanceof HTMLTextAreaElement||e instanceof HTMLOptGroupElement||e instanceof HTMLOptionElement||e instanceof HTMLFieldSetElement)&&e.disabled||e instanceof HTMLInputElement&&e.type==="hidden"||e instanceof HTMLAnchorElement&&e.href===""?!1:typeof e.tabIndex=="number"&&e.tabIndex!==-1}function ne(e){if(e.shadowRoot&&e.shadowRoot.delegatesFocus!==!0)return null;let t=e;t.shadowRoot&&(t=t.shadowRoot);let o=t.querySelector("[autofocus]");if(o)return o;{const a=t.querySelectorAll("slot");for(const l of a){const p=l.assignedElements({flatten:!0});for(const u of p){if(u.hasAttribute("autofocus"))return u;if(o=u.querySelector("[autofocus]"),o)return o}}}const n=e.ownerDocument.createTreeWalker(t,NodeFilter.SHOW_ELEMENT);let r=n.currentNode;for(;r;){if(oe(r))return r;r=n.nextNode()}}function re(e){var t;(t=ne(e))==null||t.focus()}var T=new WeakMap;function R(e){if(!g(e,!1))return;const t=e.ownerDocument;if(!e.dispatchEvent(new k("beforetoggle",{cancelable:!0,oldState:"closed",newState:"open"}))||!g(e,!1))return;let o=!1;const n=e.popover;let r=null;const a=z(e,d.get(t)||new Set),l=z(e,f.get(t)||new Set);if(n==="auto"&&(N(f.get(t)||new Set,o,!0),w(a||t,o,!0),r="auto"),n==="hint"&&(l?(w(l,o,!0),r="hint"):(N(f.get(t)||new Set,o,!0),a?(w(a,o,!0),r="auto"):r="hint")),n==="auto"||n==="hint"){if(n!==e.popover||!g(e,!1))return;L(t)||(o=!0),r==="auto"?(d.has(t)||d.set(t,new Set),d.get(t).add(e)):r==="hint"&&(f.has(t)||f.set(t,new Set),f.get(t).add(e))}T.delete(e);const p=t.activeElement;e.classList.add(":popover-open"),y.set(e,"showing"),A.has(t)||A.set(t,new Set),A.get(t).add(e),G(M.get(e),!0),re(e),o&&p&&e.popover==="auto"&&T.set(e,p),U(e,"closed","open")}function E(e,t=!1,o=!1){var n,r;if(!g(e,!0))return;const a=e.ownerDocument;if(["auto","hint"].includes(e.popover)&&(w(e,t,o),!g(e,!0)))return;const l=d.get(a)||new Set,p=l.has(e)&&m(l)===e;if(G(M.get(e),!1),M.delete(e),o&&(e.dispatchEvent(new k("beforetoggle",{oldState:"open",newState:"closed"})),p&&m(l)!==e&&w(e,t,o),!g(e,!0)))return;(n=A.get(a))==null||n.delete(e),l.delete(e),(r=f.get(a))==null||r.delete(e),e.classList.remove(":popover-open"),y.set(e,"hidden"),o&&U(e,"open","closed");const u=T.get(e);u&&(T.delete(e),t&&u.focus())}function ie(e,t=!1,o=!1){let n=L(e);for(;n;)E(n,t,o),n=L(e)}function N(e,t=!1,o=!1){let n=j(e);for(;n;)E(n,t,o),n=j(e)}function B(e,t,o,n){let r=!1,a=!1;for(;r||!a;){a=!0;let l=null,p=!1;for(const u of t)if(u===e)p=!0;else if(p){l=u;break}if(!l)return;for(;P(l)==="showing"&&t.size;)E(m(t),o,n);t.has(e)&&m(t)!==e&&(r=!0),r&&(n=!1)}}function w(e,t,o){var n,r;const a=e.ownerDocument||e;if(e instanceof Document)return ie(a,t,o);if((n=f.get(a))!=null&&n.has(e)){B(e,f.get(a),t,o);return}N(f.get(a)||new Set,t,o),(r=d.get(a))!=null&&r.has(e)&&B(e,d.get(a),t,o)}var D=new WeakMap;function V(e){if(!e.isTrusted)return;const t=e.composedPath()[0];if(!t)return;const o=t.ownerDocument||t;if(!L(o))return;const r=ee(t);if(r&&e.type==="pointerdown")D.set(o,r);else if(e.type==="pointerup"){const a=D.get(o)===r;D.delete(o),a&&w(r||o,!1,!0)}}var O=new WeakMap;function G(e,t=!1){if(!e)return;O.has(e)||O.set(e,e.getAttribute("aria-expanded"));const o=e.popoverTargetElement;if(o instanceof HTMLElement&&o.popover==="auto")e.setAttribute("aria-expanded",String(t));else{const n=O.get(e);n?e.setAttribute("aria-expanded",n):e.removeAttribute("aria-expanded")}}var $=globalThis.ShadowRoot||function(){},ae="popover-polyfill";function se(){return typeof HTMLElement<"u"&&typeof HTMLElement.prototype=="object"&&"popover"in HTMLElement.prototype&&"showPopover"in HTMLElement.prototype}function v(e,t,o){const n=e[t];Object.defineProperty(e,t,{value(r){return n.call(this,o(r))}})}var le=/(^|[^\\]):popover-open\b/g;function ue(){return typeof globalThis.CSSLayerBlockRule=="function"}function pe(e){var t;const o=ue(),n=(((t=window.POPOVER_POLYFILL_OPTIONS)==null?void 0:t.layerName)??ae).split(".").map(r=>CSS.escape(r)).join(".");return`
${o?`@layer ${n} {`:""}
  :where([popover]) {
    position: fixed;
    z-index: 2147483647;
    inset: 0;
    padding: 0.25em;
    width: fit-content;
    height: fit-content;
    border-width: initial;
    border-color: initial;
    border-image: initial;
    border-style: solid;
    background-color: canvas;
    color: canvastext;
    overflow: auto;
    margin: auto;
  }

  :where([popover]:not(.\\:popover-open)) {
    display: none;
  }

  :where(dialog[popover].\\:popover-open) {
    display: block;
  }

  :where(dialog[popover][open]) {
    display: revert;
  }

  :where([anchor].\\:popover-open) {
    inset: auto;
  }

  :where([anchor]:popover-open) {
    inset: auto;
  }

  @supports not (background-color: canvas) {
    :where([popover]) {
      background-color: white;
      color: black;
    }
  }

  @supports (width: -moz-fit-content) {
    :where([popover]) {
      width: -moz-fit-content;
      height: -moz-fit-content;
    }
  }

  @supports not (inset: 0) {
    :where([popover]) {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }
${o?"}":""}
`}var b=null;function I(e,t){const o=pe();if(b===null)try{b=new CSSStyleSheet,b.replaceSync(o)}catch{b=!1}if(b===!1||!e.adoptedStyleSheets){const n=document.createElement("style");n.textContent=o,e instanceof Document?e.head.prepend(n):e.prepend(n)}else e.adoptedStyleSheets=[b,...e.adoptedStyleSheets]}function ce(e){if(typeof window>"u")return;window.ToggleEvent=window.ToggleEvent||k;function t(i){return i!=null&&i.includes(":popover-open")&&(i=i.replace(le,"$1.\\:popover-open")),i}v(Document.prototype,"querySelector",t),v(Document.prototype,"querySelectorAll",t),v(Element.prototype,"querySelector",t),v(Element.prototype,"querySelectorAll",t),v(Element.prototype,"matches",t),v(Element.prototype,"closest",t),v(DocumentFragment.prototype,"querySelectorAll",t),Object.defineProperties(HTMLElement.prototype,{popover:{enumerable:!0,configurable:!0,get(){if(!this.hasAttribute("popover"))return null;const i=(this.getAttribute("popover")||"").toLowerCase();return i===""||i=="auto"?"auto":i=="hint"?"hint":"manual"},set(i){i===null?this.removeAttribute("popover"):this.setAttribute("popover",i)}},showPopover:{enumerable:!0,configurable:!0,writable:!0,value(i={}){R(this)}},hidePopover:{enumerable:!0,configurable:!0,writable:!0,value(){E(this,!0,!0)}},togglePopover:{enumerable:!0,configurable:!0,writable:!0,value(i={}){return typeof i=="boolean"&&(i={force:i}),y.get(this)==="showing"&&i.force===void 0||i.force===!1?E(this,!0,!0):(i.force===void 0||i.force===!0)&&R(this),y.get(this)==="showing"}}});const o=Element.prototype.attachShadow;o&&Object.defineProperties(Element.prototype,{attachShadow:{enumerable:!0,configurable:!0,writable:!0,value(i){const s=o.call(this,i);return I(s),s}}});const n=HTMLElement.prototype.attachInternals;n&&Object.defineProperties(HTMLElement.prototype,{attachInternals:{enumerable:!0,configurable:!0,writable:!0,value(){const i=n.call(this);return i.shadowRoot&&I(i.shadowRoot),i}}});const r=new WeakMap;function a(i){Object.defineProperties(i.prototype,{popoverTargetElement:{enumerable:!0,configurable:!0,set(s){if(s===null)this.removeAttribute("popovertarget"),r.delete(this);else if(s instanceof Element)this.setAttribute("popovertarget",""),r.set(this,s);else throw new TypeError("popoverTargetElement must be an element or null")},get(){if(this.localName!=="button"&&this.localName!=="input"||this.localName==="input"&&this.type!=="reset"&&this.type!=="image"&&this.type!=="button"||this.disabled||this.form&&this.type==="submit")return null;const s=r.get(this);if(s&&s.isConnected)return s;if(s&&!s.isConnected)return r.delete(this),null;const c=S(this),h=this.getAttribute("popovertarget");return(c instanceof Document||c instanceof $)&&h&&c.getElementById(h)||null}},popoverTargetAction:{enumerable:!0,configurable:!0,get(){const s=(this.getAttribute("popovertargetaction")||"").toLowerCase();return s==="show"||s==="hide"?s:"toggle"},set(s){this.setAttribute("popovertargetaction",s)}}})}a(HTMLButtonElement),a(HTMLInputElement);const l=i=>{if(i.defaultPrevented)return;const s=i.composedPath(),c=s[0];if(!(c instanceof Element)||c!=null&&c.shadowRoot)return;const h=S(c);if(!(h instanceof $||h instanceof Document))return;const F=s.find(C=>{var W;return(W=C.matches)==null?void 0:W.call(C,"[popovertargetaction],[popovertarget]")});if(F){Z(F),i.preventDefault();return}},p=i=>{const s=i.key,c=i.target;if(!i.defaultPrevented&&c&&(s==="Escape"||s==="Esc")){const h=c.ownerDocument||c;w(h,!0,!0)}};(i=>{i.addEventListener("click",l),i.addEventListener("keydown",p),i.addEventListener("pointerdown",V),i.addEventListener("pointerup",V)})(document),I(document)}se()||ce();
