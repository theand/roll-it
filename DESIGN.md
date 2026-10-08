---
name: roll-it
description: 민트 바탕과 청록색 놀이 공간을 사용하는 한국어 윷·주사위 도구
colors:
  ink: "#183f3a"
  muted: "#546e68"
  paper: "#edf3ed"
  table: "#18594f"
  accent: "#ffc49d"
  line: "#cbd9d1"
  white: "#fffef7"
  control-track: "#dbe6df"
  nav-text: "#385b52"
  nav-hover: "#ccdcd2"
  action-text: "#47301d"
  action-hover: "#ffd5b8"
  focus: "#bb4e27"
typography:
  body:
    fontFamily: "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif"
  display:
    fontSize: "64px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-.04em"
  headline:
    fontSize: "30px"
    fontWeight: 800
    letterSpacing: "-.035em"
  label:
    fontSize: "14px"
    fontWeight: 650
  action:
    fontSize: "19px"
    fontWeight: 800
rounded:
  choice: "7px"
  nav-item: "8px"
  choice-group: "10px"
  control: "12px"
  field: "16px"
spacing:
  compact: "4px"
  small: "8px"
  control: "12px"
  mobile: "18px"
  page: "24px"
  workspace: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.action-text}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-clear:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "8px 0 8px 12px"
  navigation:
    backgroundColor: "{colors.control-track}"
    rounded: "{rounded.control}"
    padding: "5px"
  choice-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.choice}"
    padding: "8px 13px"
    typography: "{typography.label}"
  play-field:
    backgroundColor: "{colors.table}"
    textColor: "{colors.white}"
    rounded: "{rounded.field}"
    padding: "32px 20px 24px"
---

# Design System: roll-it

## Overview

**Creative North Star: "청록색 놀이 공간"**

옅은 민트 바탕에 청록색 놀이 공간을 놓고 크림색 윷·주사위와 결과를 드러낸다.
살구색 실행 버튼은 놀이 공간 바로 아래에 둔다. 소개보다 던지기와 결과 읽기를 우선한다.

**Key Characteristics:**

- 세 모드에서 같은 탐색·실행·기록 표현을 사용한다.
- 시스템 한글 글꼴과 큰 결과 숫자로 빠르게 읽힌다.
- 물체의 회전·착지와 짧은 결과 등장에 움직임을 집중한다.

현재 구현 근거는 `index.html`, `dice.html`, `dice-3d/css/style.css`다.
공통 CSS는 각 진입점에 있으므로 공통 화면 변경 시 세 곳을 함께 확인한다.

## Colors

### Primary

청록색 `table`은 놀이 공간, 살구색 `accent`는 주 실행 버튼과 추가 던지기 안내에 사용한다.
버튼의 글자는 `action-text`, 호버는 `action-hover`를 따른다.

### Neutral

민트색 `paper`가 페이지 바탕이다. `ink`는 본문과 선택된 컨트롤,
`muted`는 설명과 기록 보조 정보, `white`는 놀이 공간의 결과와 선택된 항목 글자에 사용한다.
기록 구분선은 `line`, 선택 그룹의 바탕은 `control-track`이다.
특수 결과는 놀이 공간과 밝은 기록 영역에서 서로 다른 대비 색을 사용하며 글자로도 구별한다.

## Typography

모든 모드는 `body`의 시스템 글꼴을 상속한다. 외부 웹폰트는 없다.
결과는 `display`, 페이지 제목은 `headline`, 옵션은 `label`, 던지기는 `action` 역할이다.
모바일 결과는 56px, 제목은 26px로 줄어든다. 준비 상태의 결과 제목은 36px다.
기록 숫자는 고정 폭 숫자(`tabular-nums`)를 사용한다.

## Layout

페이지 최대 너비는 1120px다. 기본 레이아웃은 놀이 공간과 280px 기록 열이며 간격은 32px다.
761–950px에서는 기록 열을 245px, 간격을 24px로 줄인다.
760px 이하에서는 탐색 탭을 한 줄 전체에 펼치고 놀이 공간 아래에 기록을 배치한다.
모바일 페이지 좌우 여백은 18px, 하단은 safe-area를 반영한다.

주 실행 버튼의 최소 높이는 60px, 탐색·옵션·기록 삭제의 최소 높이는 44px다.
3D는 너비 760px 이하이면서 높이 800px 이하인 화면에서 캔버스를 150px로 줄인다.
최근 기록은 별도 스크롤 영역이며 기본 최대 높이 455px, 모바일 280px다.

## Elevation & Depth

놀이 공간은 청록색 면과 안쪽 가는 테두리로 구분한다. 기록은 카드 그림자 대신 구분선을 쓴다.
주 실행 버튼의 그림자는 `0 5px 12px #947b6340`, 누르는 동안은 `0 2px 5px #947b632e`이며
4px 아래로 이동한다. 윷·주사위에는 별도 물체 그림자를 유지한다.

## Shapes

놀이 공간은 `field`, 실행 버튼과 탐색 바는 `control` 둥글기를 사용한다.
선택 그룹과 개별 항목의 둥글기를 구별한다. 물체 외형은 윷과 주사위 자체의 형태를 따른다.

## Components

- **실행 버튼:** 가로 전체 너비, 살구색 바탕. 호버 시 밝아지고 누르면 내려간다.
  던지는 동안 비활성화되며 불투명도는 .55, 커서는 대기 상태다.
- **기록 삭제:** 배경 없는 보조 버튼. 기본 글자는 `muted`, 호버는 짙은 갈색이다.
- **탐색:** 윷·2D·3D 세 링크. 현재 모드는 짙은 바탕과 크림색 글자로 표시한다.
- **옵션:** 주사위 개수와 면 수는 같은 그룹 안에서 선택한다. 선택된 항목은 `ink` 바탕이다.
- **놀이 공간:** 결과, 물체, 짧은 설명을 담는다. 3D는 실제 캔버스를 사용한다.
- **기록:** 최신 결과부터 행으로 보여주고 개별 값과 합계를 함께 읽을 수 있게 한다.

키보드 포커스는 3px `focus` 윤곽선과 5px 간격을 사용한다.
결과 등장 효과는 .35초, 실행 버튼 전환은 .18초다.
reduced-motion에서는 CSS 움직임을 최소화하고 결과를 빠르게 확정한다.

## Do's and Don'ts

### Do:

- Do 세 모드의 공통 탐색·실행·기록 스타일을 함께 유지한다.
- Do 작은 화면에서 실행 버튼과 결과를 먼저 읽을 수 있게 한다.
- Do 터치 영역, 키보드 포커스, reduced-motion을 유지한다.

### Don't:

- Don't 결과를 색상만으로 구별한다.
- Don't 사용자 확대를 막거나 폰트·프레임워크 의존성을 추가한다.
- Don't 놀이 물체를 대체하는 장식 이미지를 추가한다.
