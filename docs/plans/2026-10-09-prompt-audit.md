# roll-it 프롬프트 감사 (prompt-audit)

- 실행일: 2026-10-09
- 실행 방식: `/claude-api prompt-audit` (비대화형). 아래 diff는 **제안만** 했고 아무것도 적용하지 않았다.

## 전제 (Step 0)

- **범위**: 작업 디렉터리 전체의 프롬프트 표면. 이 저장소는 Claude API를 호출하는 코드가 없는 순수 정적 웹앱이다(`anthropic`/`openai` 등 프로바이더 마커 0건). 그래서 감사 대상은 에이전트 설정 파일뿐이다.
- **대상 모델**: Claude Opus 5.5 — 이 감사를 실행한 모델. 요청에 모델 지정이 없고, 설정 파일은 Claude Code가 읽는다. 벤더 스킬 2개도 모델을 고정하지 않으므로 같은 기준을 적용했다.
- **범위 밖 (읽지 않음)**: `~/.claude-profiles/team/CLAUDE.md` 같은 사용자 전역 설정(요청이 지정하지 않음), `.claude/settings.local.json`(시크릿이 있을 수 있음), `archive/dice-roller/docs/superpowers/{plans,specs}/*.md` 설계 문서(자동 로드되는 지시 파일이 아님).

## 인벤토리 (Step 1)

| 파일 | 줄 수 | 비고 |
|---|---|---|
| `AGENTS.md` (`CLAUDE.md` → 심링크) | 59 | 루트 컨텍스트 |
| `archive/dice-roller/AGENTS.md` (+ `CLAUDE.md` 심링크) | 57 | deepinit 생성 계층 |
| `archive/dice-roller/{css,js,tests}/AGENTS.md` | 35 / 43 / 39 | 하위 디렉터리 |
| `archive/dice-roller/docs/superpowers/specs/AGENTS.md` | 20 | |
| `.agents/skills/threejs-geometry/SKILL.md` (`.claude/skills/` 심링크) | 548 | 벤더 스킬. `skills-lock.json`이 `cloudai-x/threejs-skills` 기준 `computedHash`로 고정한다 |
| `.agents/skills/threejs-materials/SKILL.md` (`.claude/skills/` 심링크) | 520 | 벤더 스킬. 위와 같이 lock으로 고정 |

시스템 프롬프트, 도구 정의, 요청 생성 코드, 서브에이전트 정의는 없다.

## 요약

이번 감사에서 영향이 큰 발견은 세 가지다.

1. **커밋 접두사 목록이 실제 이력과 맞지 않는다.** 루트 `AGENTS.md:58`은 `feat/fix/refactor/docs/chore`만 나열한다. 그런데 이 줄을 쓴 지 12시간 뒤 커밋 `5e67eef`가 `build:`를 썼다. 아카이브 `AGENTS.md:49`는 여기서 `chore:`까지 빠져 있다. 두 파일은 아카이브 디렉터리에서 함께 로드되는데, 커밋 접두사 규칙을 서로 다르게 말한다.
2. **벤더 스킬이 이 프로젝트의 Three.js r185.1에서 deprecated된 `RGBELoader`를 권한다.** CDN의 r185.1 소스를 직접 확인했다. 이 로더를 쓰면 `console.warn`이 찍히고 내부에서는 `HDRLoader`를 상속해 동작한다. `THREE.Clock` 경고 때문에 Timer로 옮긴 바로 그 경고 유형이다.
3. **벤더 스킬의 애드온 import 경로가 이 프로젝트의 importmap에서 해석되지 않는다.** importmap에는 `"three"` 키 하나만 있다. 스킬 예시처럼 `three/examples/jsm/...`를 그대로 붙여 넣으면 모듈 해석 단계에서 실패한다.

벤더 스킬 파일 자체는 lock hash로 고정되어 있다. 직접 고쳐도 다음 업데이트 때 덮어써지므로 SKILL.md 줄은 `flag`로 두었다. 대신 프로젝트가 소유한 `AGENTS.md`에 gotcha를 추가하는 방식으로 고친다.

| 그룹 | 발견 수 |
|---|---|
| Group 1 — 낡은 프롬프트 문구 | 2 (중간 1, 낮음 1) |
| Group 2 — 설정·스킬 파일 | 7 (높음 3, 중간 1, 낮음 3) |
| Group 3 — 도구 설명 | 해당 없음 |
| Group 4 — 요청 설정·아키텍처 | 해당 없음 (요청 코드·서브에이전트 없음) |

## 발견 사항 (Step 5, 신뢰도 순)

### H1. 커밋 접두사 목록에 실제로 쓰는 `build:`가 없음

- **위치**: `AGENTS.md:58`
- **근거 문구**: "커밋 메시지는 한글, 접두사 `feat:`/`fix:`/`refactor:`/`docs:`/`chore:`."
- **패턴**: Group 2 — Volatile specifics (저장소가 반박하는 사실)
- **왜 낡았나**: 이 줄은 `c2a01a0`(2026-07-26 04:48)에서 작성됐다. 같은 날 16:48 커밋 `5e67eef`는 `build: Three.js CDN 핀을…`이다. 저장소 이력이 목록과 맞지 않으므로, 에이전트는 의존성 핀 변경에 `build:`와 `chore:` 중 무엇을 붙일지 매번 따로 판단하게 된다.
- **신뢰도**: 높음
- **조치**: `rewrite` — 목록에 `build:`를 추가한다. Group 2 규칙에 따라 제안만 한다.

### H2. 벤더 스킬이 deprecated된 `RGBELoader`를 권장

- **위치**: `.agents/skills/threejs-materials/SKILL.md:465-467`
- **근거 문구**: `// HDR environment (recommended)` / `import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";`
- **패턴**: Group 2 — Volatile specifics (API 주장에 검증 날짜가 없음)
- **왜 낡았나**: `three@0.185.1/examples/jsm/loaders/RGBELoader.js`의 실제 내용은 `// @deprecated, r180`과 `console.warn('RGBELoader has been deprecated. Please use HDRLoader instead.')`다. 이 프로젝트의 핀(`dice-3d/index.html:42`)은 0.185.1이다.
- **신뢰도**: 높음
- **조치**: SKILL.md 줄은 `flag`로 둔다(lock hash로 고정되어 업데이트 시 덮어써짐). 대신 `AGENTS.md` Gotchas에 한 줄을 `add`한다(diff 1).

### H3. 벤더 스킬의 애드온 import 경로가 이 importmap에서 해석되지 않음

- **위치**: `.agents/skills/threejs-geometry/SKILL.md:128-129, 458` / `.agents/skills/threejs-materials/SKILL.md:466`
- **근거 문구**: `import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";`, `import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";`
- **패턴**: Group 2 — Volatile specifics (프로젝트 환경과 맞지 않는 경로)
- **왜 낡았나**: `dice-3d/index.html:39-43`의 importmap에는 정확히 `"three"` 키 하나만 있다. 접두사 키(`"three/"`나 `"three/addons/"`)가 없으면 `three/examples/jsm/...`는 bare specifier 해석에 실패한다. 빌드 도구가 없는 프로젝트라 번들러가 이 문제를 대신 풀어 주지도 않는다.
- **신뢰도**: 높음
- **조치**: SKILL.md 줄은 `flag`로 두고, `AGENTS.md` Gotchas에 한 줄을 `add`한다(diff 2).

### M1. 아카이브의 커밋 규칙이 루트와 중복되면서 내용이 다름

- **위치**: `archive/dice-roller/AGENTS.md:48-49` ↔ `AGENTS.md:58`
- **근거 문구**: "구조적 변경(refactor)과 기능 변경(feat/fix) 분리 커밋" / "커밋 접두사: feat: / fix: / refactor: / docs:"
- **패턴**: Group 2 — Instruction files that contradict each other
- **왜 낡았나**: 아카이브 쪽 줄은 `ceb4041`(2026-05-08)에서 작성됐고, 루트 줄은 `c2a01a0`(2026-07-26)에서 작성돼 더 새롭다. 아카이브 목록에는 `chore:`가 없지만, 정작 이 파일을 만든 커밋 `ceb4041`이 `chore:`다. 중첩 `CLAUDE.md`는 상위 파일과 항상 함께 로드되고 루트가 같은 규칙을 이미 다루므로, 아카이브 쪽을 지우는 것이 맞다. 같은 위치의 50행 "TDD 우선"은 아카이브 고유의 규칙이라 남긴다.
- **신뢰도**: 중간
- **조치**: `remove` 48-49행. 제안만 한다(diff 3).

### M2. 지금은 없는 `Clock`에 빗댄 설명

- **위치**: `AGENTS.md:52`
- **근거 문구**: "(현재는 미적용 — `Clock` 과 동일 거동)"
- **패턴**: Group 1d — Migration-relative phrasing
- **왜 낡았나**: 현재 코드에는 `Clock`이 없다(`dice-3d/js/main.js:120`은 `THREE.Timer`). 이 문장은 이전 구현과의 차이를 설명하는 글이라, 읽는 모델은 거기 나오지 않은 이전 상태를 추측해야 한다. 실제 동작(`main.js:122-129`는 delta를 clamp하지 않고 그대로 `d.update(delta)`에 넘김)을 직접 적는 편이 정확하다. 같은 줄의 "`THREE.Clock` 은 r181 부터 deprecated" 문장은 Clock으로 되돌리지 말라는 이유를 담고 있으므로 남긴다.
- **신뢰도**: 중간
- **조치**: `rewrite`(diff 4)

### L1. 벤더 스킬의 See Also가 설치되지 않은 스킬을 가리킴 — flag

- **위치**: `.agents/skills/threejs-materials/SKILL.md:518-520`, `.agents/skills/threejs-geometry/SKILL.md:546-548`
- **내용**: `threejs-textures`, `threejs-shaders`, `threejs-lighting`, `threejs-fundamentals`. `skills-lock.json`에는 geometry와 materials 두 개만 있다.
- **판단**: 업스트림 패키지 안의 이름이라 프로젝트 경로로 볼 수 없다. 모델이 이 스킬을 찾다가 헛걸음할 수는 있지만 해는 작다. 고칠 곳은 업스트림이거나, 나머지 스킬을 함께 설치하는 쪽이다.

### L2. `// Was 'height' in older versions` — flag

- **위치**: `.agents/skills/threejs-geometry/SKILL.md:136`
- **판단**: Group 1d 상대적 표현에 해당하지만, 벤더 파일이고 영향이 미미하다.

### L3. 벤더 스킬 2개(약 1,070줄)가 일반 Three.js API 레퍼런스 — flag

- **패턴**: Group 2 — Verbose SKILL.md explaining things the model already knows
- **판단**: 내용 대부분이 생성자 시그니처 목록이라 대상 모델이 이미 아는 지식일 가능성이 높다. 다만 이 스킬들은 트리거될 때만 로드되고, 가장 최근 커밋(`c7dd1c9`)에서 의도적으로 추가됐다. 길이만으로 삭제를 권할 근거는 없다. H2·H3처럼 이 프로젝트 환경과 어긋나는 예시가 계속 나오면 그때 스킬 유지 여부를 다시 판단한다.

### L4. 아카이브 배너의 커밋 해시 — flag

- **위치**: `archive/dice-roller/AGENTS.md:3`
- **근거 문구**: "`dice-3d/`로 통합된 원본 standalone 프로젝트(`afb4bf8`, `ceb4041`)"
- **판단**: Group 2 History narrative 패턴과 형태는 같다. 하지만 이 줄은 규칙의 근거가 아니라 아카이브의 출처를 적은 맥락이다. 두 해시 모두 실제로 존재한다. 편집은 제안하지 않는다.

### 발견으로 잡지 않은 것 (keep list)

- **포트 3460 ↔ 3461**: 아카이브 파일들(`archive/dice-roller/AGENTS.md:14,41`, `tests/AGENTS.md:17-18`, `js/AGENTS.md:27`)은 해당 디렉터리 안에서 서버 하나만 띄우는 경우를, 루트 파일은 두 서버를 동시에 띄우는 경우를 설명한다. 하위 파일의 규칙이 자기 디렉터리로 설명되므로 충돌이 아니라 override다.
- **`반드시`/`필수` 강조**: 해당 문장마다 이유(CORS, nav 404, 사본 관계)가 바로 붙어 있다. 강조가 아니라 근거 있는 제약이다.
- **`file://` CORS 경고 3중복**(루트 44행, 아카이브 38행, tests 17행): 세 곳의 내용이 일치하는 정상 중복이다.
- **`AGENTS.md:23-24` "요약줄이 나올 때까지 기다려라"**: 세션 학습(`878bf90`)에서 왔지만 이 테스트를 돌리는 모든 세션에 적용되는 환경 사실이므로 recency trap이 아니다. 실측 결과 assertion은 15개였고(31행은 `function assert` 정의) 굴림은 20회 루프 2개로 40회였다.
- **`<!-- MANUAL: … -->` 마커**: deepinit 재생성 계약이다.
- **사실 검증 통과 항목**: nav 라인 번호(`index.html:340`, `dice.html:331`, `dice-3d/index.html:10`), `dice.js:76`·`94-97`, 두 `dice.js`의 바이트 동일성(`cmp`), Three.js 0.185.1 핀(파일 3곳), `GRAVITY`·`RESTITUTION`·`BOUNCE_STOP_SPEED`·`_faceData`·`rolling`/`settling` 상태, `#webgl-error:not([hidden])`, 480px 미디어쿼리, `FLAT_PROB = 0.4`, `i === 0` 빽도 판정. 모두 현재 코드와 일치했다.

## 제안 diff (Step 6)

발견 하나당 hunk 하나다. 필요한 것만 골라 적용하면 된다. H1과 M1은 Group 2 규칙에 따라 사용자 확인이 필요한 제안이다.

아래 hunk는 읽기 쉽도록 긴 줄을 `…`로 줄여 적었다. 다섯 개를 모두 반영한 patch는 같은 디렉터리의 `2026-10-09-prompt-audit.patch`에 있고, `git apply --check`를 통과했다. 일부만 적용하려면 해당 줄만 직접 옮기면 된다.

### diff 1 — H2: HDRLoader gotcha 추가

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -52,1 +52,2 @@
 - 애니메이션 루프는 `THREE.Timer` 를 쓴다 — …
+- `RGBELoader` 는 r180 부터 deprecated(콘솔 경고) — HDR 환경맵은 `HDRLoader` 를 쓴다. 벤더 스킬 `threejs-materials` 의 예시는 아직 `RGBELoader` 라 그대로 옮기지 않는다.
```

### diff 2 — H3: importmap 애드온 경로 gotcha 추가

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -44,1 +44,2 @@
 - `dice-3d/`는 ES module + importmap이라 `file://`로 열면 CORS로 죽는다. …
+- importmap 은 `"three"` 키 하나만 매핑한다. 애드온(`three/addons/…`, 벤더 스킬 예시의 `three/examples/jsm/…`)을 쓰려면 같은 버전으로 `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/"` 키를 추가하고 `three/addons/…` 로 import 한다.
```

### diff 3 — M1: 아카이브의 중복 커밋 규칙 제거

```diff
--- a/archive/dice-roller/AGENTS.md
+++ b/archive/dice-roller/AGENTS.md
@@ -47,4 +47,2 @@
 ### Code Conventions
-- 구조적 변경(refactor)과 기능 변경(feat/fix) 분리 커밋
-- 커밋 접두사: feat: / fix: / refactor: / docs:
 - TDD 우선 (테스트 먼저 → 구현 → 리팩터)
```

### diff 4 — M2: Clock 비교를 현재 동작 설명으로 교체

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -52,1 +52,1 @@
-… 탭 백그라운드 복귀 시의 큰 delta 가 물리를 튀게 하면 `timer.connect(document)` 로 Page Visibility 보호를 켤 수 있다(현재는 미적용 — `Clock` 과 동일 거동).
+… 탭 백그라운드 복귀 시의 큰 delta 가 물리를 튀게 하면 `timer.connect(document)` 로 Page Visibility 보호를 켤 수 있다(현재는 미적용 — 복귀 직후의 큰 delta 가 clamp 없이 그대로 `Dice.update()` 로 들어간다).
```

### diff 5 — H1: 커밋 접두사에 `build:` 추가

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -58,1 +58,1 @@
-- 커밋 메시지는 한글, 접두사 `feat:`/`fix:`/`refactor:`/`docs:`/`chore:`. 구조 변경과 기능 변경을 같은 커밋에 섞지 않는다.
+- 커밋 메시지는 한글, 접두사 `feat:`/`fix:`/`refactor:`/`docs:`/`build:`/`chore:`. 구조 변경과 기능 변경을 같은 커밋에 섞지 않는다.
```

> diff 1과 diff 4는 둘 다 52행 근처를 고친다. 함께 적용하면 diff 1의 추가 줄은 수정된 52행 바로 다음에 들어간다. `CLAUDE.md`는 `AGENTS.md`를 가리키는 심링크라 따로 고칠 필요가 없다.

## 검증 메모 (Step 7)

이번 발견은 모두 Group 2의 사실 오류·파일 간 충돌이거나 문구 표현 문제다. 행동 프로브 대신 저장소와 CDN 소스를 대조해 검증했다. diff를 적용한 뒤에는 `rg -n 'RGBELoader|examples/jsm|chore:|build:' AGENTS.md archive/dice-roller/AGENTS.md`로 반영 결과를 확인하면 된다.
