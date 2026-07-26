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
- 모드 nav(`.mode-nav`)는 세 곳에 각각 하드코딩되어 있다 — `index.html:340`, `dice.html:331`, `dice-3d/index.html:10`. 모드를 추가·이름변경하면 세 파일을 모두 고쳐야 한다.
- `dice-3d/js/dice.js`가 `Dice` 클래스(다면체 지오메트리, 면별 머터리얼, 낙하+바운스 물리, 결과 스프라이트)를 export 하고, `main.js`는 씬/조명/카메라 세팅과 UI 이벤트·애니메이션 루프만 담당한다.

## Gotchas

- `dice-3d/`는 ES module + importmap이라 `file://`로 열면 CORS로 죽는다. HTTP 서버 필수이고, `npx serve`에 SPA 플래그(`-s`)를 붙이면 하위 경로가 깨진다.
- `serve`는 `.html` 확장자를 벗겨 301 리다이렉트한다(`/dice.html` → `/dice`). 브라우저는 따라가므로 nav 링크(`href="dice.html"`)는 정상 동작하지만, 스크립트·테스트에서 URL을 때릴 때는 리다이렉트를 따라가게(`curl -L`) 해야 한다.
- `dice-3d/` nav 링크가 `../index.html`이라 **`dice-3d/` 안에서 서버를 띄우면 모드 전환이 404**다. 항상 repo 루트를 서버 루트로 둔다.
- `dice-3d/js/dice.js`는 `archive/dice-roller/js/dice.js`와 바이트 단위로 동일한 사본이다. 한쪽만 고치면 아카이브 테스트가 검증하는 대상과 갈라진다 — 고칠 때 사본 관계를 유지할지 먼저 정하고, 유지하지 않기로 했다면 커밋 메시지에 그 결정을 남긴다.
- `dice-3d/`에는 테스트가 없다. 3D 주사위 로직 회귀 검증은 `archive/dice-roller/tests/dice.test.html`이 유일한 수단이다.
- CSS는 이미 갈라져 있다 — `dice-3d/css/style.css`는 아카이브 원본에 `.mode-nav` 블록이 추가된 버전이라, 아카이브 CSS로 덮어쓰면 nav가 사라진다.
- 렌더는 로드마다 비결정적이다 — `dice.js:76` 의 `_colorOffset`(면-색 배치)과 `dice.js:94-97` 의 초기 회전이 랜덤이다. **스크린샷 A/B 비교로 시각 회귀를 판정할 수 없다.** 15개 assertion 도 개수·범위·면접촉·dispose 만 보고 외형과 라벨 값은 검사하지 않는다.
- 헤드리스로 3D 를 검증하려면 소프트웨어 WebGL 이 필요하다 — Chrome 에 `--headless=new --enable-unsafe-swiftshader --use-angle=swiftshader`. 루프가 살아있는지는 ROLL 후 `#roll-btn` 이 다시 활성화되는지로 본다: delta 가 0이면 `roll()` 의 Promise 가 resolve 되지 않아 영구 disabled 로 남는다.
- 애니메이션 루프는 `THREE.Timer` 를 쓴다 — `THREE.Clock` 은 r181 부터 deprecated 라 콘솔 경고가 뜬다. `Timer` 는 `update()` 를 먼저 호출한 뒤 `getDelta()` 를 읽어야 한다. 탭 백그라운드 복귀 시의 큰 delta 가 물리를 튀게 하면 `timer.connect(document)` 로 Page Visibility 보호를 켤 수 있다(현재는 미적용 — `Clock` 과 동일 거동).
- 윷 판정: 평면 개수 0=모, 1=도, 2=개, 3=걸, 4=윷. 빽도는 `X` 표시된 첫 윷가락(`index.html`의 `i === 0`)만 평면일 때다. 평면 확률은 `FLAT_PROB = 0.4`.

## Code Conventions

- 프레임워크·빌드 도구·패키지 매니저를 도입하지 않는다. 외부 의존성은 CDN importmap의 Three.js v0.185.1 하나뿐이다.
- 커밋 메시지는 한글, 접두사 `feat:`/`fix:`/`refactor:`/`docs:`/`chore:`. 구조 변경과 기능 변경을 같은 커밋에 섞지 않는다.
- UI 텍스트는 한국어, 모바일 우선(`user-scalable=no`, `100dvh`, `apple-mobile-web-app-*` 메타, `navigator.vibrate` 햅틱).
