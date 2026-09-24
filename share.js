(function () {
  var SITE = location.origin + location.pathname;
  var PARAM = "listing";
  var wanted = new URLSearchParams(location.search).get(PARAM);
  var handled = !wanted;
  var current = null;

  var css =
    ".dp-share{position:absolute;top:12px;right:12px;z-index:2;width:40px;height:40px;border-radius:50%;" +
    "background:rgba(0,0,0,.72);border:1px solid rgba(189,159,99,.7);color:#EBD391;display:grid;place-items:center;cursor:pointer}" +
    ".dp-share:hover,.dp-share:focus-visible{background:#BD9F63;color:#000}" +
    ".dp-share svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
    ".dp-bar{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;padding-top:18px;border-top:1px solid #E0DCD3}" +
    ".dp-bar button{font:inherit;font-weight:500;padding:12px 20px;cursor:pointer;border:1px solid #000;letter-spacing:.03em}" +
    ".dp-bar .dp-main{background:#000;color:#EBD391}" +
    ".dp-bar .dp-main:hover{background:#BD9F63;border-color:#BD9F63;color:#000}" +
    ".dp-bar .dp-copy{background:#fff;color:#000}" +
    ".dp-bar .dp-copy:hover{border-color:#BD9F63;color:#8A6D35}" +
    ".dp-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);opacity:0;z-index:9999;" +
    "background:#000;color:#EBD391;border:1px solid #BD9F63;padding:12px 20px;font-size:.95rem;" +
    "transition:opacity .25s,transform .25s;pointer-events:none;max-width:90vw;text-align:center}" +
    ".dp-toast.show{opacity:1;transform:translate(-50%,0)}" +
    "@media (prefers-reduced-motion:reduce){.dp-toast{transition:none}}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/>' +
    '<circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/></svg>';

  function slug(s) {
    return (s || "").toLowerCase().normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  function text(el, sel) {
    var n = el.querySelector(sel);
    return n ? n.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function urlFor(card) {
    return SITE + "?" + PARAM + "=" + encodeURIComponent(card.dataset.dpSlug);
  }

  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "dp-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  function copy(url) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("Link copied"); }
      catch (e) { window.prompt("Copy this link:", url); }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, fallback);
    } else { fallback(); }
  }

  function share(card) {
    var url = urlFor(card);
    var title = text(card, "h3");
    var price = text(card, ".price");
    var msg = title + (price ? " – " + price : "");
    if (navigator.share) {
      navigator.share({ title: title, text: msg, url: url }).catch(function () {});
    } else { copy(url); }
  }

  function tagCards() {
    var grid = document.getElementById("grid");
    if (!grid) return;
    var seen = {};
    grid.querySelectorAll(".card").forEach(function (card) {
      var status = /sale/i.test(text(card, ".status")) ? "sale" : "rent";
      var s = slug(text(card, "h3") + " " + status);
      if (!s) return;
      seen[s] = (seen[s] || 0) + 1;
      if (seen[s] > 1) s += "-" + seen[s];
      card.dataset.dpSlug = s;
      var photo = card.querySelector(".photo");
      if (photo && !photo.querySelector(".dp-share")) {
        var b = document.createElement("span");
        b.className = "dp-share";
        b.setAttribute("role", "button");
        b.setAttribute("tabindex", "0");
        b.setAttribute("aria-label", "Share this listing");
        b.innerHTML = ICON;
        b.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation(); share(card);
        });
        b.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault(); e.stopPropagation(); share(card);
          }
        });
        photo.appendChild(b);
      }
    });
    openWanted();
  }

  function openWanted() {
    if (handled) return;
    var card = document.querySelector('#grid .card[data-dp-slug="' + CSS.escape(wanted) + '"]');
    if (!card) return;
    handled = true;
    card.scrollIntoView({ block: "center" });
    setTimeout(function () { card.click(); }, 350);
  }
  setTimeout(function () {
    if (!handled) {
      handled = true;
      var sec = document.getElementById("listings");
      if (sec) sec.scrollIntoView();
      toast("This listing is no longer available. Here are our current listings.");
    }
  }, 9000);

  document.addEventListener("click", function (e) {
    var card = e.target.closest && e.target.closest("#grid .card");
    if (card) current = card;
  }, true);

  function addBar() {
    var info = document.getElementById("info");
    if (!info || !current) return;
    var old = info.querySelector(".dp-bar");
    if (old) old.remove();
    var bar = document.createElement("div");
    bar.className = "dp-bar";
    var card = current;
    var main = document.createElement("button");
    main.type = "button";
    main.className = "dp-main";
    main.textContent = "Share this listing";
    main.addEventListener("click", function () { share(card); });
    var cp = document.createElement("button");
    cp.type = "button";
    cp.className = "dp-copy";
    cp.textContent = "Copy link";
    cp.addEventListener("click", function () { copy(urlFor(card)); });
    bar.appendChild(main);
    bar.appendChild(cp);
    info.appendChild(bar);
    if (history.replaceState) history.replaceState(null, "", urlFor(card));
  }

  var dlg = document.getElementById("detail");
  if (dlg) {
    new MutationObserver(function () {
      if (dlg.hasAttribute("open")) setTimeout(addBar, 0);
    }).observe(dlg, { attributes: true, attributeFilter: ["open"] });
    dlg.addEventListener("close", function () {
      if (history.replaceState) history.replaceState(null, "", SITE);
    });
  }

  var grid = document.getElementById("grid");
  if (grid) {
    new MutationObserver(tagCards).observe(grid, { childList: true });
    tagCards();
  }
})();
