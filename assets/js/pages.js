/* ============================================================
   pages.js — 화면(페이지) 렌더링 모듈
   각 페이지: { title, crumb, render(params)->html, mount?(params) }
   router.js 가 #view 에 render() 결과를 주입하고 mount()로 이벤트 연결.
   화면 간 선택값 공유: window.STATE
   전역: window.PAGES
   ============================================================ */
(function () {
  "use strict";
  const e = U.esc, n0 = U.n0, nd = U.nd, pct = U.pct;

  // 페이지 간 공유 상태 (발주→계획→작업지시 연계)
  window.STATE = window.STATE || { planInput: { productCode: "FG-1001", qty: 12000, orderNo: "" }, planDate: "" };
  if (!STATE.planDate) STATE.planDate = "";

  function head(title, sub, actions) {
    return (
      '<div class="page-head"><div><h1>' + e(title) + "</h1>" +
      (sub ? '<p class="sub">' + e(sub) + "</p>" : "") + "</div>" +
      (actions ? '<div class="page-head__actions">' + actions + "</div>" : "") +
      "</div>"
    );
  }
  function go(route) { window.location.hash = "#" + route; }

  /* ============================ 대시보드 ============================ */
  const dashboard = {
    title: "대시보드", crumb: ["현황", "대시보드"],
    render() {
      const orders = DB.orders;
      const waiting = orders.filter((o) => o.status === "계획대기").length;
      const totalQty = orders.reduce((a, o) => a + o.qty, 0);
      const kpi = (label, val, hint) =>
        '<div class="card kpi"><div class="kpi__label">' + e(label) +
        '</div><div class="kpi__value">' + val + '</div>' +
        (hint ? '<div class="kpi__hint">' + e(hint) + "</div>" : "") + "</div>";

      const rows = orders.map((o) => {
        const p = DB.getProduct(o.product) || {};
        return "<tr><td>" + e(o.no) + "</td><td>" + e(p.name || o.product) +
          '</td><td class="num">' + n0(o.qty) + "</td><td>" + e(o.due) +
          '</td><td class="center">' + statusBadge(o.status) + "</td>" +
          '<td class="center"><button class="btn btn--sm" data-plan="' + e(o.no) +
          '">계획산출 →</button></td></tr>';
      }).join("");

      return head("대시보드", "발주·생산계획 현황 요약 (샘플 데이터)") +
        '<div class="grid grid--4">' +
          kpi("진행 발주 건수", n0(orders.length), "전체 수주") +
          kpi("계획 대기", n0(waiting), "산출 필요") +
          kpi("총 발주 수량", n0(totalQty) + " ea", "완제품 기준") +
          kpi("등록 제품", n0(DB.products.length) + " 종", "기준정보") +
        "</div>" +
        '<div class="card"><div class="card__head">최근 발주</div>' +
        '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th>발주번호</th><th>제품</th><th class='num'>수량</th><th>납기</th>" +
        "<th class='center'>상태</th><th class='center'>작업</th></tr></thead><tbody>" +
        rows + "</tbody></table></div></div></div>" +
        '<div class="note">이 화면은 메뉴 연결을 확인하기 위한 와이어프레임입니다. ' +
        "실제 데이터/DB 연동은 추후 단계에서 구성합니다.</div>";
    },
    mount() {
      document.querySelectorAll("[data-plan]").forEach((b) =>
        b.addEventListener("click", () => {
          const o = DB.orders.find((x) => x.no === b.dataset.plan);
          if (o) { STATE.planInput = { productCode: o.product, qty: o.qty, orderNo: o.no }; }
          go("plan");
        })
      );
    },
  };

  function statusBadge(s) {
    if (s === "계획완료") return '<span class="badge badge--ok">계획완료</span>';
    if (s === "계획대기") return '<span class="badge badge--warn">계획대기</span>';
    return '<span class="badge badge--muted">' + e(s) + "</span>";
  }

  /* ============================ 제품 관리 ============================ */
  const products = {
    title: "제품 관리", crumb: ["기준정보", "제품 관리"],
    render() {
      const rows = DB.products.map((p) =>
        "<tr><td>" + e(p.code) + "</td><td>" + e(p.name) + "</td><td>" + e(p.category) +
        "</td><td>" + e(p.spec) + '</td><td class="center">' + e(p.unit) +
        '</td><td class="center">' + n0(p.routing.length) + '</td><td class="center">' +
        n0(p.bom.length) + '</td><td class="num">' + pct(CALC.totalYield(p)) + "</td></tr>"
      ).join("");
      return head("제품 관리", "완제품 마스터 (라우팅·BOM·누적수율 연결)",
        '<button class="btn btn--primary" disabled title="추후 구현">＋ 제품 등록</button>') +
        '<div class="card"><div class="card__body card__body--pad0"><div class="table-wrap">' +
        '<table class="tbl"><thead><tr><th>제품코드</th><th>제품명</th><th>분류</th><th>규격</th>' +
        "<th class='center'>단위</th><th class='center'>공정수</th><th class='center'>BOM</th>" +
        "<th class='num'>누적수율</th></tr></thead><tbody>" + rows + "</tbody></table></div></div></div>";
    },
  };

  /* ============================ BOM 관리 ============================ */
  const bom = {
    title: "BOM 관리", crumb: ["기준정보", "BOM 관리"],
    render(params) {
      const code = (params && params.product) || DB.products[0].code;
      const sel = productSelect("bomProduct", code);
      const p = DB.getProduct(code);
      const rows = p.bom.map((b) =>
        "<tr><td>" + e(b.material) + "</td><td>" + e(b.name) +
        '</td><td class="num">' + nd(b.qtyPer, 3) + '</td><td class="center">' + e(b.unit) +
        "</td></tr>"
      ).join("");
      return head("BOM 관리", "완제품 1단위(ea)당 원·부자재 소요량") +
        '<div class="card"><div class="card__body"><div class="field field--inline">' +
        "<label>제품 선택</label>" + sel + "</div></div></div>" +
        '<div class="card"><div class="card__head">' + e(p.name) +
        ' <span class="badge badge--info">' + e(p.code) + "</span></div>" +
        '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th>자재코드</th><th>자재명</th><th class='num'>단위소요량</th>" +
        "<th class='center'>단위</th></tr></thead><tbody>" + rows + "</tbody></table></div></div></div>";
    },
    mount() {
      const s = document.getElementById("bomProduct");
      if (s) s.addEventListener("change", () => go("bom?product=" + s.value));
    },
  };

  /* ====================== 라우팅·수율 관리 ====================== */
  const routing = {
    title: "라우팅·수율 관리", crumb: ["기준정보", "라우팅·수율 관리"],
    render(params) {
      const code = (params && params.product) || DB.products[0].code;
      const p = DB.getProduct(code);
      // 공정 흐름 다이어그램
      const flow = p.routing.map((s, i) => {
        const step =
          '<div class="flow__step"><div class="flow__seq">STEP ' + s.seq + "</div>" +
          '<div class="flow__name">' + e(DB.getProcessName(s.process)) + "</div>" +
          '<div class="flow__yield">수율 ' + pct(s.yield) + "</div></div>";
        const arrow = i < p.routing.length - 1 ? '<div class="flow__arrow">▶</div>' : "";
        return step + arrow;
      }).join("");

      const rows = p.routing.map((s) =>
        '<tr><td class="center">' + s.seq + "</td><td>" + e(s.process) + "</td><td>" +
        e(DB.getProcessName(s.process)) + '</td><td class="num">' + pct(s.yield) +
        '</td><td class="num">' + n0(s.stdMinPer1000) + "</td></tr>"
      ).join("");

      return head("라우팅·수율 관리", "제품별 공정 순서와 공정별 수율(%) 정의") +
        '<div class="card"><div class="card__body"><div class="field field--inline">' +
        "<label>제품 선택</label>" + productSelect("rtProduct", code) + "</div></div></div>" +
        '<div class="card"><div class="card__head">공정 흐름</div><div class="card__body">' +
        '<div class="flow">' + flow + "</div>" +
        '<p class="sub" style="margin-top:12px">누적수율 <b>' + pct(CALC.totalYield(p)) +
        "</b> — 완제품 1ea 생산을 위해 투입단계에서 더 많은 수량이 필요합니다.</p></div></div>" +
        '<div class="card"><div class="card__head">공정별 상세</div>' +
        '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th class='center'>순서</th><th>공정코드</th><th>공정명</th>" +
        "<th class='num'>수율(%)</th><th class='num'>표준시간(분/1,000ea)</th></tr></thead><tbody>" +
        rows + "</tbody></table></div></div></div>";
    },
    mount() {
      const s = document.getElementById("rtProduct");
      if (s) s.addEventListener("change", () => go("routing?product=" + s.value));
    },
  };

  /* ============================ 공정 관리 ============================ */
  const process = {
    title: "공정 관리", crumb: ["기준정보", "공정 관리"],
    render() {
      const rows = DB.processes.map((p, i) =>
        '<tr><td class="center">' + (i + 1) + "</td><td>" + e(p.code) + "</td><td>" +
        e(p.name) + "</td><td>" + e(p.workCenter) + "</td><td>" + e(p.desc) + "</td></tr>"
      ).join("");
      return head("공정 관리", "생산 공정(작업장) 마스터") +
        '<div class="card"><div class="card__body card__body--pad0"><div class="table-wrap">' +
        "<table class='tbl'><thead><tr><th class='center'>#</th><th>공정코드</th><th>공정명</th>" +
        "<th>작업장</th><th>설명</th></tr></thead><tbody>" + rows + "</tbody></table></div></div></div>";
    },
  };

  /* ============================ 발주 입력 ============================ */
  const order = {
    title: "발주 입력", crumb: ["발주 / 주문", "발주 입력"],
    render() {
      return head("발주 입력", "발주 정보를 입력하면 생산계획 산출로 연결됩니다") +
        '<div class="card"><div class="card__head">신규 발주</div><div class="card__body">' +
        '<div class="form-row">' +
        field("발주번호", '<input id="oNo" value="SO-2026-0151" />') +
        field("고객사", '<input id="oCust" placeholder="고객사명" value="D상사" />') +
        "</div><div class='form-row'>" +
        field("제품", productSelect("oProduct", STATE.planInput.productCode)) +
        field("발주수량 (ea)", '<input id="oQty" type="number" min="1" step="100" value="10000" />') +
        "</div><div class='form-row'>" +
        field("수주일", '<input id="oDate" type="date" value="2026-06-30" />') +
        field("납기일", '<input id="oDue" type="date" value="2026-07-10" />') +
        "</div>" +
        '<div class="page-head__actions">' +
        '<button class="btn" id="oReset">초기화</button>' +
        '<button class="btn btn--primary" id="oSubmit">발주 저장 후 계획산출 →</button>' +
        "</div></div></div>" +
        '<div class="note">저장 동작은 메모리상에서만 처리됩니다(새로고침 시 초기화). DB 저장은 추후 구성.</div>';
    },
    mount() {
      const sub = document.getElementById("oSubmit");
      sub && sub.addEventListener("click", () => {
        const no = val("oNo"), cust = val("oCust"), prod = val("oProduct");
        const qty = parseInt(val("oQty"), 10) || 0;
        if (qty <= 0) { alert("발주수량을 입력하세요."); return; }
        DB.orders.unshift({
          no: no, date: val("oDate"), due: val("oDue"),
          customer: cust, product: prod, qty: qty, status: "계획대기",
        });
        STATE.planInput = { productCode: prod, qty: qty, orderNo: no };
        go("plan");
      });
      const rst = document.getElementById("oReset");
      rst && rst.addEventListener("click", () => go("order"));
    },
  };

  /* ============================ 발주 현황 ============================ */
  const orderList = {
    title: "발주 현황", crumb: ["발주 / 주문", "발주 현황"],
    render() {
      const rows = DB.orders.map((o) => {
        const p = DB.getProduct(o.product) || {};
        return "<tr><td>" + e(o.no) + "</td><td>" + e(o.date) + "</td><td>" + e(o.customer) +
          "</td><td>" + e(p.name || o.product) + '</td><td class="num">' + n0(o.qty) +
          "</td><td>" + e(o.due) + '</td><td class="center">' + statusBadge(o.status) +
          '</td><td class="center"><button class="btn btn--sm" data-plan="' + e(o.no) +
          '">계획산출 →</button></td></tr>';
      }).join("");
      return head("발주 현황", "수주 목록 — 행에서 바로 생산계획 산출") +
        '<div class="card"><div class="card__body card__body--pad0"><div class="table-wrap">' +
        '<table class="tbl"><thead><tr><th>발주번호</th><th>수주일</th><th>고객사</th><th>제품</th>' +
        "<th class='num'>수량</th><th>납기</th><th class='center'>상태</th><th class='center'>작업</th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table></div></div></div>";
    },
    mount() {
      document.querySelectorAll("[data-plan]").forEach((b) =>
        b.addEventListener("click", () => {
          const o = DB.orders.find((x) => x.no === b.dataset.plan);
          if (o) STATE.planInput = { productCode: o.product, qty: o.qty, orderNo: o.no };
          go("plan");
        })
      );
    },
  };

  /* ======================== 생산계획 산출 ======================== */
  const plan = {
    title: "생산계획 산출", crumb: ["생산계획", "생산계획 산출"],
    render() {
      const pi = STATE.planInput;
      const controls =
        '<div class="card"><div class="card__body"><div class="form-row">' +
        field("제품", productSelect("plProduct", pi.productCode)) +
        field("발주수량 (ea)", '<input id="plQty" type="number" min="1" step="100" value="' + (pi.qty || 0) + '" />') +
        field("발주번호(참조)", '<input id="plNo" value="' + e(pi.orderNo || "") + '" placeholder="(선택)" />') +
        '<div class="field" style="justify-content:flex-end">' +
        '<button class="btn btn--primary" id="plRun">계획 산출</button></div>' +
        "</div></div></div>";
      return head("생산계획 산출", "발주량 → 라우팅·수율·BOM 전개 → 공정별 계획",
        '<button class="btn" id="plToWO">공정별 작업지시 →</button>') +
        controls + '<div id="planResult">' + renderPlanResult(pi.productCode, pi.qty) + "</div>";
    },
    mount() {
      const run = () => {
        const code = val("plProduct");
        const qty = parseInt(val("plQty"), 10) || 0;
        STATE.planInput = { productCode: code, qty: qty, orderNo: val("plNo") };
        document.getElementById("planResult").innerHTML = renderPlanResult(code, qty);
      };
      document.getElementById("plRun").addEventListener("click", run);
      document.getElementById("plToWO").addEventListener("click", () => { run(); go("workorder"); });
    },
  };

  function renderPlanResult(code, qty) {
    if (!qty || qty <= 0) return '<div class="empty">발주수량을 입력하고 [계획 산출]을 누르세요.</div>';
    const r = CALC.buildPlan(code, qty);
    if (!r) return '<div class="empty">제품 정보를 찾을 수 없습니다.</div>';

    const kpi = (l, v, h) =>
      '<div class="card kpi"><div class="kpi__label">' + e(l) + '</div><div class="kpi__value">' +
      v + '</div><div class="kpi__hint">' + e(h) + "</div></div>";

    const summary =
      '<div class="grid grid--4">' +
      kpi("완제품 목표", n0(r.orderQty) + " ea", "발주량") +
      kpi("최초 투입수량", n0(r.grossInputQty) + " ea", "1공정 투입 기준") +
      kpi("누적 수율", pct(r.totalYield), "총 로스 " + n0(r.totalLossQty) + " ea") +
      kpi("총 표준시간", nd(r.totalStdMinutes / 60, 1) + " h", n0(r.totalStdMinutes) + " 분") +
      "</div>";

    const stepRows = r.steps.map((s) =>
      '<tr><td class="center">' + s.seq + "</td><td>" + e(s.processName) +
      '</td><td class="center">' + e(s.workCenter) + '</td><td class="num">' + n0(s.inputQty) +
      '</td><td class="num">' + pct(s.yield) + '</td><td class="num">' + n0(s.outputQty) +
      '</td><td class="num">' + n0(s.lossQty) + '</td><td class="num">' + nd(s.stdMinutes, 0) +
      "</td></tr>"
    ).join("");

    const stepTable =
      '<div class="card"><div class="card__head">공정별 생산계획</div>' +
      '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
      "<thead><tr><th class='center'>순서</th><th>공정</th><th class='center'>작업장</th>" +
      "<th class='num'>투입</th><th class='num'>수율</th><th class='num'>산출</th>" +
      "<th class='num'>로스</th><th class='num'>표준시간(분)</th></tr></thead><tbody>" +
      stepRows + "</tbody></table></div></div></div>";

    const bomRows = r.bom.map((b) =>
      "<tr><td>" + e(b.material) + "</td><td>" + e(b.name) + '</td><td class="num">' +
      nd(b.qtyPer, 3) + '</td><td class="center">' + e(b.unit) + '</td><td class="num">' +
      nd(b.requiredQty, 2) + "</td></tr>"
    ).join("");

    const bomTable =
      '<div class="card"><div class="card__head">자재 소요량 (BOM 전개)</div>' +
      '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
      "<thead><tr><th>자재코드</th><th>자재명</th><th class='num'>단위소요</th>" +
      "<th class='center'>단위</th><th class='num'>총 소요량</th></tr></thead><tbody>" +
      bomRows + "</tbody></table></div></div></div>";

    return summary + stepTable + bomTable;
  }

  /* ====================== 공정별 생산계획 ====================== */
  const planProcess = {
    title: "공정별 생산계획", crumb: ["생산계획", "공정별 생산계획"],
    render() {
      const pi = STATE.planInput;
      const r = pi.qty > 0 ? CALC.buildPlan(pi.productCode, pi.qty) : null;
      if (!r) return head("공정별 생산계획", "공정 관점의 계획") +
        '<div class="empty">먼저 [생산계획 산출]에서 계획을 만들어 주세요.</div>';

      const cards = r.steps.map((s) =>
        '<div class="card"><div class="card__head">' + e(s.processName) +
        ' <span class="badge badge--info">' + e(s.workCenter) + "</span></div>" +
        '<div class="card__body"><div class="grid grid--2">' +
        miniKpi("투입", n0(s.inputQty) + " ea") +
        miniKpi("산출", n0(s.outputQty) + " ea") +
        miniKpi("수율", pct(s.yield)) +
        miniKpi("표준시간", nd(s.stdMinutes, 0) + " 분") +
        "</div></div></div>"
      ).join("");

      return head("공정별 생산계획",
        e(r.product.name) + " · 발주 " + n0(r.orderQty) + " ea" + (pi.orderNo ? " · " + e(pi.orderNo) : "")) +
        '<div class="grid grid--2">' + cards + "</div>";
    },
  };

  function miniKpi(l, v) {
    return '<div class="kpi" style="padding:8px 0"><div class="kpi__label">' + e(l) +
      '</div><div class="kpi__value" style="font-size:18px">' + v + "</div></div>";
  }

  /* ====================== 주간 생산계획 ====================== */
  const planWeekly = {
    title: "주간 생산계획", crumb: ["생산계획", "주간 생산계획"],
    render() {
      const wp = DB.getWeekPlan();
      const days = wp.days;

      // 헤더: 요일(날짜) — 클릭 시 일간계획 이동
      const dayTh = days.map((d) =>
        '<th class="num center day-col" data-date="' + e(d.date) + '" style="cursor:pointer" ' +
        'title="' + e(d.date) + ' 일간계획 보기">' + e(d.dow) + "<br><span style='font-weight:400;color:#888'>" +
        e(d.date.slice(5)) + "</span></th>"
      ).join("");

      // 본문: 제품 × 요일
      const bodyRows = wp.rows.map((r) => {
        const p = DB.getProduct(r.product) || {};
        const cells = r.qty.map((q, i) =>
          '<td class="num day-col" data-date="' + e(days[i].date) + '" style="cursor:pointer">' +
          (q > 0 ? n0(q) : '<span style="color:#ccc">-</span>') + "</td>"
        ).join("");
        const rowTotal = r.qty.reduce((a, b) => a + b, 0);
        return "<tr><td>" + e(p.name || r.product) + '</td>' + cells +
          '<td class="num" style="font-weight:700">' + n0(rowTotal) + "</td></tr>";
      }).join("");

      // 합계 행
      const dayTotals = days.map((d, i) => {
        const t = wp.rows.reduce((a, r) => a + (r.qty[i] || 0), 0);
        return '<td class="num">' + (t > 0 ? n0(t) : '<span style="color:#ccc">-</span>') + "</td>";
      }).join("");
      const grand = wp.rows.reduce((a, r) => a + r.qty.reduce((x, y) => x + y, 0), 0);

      return head("주간 생산계획", wp.weekLabel + " · 완제품 생산수량(ea) 기준") +
        '<div class="note no-print">요일(날짜) 헤더나 수량 셀을 클릭하면 해당일 <b>일간 생산계획</b>으로 이동합니다.</div>' +
        '<div class="card"><div class="card__head">' + e(wp.weekLabel) +
        ' <span class="badge badge--info">월~일</span></div>' +
        '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th>제품</th>" + dayTh + "<th class='num'>주간 합계</th></tr></thead>" +
        "<tbody>" + bodyRows + "</tbody>" +
        '<tfoot><tr><td>일 합계</td>' + dayTotals +
        '<td class="num">' + n0(grand) + "</td></tr></tfoot>" +
        "</table></div></div></div>";
    },
    mount() {
      document.querySelectorAll(".day-col").forEach((el) =>
        el.addEventListener("click", () => {
          STATE.planDate = el.dataset.date;
          go("planDaily?date=" + el.dataset.date);
        })
      );
    },
  };

  /* ====================== 일간 생산계획 ====================== */
  // 특정일 제품별 계획 + 공정별 부하 집계
  function aggregateDay(date) {
    const list = DB.getDailyPlan(date); // [{product, qty}]
    const products = list.map((x) => ({
      code: x.product, qty: x.qty, plan: CALC.buildPlan(x.product, x.qty),
    }));
    const procMap = {};
    products.forEach((p) => {
      p.plan.steps.forEach((s) => {
        if (!procMap[s.process]) {
          procMap[s.process] = {
            process: s.process, name: s.processName, wc: s.workCenter,
            input: 0, output: 0, minutes: 0,
          };
        }
        procMap[s.process].input += s.inputQty;
        procMap[s.process].output += s.outputQty;
        procMap[s.process].minutes += s.stdMinutes;
      });
    });
    const order = DB.processes.map((p) => p.code);
    const procs = Object.keys(procMap).map((k) => procMap[k])
      .sort((a, b) => order.indexOf(a.process) - order.indexOf(b.process));
    return { products, procs };
  }

  const planDaily = {
    title: "일간 생산계획", crumb: ["생산계획", "일간 생산계획"],
    render(params) {
      const wp = DB.getWeekPlan();
      const date = (params && params.date) || STATE.planDate ||
        (wp.days.find((d) => DB.getDailyPlan(d.date).length > 0) || wp.days[0]).date;
      STATE.planDate = date;

      // 날짜 선택 탭
      const tabs = wp.days.map((d) => {
        const has = DB.getDailyPlan(d.date).length > 0;
        const active = d.date === date;
        return '<button class="btn btn--sm day-tab' + (active ? " btn--primary" : "") + '"' +
          (has ? "" : " disabled") + ' data-date="' + e(d.date) + '" title="' + e(d.date) + '">' +
          e(d.dow) + " " + e(d.date.slice(5)) + "</button>";
      }).join(" ");
      const tabBar = '<div class="card"><div class="card__body"><div class="page-head__actions">' +
        tabs + "</div></div></div>";

      const agg = aggregateDay(date);
      if (!agg.products.length) {
        return head("일간 생산계획", date + " (생산 없음)") + tabBar +
          '<div class="empty">해당일에 계획된 생산이 없습니다. (주말/휴무)</div>';
      }

      // 제품별 당일 생산량
      const prodRows = agg.products.map((p) => {
        const r = p.plan;
        return "<tr><td>" + e(r.product.name) + '</td><td class="num">' + n0(p.qty) +
          '</td><td class="num">' + n0(r.grossInputQty) + '</td><td class="num">' + pct(r.totalYield) +
          '</td><td class="num">' + nd(r.totalStdMinutes / 60, 1) +
          '</td><td class="center"><button class="btn btn--sm to-plan" data-product="' + e(p.code) +
          '" data-qty="' + p.qty + '">계획산출 →</button></td></tr>';
      }).join("");
      const dayQtyTotal = agg.products.reduce((a, p) => a + p.qty, 0);

      const prodTable =
        '<div class="card"><div class="card__head">제품별 당일 생산량</div>' +
        '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th>제품</th><th class='num'>생산량(ea)</th><th class='num'>최초투입(ea)</th>" +
        "<th class='num'>누적수율</th><th class='num'>표준시간(h)</th><th class='center'>작업</th></tr></thead>" +
        "<tbody>" + prodRows + "</tbody>" +
        '<tfoot><tr><td>합계</td><td class="num">' + n0(dayQtyTotal) + '</td><td colspan="4"></td></tr></tfoot>' +
        "</table></div></div></div>";

      // 공정별 당일 부하
      const procRows = agg.procs.map((p) =>
        "<tr><td>" + e(p.name) + '</td><td class="center">' + e(p.wc) + '</td><td class="num">' +
        n0(p.input) + '</td><td class="num">' + n0(p.output) + '</td><td class="num">' +
        nd(p.minutes, 0) + '</td><td class="num">' + nd(p.minutes / 60, 1) + "</td></tr>"
      ).join("");
      const totMin = agg.procs.reduce((a, p) => a + p.minutes, 0);

      const procTable =
        '<div class="card"><div class="card__head">공정별 당일 생산부하 (제품 합산)</div>' +
        '<div class="card__body card__body--pad0"><div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th>공정</th><th class='center'>작업장</th><th class='num'>총 투입</th>" +
        "<th class='num'>총 산출</th><th class='num'>표준시간(분)</th><th class='num'>표준시간(h)</th></tr></thead>" +
        "<tbody>" + procRows + "</tbody>" +
        '<tfoot><tr><td colspan="4">합계</td><td class="num">' + nd(totMin, 0) +
        '</td><td class="num">' + nd(totMin / 60, 1) + "</td></tr></tfoot>" +
        "</table></div></div></div>";

      return head("일간 생산계획", date + " · 주간계획에서 전개된 당일 계획",
        '<button class="btn" id="dayToWeekly">← 주간 생산계획</button>') +
        tabBar + prodTable + procTable;
    },
    mount() {
      document.querySelectorAll(".day-tab").forEach((b) =>
        b.addEventListener("click", () => {
          if (b.disabled) return;
          STATE.planDate = b.dataset.date;
          go("planDaily?date=" + b.dataset.date);
        })
      );
      document.querySelectorAll(".to-plan").forEach((b) =>
        b.addEventListener("click", () => {
          STATE.planInput = { productCode: b.dataset.product, qty: parseInt(b.dataset.qty, 10) || 0, orderNo: "" };
          go("plan");
        })
      );
      const w = document.getElementById("dayToWeekly");
      w && w.addEventListener("click", () => go("planWeekly"));
    },
  };

  /* ====================== 공정별 작업지시 (+ 인쇄) ====================== */
  const workorder = {
    title: "공정별 작업지시", crumb: ["작업지시", "공정별 작업지시"],
    render() {
      const pi = STATE.planInput;
      const r = pi.qty > 0 ? CALC.buildPlan(pi.productCode, pi.qty) : null;
      if (!r) return head("공정별 작업지시", "공정별 세부 작업지시서") +
        '<div class="empty">먼저 [생산계획 산출]에서 계획을 만들어 주세요.</div>';

      const woNo = (pi.orderNo || "WO") + "-" + r.product.code;
      const sheets = r.steps.map((s, i) => workSheet(r, s, i, woNo)).join("");

      return head("공정별 작업지시", e(r.product.name) + " · 발주 " + n0(r.orderQty) + " ea",
        '<button class="btn" onclick="window.print()">🖨️ 전체 인쇄</button>') +
        '<div class="note no-print">각 공정별 작업지시서입니다. [전체 인쇄]를 누르면 ' +
        "공정마다 한 페이지로 출력됩니다(인쇄 미리보기에서 확인).</div>" +
        sheets;
    },
  };

  function workSheet(r, s, idx, woNo) {
    // 해당 공정에서 사용하는 BOM(최초 투입 공정에만 자재 표시 — 단순화)
    const isFirst = idx === 0;
    const matRows = isFirst
      ? r.bom.map((b) =>
          "<tr><td>" + e(b.material) + "</td><td>" + e(b.name) + '</td><td class="num">' +
          nd(b.requiredQty, 2) + '</td><td class="center">' + e(b.unit) + "</td></tr>").join("")
      : '<tr><td colspan="4" class="center" style="color:#888">해당 공정 직접투입 자재 없음 (선행 공정 반제품 투입)</td></tr>';

    return (
      '<div class="card print-page"><div class="card__head">' +
      "작업지시서 — STEP " + s.seq + " · " + e(s.processName) +
      ' <span class="badge badge--info">' + e(s.workCenter) + "</span></div>" +
      '<div class="card__body">' +
      '<table class="tbl" style="margin-bottom:14px"><tbody>' +
      "<tr><th style='width:140px'>지시번호</th><td>" + e(woNo) + "-" + s.seq +
      "</td><th style='width:140px'>제품</th><td>" + e(r.product.name) + " (" + e(r.product.code) + ")</td></tr>" +
      "<tr><th>공정</th><td>" + e(s.processName) + " / " + e(s.process) +
      "</th><th>작업장</th><td>" + e(s.workCenter) + "</td></tr>" +
      '<tr><th>투입수량</th><td class="num">' + n0(s.inputQty) +
      ' ea</td><th>산출(목표)</th><td class="num">' + n0(s.outputQty) + " ea</td></tr>" +
      '<tr><th>적용수율</th><td class="num">' + pct(s.yield) +
      '</td><th>표준 작업시간</th><td class="num">' + nd(s.stdMinutes, 0) + " 분</td></tr>" +
      "</tbody></table>" +
      '<div class="card__head" style="border:0;padding:0 0 8px">투입 자재</div>' +
      '<table class="tbl"><thead><tr><th>자재코드</th><th>자재명</th>' +
      "<th class='num'>소요량</th><th class='center'>단위</th></tr></thead><tbody>" +
      matRows + "</tbody></table>" +
      '<div style="display:flex;gap:24px;margin-top:18px;font-size:12px;color:#555">' +
      "<div>작업자 서명: ____________</div><div>검사자 서명: ____________</div>" +
      "<div>작업일자: ____ / ____ / ____</div></div>" +
      "</div></div>"
    );
  }

  /* ============================ 공용 폼 헬퍼 ============================ */
  function field(label, inner) {
    return '<div class="field field--inline"><label>' + e(label) + "</label>" + inner + "</div>";
  }
  function productSelect(id, selected) {
    const opts = DB.products.map((p) =>
      '<option value="' + e(p.code) + '"' + (p.code === selected ? " selected" : "") +
      ">" + e(p.name) + " (" + e(p.code) + ")</option>").join("");
    return '<select id="' + e(id) + '">' + opts + "</select>";
  }
  function val(id) { const el = document.getElementById(id); return el ? el.value : ""; }

  /* ============================ export ============================ */
  window.PAGES = {
    dashboard, products, bom, routing, process,
    order, orderList, plan, planWeekly, planDaily, planProcess, workorder,
  };
})();
