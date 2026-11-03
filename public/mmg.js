let T="./";const z="/api/upload";function Z(t){var e;if(typeof globalThis<"u"&&globalThis.MMG_ASSET_BASE)return String(globalThis.MMG_ASSET_BASE).replace(/\/$/,"")||".";if((e=t==null?void 0:t.src)!=null&&e.includes("/src/main"))return"/";try{return new URL(t.src,location.href).pathname.replace(/\/mmg\.js$/,"")||"."}catch{return"/"}}function X(t){T=t.endsWith("/")?t.slice(0,-1):t}function E(t){const e=t.startsWith("/")?t.slice(1):t;return`${T==="."?"":T}/${e}`.replace(/\/+/g,"/")}function J(){return{items:[],taxonomy:null,sort:"best",segment:"all",category:"",search:"",visibleCount:24,lightbox:null,lastFocus:null}}function K(t,e){const s=t.featured?1:0,n=e.featured?1:0;if(n!==s)return n-s;const d=t.score??0,r=e.score??0;return r!==d?r-d:(e.added||"").localeCompare(t.added||"")}function W(t,e){const s=[...t];return e==="newest"?s.sort((n,d)=>(d.added||"").localeCompare(n.added||"")):e==="mural"?s.sort((n,d)=>{var i,b;const r=(((i=n.mural)==null?void 0:i.name)||n.headline||"").toLowerCase(),o=(((b=d.mural)==null?void 0:b.name)||d.headline||"").toLowerCase();return r.localeCompare(o)}):s.sort(K),s}function Y(t){var e;return[t.headline,t.caption,t.text,(e=t.mural)==null?void 0:e.name].filter(Boolean).join(" ").toLowerCase()}function I(t){let e=t.items;t.segment==="residential"?e=e.filter(n=>n.segment==="residential"):t.segment==="business"&&(e=e.filter(n=>n.segment==="business")),t.category&&(e=e.filter(n=>n.segment==="business"?(n.sectors||[]).includes(t.category):(n.rooms||[]).includes(t.category)));const s=t.searchTokens||[];return s.length&&(e=e.filter(n=>{const d=Y(n);return s.every(r=>d.includes(r))})),W(e,t.sort)}function O(t,e){const s=e.params.get("seg");s==="residential"||s==="business"?t.segment=s:e.params.has("seg")&&(t.segment="all");const n=e.params.get("room"),d=e.params.get("sector");t.category=n||d||"";const r=e.params.get("sort");(r==="newest"||r==="mural"||r==="best")&&(t.sort=r);const o=e.params.get("q");o!=null&&(t.search=o)}function Q(t){var s,n;const e=new URLSearchParams;return t.segment!=="all"&&e.set("seg",t.segment),t.category&&(t.segment==="business"?e.set("sector",t.category):t.segment==="residential"?e.set("room",t.category):(n=(s=t.taxonomy)==null?void 0:s.sectors)!=null&&n[t.category]?e.set("sector",t.category):e.set("room",t.category)),t.sort!=="best"&&e.set("sort",t.sort),t.search.trim()&&e.set("q",t.search.trim()),e}function H(t,e){let s;return(...n)=>{clearTimeout(s),s=setTimeout(()=>t(...n),e)}}function $(){const t=location.hash.replace(/^#/,"").trim();return t?/^G-\d{4}$/i.test(t)?{id:t.toUpperCase(),params:new URLSearchParams}:{id:null,params:new URLSearchParams(t)}:{id:null,params:new URLSearchParams}}function P(t,e){if(e){location.hash=e;return}const s=t.toString();location.hash=s||""}function V(t){return[...t.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>e.offsetParent!==null||e===document.activeElement)}function D(t,e){const s=n=>{if(n.key==="Escape"){n.preventDefault(),e();return}if(n.key!=="Tab")return;const d=V(t);if(!d.length)return;const r=d[0],o=d[d.length-1];n.shiftKey&&document.activeElement===r?(n.preventDefault(),o.focus()):!n.shiftKey&&document.activeElement===o&&(n.preventDefault(),r.focus())};return document.addEventListener("keydown",s),()=>document.removeEventListener("keydown",s)}function ee(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function N(t){return[450,900,1600].map(s=>`${E(`${t}-${s}.webp`)} ${s}w`).join(", ")}function q(t,e){const s=e<=450?450:e<=900?900:1600;return E(`${t}-${s}.webp`)}function te(t,e,s){const n=new URL("https://www.pinterest.com/pin/create/button/");return n.searchParams.set("url",t),n.searchParams.set("media",e),n.searchParams.set("description",s),n.toString()}function ne(t,e,{onOpenLightbox:s,onStateChange:n}){t.classList.add("mmg-root"),t.innerHTML=`
    <noscript><p class="mmg-noscript">Enable JavaScript to browse the customer photo gallery, filter by room, and view full-size photos.</p></noscript>
    <div class="mmg-app" hidden>
      <div class="mmg-toolbar">
        <div class="mmg-toolbar__row">
          <div class="mmg-segments" role="group" aria-label="Gallery segment">
            <button type="button" class="mmg-seg" data-seg="all">All</button>
            <button type="button" class="mmg-seg" data-seg="residential">Residential</button>
            <button type="button" class="mmg-seg" data-seg="business">Business</button>
          </div>
          <label class="mmg-select-wrap">
            <span class="mmg-visually-hidden">Room or sector</span>
            <select class="mmg-category" aria-label="Filter by room or sector"></select>
          </label>
        </div>
        <div class="mmg-toolbar__row">
          <label class="mmg-search-wrap">
            <span class="mmg-visually-hidden">Search gallery</span>
            <input type="search" class="mmg-search" placeholder="Search photos" autocomplete="off" />
          </label>
          <label class="mmg-select-wrap mmg-select-wrap--sort">
            <span class="mmg-visually-hidden">Sort</span>
            <select class="mmg-sort" aria-label="Sort gallery">
              <option value="best">Best</option>
              <option value="newest">Newest</option>
              <option value="mural">Mural name</option>
            </select>
          </label>
        </div>
      </div>
      <p class="mmg-count" aria-live="polite"></p>
      <div class="mmg-grid" role="list"></div>
      <div class="mmg-empty" hidden>
        <p>No photos match your filters.</p>
        <button type="button" class="mmg-btn mmg-clear">Clear filters</button>
      </div>
      <button type="button" class="mmg-btn mmg-load-more" hidden>Load more</button>
    </div>
  `;const d=t.querySelector(".mmg-app"),r=t.querySelector(".mmg-grid"),o=t.querySelector(".mmg-count"),i=t.querySelector(".mmg-empty"),b=t.querySelector(".mmg-load-more"),f=t.querySelector(".mmg-category"),y=t.querySelector(".mmg-search"),u=t.querySelector(".mmg-sort");function g(){const l=e.taxonomy,h=[{value:"",label:e.segment==="business"?"All sectors":"All rooms"}];if(!l)return h;const x=e.segment==="business"?l.sectors:l.rooms;if(e.segment==="all")return h.push({value:"",label:"Select segment first",disabled:!0}),h;for(const[C,w]of Object.entries(x))h.push({value:C,label:w});return h}function p(){t.querySelectorAll(".mmg-seg").forEach(h=>{h.classList.toggle("is-active",h.dataset.seg===e.segment),h.setAttribute("aria-pressed",h.dataset.seg===e.segment?"true":"false")}),u.value=e.sort,y.value=e.search;const l=e.category;f.textContent="";for(const h of g()){const x=document.createElement("option");x.value=h.value,x.textContent=h.label,h.disabled&&(x.disabled=!0),f.appendChild(x)}[...f.options].some(h=>h.value===l)?f.value=l:(f.value="",e.category=""),f.disabled=e.segment==="all"}function a(l){var C,w;r.textContent="";const h=l.slice(0,e.visibleCount);for(const v of h){const _=(C=v.images)==null?void 0:C[0],S=document.createElement("article");S.className="mmg-card",S.setAttribute("role","listitem"),S.tabIndex=0,S.dataset.id=v.id;const F=_?`${_.w} / ${_.h}`:"4 / 3",U=((w=v.mural)==null?void 0:w.name)||v.headline||"Custom mural",G=v.caption||"";S.innerHTML=`
        <div class="mmg-card__media" style="aspect-ratio: ${F}">
          <img class="mmg-card__img" alt="" loading="lazy" decoding="async" />
          <div class="mmg-card__overlay">
            <span class="mmg-card__mural"></span>
            <span class="mmg-card__loc"></span>
          </div>
        </div>
      `;const L=S.querySelector(".mmg-card__img");_&&(L.src=q(_.src,450),L.srcset=N(_.src),L.sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",L.alt=_.alt||U),S.querySelector(".mmg-card__mural").textContent=U,S.querySelector(".mmg-card__loc").textContent=G;const M=()=>s(v,l);S.addEventListener("click",M),S.addEventListener("keydown",A=>{(A.key==="Enter"||A.key===" ")&&(A.preventDefault(),M())}),r.appendChild(S)}const x=l.length>e.visibleCount;b.hidden=!x,i.hidden=l.length>0,r.hidden=l.length===0,o.textContent=l.length===e.items.length?`${l.length} photos`:`${l.length} of ${e.items.length} photos`}function m(){e.searchTokens=e.search.trim().toLowerCase().split(/\s+/).filter(Boolean),p();const l=I(e);return a(l),l}t.querySelectorAll(".mmg-seg").forEach(l=>{l.addEventListener("click",()=>{e.segment=l.dataset.seg,e.category="",e.visibleCount=24,n()})}),f.addEventListener("change",()=>{e.category=f.value,e.visibleCount=24,n()}),u.addEventListener("change",()=>{e.sort=u.value,n()});const c=H(()=>n(),250);return y.addEventListener("input",()=>{e.search=y.value,e.visibleCount=24,c()}),b.addEventListener("click",()=>{e.visibleCount+=24,m()}),t.querySelector(".mmg-clear").addEventListener("click",()=>{e.segment="all",e.category="",e.search="",e.sort="best",e.visibleCount=24,n()}),d.hidden=!1,{refresh:m,updateHash:()=>Q(e)}}function se(t,e,s,n){let d=null,r=0;const o=document.createElement("div");o.className="mmg-lightbox",o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label","Photo details"),o.hidden=!0,o.innerHTML=`
    <div class="mmg-lightbox__backdrop" data-mmg-action="close"></div>
    <div class="mmg-lightbox__panel">
      <button type="button" class="mmg-lightbox__close" data-mmg-action="close" aria-label="Close">&times;</button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--prev" data-mmg-action="prev" aria-label="Previous photo">&lsaquo;</button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--next" data-mmg-action="next" aria-label="Next photo">&rsaquo;</button>
      <figure class="mmg-lightbox__figure">
        <img class="mmg-lightbox__img" alt="" decoding="async" />
        <figcaption class="mmg-lightbox__caption"></figcaption>
      </figure>
      <div class="mmg-lightbox__thumbs" hidden></div>
      <div class="mmg-lightbox__body">
        <p class="mmg-lightbox__headline"></p>
        <p class="mmg-lightbox__text"></p>
        <p class="mmg-lightbox__id"></p>
        <div class="mmg-lightbox__actions">
          <a class="mmg-btn mmg-btn--primary mmg-lightbox__mural" href="#"></a>
          <button type="button" class="mmg-btn mmg-lightbox__copy">Copy link</button>
          <a class="mmg-btn mmg-lightbox__pin" href="#" target="_blank" rel="noopener noreferrer">Save to Pinterest</a>
        </div>
      </div>
    </div>
  `,t.appendChild(o);const i={img:o.querySelector(".mmg-lightbox__img"),caption:o.querySelector(".mmg-lightbox__caption"),headline:o.querySelector(".mmg-lightbox__headline"),text:o.querySelector(".mmg-lightbox__text"),id:o.querySelector(".mmg-lightbox__id"),mural:o.querySelector(".mmg-lightbox__mural"),copy:o.querySelector(".mmg-lightbox__copy"),pin:o.querySelector(".mmg-lightbox__pin"),thumbs:o.querySelector(".mmg-lightbox__thumbs")};function b(a){return`${`${location.origin}${location.pathname}`}#${a}`}function f(a,m){const c=a.images||[],l=c[m]||c[0];if(!l)return;i.img.src=q(l.src,1600),i.img.srcset=N(l.src),i.img.sizes="(min-width: 900px) 900px, 100vw",i.img.alt=l.alt||"",i.img.style.aspectRatio=`${l.w} / ${l.h}`;const h=b(a.id),x=E(`${l.src}-1600.webp`);i.pin.href=te(h,x,a.headline||a.caption),c.length>1?(i.thumbs.hidden=!1,i.thumbs.textContent="",c.forEach((C,w)=>{const v=document.createElement("button");v.type="button",v.className="mmg-lightbox__thumb"+(w===m?" is-active":""),v.setAttribute("aria-label",`Image ${w+1} of ${c.length}`);const _=document.createElement("img");_.src=q(C.src,450),_.alt="",_.loading="lazy",v.appendChild(_),v.addEventListener("click",()=>{e.lightbox.imageIndex=w,f(a,w)}),i.thumbs.appendChild(v)})):i.thumbs.hidden=!0}function y(a,m=0){var c;i.caption.textContent=a.caption||"",i.headline.textContent=a.headline||"",i.text.textContent=a.text||"",i.id.textContent=`Photo ${a.id}`,(c=a.mural)!=null&&c.url?(i.mural.textContent="See this mural",i.mural.href=a.mural.url):(i.mural.textContent="Start a custom mural like this",i.mural.href="/custom-wall-murals.html"),i.mural.hidden=!1,f(a,m)}function u(a,m,c=0){const l=o.hidden;l&&(e.lastFocus=document.activeElement,d=D(o,g)),e.lightbox={item:a,list:m,imageIndex:c},o.hidden=!1,document.body.classList.add("mmg-lightbox-open"),y(a,c),l&&o.querySelector(".mmg-lightbox__close").focus()}function g(){var a;o.hidden=!0,document.body.classList.remove("mmg-lightbox-open"),e.lightbox=null,d&&d(),d=null,(a=e.lastFocus)!=null&&a.focus&&e.lastFocus.focus(),s==null||s()}function p(a){if(!e.lightbox)return;const{list:m,item:c}=e.lightbox,l=m.findIndex(x=>x.id===c.id);if(l<0)return;const h=m[(l+a+m.length)%m.length];e.lightbox.item=h,e.lightbox.imageIndex=0,y(h,0),n==null||n(h.id)}return o.addEventListener("click",a=>{var c;const m=(c=a.target.closest("[data-mmg-action]"))==null?void 0:c.getAttribute("data-mmg-action");m==="close"&&g(),m==="prev"&&p(-1),m==="next"&&p(1)}),i.copy.addEventListener("click",async()=>{if(!e.lightbox)return;const a=b(e.lightbox.item.id);try{await navigator.clipboard.writeText(a),i.copy.textContent="Copied!",setTimeout(()=>{i.copy.textContent="Copy link"},2e3)}catch{i.copy.textContent="Copy failed"}}),o.addEventListener("touchstart",a=>{var m;r=((m=a.changedTouches[0])==null?void 0:m.clientX)??0},{passive:!0}),o.addEventListener("touchend",a=>{var c;if(ee())return;const m=(((c=a.changedTouches[0])==null?void 0:c.clientX)??0)-r;Math.abs(m)<50||p(m>0?-1:1)},{passive:!0}),o.addEventListener("keydown",a=>{a.key==="ArrowLeft"&&(a.preventDefault(),p(-1)),a.key==="ArrowRight"&&(a.preventDefault(),p(1))}),{open:u,close:g,el:o}}const k=10,R=15*1024*1024;function oe(t){const e=document.createElement("button");e.type="button",e.className="mmg-share-tab",e.textContent="Share your wall";const s=document.createElement("div");s.className="mmg-share-modal",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.setAttribute("aria-label","Share your photo"),s.hidden=!0,s.innerHTML=`
    <div class="mmg-share-modal__backdrop" data-mmg-share="close"></div>
    <div class="mmg-share-modal__panel">
      <button type="button" class="mmg-share-modal__close" data-mmg-share="close" aria-label="Close">&times;</button>
      <h2 class="mmg-share-modal__title">Share your wall</h2>
      <p class="mmg-share-modal__intro">Upload a photo of your Magic Mural installation. Submissions are reviewed before appearing in the gallery.</p>
      <form class="mmg-share-form" novalidate>
        <div class="mmg-field mmg-field--hp" aria-hidden="true">
          <label for="mmg-hp">Leave blank</label>
          <input id="mmg-hp" name="website" type="text" tabindex="-1" autocomplete="off" />
        </div>
        <div class="mmg-field">
          <label for="mmg-photos">Photos <span class="mmg-req">*</span></label>
          <input id="mmg-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple required />
          <p class="mmg-hint">Up to ${k} images, ${R/(1024*1024)} MB each.</p>
          <ul class="mmg-share-previews" aria-live="polite"></ul>
        </div>
        <div class="mmg-field">
          <label for="mmg-email">Email <span class="mmg-req">*</span></label>
          <input id="mmg-email" name="email" type="email" required autocomplete="email" />
        </div>
        <div class="mmg-field">
          <label for="mmg-first">First name</label>
          <input id="mmg-first" name="firstName" type="text" autocomplete="given-name" />
        </div>
        <div class="mmg-field">
          <label for="mmg-location">City / state</label>
          <input id="mmg-location" name="location" type="text" autocomplete="address-level2" />
        </div>
        <div class="mmg-field">
          <label for="mmg-comment">Comment</label>
          <input id="mmg-comment" name="comment" type="text" maxlength="200" />
        </div>
        <div class="mmg-field mmg-field--check">
          <input id="mmg-permission" name="permission" type="checkbox" required />
          <label for="mmg-permission">OK to display my photo on magicmurals.com <span class="mmg-req">*</span></label>
        </div>
        <div id="mmg-turnstile" class="mmg-turnstile" aria-hidden="true"></div>
        <p class="mmg-share-status" role="status"></p>
        <button type="submit" class="mmg-btn mmg-btn--primary">Submit</button>
        <p class="mmg-share-alt">Prefer email? <a href="mailto:testimonials@magicmurals.com">Send photos to testimonials@magicmurals.com</a></p>
      </form>
    </div>
  `,t.appendChild(e),t.appendChild(s);const n=s.querySelector(".mmg-share-form"),d=s.querySelector(".mmg-share-previews"),r=s.querySelector(".mmg-share-status");let o=null,i=null,b=[];function f(){b.forEach(g=>URL.revokeObjectURL(g)),b=[],d.textContent=""}function y(){i=document.activeElement,s.hidden=!1,o=D(s,u),s.querySelector(".mmg-share-modal__close").focus()}function u(){s.hidden=!0,o&&o(),o=null,r.textContent="",i!=null&&i.focus&&i.focus()}return e.addEventListener("click",y),s.addEventListener("click",g=>{var a;((a=g.target.closest("[data-mmg-share]"))==null?void 0:a.getAttribute("data-mmg-share"))==="close"&&u()}),n.photos.addEventListener("change",()=>{f();const g=[...n.photos.files].slice(0,k);for(const p of g){const a=URL.createObjectURL(p);b.push(a);const m=document.createElement("li"),c=document.createElement("img");c.src=a,c.alt="",m.appendChild(c),d.appendChild(m)}}),n.addEventListener("submit",async g=>{if(g.preventDefault(),r.textContent="",n.website.value){r.textContent="Thanks!",n.reset(),f();return}const p=[...n.photos.files];if(!p.length){r.textContent="Please add at least one photo.";return}if(p.length>k){r.textContent=`Please select at most ${k} photos.`;return}for(const c of p)if(c.size>R){r.textContent="Each photo must be 15 MB or smaller.";return}const a=new FormData;p.forEach((c,l)=>a.append(`photo${l}`,c)),a.append("email",n.email.value),a.append("firstName",n.firstName.value),a.append("location",n.location.value),a.append("comment",n.comment.value),a.append("permission",n.permission.checked?"yes":"no");const m=n.querySelector('[type="submit"]');m.disabled=!0,r.textContent="Uploading…";try{const c=await fetch(z,{method:"POST",body:a}),l=await c.json().catch(()=>({}));if(!c.ok||!l.ok)throw new Error("upload_failed");r.textContent="Thank you! Your photo was received and will be reviewed.",n.reset(),f()}catch{r.textContent="Something went wrong. Please try again or email us."}finally{m.disabled=!1}}),new URLSearchParams(location.search).get("share")==="1"&&queueMicrotask(y),{open:y,close:u}}function ae(t,e=24){const s=document.getElementById("mmg-jsonld");s&&s.remove();const d=t.slice(0,e).map(o=>{var f,y;const i=(f=o.images)==null?void 0:f[0],b=i?E(`${i.src}-900.webp`):void 0;return{"@type":"ImageObject",name:o.headline||((y=o.mural)==null?void 0:y.name)||o.id,description:o.text||o.caption,contentUrl:b,thumbnailUrl:i?q(i.src,450):void 0,caption:o.caption}}),r=document.createElement("script");r.type="application/ld+json",r.id="mmg-jsonld",r.textContent=JSON.stringify({"@context":"https://schema.org","@graph":d}),document.head.appendChild(r)}function ie(t){if(document.querySelector("link[data-mmg-css]"))return;const e=document.createElement("link");e.rel="stylesheet",e.href=E("mmg.css"),e.setAttribute("data-mmg-css",""),document.head.appendChild(e)}async function j(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load ${t}`);return e.json()}async function B(){const t=document.getElementById("mmg-gallery");if(!t)return;const e=document.currentScript||document.querySelector('script[src*="mmg"], script[src*="main.js"]'),s=Z(e);X(s),ie();const n=J(),[d,r]=await Promise.all([j(E("data/gallery.json")),j(E("data/taxonomy.json"))]);n.items=d.items||[],n.taxonomy=r,ae(n.items);let o,i;const b=H(()=>{$().id||P(i.updateHash())},100);i=ne(t,n,{onOpenLightbox:(u,g)=>{P(new URLSearchParams,u.id),o.open(u,g)},onStateChange:()=>{const u=i.refresh();if(b(),n.pendingOpenId){const g=u.find(p=>p.id===n.pendingOpenId);g&&(o.open(g,u),n.pendingOpenId=null)}}}),o=se(t,n,()=>{b()},u=>{P(new URLSearchParams,u)}),oe(t);const y=$();if(O(n,y),y.id&&(n.pendingOpenId=y.id.toUpperCase()),i.refresh(),n.pendingOpenId){const u=I(n),g=u.find(p=>p.id===n.pendingOpenId)||n.items.find(p=>p.id===n.pendingOpenId);g&&(o.open(g,u.length?u:n.items),n.pendingOpenId=null)}window.addEventListener("hashchange",()=>{const u=$();if(u.id){const g=I(n),p=n.items.find(a=>a.id===u.id);p&&o.open(p,g.length?g:n.items);return}O(n,u),n.visibleCount=24,i.refresh(),o.close()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",B):B();
