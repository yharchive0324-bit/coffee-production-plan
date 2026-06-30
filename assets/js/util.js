/* ============================================================
   util.js — 공용 유틸 (DOM 생성 / 포맷)
   전역: window.U
   ============================================================ */
(function () {
  "use strict";

  /* 안전한 HTML 이스케이프 */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* 천단위 콤마 (정수) */
  function n0(v) {
    if (v == null || isNaN(v)) return "-";
    return Math.round(v).toLocaleString("ko-KR");
  }

  /* 소수 자릿수 포맷 */
  function nd(v, digits) {
    if (v == null || isNaN(v)) return "-";
    return Number(v).toLocaleString("ko-KR", {
      minimumFractionDigits: digits, maximumFractionDigits: digits,
    });
  }

  /* 퍼센트 */
  function pct(v, digits) {
    if (v == null || isNaN(v)) return "-";
    return nd(v, digits == null ? 1 : digits) + "%";
  }

  /* tagged template 비슷한 간단 HTML 헬퍼는 쓰지 않고 문자열 조립 사용 */

  window.U = { esc, n0, nd, pct };
})();
