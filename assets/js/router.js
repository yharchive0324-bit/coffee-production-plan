/* ============================================================
   router.js — 해시 기반 단순 라우터 (빌드 도구 없이 동작)
   형식: #route 또는 #route?key=value&key2=value2
   전역: window.ROUTER
   ============================================================ */
(function () {
  "use strict";

  function parseHash() {
    let h = window.location.hash.replace(/^#/, "");
    if (!h) h = "dashboard";
    const qIdx = h.indexOf("?");
    let route = h, params = {};
    if (qIdx >= 0) {
      route = h.slice(0, qIdx);
      h.slice(qIdx + 1).split("&").forEach((pair) => {
        if (!pair) return;
        const kv = pair.split("=");
        params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
      });
    }
    return { route, params };
  }

  function render() {
    const { route, params } = parseHash();
    const page = window.PAGES[route] || window.PAGES.dashboard;
    const view = document.getElementById("view");

    view.innerHTML = page.render ? page.render(params) : "";
    if (page.mount) page.mount(params);

    // 브레드크럼
    const bc = document.getElementById("breadcrumb");
    if (bc) {
      const crumb = page.crumb || [page.title || route];
      bc.innerHTML = crumb.map((c, i) =>
        i === crumb.length - 1 ? "<b>" + U.esc(c) + "</b>" : U.esc(c)
      ).join(" › ");
    }

    // 활성 메뉴 표시
    document.querySelectorAll(".nav__item").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.route === route);
    });

    document.title = (page.title ? page.title + " · " : "") + "커피 생산관리 (Wireframe)";
    window.scrollTo(0, 0);
  }

  function start() {
    window.addEventListener("hashchange", render);
    render();
  }

  window.ROUTER = { start, render, parseHash };
})();
