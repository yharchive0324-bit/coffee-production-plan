/* ============================================================
   calc.js — 생산계획 산출 엔진
   입력: 제품 + 발주량(완제품 ea)
   처리: 라우팅 역산(수율 반영) → 공정별 투입/산출/로스 → BOM 소요량 → 표준 작업시간
   ※ 와이어프레임용 단순 모델. 실제 룰(가동률/배치/리드타임 등)은 추후.
   전역: window.CALC
   ============================================================ */
(function () {
  "use strict";

  /* 라우팅 역산: 완제품 목표수량을 만족시키기 위한 공정별 투입/산출 */
  function explodeRouting(product, orderQty) {
    const routing = product.routing.slice().sort((a, b) => a.seq - b.seq);

    // 뒤(마지막 공정)에서 앞으로 역산
    // outputQty(마지막) = orderQty, inputQty = outputQty / yield
    const out = new Array(routing.length);
    let nextInput = orderQty; // 다음 공정의 투입 = 현재 공정의 산출
    for (let i = routing.length - 1; i >= 0; i--) {
      const step = routing[i];
      const outputQty = nextInput;
      const y = step.yield / 100;
      const inputQty = y > 0 ? outputQty / y : outputQty;
      const stdMin = (inputQty / 1000) * (step.stdMinPer1000 || 0);
      out[i] = {
        seq: step.seq,
        process: step.process,
        processName: (window.DB ? DB.getProcessName(step.process) : step.process),
        workCenter: (window.DB && DB.getProcess(step.process) ? DB.getProcess(step.process).workCenter : "-"),
        yield: step.yield,
        inputQty: inputQty,
        outputQty: outputQty,
        lossQty: inputQty - outputQty,
        stdMinutes: stdMin,
      };
      nextInput = inputQty; // 이전(앞) 공정의 산출량 = 현재 공정 투입량
    }
    return out;
  }

  /* 누적 수율 (%) */
  function totalYield(product) {
    return product.routing.reduce((acc, s) => acc * (s.yield / 100), 1) * 100;
  }

  /* BOM 소요량: 1공정(투입) 기준 gross 투입량 × 단위소요 */
  function explodeBom(product, steps) {
    const firstInput = steps.length ? steps[0].inputQty : 0;
    return product.bom.map((b) => ({
      material: b.material,
      name: b.name,
      qtyPer: b.qtyPer,
      unit: b.unit,
      requiredQty: firstInput * b.qtyPer,
    }));
  }

  /* 전체 계획 산출 */
  function buildPlan(productCode, orderQty) {
    const product = window.DB ? DB.getProduct(productCode) : null;
    if (!product) return null;
    const steps = explodeRouting(product, orderQty);
    const bom = explodeBom(product, steps);
    const grossInput = steps.length ? steps[0].inputQty : 0;
    return {
      product: product,
      orderQty: orderQty,
      grossInputQty: grossInput,         // 최초 투입수량
      totalLossQty: grossInput - orderQty,
      totalYield: totalYield(product),   // %
      totalStdMinutes: steps.reduce((a, s) => a + s.stdMinutes, 0),
      steps: steps,
      bom: bom,
    };
  }

  window.CALC = { buildPlan, explodeRouting, explodeBom, totalYield };
})();
