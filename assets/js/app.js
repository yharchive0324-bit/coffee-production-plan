/* ============================================================
   app.js — 부트스트랩: 네비게이션 렌더 + 라우터 시작
   ============================================================ */
(function () {
  "use strict";

  function renderNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    nav.innerHTML = window.MENU.map((group) =>
      '<div class="nav__group-title">' + U.esc(group.group) + "</div>" +
      group.items.map((it) =>
        '<a class="nav__item" data-route="' + U.esc(it.route) + '" href="#' + U.esc(it.route) + '">' +
        '<span class="nav__icon">' + it.icon + "</span>" +
        '<span class="nav__label">' + U.esc(it.label) + "</span></a>"
      ).join("")
    ).join("");
  }

  function wireToggle() {
    const btn = document.getElementById("navToggle");
    if (btn) btn.addEventListener("click", () => document.body.classList.toggle("nav-collapsed"));
  }

  function init() {
    renderNav();
    wireToggle();
    window.ROUTER.start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
