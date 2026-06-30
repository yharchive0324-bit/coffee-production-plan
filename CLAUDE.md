# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

커피 생산공장의 **생산관리 프로그램**. 핵심 흐름:

> 발주량 입력 → 제품별 **라우팅 + 수율 + BOM** 전개 → **공정별 생산계획** 산출 → **공정별 세부 작업지시서** 화면 표시 및 **인쇄**

현재 단계는 **메뉴 구조를 연결하는 와이어프레임**이다. DB 연결과 실데이터 입력은 추후 단계이며, 지금은 HTML + 바닐라 JS + 정적 샘플데이터로만 동작한다. 추후 웹 서버 배포 예정.

## 실행 방법

빌드 도구·패키지·서버 없음. `index.html`을 브라우저로 직접 열면 된다 (`file://` 더블클릭 가능 — 그래서 ES module이 아닌 일반 `<script>`를 사용한다). 로컬 서버로 보려면 임의의 정적 서버(예: `python -m http.server`)면 충분하다.

JS 문법 검사: `node --check assets/js/<file>.js`
계산 로직 단독 테스트(브라우저 없이): `global.window = global` 로 두고 `util.js → data.js → calc.js`를 순서대로 `require` 한 뒤 `window.CALC.buildPlan(productCode, qty)` 호출.

## 아키텍처 (핵심)

스크립트는 **모듈 번들러 없이 전역 네임스페이스**로 연결된다. `index.html`의 `<script>` **로드 순서가 곧 의존성 순서**이므로 순서를 바꾸면 깨진다:

```
util.js (U) → data.js (DB, MENU) → calc.js (CALC) → pages.js (PAGES, STATE) → router.js (ROUTER) → app.js
```

각 파일은 IIFE로 감싸 하나의 전역 객체만 노출한다:

- `U` — 포맷/이스케이프 유틸 (`esc`, `n0`, `nd`, `pct`)
- `DB` — 샘플 기준정보(`products`, `processes`, `orders`)와 조회 헬퍼. **모든 마스터 데이터의 단일 출처.** DB 연동 시 이 객체의 내부만 API 호출로 교체하면 페이지 코드는 그대로 동작하도록 설계됨.
- `MENU` — 좌측 메뉴 구조 정의 배열. **메뉴 추가는 여기에 항목을 넣고, 같은 `route` 키로 `PAGES`에 페이지를 추가**하면 끝.
- `CALC` — 생산계획 산출 엔진 (아래 참조)
- `PAGES` — 페이지별 `{ title, crumb, render(params)->htmlString, mount?(params) }`. `render`는 HTML **문자열**을 반환하고, `mount`에서 이벤트를 바인딩한다(렌더 후 호출됨).
- `STATE` — 페이지 간 공유 상태. 특히 `STATE.planInput = { productCode, qty, orderNo }`가 **발주 → 생산계획 → 작업지시 화면을 잇는 연결고리**다. 발주/대시보드에서 이 값을 세팅하고 `#plan`으로 이동하면 계획·작업지시 화면이 같은 값을 읽는다.
- `ROUTER` — 해시 라우터. `#route` 또는 `#route?k=v` 형식. `route` 키로 `PAGES`에서 페이지를 찾아 `#view`에 주입하고 `mount` 호출, 브레드크럼·활성메뉴를 갱신.

### 생산계획 산출 로직 (`calc.js`)

`buildPlan(productCode, orderQty)`가 핵심. 라우팅을 **마지막 공정에서 역산**한다: 마지막 공정 산출 = 발주량, 각 공정 `투입 = 산출 / 수율`, 한 공정의 투입량이 곧 앞 공정의 산출량. 그래서 누적수율이 낮을수록 최초 투입량이 커진다. BOM 소요량은 **최초 투입공정의 투입량(gross input) × 단위소요량**으로 계산해 모든 공정 로스를 반영한다.

## 데이터 모델 규칙

- 제품(`products`)은 `routing`(공정 순서 + 공정별 `yield`% + `stdMinPer1000`)과 `bom`(완제품 1ea당 `qtyPer`)을 가진다.
- 라우팅의 `process`는 `processes`의 `code`를 참조한다(FK). 공정명은 코드가 아니라 `DB.getProcessName(code)`로 조회할 것 — 화면에 코드를 직접 노출하지 말 것.
- 수율은 퍼센트 숫자(예: `84.0`)로 저장, 계산 시 `/100`.

## 컨벤션

- 화면 텍스트·주석은 한국어, 코드 식별자는 영어.
- 사용자 입력에서 온 값을 HTML에 넣을 때는 반드시 `U.esc()`로 이스케이프(특히 발주 입력값).
- 새 화면을 추가할 때: ① `MENU`에 항목, ② `PAGES`에 동일 `route` 키로 페이지 객체, 두 가지만 하면 라우터가 자동 연결한다.
- 인쇄: 화면 UI는 `assets/css/print.css`(`@media print`)에서 숨기고, `.print-page` 클래스가 붙은 요소가 페이지 단위로 분리 출력된다. 인쇄에서 제외할 요소엔 `no-print` 클래스를 붙인다.

## 추후 작업 시 주의

DB/백엔드를 붙일 때 페이지 렌더 코드를 고치지 말고 `DB`의 데이터 접근부만 비동기로 바꾸는 방향을 우선 검토할 것(현재 동기 호출 전제이므로 `render`를 async로 바꾸려면 라우터의 호출부도 함께 수정 필요).
