# roll-it

## Purpose
한국 보드게임용 무작위 던지기 웹 유틸리티 3종(윷 / 2D 주사위 / 3D 주사위).
빌드 도구·패키지 설치 없이 정적 파일로만 동작하며 상단 nav로 세 모드를 오간다.

## Commands

```bash
# 윷 / 2D 주사위만 확인 — 단일 파일이라 서버 불필요
open index.html
open dice.html

# 3D 포함 전체 확인 — 반드시 repo 루트를 서버 루트로 띄운다
npx serve -l 3460 .
#   http://localhost:3460/           윷
#   http://localhost:3460/dice       2D 주사위 (`/dice.html` 은 301 로 여기로 넘어온다)
#   http://localhost:3460/dice-3d/   3D 주사위

# dice-3d/js/dice.js 를 고쳤으면 아카이브의 브라우저 테스트로 검증
npx serve -l 3461 archive/dice-roller
#   http://localhost:3461/tests/dice.test   (루트 서버면 /archive/dice-roller/tests/dice.test)
#   40회 굴림이라 30초 이상 걸린다. `--- 15 passed, 0 failed ---` 요약줄이 나올 때까지
#   기다려라 — 중간에 읽으면 7/15만 보여 실패처럼 읽힌다.
```

## Key Files

| File | Description |
|------|-------------|
| `index.html` | 윷 던지기. 인라인 CSS/JS 단일 파일. 윷가락 4개를 CSS 3D `rotateX`로 뒤집어 평/원면 결정 |
| `dice.html` | 2D 주사위. 인라인 단일 파일. `DOT_MAP`으로 pip 배치, 1~2개 굴림 + 합계/더블 표시 |
| `dice-3d/` | Three.js 3D 주사위(D6/D8/D12/D20, 최대 4개). ES module + CDN importmap |
| `archive/dice-roller/` | `dice-3d/`의 원본 standalone 프로젝트 + 유일한 자동 테스트. 자체 AGENTS.md 계층 보유 |

## Architecture

- 세 모드는 독립 진입점이고 공유 번들·프레임워크가 없다. `index.html`·`dice.html`은 자기완결 인라인 파일이고, `dice-3d/`만 `css/`·`js/`로 분리된 ES module 구조다.
- 모드 nav(`.mode-nav`)는 `index.html`, `dice.html`, `dice-3d/index.html`에 각각 하드코딩되어 있다. 모드를 추가·이름변경하면 세 파일을 모두 고쳐야 한다.
- `dice-3d/js/dice.js`가 `Dice` 클래스(다면체 지오메트리, 면별 머터리얼, 낙하+바운스 물리, 결과 스프라이트)를 export 한다. `main.js`는 씬/조명/반응형 카메라, 표시용 재질 조정, UI, 합계·기록, 애니메이션 루프를 담당한다.
- 세 모드의 최근 30회 기록은 모드별 `sessionStorage` 키로 보관한다. 같은 탭에서 이동·새로고침하면 복원되며, 저장 실패 시 현재 화면의 던지기는 계속 동작한다.
- 공통 화면 CSS도 자기완결 파일 제약 때문에 세 곳에 복제되어 있다. 디자인 기준은 `DESIGN.md`, 브라우저 회귀 검사는 `tests/browser-smoke.py`를 참고한다.

## Gotchas

- `dice-3d/`는 ES module + importmap이라 `file://`로 열면 CORS로 죽는다. HTTP 서버 필수이고, `npx serve`에 SPA 플래그(`-s`)를 붙이면 하위 경로가 깨진다.
- importmap 은 `"three"` 키 하나만 매핑한다. 애드온(`three/addons/…`, 벤더 스킬 예시의 `three/examples/jsm/…`)을 쓰려면 같은 버전으로 `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/"` 키를 추가하고 `three/addons/…` 로 import 한다.
- `serve`는 `.html` 확장자를 벗겨 301 리다이렉트한다(`/dice.html` → `/dice`). 브라우저는 따라가므로 nav 링크(`href="dice.html"`)는 정상 동작하지만, 스크립트·테스트에서 URL을 때릴 때는 리다이렉트를 따라가게(`curl -L`) 해야 한다.
- `dice-3d/` nav 링크가 `../index.html`이라 **`dice-3d/` 안에서 서버를 띄우면 모드 전환이 404**다. 항상 repo 루트를 서버 루트로 둔다.
- `dice-3d/js/dice.js`는 `archive/dice-roller/js/dice.js`와 바이트 단위로 동일한 사본이다. 한쪽만 고치면 아카이브 테스트가 검증하는 대상과 갈라진다 — 고칠 때 사본 관계를 유지할지 먼저 정하고, 유지하지 않기로 했다면 커밋 메시지에 그 결정을 남긴다.
- 3D 주사위 내부 물리 회귀 검증은 `archive/dice-roller/tests/dice.test.html`을 쓴다. 세 모드의 UI·기록·결과·반응형 검증은 루트 서버 3460을 띄운 뒤 `browser-cdp-pw run < tests/browser-smoke.py`로 실행한다(browser-cdp 스킬 필요).
- `archive/dice-roller/` 안에는 별도 `.git` 이 있다 — 그 디렉터리를 cwd 로 git 을 돌리면 roll-it 이 아니라 아카이브 원본 저장소에 적용된다. 아카이브 파일의 git 작업은 repo 루트에서 경로를 지정해 한다.
- CSS는 이미 갈라져 있다 — `dice-3d/css/style.css`는 아카이브 원본에 `.mode-nav` 블록이 추가된 버전이라, 아카이브 CSS로 덮어쓰면 nav가 사라진다.
- 렌더는 초기 회전과 굴림 결과 때문에 비결정적이다. `dice.js`의 `_colorOffset`도 랜덤이지만 현재 UI는 `main.js`에서 주사위별 단색으로 덮어쓴다. **스크린샷 A/B 비교로 시각 회귀를 판정할 수 없다.** 아카이브의 15개 assertion은 개수·범위·면접촉·dispose만 보고 외형과 라벨 값은 검사하지 않는다.
- 헤드리스로 3D 를 검증하려면 소프트웨어 WebGL 이 필요하다 — Chrome 에 `--headless=new --enable-unsafe-swiftshader --use-angle=swiftshader`. 루프가 살아있는지는 ROLL 후 `#roll-btn` 이 다시 활성화되는지로 본다: delta 가 0이면 `roll()` 의 Promise 가 resolve 되지 않아 영구 disabled 로 남는다.
- 애니메이션 루프는 `THREE.Timer`를 쓴다. `update()` 후 `getDelta()`를 읽고, `timer.connect(document)`와 최대 0.05초 delta로 탭 복귀를 보호한다. reduced-motion에서는 동일 물리를 빠르게 진행하고 중간 렌더를 생략한다. 아카이브 main.js에는 이 UI 개선을 복제하지 않는다.
- `RGBELoader` 는 r180 부터 deprecated(콘솔 경고) — HDR 환경맵은 `HDRLoader` 를 쓴다. 벤더 스킬 `threejs-materials` 의 예시는 아직 `RGBELoader` 라 그대로 옮기지 않는다.
- 윷 판정: 평면 개수 0=모, 1=도, 2=개, 3=걸, 4=윷. 빽도는 `X` 표시된 첫 윷가락(`index.html`의 `i === 0`)만 평면일 때다. 평면 확률은 `FLAT_PROB = 0.4`.

## Code Conventions

- 프레임워크·빌드 도구·패키지 매니저를 도입하지 않는다. 외부 의존성은 CDN importmap의 Three.js v0.185.1 하나뿐이다.
- 커밋 메시지는 한글, 접두사 `feat:`/`fix:`/`refactor:`/`docs:`/`build:`/`chore:`. 구조 변경과 기능 변경을 같은 커밋에 섞지 않는다.
- UI 텍스트는 한국어, 모바일 우선(`100dvh`, `viewport-fit=cover`, `navigator.vibrate` 햅틱). 확대를 막는 `user-scalable=no`는 사용하지 않는다. 터치 컨트롤은 최소 44px, reduced-motion과 키보드 포커스를 유지한다.
