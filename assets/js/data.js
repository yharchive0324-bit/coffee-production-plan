/* ============================================================
   data.js — 샘플(목업) 기준정보 + 메뉴 구성
   ※ DB 연결 전까지 사용하는 정적 데이터. 추후 API 응답으로 교체.
   전역 네임스페이스: window.DB / window.MENU
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 생산라인(공정 구분) ----------
     주간/일간 생산계획을 이 라인 기준으로 세분화한다. */
  const lines = ["로스팅", "추출", "병입", "SD", "과립", "MRC", "액상스틱"];

  /* ---------- 메뉴 구조 (와이어프레임 핵심) ----------
     각 항목 route 는 router.js 의 페이지 키와 1:1 매칭 */
  const MENU = [
    {
      group: "현황",
      items: [
        { route: "dashboard", icon: "🏠", label: "대시보드" },
      ],
    },
    {
      group: "기준정보",
      items: [
        { route: "products", icon: "📦", label: "제품 관리" },
        { route: "bom",      icon: "🧾", label: "BOM 관리" },
        { route: "routing",  icon: "🔀", label: "라우팅·수율 관리" },
        { route: "process",  icon: "🏭", label: "공정 관리" },
      ],
    },
    {
      group: "발주 / 주문",
      items: [
        { route: "order",     icon: "✍️", label: "발주 입력" },
        { route: "orderList", icon: "📋", label: "발주 현황" },
      ],
    },
    {
      group: "생산계획",
      items: [
        { route: "plan",        icon: "📈", label: "생산계획 산출" },
        { route: "planWeekly",  icon: "🗓️", label: "주간 생산계획" },
        { route: "planDaily",   icon: "📅", label: "일간 생산계획" },
        { route: "planProcess", icon: "🗂️", label: "공정별 생산계획" },
      ],
    },
    {
      group: "작업지시",
      items: [
        { route: "workorder", icon: "📑", label: "공정별 작업지시" },
      ],
    },
  ];

  /* ---------- 공정 마스터 ---------- */
  const processes = [
    { code: "WGH", name: "투입·계량", workCenter: "WC-01", desc: "원료 계량 및 투입" },
    { code: "RST", name: "로스팅",     workCenter: "WC-02", desc: "배전(원두 볶음)" },
    { code: "GRD", name: "분쇄",       workCenter: "WC-03", desc: "원두 분쇄" },
    { code: "EXT", name: "추출",       workCenter: "WC-04", desc: "커피 추출" },
    { code: "CON", name: "농축",       workCenter: "WC-05", desc: "추출액 농축" },
    { code: "SPD", name: "분무건조",   workCenter: "WC-06", desc: "스프레이 드라이(SD)" },
    { code: "GRN", name: "과립",       workCenter: "WC-07", desc: "응집·과립화" },
    { code: "BLD", name: "블렌딩",     workCenter: "WC-08", desc: "원료 배합" },
    { code: "STE", name: "살균",       workCenter: "WC-09", desc: "UHT/살균" },
    { code: "BOT", name: "병입",       workCenter: "WC-10", desc: "충전·병입" },
    { code: "STK", name: "스틱충전",   workCenter: "WC-11", desc: "스틱 충전·성형" },
    { code: "PKG", name: "포장",       workCenter: "WC-12", desc: "내·외포장" },
    { code: "QC",  name: "품질검사",   workCenter: "WC-13", desc: "중량·관능·이물 검사" },
    { code: "SHP", name: "출하",       workCenter: "WC-14", desc: "팔레타이징·출하 대기" },
  ];

  /* ---------- 제품 마스터 ----------
     line: 생산라인(위 lines 중 하나)  ← 주간계획 세분화 기준
     routing: 공정 순서 + 공정별 수율(%) + 표준 작업시간(분/1,000ea 기준)
     bom: 완제품 1 단위(ea) 당 소요 원·부자재 */
  const products = [
    /* ===== 로스팅 라인 ===== */
    {
      code: "FG-RS01", name: "원두커피 250g (홀빈)", unit: "ea", spec: "250g / 봉",
      line: "로스팅", category: "로스팅",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 40 },
        { seq: 2, process: "RST", yield: 84.0,  stdMinPer1000: 180 },
        { seq: 3, process: "BLD", yield: 99.0,  stdMinPer1000: 50 },
        { seq: 4, process: "PKG", yield: 99.5,  stdMinPer1000: 120 },
        { seq: 5, process: "QC",  yield: 99.8,  stdMinPer1000: 30 },
      ],
      bom: [
        { material: "RM-GB-01", name: "생두(아라비카)", qtyPer: 0.298, unit: "kg" },
        { material: "PK-BAG-250", name: "원두 봉투 250g", qtyPer: 1, unit: "ea" },
        { material: "PK-LBL-01", name: "라벨", qtyPer: 1, unit: "ea" },
        { material: "PK-VLV-01", name: "아로마 밸브", qtyPer: 1, unit: "ea" },
      ],
    },
    {
      code: "FG-RS02", name: "분쇄원두 200g", unit: "ea", spec: "200g / 봉",
      line: "로스팅", category: "로스팅",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 40 },
        { seq: 2, process: "RST", yield: 84.0,  stdMinPer1000: 180 },
        { seq: 3, process: "GRD", yield: 98.5,  stdMinPer1000: 60 },
        { seq: 4, process: "PKG", yield: 99.5,  stdMinPer1000: 120 },
        { seq: 5, process: "QC",  yield: 99.8,  stdMinPer1000: 30 },
      ],
      bom: [
        { material: "RM-GB-01", name: "생두(아라비카)", qtyPer: 0.240, unit: "kg" },
        { material: "PK-BAG-200", name: "원두 봉투 200g", qtyPer: 1, unit: "ea" },
        { material: "PK-LBL-01", name: "라벨", qtyPer: 1, unit: "ea" },
      ],
    },

    /* ===== 추출 라인 ===== */
    {
      code: "FG-EX01", name: "커피 원액 20kg (농축)", unit: "ea", spec: "20kg / BIB",
      line: "추출", category: "추출",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 50 },
        { seq: 2, process: "RST", yield: 85.0,  stdMinPer1000: 200 },
        { seq: 3, process: "GRD", yield: 99.0,  stdMinPer1000: 60 },
        { seq: 4, process: "EXT", yield: 92.0,  stdMinPer1000: 140 },
        { seq: 5, process: "CON", yield: 90.0,  stdMinPer1000: 160 },
        { seq: 6, process: "STE", yield: 99.0,  stdMinPer1000: 80 },
        { seq: 7, process: "PKG", yield: 99.5,  stdMinPer1000: 90 },
        { seq: 8, process: "QC",  yield: 99.5,  stdMinPer1000: 40 },
      ],
      bom: [
        { material: "RM-GB-01", name: "생두(로부스타)", qtyPer: 5.5, unit: "kg" },
        { material: "PK-BIB-20", name: "BIB 용기 20L", qtyPer: 1, unit: "ea" },
        { material: "PK-CAP-01", name: "밸브 캡", qtyPer: 1, unit: "ea" },
      ],
    },

    /* ===== 병입 라인 ===== */
    {
      code: "FG-BT01", name: "RTD 병커피 300ml", unit: "ea", spec: "300ml / 병",
      line: "병입", category: "병입",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 40 },
        { seq: 2, process: "RST", yield: 85.0,  stdMinPer1000: 180 },
        { seq: 3, process: "GRD", yield: 99.0,  stdMinPer1000: 60 },
        { seq: 4, process: "EXT", yield: 92.0,  stdMinPer1000: 120 },
        { seq: 5, process: "BLD", yield: 99.0,  stdMinPer1000: 50 },
        { seq: 6, process: "STE", yield: 99.0,  stdMinPer1000: 70 },
        { seq: 7, process: "BOT", yield: 98.0,  stdMinPer1000: 200 },
        { seq: 8, process: "QC",  yield: 99.5,  stdMinPer1000: 30 },
      ],
      bom: [
        { material: "RM-GB-01", name: "생두(브라질)", qtyPer: 0.030, unit: "kg" },
        { material: "PK-BTL-300", name: "PET병 300ml", qtyPer: 1, unit: "ea" },
        { material: "PK-CAP-02", name: "병 캡", qtyPer: 1, unit: "ea" },
        { material: "PK-LBL-02", name: "병 라벨", qtyPer: 1, unit: "ea" },
      ],
    },

    /* ===== SD(분무건조) 라인 ===== */
    {
      code: "FG-SD01", name: "인스턴트커피 SD 500g", unit: "ea", spec: "500g / 병",
      line: "SD", category: "SD",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 50 },
        { seq: 2, process: "RST", yield: 85.0,  stdMinPer1000: 200 },
        { seq: 3, process: "GRD", yield: 99.0,  stdMinPer1000: 60 },
        { seq: 4, process: "EXT", yield: 92.0,  stdMinPer1000: 140 },
        { seq: 5, process: "CON", yield: 90.0,  stdMinPer1000: 160 },
        { seq: 6, process: "SPD", yield: 95.0,  stdMinPer1000: 220 },
        { seq: 7, process: "PKG", yield: 99.0,  stdMinPer1000: 120 },
        { seq: 8, process: "QC",  yield: 99.5,  stdMinPer1000: 40 },
      ],
      bom: [
        { material: "RM-GB-01", name: "생두(로부스타)", qtyPer: 2.60, unit: "kg" },
        { material: "PK-JAR-500", name: "유리병 500g", qtyPer: 1, unit: "ea" },
        { material: "PK-LBL-03", name: "라벨", qtyPer: 1, unit: "ea" },
      ],
    },

    /* ===== 과립 라인 ===== */
    {
      code: "FG-GR01", name: "과립커피 리필 170g", unit: "ea", spec: "170g / 봉",
      line: "과립", category: "과립",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 50 },
        { seq: 2, process: "RST", yield: 85.0,  stdMinPer1000: 200 },
        { seq: 3, process: "GRD", yield: 99.0,  stdMinPer1000: 60 },
        { seq: 4, process: "EXT", yield: 92.0,  stdMinPer1000: 140 },
        { seq: 5, process: "CON", yield: 90.0,  stdMinPer1000: 160 },
        { seq: 6, process: "SPD", yield: 95.0,  stdMinPer1000: 220 },
        { seq: 7, process: "GRN", yield: 97.0,  stdMinPer1000: 90 },
        { seq: 8, process: "PKG", yield: 99.0,  stdMinPer1000: 120 },
        { seq: 9, process: "QC",  yield: 99.5,  stdMinPer1000: 40 },
      ],
      bom: [
        { material: "RM-GB-01", name: "생두(로부스타)", qtyPer: 0.90, unit: "kg" },
        { material: "PK-REF-170", name: "리필 봉투 170g", qtyPer: 1, unit: "ea" },
      ],
    },

    /* ===== MRC 라인 (커피믹스) ===== */
    {
      code: "FG-MR01", name: "MRC 커피믹스 (스틱 100입)", unit: "ea", spec: "12g x 100 / 박스",
      line: "MRC", category: "MRC",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 40 },
        { seq: 2, process: "BLD", yield: 98.0,  stdMinPer1000: 70 },
        { seq: 3, process: "STK", yield: 96.5,  stdMinPer1000: 260 },
        { seq: 4, process: "PKG", yield: 99.0,  stdMinPer1000: 60 },
        { seq: 5, process: "QC",  yield: 99.5,  stdMinPer1000: 30 },
      ],
      bom: [
        { material: "RM-IC-01", name: "인스턴트 커피분말", qtyPer: 0.45, unit: "kg" },
        { material: "RM-SG-01", name: "설탕", qtyPer: 0.50, unit: "kg" },
        { material: "RM-CR-01", name: "프림(크리머)", qtyPer: 0.40, unit: "kg" },
        { material: "PK-STK-01", name: "스틱 포장재", qtyPer: 100, unit: "ea" },
        { material: "PK-BOX-100", name: "100입 박스", qtyPer: 1, unit: "ea" },
      ],
    },

    /* ===== 액상스틱 라인 ===== */
    {
      code: "FG-LQ01", name: "액상커피 스틱 (10입)", unit: "ea", spec: "13g x 10 / 박스",
      line: "액상스틱", category: "액상스틱",
      routing: [
        { seq: 1, process: "WGH", yield: 100.0, stdMinPer1000: 40 },
        { seq: 2, process: "RST", yield: 85.0,  stdMinPer1000: 180 },
        { seq: 3, process: "GRD", yield: 99.0,  stdMinPer1000: 60 },
        { seq: 4, process: "EXT", yield: 92.0,  stdMinPer1000: 120 },
        { seq: 5, process: "CON", yield: 90.0,  stdMinPer1000: 150 },
        { seq: 6, process: "STE", yield: 99.0,  stdMinPer1000: 70 },
        { seq: 7, process: "STK", yield: 96.0,  stdMinPer1000: 240 },
        { seq: 8, process: "PKG", yield: 99.0,  stdMinPer1000: 60 },
        { seq: 9, process: "QC",  yield: 99.5,  stdMinPer1000: 30 },
      ],
      bom: [
        { material: "RM-GB-01", name: "생두(브라질)", qtyPer: 0.120, unit: "kg" },
        { material: "PK-LST-01", name: "액상스틱 파우치", qtyPer: 10, unit: "ea" },
        { material: "PK-BOX-10", name: "10입 박스", qtyPer: 1, unit: "ea" },
      ],
    },
  ];

  /* ---------- 발주(주문) 샘플 ---------- */
  const orders = [
    { no: "SO-2026-0148", date: "2026-06-28", due: "2026-07-05", customer: "A유통", product: "FG-RS01", qty: 12000, status: "계획완료" },
    { no: "SO-2026-0149", date: "2026-06-29", due: "2026-07-06", customer: "B마트",  product: "FG-SD01", qty: 8000,  status: "계획대기" },
    { no: "SO-2026-0150", date: "2026-06-30", due: "2026-07-08", customer: "C카페",  product: "FG-MR01", qty: 20000, status: "계획대기" },
    { no: "SO-2026-0151", date: "2026-06-30", due: "2026-07-09", customer: "D상사",  product: "FG-BT01", qty: 25000, status: "계획대기" },
  ];

  /* ---------- 주간 생산계획 (가상 샘플) ----------
     한 주(월~일)를 기준으로 제품별 일일 생산수량(완제품 ea)을 배분.
     제품의 line 으로 라인별 세분화(그룹·소계)한다.
     ※ 실제로는 발주·능력계획으로 산출되지만, 지금은 정적 샘플. */
  const weekPlan = {
    weekLabel: "2026년 27주차",
    days: [
      { date: "2026-06-29", dow: "월" },
      { date: "2026-06-30", dow: "화" },
      { date: "2026-07-01", dow: "수" },
      { date: "2026-07-02", dow: "목" },
      { date: "2026-07-03", dow: "금" },
      { date: "2026-07-04", dow: "토" },
      { date: "2026-07-05", dow: "일" },
    ],
    rows: [
      // 로스팅
      { product: "FG-RS01", qty: [3000, 3000, 2000, 2000, 2000, 0, 0] },
      { product: "FG-RS02", qty: [1000, 1000, 1000, 1000, 1000, 0, 0] },
      // 추출
      { product: "FG-EX01", qty: [200, 200, 200, 200, 200, 0, 0] },
      // 병입
      { product: "FG-BT01", qty: [5000, 5000, 5000, 5000, 5000, 0, 0] },
      // SD
      { product: "FG-SD01", qty: [1600, 1600, 1600, 1600, 1600, 0, 0] },
      // 과립
      { product: "FG-GR01", qty: [1200, 1200, 1200, 1200, 1200, 0, 0] },
      // MRC
      { product: "FG-MR01", qty: [4000, 4000, 4000, 4000, 4000, 0, 0] },
      // 액상스틱
      { product: "FG-LQ01", qty: [3000, 3000, 3000, 3000, 3000, 0, 0] },
    ],
  };

  /* ---------- 조회 헬퍼 ---------- */
  const DB = {
    lines, processes, products, orders, weekPlan,
    getProcess: (code) => processes.find((p) => p.code === code),
    getProcessName: (code) => (processes.find((p) => p.code === code) || {}).name || code,
    getProduct: (code) => products.find((p) => p.code === code),
    getWeekPlan: () => weekPlan,
    // 특정 날짜의 제품별 생산량 목록 [{ product, qty }]
    getDailyPlan: (date) => {
      const idx = weekPlan.days.findIndex((d) => d.date === date);
      if (idx < 0) return [];
      return weekPlan.rows
        .map((r) => ({ product: r.product, qty: r.qty[idx] || 0 }))
        .filter((r) => r.qty > 0);
    },
  };

  window.DB = DB;
  window.MENU = MENU;
})();
