let M="./";const z="/api/upload";function Z(t){var e;if(typeof globalThis<"u"&&globalThis.MMG_ASSET_BASE)return String(globalThis.MMG_ASSET_BASE).replace(/\/$/,"")||".";if((e=t==null?void 0:t.src)!=null&&e.includes("/src/main"))return"/";try{return new URL(t.src,location.href).pathname.replace(/\/mmg\.js$/,"")||"."}catch{return"/"}}function X(t){M=t.endsWith("/")?t.slice(0,-1):t}function q(t){const e=t.startsWith("/")?t.slice(1):t;return`${M==="."?"":M}/${e}`.replace(/\/+/g,"/")}function J(){return{items:[],taxonomy:null,sort:"best",segment:"all",category:"",search:"",visibleCount:24,lightbox:null,lastFocus:null}}function K(t,e){const s=t.featured?1:0,n=e.featured?1:0;if(n!==s)return n-s;const m=t.score??0,c=e.score??0;return c!==m?c-m:(e.added||"").localeCompare(t.added||"")}function W(t,e){const s=[...t];return e==="newest"?s.sort((n,m)=>(m.added||"").localeCompare(n.added||"")):e==="mural"?s.sort((n,m)=>{var a,_;const c=(((a=n.mural)==null?void 0:a.name)||n.headline||"").toLowerCase(),o=(((_=m.mural)==null?void 0:_.name)||m.headline||"").toLowerCase();return c.localeCompare(o)}):s.sort(K),s}function Y(t){var e;return[t.headline,t.caption,t.text,(e=t.mural)==null?void 0:e.name].filter(Boolean).join(" ").toLowerCase()}function B(t){let e=t.items;t.segment==="residential"?e=e.filter(n=>n.segment==="residential"):t.segment==="business"&&(e=e.filter(n=>n.segment==="business")),t.category&&(e=e.filter(n=>n.segment==="business"?(n.sectors||[]).includes(t.category):(n.rooms||[]).includes(t.category)));const s=t.searchTokens||[];return s.length&&(e=e.filter(n=>{const m=Y(n);return s.every(c=>m.includes(c))})),W(e,t.sort)}function R(t,e){const s=e.params.get("seg");s==="residential"||s==="business"?t.segment=s:e.params.has("seg")&&(t.segment="all");const n=e.params.get("room"),m=e.params.get("sector");t.category=n||m||"";const c=e.params.get("sort");(c==="newest"||c==="mural"||c==="best")&&(t.sort=c);const o=e.params.get("q");o!=null&&(t.search=o)}function Q(t){var s,n;const e=new URLSearchParams;return t.segment!=="all"&&e.set("seg",t.segment),t.category&&(t.segment==="business"?e.set("sector",t.category):t.segment==="residential"?e.set("room",t.category):(n=(s=t.taxonomy)==null?void 0:s.sectors)!=null&&n[t.category]?e.set("sector",t.category):e.set("room",t.category)),t.sort!=="best"&&e.set("sort",t.sort),t.search.trim()&&e.set("q",t.search.trim()),e}function D(t,e){let s;return(...n)=>{clearTimeout(s),s=setTimeout(()=>t(...n),e)}}function I(){const t=location.hash.replace(/^#/,"").trim();return t?/^G-\d{4}$/i.test(t)?{id:t.toUpperCase(),params:new URLSearchParams}:{id:null,params:new URLSearchParams(t)}:{id:null,params:new URLSearchParams}}function U(t,e){if(e){location.hash=e;return}const s=t.toString();location.hash=s||""}function V(t){return[...t.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>e.offsetParent!==null||e===document.activeElement)}function F(t,e){const s=n=>{if(n.key==="Escape"){n.preventDefault(),e();return}if(n.key!=="Tab")return;const m=V(t);if(!m.length)return;const c=m[0],o=m[m.length-1];n.shiftKey&&document.activeElement===c?(n.preventDefault(),o.focus()):!n.shiftKey&&document.activeElement===o&&(n.preventDefault(),c.focus())};return document.addEventListener("keydown",s),()=>document.removeEventListener("keydown",s)}function ee(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function G(t){return[450,900,1600].map(s=>`${q(`${t}-${s}.webp`)} ${s}w`).join(", ")}function P(t,e){const s=e<=450?450:e<=900?900:1600;return q(`${t}-${s}.webp`)}function te(t,e,s){const n=new URL("https://www.pinterest.com/pin/create/button/");return n.searchParams.set("url",t),n.searchParams.set("media",e),n.searchParams.set("description",s),n.toString()}function ne(t,e,{onOpenLightbox:s,onStateChange:n}){t.classList.add("mmg-root"),t.innerHTML=`
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
  `;const m=t.querySelector(".mmg-app"),c=t.querySelector(".mmg-grid"),o=t.querySelector(".mmg-count"),a=t.querySelector(".mmg-empty"),_=t.querySelector(".mmg-load-more"),v=t.querySelector(".mmg-category"),x=t.querySelector(".mmg-search"),d=t.querySelector(".mmg-sort");function p(){const l=e.taxonomy,u=[{value:"",label:e.segment==="business"?"All sectors":"All rooms"}];if(!l)return u;const f=e.segment==="business"?l.sectors:l.rooms;if(e.segment==="all")return u.push({value:"",label:"Select segment first",disabled:!0}),u;for(const[b,L]of Object.entries(f))u.push({value:b,label:L});return u}function h(){t.querySelectorAll(".mmg-seg").forEach(u=>{u.classList.toggle("is-active",u.dataset.seg===e.segment),u.setAttribute("aria-pressed",u.dataset.seg===e.segment?"true":"false")}),d.value=e.sort,x.value=e.search;const l=e.category;v.textContent="";for(const u of p()){const f=document.createElement("option");f.value=u.value,f.textContent=u.label,u.disabled&&(f.disabled=!0),v.appendChild(f)}[...v.options].some(u=>u.value===l)?v.value=l:(v.value="",e.category=""),v.disabled=e.segment==="all"}function g(l){var b,L;c.textContent="";const u=l.slice(0,e.visibleCount);for(const S of u){const w=(b=S.images)==null?void 0:b[0],y=document.createElement("article");y.className="mmg-card",y.setAttribute("role","listitem"),y.tabIndex=0,y.dataset.id=S.id;const E=w?`${w.w} / ${w.h}`:"4 / 3",C=((L=S.mural)==null?void 0:L.name)||S.headline||"Custom mural",A=S.caption||"";y.innerHTML=`
        <div class="mmg-card__media" style="aspect-ratio: ${E}">
          <img class="mmg-card__img" alt="" loading="lazy" decoding="async" />
          <div class="mmg-card__overlay">
            <span class="mmg-card__mural"></span>
            <span class="mmg-card__loc"></span>
          </div>
        </div>
      `;const k=y.querySelector(".mmg-card__img");w&&(k.src=P(w.src,450),k.srcset=G(w.src),k.sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",k.alt=w.alt||C),y.querySelector(".mmg-card__mural").textContent=C,y.querySelector(".mmg-card__loc").textContent=A;const O=()=>s(S,l);y.addEventListener("click",O),y.addEventListener("keydown",T=>{(T.key==="Enter"||T.key===" ")&&(T.preventDefault(),O())}),c.appendChild(y)}const f=l.length>e.visibleCount;_.hidden=!f,a.hidden=l.length>0,c.hidden=l.length===0,o.textContent=l.length===e.items.length?`${l.length} photos`:`${l.length} of ${e.items.length} photos`}function i(){e.searchTokens=e.search.trim().toLowerCase().split(/\s+/).filter(Boolean),h();const l=B(e);return g(l),l}t.querySelectorAll(".mmg-seg").forEach(l=>{l.addEventListener("click",()=>{e.segment=l.dataset.seg,e.category="",e.visibleCount=24,n()})}),v.addEventListener("change",()=>{e.category=v.value,e.visibleCount=24,n()}),d.addEventListener("change",()=>{e.sort=d.value,n()});const r=D(()=>n(),250);return x.addEventListener("input",()=>{e.search=x.value,e.visibleCount=24,r()}),_.addEventListener("click",()=>{e.visibleCount+=24,i()}),t.querySelector(".mmg-clear").addEventListener("click",()=>{e.segment="all",e.category="",e.search="",e.sort="best",e.visibleCount=24,n()}),m.hidden=!1,{refresh:i,updateHash:()=>Q(e)}}function se(t,e,s,n){let m=null,c=0;const o=document.createElement("div");o.className="mmg-lightbox",o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label","Photo details"),o.hidden=!0,o.innerHTML=`
    <div class="mmg-lightbox__backdrop" data-mmg-action="close"></div>
    <div class="mmg-lightbox__panel">
      <button type="button" class="mmg-lightbox__close" data-mmg-action="close" aria-label="Close">&times;</button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--prev" data-mmg-action="prev" aria-label="Previous photo">&lsaquo;</button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--next" data-mmg-action="next" aria-label="Next photo">&rsaquo;</button>
      <figure class="mmg-lightbox__figure">
        <img class="mmg-lightbox__img" alt="" decoding="async" />
        <p class="mmg-lightbox__image-count" hidden></p>
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
  `,t.appendChild(o);const a={img:o.querySelector(".mmg-lightbox__img"),caption:o.querySelector(".mmg-lightbox__caption"),headline:o.querySelector(".mmg-lightbox__headline"),text:o.querySelector(".mmg-lightbox__text"),id:o.querySelector(".mmg-lightbox__id"),mural:o.querySelector(".mmg-lightbox__mural"),copy:o.querySelector(".mmg-lightbox__copy"),pin:o.querySelector(".mmg-lightbox__pin"),thumbs:o.querySelector(".mmg-lightbox__thumbs"),imageCount:o.querySelector(".mmg-lightbox__image-count"),prevBtn:o.querySelector(".mmg-lightbox__nav--prev"),nextBtn:o.querySelector(".mmg-lightbox__nav--next")};function _(i){return`${`${location.origin}${location.pathname}`}#${i}`}function v(i,r){const l=i.images||[],u=l.length>1,f=r<=0,b=r>=l.length-1;a.prevBtn.setAttribute("aria-label",u&&!f?"Previous image in this set":"Previous testimonial"),a.nextBtn.setAttribute("aria-label",u&&!b?"Next image in this set":"Next testimonial")}function x(i,r,l={}){const{rebuildThumbs:u=!0}=l,f=i.images||[],b=f[r]||f[0];if(!b)return;a.img.src=P(b.src,1600),a.img.srcset=G(b.src),a.img.sizes="(min-width: 900px) 900px, 100vw",a.img.alt=b.alt||"",a.img.style.aspectRatio=`${b.w} / ${b.h}`;const L=_(i.id),S=q(`${b.src}-1600.webp`);if(a.pin.href=te(L,S,i.headline||i.caption),f.length>1?(a.imageCount.hidden=!1,a.imageCount.textContent=`Image ${r+1} of ${f.length}`):(a.imageCount.hidden=!0,a.imageCount.textContent=""),v(i,r),f.length>1){a.thumbs.hidden=!1;const w=a.thumbs.querySelectorAll(".mmg-lightbox__thumb");u||w.length!==f.length?(a.thumbs.textContent="",f.forEach((y,E)=>{const C=document.createElement("button");C.type="button",C.className="mmg-lightbox__thumb"+(E===r?" is-active":""),C.setAttribute("aria-label",`Show image ${E+1} of ${f.length}`),C.setAttribute("aria-current",E===r?"true":"false");const A=document.createElement("img");A.src=P(y.src,450),A.alt="",A.loading="lazy",C.appendChild(A),C.addEventListener("click",()=>{e.lightbox&&(e.lightbox.imageIndex=E,x(e.lightbox.item,E,{rebuildThumbs:!1}))}),a.thumbs.appendChild(C)})):w.forEach((y,E)=>{y.classList.toggle("is-active",E===r),y.setAttribute("aria-current",E===r?"true":"false")})}else a.thumbs.hidden=!0,a.thumbs.textContent=""}function d(i,r=0){var l;a.caption.textContent=i.caption||"",a.headline.textContent=i.headline||"",a.text.textContent=i.text||"",a.id.textContent=`Photo ${i.id}`,(l=i.mural)!=null&&l.url?(a.mural.textContent="See this mural",a.mural.href=i.mural.url):(a.mural.textContent="Start a custom mural like this",a.mural.href="/custom-wall-murals.html"),a.mural.hidden=!1,x(i,r)}function p(i,r,l=0){const u=o.hidden;u&&(e.lastFocus=document.activeElement,m=F(o,h)),e.lightbox={item:i,list:r,imageIndex:l},o.hidden=!1,document.body.classList.add("mmg-lightbox-open"),d(i,l),u&&o.querySelector(".mmg-lightbox__close").focus()}function h(){var i;o.hidden=!0,document.body.classList.remove("mmg-lightbox-open"),e.lightbox=null,m&&m(),m=null,(i=e.lastFocus)!=null&&i.focus&&e.lastFocus.focus(),s==null||s()}function g(i){if(!e.lightbox)return;const{list:r,item:l,imageIndex:u}=e.lightbox,f=l.images||[],b=u+i;if(f.length>1&&b>=0&&b<f.length){e.lightbox.imageIndex=b,x(l,b,{rebuildThumbs:!1});return}const L=r.findIndex(E=>E.id===l.id);if(L<0)return;const S=r[(L+i+r.length)%r.length],w=S.images||[],y=i>0?0:Math.max(0,w.length-1);e.lightbox.item=S,e.lightbox.imageIndex=y,d(S,y),n==null||n(S.id)}return o.addEventListener("click",i=>{var l;const r=(l=i.target.closest("[data-mmg-action]"))==null?void 0:l.getAttribute("data-mmg-action");r==="close"&&h(),r==="prev"&&g(-1),r==="next"&&g(1)}),a.copy.addEventListener("click",async()=>{if(!e.lightbox)return;const i=_(e.lightbox.item.id);try{await navigator.clipboard.writeText(i),a.copy.textContent="Copied!",setTimeout(()=>{a.copy.textContent="Copy link"},2e3)}catch{a.copy.textContent="Copy failed"}}),o.addEventListener("touchstart",i=>{var r;c=((r=i.changedTouches[0])==null?void 0:r.clientX)??0},{passive:!0}),o.addEventListener("touchend",i=>{var l;if(ee())return;const r=(((l=i.changedTouches[0])==null?void 0:l.clientX)??0)-c;Math.abs(r)<50||g(r>0?-1:1)},{passive:!0}),o.addEventListener("keydown",i=>{i.key==="ArrowLeft"&&(i.preventDefault(),g(-1)),i.key==="ArrowRight"&&(i.preventDefault(),g(1))}),{open:p,close:h,el:o}}const $=10,j=15*1024*1024;function oe(t){const e=document.createElement("button");e.type="button",e.className="mmg-share-tab",e.textContent="Share your wall";const s=document.createElement("div");s.className="mmg-share-modal",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.setAttribute("aria-label","Share your photo"),s.hidden=!0,s.innerHTML=`
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
          <p class="mmg-hint">Up to ${$} images, ${j/(1024*1024)} MB each.</p>
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
  `,t.appendChild(e),t.appendChild(s);const n=s.querySelector(".mmg-share-form"),m=s.querySelector(".mmg-share-previews"),c=s.querySelector(".mmg-share-status");let o=null,a=null,_=[];function v(){_.forEach(p=>URL.revokeObjectURL(p)),_=[],m.textContent=""}function x(){a=document.activeElement,s.hidden=!1,o=F(s,d),s.querySelector(".mmg-share-modal__close").focus()}function d(){s.hidden=!0,o&&o(),o=null,c.textContent="",a!=null&&a.focus&&a.focus()}return e.addEventListener("click",x),s.addEventListener("click",p=>{var g;((g=p.target.closest("[data-mmg-share]"))==null?void 0:g.getAttribute("data-mmg-share"))==="close"&&d()}),n.photos.addEventListener("change",()=>{v();const p=[...n.photos.files].slice(0,$);for(const h of p){const g=URL.createObjectURL(h);_.push(g);const i=document.createElement("li"),r=document.createElement("img");r.src=g,r.alt="",i.appendChild(r),m.appendChild(i)}}),n.addEventListener("submit",async p=>{if(p.preventDefault(),c.textContent="",n.website.value){c.textContent="Thanks!",n.reset(),v();return}const h=[...n.photos.files];if(!h.length){c.textContent="Please add at least one photo.";return}if(h.length>$){c.textContent=`Please select at most ${$} photos.`;return}for(const r of h)if(r.size>j){c.textContent="Each photo must be 15 MB or smaller.";return}const g=new FormData;h.forEach((r,l)=>g.append(`photo${l}`,r)),g.append("email",n.email.value),g.append("firstName",n.firstName.value),g.append("location",n.location.value),g.append("comment",n.comment.value),g.append("permission",n.permission.checked?"yes":"no");const i=n.querySelector('[type="submit"]');i.disabled=!0,c.textContent="Uploading…";try{const r=await fetch(z,{method:"POST",body:g}),l=await r.json().catch(()=>({}));if(!r.ok||!l.ok)throw new Error("upload_failed");c.textContent="Thank you! Your photo was received and will be reviewed.",n.reset(),v()}catch{c.textContent="Something went wrong. Please try again or email us."}finally{i.disabled=!1}}),new URLSearchParams(location.search).get("share")==="1"&&queueMicrotask(x),{open:x,close:d}}function ae(t,e=24){const s=document.getElementById("mmg-jsonld");s&&s.remove();const m=t.slice(0,e).map(o=>{var v,x;const a=(v=o.images)==null?void 0:v[0],_=a?q(`${a.src}-900.webp`):void 0;return{"@type":"ImageObject",name:o.headline||((x=o.mural)==null?void 0:x.name)||o.id,description:o.text||o.caption,contentUrl:_,thumbnailUrl:a?P(a.src,450):void 0,caption:o.caption}}),c=document.createElement("script");c.type="application/ld+json",c.id="mmg-jsonld",c.textContent=JSON.stringify({"@context":"https://schema.org","@graph":m}),document.head.appendChild(c)}function ie(t){if(document.querySelector("link[data-mmg-css]"))return;const e=document.createElement("link");e.rel="stylesheet",e.href=q("mmg.css"),e.setAttribute("data-mmg-css",""),document.head.appendChild(e)}async function N(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load ${t}`);return e.json()}async function H(){const t=document.getElementById("mmg-gallery");if(!t)return;const e=document.currentScript||document.querySelector('script[src*="mmg"], script[src*="main.js"]'),s=Z(e);X(s),ie();const n=J(),[m,c]=await Promise.all([N(q("data/gallery.json")),N(q("data/taxonomy.json"))]);n.items=m.items||[],n.taxonomy=c,ae(n.items);let o,a;const _=D(()=>{I().id||U(a.updateHash())},100);a=ne(t,n,{onOpenLightbox:(d,p)=>{U(new URLSearchParams,d.id),o.open(d,p)},onStateChange:()=>{const d=a.refresh();if(_(),n.pendingOpenId){const p=d.find(h=>h.id===n.pendingOpenId);p&&(o.open(p,d),n.pendingOpenId=null)}}}),o=se(t,n,()=>{_()},d=>{U(new URLSearchParams,d)}),oe(t);const x=I();if(R(n,x),x.id&&(n.pendingOpenId=x.id.toUpperCase()),a.refresh(),n.pendingOpenId){const d=B(n),p=d.find(h=>h.id===n.pendingOpenId)||n.items.find(h=>h.id===n.pendingOpenId);p&&(o.open(p,d.length?d:n.items),n.pendingOpenId=null)}window.addEventListener("hashchange",()=>{const d=I();if(d.id){const p=B(n),h=n.items.find(g=>g.id===d.id);h&&o.open(h,p.length?p:n.items);return}R(n,d),n.visibleCount=24,a.refresh(),o.close()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",H):H();
