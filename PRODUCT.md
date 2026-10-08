# roll-it

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

휴대폰과 태블릿에서 윷과 주사위를 던지는 사용자. 함께 플레이하는 인원과
구체적인 게임 종류는 정해지지 않았다.

## Product Purpose

실물 윷과 주사위 없이 결과를 뽑고 바로 읽을 수 있는 한국어 보드게임 도구다.
사용자는 기존 디자인, 효과, 기능 전반의 개선을 요청했다.

## Capabilities and Constraints

- 윷, 2D 주사위, 3D 주사위의 세 진입점을 유지한다.
- 윷은 빽도와 윷·모 추가 던지기를 구분한다. 기존 판정과 확률을 보존한다.
- 2D는 주사위 1~2개, 3D는 D6/D8/D12/D20을 최대 4개 지원한다.
- 빌드 도구나 프레임워크 없이 정적 파일로 동작한다. 3D는 HTTP가 필요하다.
- 외부 런타임 의존성은 기존 Three.js CDN importmap이다.
- 이번 개선의 주요 기기는 휴대폰과 태블릿이다.
- 배포 및 원격 저장소 변경은 이번 요청에 포함되지 않았다.

## Evidence on Hand

현재 동작은 `index.html`, `dice.html`, `dice-3d/`에서 확인할 수 있다.
3D 주사위 회귀 테스트는 `archive/dice-roller/tests/dice.test.html`에 있다.

## Product Principles

- 던지기, 결과 읽기, 다시 던지기가 화면의 중심이다.
- 세 모드에서 같은 조작 용어와 결과 표시 방식을 사용한다.
- 터치 조작과 작은 화면에서의 가독성을 우선한다.
- 기능 확장은 실제 던지기 흐름을 개선하는 범위로 제한한다.
