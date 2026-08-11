"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type WidgetType =
  | "hero"
  | "text"
  | "button"
  | "form"
  | "stat"
  | "status"
  | "progress"
  | "profile"
  | "trend"
  | "bar"
  | "line"
  | "area"
  | "stackedBar"
  | "pie"
  | "scatter"
  | "radar"
  | "heatmap"
  | "funnel"
  | "donut"
  | "gauge"
  | "board"
  | "editor"
  | "live"
  | "assign"
  | "poll"
  | "customTable"
  | "kanban"
  | "gantt";

type WidgetWidth = "third" | "half" | "full";

type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  width: WidgetWidth;
  height?: number | "auto";
  settings: Record<string, string>;
};

type Page = {
  id: string;
  name: string;
  icon: string;
  iconTone?: PageIconTone;
  parentId?: string | null;
  widgets: Widget[];
};

type PageIconTone = "accent" | "accent2" | "positive" | "text" | "muted";

type Theme = {
  id: string;
  name: string;
  mode: "dark" | "light";
  isNew?: boolean;
  bg: string;
  sidebar: string;
  panel: string;
  surface: string;
  elevated: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  positive: string;
};

type SavedLayout = {
  name: string;
  updatedAt: number;
  pages: Page[];
  themeId: string;
  fontSize?: number;
};

type DropTarget = {
  targetId: string;
  position: "before" | "after";
};

const THEMES: Theme[] = [
  { id: "violet-night", name: "Violet Night", mode: "dark", bg: "#14151b", sidebar: "#191a21", panel: "#202128", surface: "#272830", elevated: "#30313b", line: "#393a45", text: "#f5f3ff", muted: "#9b9aa8", accent: "#a970ff", accent2: "#28c9d8", positive: "#45d394" },
  { id: "ocean-dark", name: "Ocean Dark", mode: "dark", bg: "#07151d", sidebar: "#0a1b25", panel: "#102630", surface: "#16323d", elevated: "#1d404b", line: "#28505b", text: "#edfaff", muted: "#89aab5", accent: "#23b5d3", accent2: "#6ae4b9", positive: "#52d6a3" },
  { id: "rose-charcoal", name: "Rose Charcoal", mode: "dark", bg: "#181416", sidebar: "#20191d", panel: "#292126", surface: "#33282e", elevated: "#423139", line: "#543c46", text: "#fff5f8", muted: "#b19ca5", accent: "#f05b8c", accent2: "#ffad66", positive: "#6ed6a4" },
  { id: "lime-graphite", name: "Lime Graphite", mode: "dark", bg: "#151815", sidebar: "#1b201b", panel: "#242924", surface: "#2d332d", elevated: "#373f37", line: "#465046", text: "#f4faef", muted: "#9ba795", accent: "#9bdd46", accent2: "#45d6b2", positive: "#77d982" },
  { id: "cobalt-ink", name: "Cobalt Ink", mode: "dark", bg: "#10131c", sidebar: "#151a27", panel: "#1c2332", surface: "#252d3e", elevated: "#303a4e", line: "#3a465c", text: "#f3f6ff", muted: "#96a2ba", accent: "#668cff", accent2: "#31d1c5", positive: "#5ed69a" },
  { id: "amber-coal", name: "Amber Coal", mode: "dark", bg: "#181611", sidebar: "#211d16", panel: "#2a251c", surface: "#352e23", elevated: "#443a2a", line: "#574a35", text: "#fff9e9", muted: "#b0a58d", accent: "#f5ad3d", accent2: "#ef6f6c", positive: "#72d39b" },
  { id: "mint-noir", name: "Mint Noir", mode: "dark", bg: "#101716", sidebar: "#141f1d", panel: "#1b2926", surface: "#23342f", elevated: "#2b423b", line: "#38544b", text: "#effcf8", muted: "#8faaa2", accent: "#55d6be", accent2: "#8b8cff", positive: "#67dc98" },
  { id: "coral-night", name: "Coral Night", mode: "dark", bg: "#191515", sidebar: "#221a1a", panel: "#2b2221", surface: "#362b29", elevated: "#453633", line: "#584541", text: "#fff6f3", muted: "#b09c97", accent: "#ff7869", accent2: "#f7c45b", positive: "#68d29b" },
  { id: "orchid-deep", name: "Orchid Deep", mode: "dark", bg: "#17131c", sidebar: "#1f1828", panel: "#292034", surface: "#342940", elevated: "#43344f", line: "#554263", text: "#fcf4ff", muted: "#aa97b3", accent: "#d06cf0", accent2: "#4fc7e8", positive: "#61d6a2" },
  { id: "slate-sky", name: "Slate Sky", mode: "dark", bg: "#12171d", sidebar: "#18202a", panel: "#202b37", surface: "#293744", elevated: "#344554", line: "#415668", text: "#f1f8ff", muted: "#96a9ba", accent: "#55a8ff", accent2: "#5fe0d0", positive: "#6ad8a4" },
  { id: "obsidian-pulse", name: "Obsidian Pulse", mode: "dark", isNew: true, bg: "#090a0e", sidebar: "#0e1016", panel: "#151823", surface: "#1d2130", elevated: "#272c3d", line: "#343a4d", text: "#f6f7fb", muted: "#8991a6", accent: "#7c5cff", accent2: "#00d7c9", positive: "#35d49a" },
  { id: "carbon-cyan", name: "Carbon Cyan", mode: "dark", isNew: true, bg: "#0b1012", sidebar: "#101719", panel: "#162124", surface: "#1d2b2f", elevated: "#25363b", line: "#30464c", text: "#eafbfc", muted: "#82a3a7", accent: "#00c7d9", accent2: "#6be7a5", positive: "#4dda9b" },
  { id: "midnight-electric", name: "Midnight Electric", mode: "dark", isNew: true, bg: "#080d18", sidebar: "#0d1422", panel: "#121d2d", surface: "#19273a", elevated: "#22334a", line: "#2d425c", text: "#f1f6ff", muted: "#869ab6", accent: "#3578ff", accent2: "#9b6cff", positive: "#3dd49a" },
  { id: "graphite-ruby", name: "Graphite Ruby", mode: "dark", isNew: true, bg: "#111012", sidebar: "#171417", panel: "#20191d", surface: "#2a2025", elevated: "#36282e", line: "#46343c", text: "#fff3f6", muted: "#a58e96", accent: "#f0446a", accent2: "#ff8a5c", positive: "#4fd5a0" },
  { id: "black-gold", name: "Black Gold", mode: "dark", isNew: true, bg: "#0d0c09", sidebar: "#14120d", panel: "#1d1911", surface: "#272118", elevated: "#332a1e", line: "#443624", text: "#fff8e8", muted: "#a99c80", accent: "#ddaa3d", accent2: "#f2d17b", positive: "#5bd19a" },
  { id: "neo-indigo", name: "Neo Indigo", mode: "dark", isNew: true, bg: "#0d0b16", sidebar: "#131020", panel: "#1b172b", surface: "#241e38", elevated: "#302748", line: "#40345e", text: "#f7f3ff", muted: "#9c92b4", accent: "#816bff", accent2: "#e25dff", positive: "#4dd7a0" },
  { id: "forest-matrix", name: "Forest Matrix", mode: "dark", isNew: true, bg: "#0a110e", sidebar: "#0f1914", panel: "#15231c", surface: "#1d2f25", elevated: "#283e31", line: "#365341", text: "#edfff5", muted: "#89a898", accent: "#47d67a", accent2: "#a2e85b", positive: "#5edf9a" },
  { id: "velvet-plum", name: "Velvet Plum", mode: "dark", isNew: true, bg: "#120c13", sidebar: "#1a111c", panel: "#231726", surface: "#2e1e32", elevated: "#3c2842", line: "#513557", text: "#fff2ff", muted: "#aa8faf", accent: "#d85ad4", accent2: "#ff7c9e", positive: "#5bd5a1" },
  { id: "steel-orange", name: "Steel Orange", mode: "dark", isNew: true, bg: "#101214", sidebar: "#161a1e", panel: "#1d2329", surface: "#262e35", elevated: "#303a43", line: "#3e4b55", text: "#f5f8fa", muted: "#929fa9", accent: "#ff7a45", accent2: "#49b9ff", positive: "#50d29a" },
  { id: "polar-night", name: "Polar Night", mode: "dark", isNew: true, bg: "#071014", sidebar: "#0b171d", panel: "#102129", surface: "#172c35", elevated: "#1f3944", line: "#2a4a56", text: "#f0fcff", muted: "#86a8b3", accent: "#65d8ff", accent2: "#a2f06c", positive: "#55dba3" },
  { id: "cloud-blue", name: "Cloud Blue", mode: "light", bg: "#edf3fa", sidebar: "#ffffff", panel: "#f7faff", surface: "#ffffff", elevated: "#e8f0fa", line: "#d7e1ed", text: "#1a2634", muted: "#708094", accent: "#3978f6", accent2: "#00a9a5", positive: "#209b68" },
  { id: "paper-violet", name: "Paper Violet", mode: "light", bg: "#f4f1f8", sidebar: "#fffefe", panel: "#faf8fd", surface: "#ffffff", elevated: "#eee8f5", line: "#ded5e8", text: "#2b2334", muted: "#7b6f88", accent: "#8055c7", accent2: "#df5f8b", positive: "#269669" },
  { id: "sage-studio", name: "Sage Studio", mode: "light", bg: "#edf2ed", sidebar: "#f9fcf8", panel: "#f4f8f3", surface: "#ffffff", elevated: "#e4ece2", line: "#d3ded1", text: "#243127", muted: "#6f7e72", accent: "#4f8f65", accent2: "#cf8c45", positive: "#2d9662" },
  { id: "warm-sand", name: "Warm Sand", mode: "light", bg: "#f4efe7", sidebar: "#fffcf7", panel: "#faf6ef", surface: "#ffffff", elevated: "#eee5d8", line: "#ded2c2", text: "#342c24", muted: "#83776a", accent: "#b76b3f", accent2: "#3e8c93", positive: "#438e62" },
  { id: "ice-mint", name: "Ice Mint", mode: "light", bg: "#edf7f5", sidebar: "#fafffe", panel: "#f4fbfa", surface: "#ffffff", elevated: "#dff1ed", line: "#cce4df", text: "#17332f", muted: "#66837e", accent: "#008f7d", accent2: "#5077d9", positive: "#258f61" },
  { id: "peach-office", name: "Peach Office", mode: "light", bg: "#faf0ec", sidebar: "#fffafa", panel: "#fff6f2", surface: "#ffffff", elevated: "#f5e2da", line: "#ead2c8", text: "#3d2924", muted: "#8c716a", accent: "#dc684e", accent2: "#7a66c8", positive: "#359266" },
  { id: "mono-light", name: "Mono Light", mode: "light", bg: "#f0f1f3", sidebar: "#ffffff", panel: "#f7f8f9", surface: "#ffffff", elevated: "#e7e9ec", line: "#d6d9de", text: "#20242a", muted: "#717781", accent: "#313842", accent2: "#6e7784", positive: "#24875b" },
  { id: "lemon-air", name: "Lemon Air", mode: "light", bg: "#f7f6ea", sidebar: "#fffffa", panel: "#fbfbf3", surface: "#ffffff", elevated: "#eeeeD9", line: "#dfdfc9", text: "#303126", muted: "#7b7c68", accent: "#8a8f24", accent2: "#e3883c", positive: "#3a9163" },
  { id: "lavender-air", name: "Lavender Air", mode: "light", bg: "#f3f2fb", sidebar: "#fdfcff", panel: "#f8f7fe", surface: "#ffffff", elevated: "#e9e7f6", line: "#d9d6ec", text: "#29263a", muted: "#747087", accent: "#6d63d9", accent2: "#d35e9b", positive: "#36936b" },
  { id: "aqua-paper", name: "Aqua Paper", mode: "light", bg: "#eef7f8", sidebar: "#fbffff", panel: "#f6fbfc", surface: "#ffffff", elevated: "#e0eff1", line: "#cde1e4", text: "#203235", muted: "#6d8185", accent: "#168da1", accent2: "#705ec8", positive: "#2d9165" },
];

const PAGE_ICON_GROUPS = [
  { category: "기본", icons: [["⌂", "홈"], ["⌘", "워크스페이스"], ["☰", "메뉴"], ["▦", "대시보드"], ["▤", "목록"], ["▥", "패널"], ["▧", "레이아웃"], ["▨", "타일"], ["▩", "그리드"], ["□", "페이지"], ["◇", "프로젝트"], ["○", "개요"]] },
  { category: "업무", icons: [["⚙", "설정"], ["⚒", "도구"], ["⚖", "정책"], ["⚑", "목표"], ["⚐", "마일스톤"], ["⌁", "흐름"], ["⌗", "태그"], ["§", "규정"], ["¶", "문단"], ["※", "참고"], ["†", "중요"], ["‡", "승인"]] },
  { category: "문서", icons: [["✎", "편집"], ["✐", "작성"], ["✑", "서명"], ["✒", "기록"], ["✉", "메일"], ["✂", "정리"], ["☷", "문서 목록"], ["☶", "문서 상세"], ["☵", "자료"], ["☲", "노트"], ["☳", "양식"], ["☱", "보관함"]] },
  { category: "소통", icons: [["☏", "연락처"], ["☎", "전화"], ["☊", "알림"], ["☋", "공지"], ["♩", "미디어"], ["♪", "오디오"], ["♫", "콘텐츠"], ["♬", "방송"], ["☼", "아이디어"], ["☀", "업데이트"], ["☁", "클라우드"], ["☂", "지원"]] },
  { category: "분석", icons: [["∑", "합계"], ["∫", "누적"], ["∂", "변화"], ["∆", "증감"], ["∇", "감소"], ["∞", "지속"], ["≈", "비교"], ["≡", "데이터"], ["≤", "하한"], ["≥", "상한"], ["%", "비율"], ["#", "지표"]] },
  { category: "일정", icons: [["◷", "시간"], ["◶", "오전"], ["◵", "오후"], ["◴", "마감"], ["◰", "주간"], ["◱", "월간"], ["◲", "분기"], ["◳", "연간"], ["⌛", "대기"], ["⌚", "일정"], ["⧗", "타이머"], ["⧖", "소요 시간"]] },
  { category: "방향", icons: [["←", "이전"], ["↑", "위"], ["→", "다음"], ["↓", "아래"], ["↔", "가로 이동"], ["↕", "세로 이동"], ["↗", "상승"], ["↘", "하락"], ["↙", "왼쪽 아래"], ["↖", "왼쪽 위"], ["⇄", "교환"], ["⇅", "정렬"]] },
  { category: "상태", icons: [["✓", "완료"], ["✔", "확인"], ["✕", "닫기"], ["✖", "오류"], ["+", "추가"], ["−", "제거"], ["±", "조정"], ["!", "경고"], ["?", "도움말"], ["*", "필수"], ["•", "진행"], ["◉", "활성"]] },
  { category: "사람", icons: [["♙", "구성원"], ["♟", "담당자"], ["♔", "관리자"], ["♕", "리더"], ["♖", "조직"], ["♗", "전문가"], ["♘", "협업자"], ["♚", "책임자"], ["♛", "오너"], ["♜", "부서"], ["♝", "파트너"], ["♞", "외부 인력"]] },
  { category: "강조", icons: [["☆", "즐겨찾기"], ["★", "중요 항목"], ["✦", "새 기능"], ["✧", "추천"], ["✪", "우수"], ["✫", "핵심"], ["✬", "성과"], ["✭", "평가"], ["✮", "등급"], ["✯", "주목"], ["✰", "베스트"], ["❖", "특별"]] },
] as const;

const PAGE_ICONS = PAGE_ICON_GROUPS.flatMap((group) => group.icons.map(([glyph, label], index) => ({
  id: `${group.category}-${index + 1}`,
  category: group.category,
  glyph,
  label,
})));
const PAGE_ICON_TONES: Array<{ id: PageIconTone; label: string }> = [
  { id: "accent", label: "포인트" },
  { id: "accent2", label: "보조" },
  { id: "positive", label: "완료" },
  { id: "text", label: "본문" },
  { id: "muted", label: "중립" },
];

function PageIcon({ glyph, tone = "accent" }: { glyph: string; tone?: PageIconTone }) {
  return <span className={`page-icon tone-${tone}`} aria-hidden="true">{glyph}</span>;
}

const TOOLBOX: Array<{ category: string; items: Array<{ type: WidgetType; label: string; icon: string; description: string }> }> = [
  { category: "기본 구성", items: [
    { type: "hero", label: "페이지 헤더", icon: "H", description: "제목과 설명" },
    { type: "text", label: "텍스트 블록", icon: "T", description: "본문 콘텐츠" },
    { type: "button", label: "액션 버튼", icon: "+", description: "주요 동작" },
    { type: "form", label: "입력 폼", icon: "F", description: "필드와 제출" },
  ]},
  { category: "정보 카드", items: [
    { type: "stat", label: "지표 카드", icon: "%", description: "숫자와 증감" },
    { type: "status", label: "상태 카드", icon: "●", description: "상태 요약" },
    { type: "progress", label: "진행률", icon: "↗", description: "목표 진행" },
    { type: "profile", label: "프로필", icon: "P", description: "담당자 정보" },
  ]},
  { category: "인터랙티브 차트", items: [
    { type: "trend", label: "추세 차트", icon: "⌁", description: "기간별 추이" },
    { type: "bar", label: "막대 차트", icon: "▥", description: "항목별 비교" },
    { type: "line", label: "선 차트", icon: "╱", description: "연속 변화 비교" },
    { type: "area", label: "영역 차트", icon: "◿", description: "누적 규모 추이" },
    { type: "stackedBar", label: "누적 막대", icon: "▤", description: "구성 항목 비교" },
    { type: "pie", label: "원형 차트", icon: "◕", description: "전체 대비 비중" },
    { type: "scatter", label: "산점도", icon: "∴", description: "상관관계 분석" },
    { type: "radar", label: "레이더 차트", icon: "◇", description: "다차원 역량 비교" },
    { type: "heatmap", label: "히트맵", icon: "▦", description: "밀도와 패턴 탐색" },
    { type: "funnel", label: "퍼널 차트", icon: "▽", description: "단계별 전환 분석" },
    { type: "donut", label: "도넛 차트", icon: "◉", description: "비중 분석" },
    { type: "gauge", label: "게이지", icon: "◔", description: "달성 현황" },
  ]},
  { category: "업무 도구", items: [
    { type: "board", label: "업무 게시판", icon: "B", description: "필터 가능한 목록" },
    { type: "editor", label: "콘텐츠 에디터", icon: "E", description: "문서 작성" },
    { type: "live", label: "실시간 피드", icon: "L", description: "자동 갱신 카드" },
    { type: "assign", label: "담당자 배정", icon: "A", description: "사람과 업무 연결" },
    { type: "poll", label: "투표", icon: "V", description: "선택과 결과 집계" },
    { type: "customTable", label: "커스텀 테이블", icon: "▦", description: "입력 열과 행 구성" },
    { type: "kanban", label: "칸반 보드", icon: "K", description: "단계별 업무 흐름" },
    { type: "gantt", label: "간트차트", icon: "G", description: "일정과 기간 관리" },
  ]},
];

const LABELS: Record<WidgetType, string> = Object.fromEntries(
  TOOLBOX.flatMap((group) => group.items.map((item) => [item.type, item.label])),
) as Record<WidgetType, string>;

const WIDTH_LABELS: Record<WidgetWidth, string> = { third: "1/3", half: "1/2", full: "전체" };

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeWidget(type: WidgetType, overrides: Partial<Widget> = {}): Widget {
  const fullTypes: WidgetType[] = ["hero", "text", "form", "trend", "bar", "line", "area", "stackedBar", "scatter", "heatmap", "board", "editor", "live", "customTable", "kanban", "gantt"];
  const defaults: Partial<Record<WidgetType, Record<string, string>>> = {
    hero: { subtitle: "팀의 핵심 업무와 현황을 한눈에 확인하세요.", eyebrow: "WORKSPACE" },
    text: { body: "팀이 함께 확인해야 할 안내와 설명을 입력하세요." },
    button: { label: "새 업무 만들기" },
    form: { button: "등록하기" },
    stat: { value: "₩84.2M", delta: "+12.8%", caption: "전월 대비" },
    status: { value: "정상", caption: "모든 시스템 운영 중" },
    progress: { value: "68", caption: "분기 목표 달성률" },
    profile: { value: "김민준", caption: "프로젝트 오너" },
    trend: { caption: "최근 7일 처리량" },
    bar: { caption: "팀별 완료 업무" },
    line: { caption: "월별 매출 변화" },
    area: { caption: "기간별 누적 사용자" },
    stackedBar: { caption: "채널별 실적 구성" },
    pie: { caption: "부서별 업무 비중" },
    scatter: { caption: "비용 대비 전환 상관관계" },
    radar: { caption: "팀 역량 비교" },
    heatmap: { caption: "시간대별 활동 밀도" },
    funnel: { caption: "고객 전환 단계" },
    donut: { value: "74", caption: "완료 비율" },
    gauge: { value: "82", caption: "서비스 목표" },
    board: { caption: "팀 전체 업무" },
    editor: { caption: "공유 문서" },
    live: { caption: "팀 활동을 실시간으로 확인합니다." },
    assign: { caption: "업무 담당자와 마감일" },
    poll: { caption: "현재 36명 참여", question: "다음 팀 워크숍은 언제가 좋을까요?", option1: "8월 21일 금요일", option2: "8월 28일 금요일", option3: "9월 4일 금요일" },
    customTable: { caption: "열을 끌어 순서를 바꾸고 행을 추가하세요.", comboOptions: "대기,진행,검토,완료", comboDefault: "진행", radioOptions: "일반,높음", radioDefault: "일반", textDefault: "새 업무" },
    kanban: { caption: "카드를 끌어 단계별로 이동하세요." },
    gantt: { caption: "업무 막대를 끌어 일정을 이동하고 기간을 조절하세요." },
  };
  return {
    id: newId("widget"),
    type,
    title: LABELS[type],
    width: fullTypes.includes(type) ? "full" : type === "poll" ? "half" : "third",
    height: "auto",
    settings: defaults[type] ?? {},
    ...overrides,
  };
}

const INITIAL_PAGES: Page[] = [
  {
    id: "dashboard",
    name: "워크 대시보드",
    icon: "⌘",
    iconTone: "accent",
    widgets: [
      makeWidget("hero", { title: "안녕하세요, 좋은 아침입니다" }),
      makeWidget("stat", { title: "이번 달 매출", width: "third" }),
      makeWidget("progress", { title: "프로젝트 진행", width: "third", settings: { value: "68", caption: "48개 중 33개 완료" } }),
      makeWidget("status", { title: "서비스 상태", width: "third" }),
      makeWidget("trend", { title: "업무 처리 흐름", width: "full" }),
      makeWidget("assign", { title: "오늘의 우선 업무", width: "half" }),
      makeWidget("live", { title: "팀 라이브 피드", width: "half" }),
    ],
  },
  { id: "projects", name: "프로젝트", icon: "◇", iconTone: "accent2", widgets: [makeWidget("progress", { title: "진행 중인 프로젝트", width: "half" }), makeWidget("assign", { title: "담당 업무", width: "half" }), makeWidget("board", { title: "프로젝트 보드" })] },
  { id: "board", name: "업무 게시판", icon: "▤", iconTone: "positive", widgets: [makeWidget("hero", { title: "팀 업무 게시판", settings: { subtitle: "담당자, 우선순위, 진행 상태를 한 곳에서 관리합니다.", eyebrow: "TEAM BOARD" } }), makeWidget("board", { title: "전체 업무" })] },
  { id: "content", name: "문서 에디터", icon: "✎", iconTone: "text", widgets: [makeWidget("editor", { title: "새 업무 문서" })] },
  { id: "people", name: "팀과 담당자", icon: "♙", iconTone: "muted", widgets: [makeWidget("profile", { title: "프로젝트 리드", width: "third" }), makeWidget("assign", { title: "업무 배정", width: "full" })] },
];

function MiniChart({ variant }: { variant: "trend" | "bar" }) {
  const [range, setRange] = useState("7일");
  const data = useMemo(() => {
    if (range === "오늘") return [28, 46, 35, 68, 58, 76, 64, 88];
    if (range === "30일") return [38, 51, 46, 63, 57, 74, 69, 83, 78, 92, 86, 97];
    return [44, 61, 55, 72, 49, 78, 68, 90, 73, 86, 81, 96];
  }, [range]);
  return (
    <div className="chart-shell">
      <div className="chart-toolbar">
        <div><strong>12,840</strong><span> +18.4%</span></div>
        <div className="segment-control" aria-label="차트 기간">
          {["오늘", "7일", "30일"].map((item) => (
            <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>
          ))}
        </div>
      </div>
      <div className={`mini-chart ${variant}`}>
        <div className="chart-grid-lines"><i /><i /><i /><i /></div>
        <div className="chart-bars">
          {data.map((value, index) => (
            <button
              className="chart-bar"
              key={`${range}-${index}`}
              style={{ "--bar-height": `${value}%`, "--delay": `${index * 25}ms` } as CSSProperties}
              aria-label={`${index + 1}번째 값 ${value}`}
            >
              <span className="chart-tooltip">{value * 128}</span>
              <i />
            </button>
          ))}
        </div>
      </div>
      <div className="chart-axis"><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
    </div>
  );
}

function LineAreaChart({ variant }: { variant: "line" | "area" }) {
  const [range, setRange] = useState("6개월");
  const data = range === "1년" ? [34, 43, 39, 55, 49, 64, 58, 73, 69, 82, 77, 91] : range === "30일" ? [48, 56, 44, 62, 68, 59, 76, 84] : [38, 52, 47, 65, 58, 74, 69, 86];
  const width = 100 / (data.length - 1);
  const areaShape = `polygon(0 100%, ${data.map((value, index) => `${index * width}% ${100 - value}%`).join(", ")}, 100% 100%)`;
  return (
    <div className={`advanced-chart line-area-chart ${variant}`}>
      <div className="advanced-chart-head"><div><strong>{variant === "line" ? "₩128.4M" : "48,920"}</strong><span>{variant === "line" ? "매출" : "활성 사용자"} · +16.8%</span></div><div className="segment-control">{["30일", "6개월", "1년"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div>
      <div className="line-plot">
        <div className="chart-grid-lines"><i /><i /><i /><i /></div>
        {variant === "area" && <i className="area-fill" style={{ clipPath: areaShape }} />}
        {data.slice(0, -1).map((value, index) => {
          const angle = -Math.atan2((data[index + 1] - value) * 1.15, width) * 180 / Math.PI;
          return <i className="line-segment" key={index} style={{ left: `${index * width}%`, bottom: `${value}%`, width: `${width}%`, transform: `rotate(${angle}deg)` }} />;
        })}
        {data.map((value, index) => <button className="line-point" key={`${range}-${index}`} style={{ left: `${index * width}%`, bottom: `${value}%` }} aria-label={`${index + 1}번째 데이터 ${value * 160}`}><span>{(value * 160).toLocaleString()}</span></button>)}
      </div>
      <div className="compact-axis"><span>1월</span><span>3월</span><span>5월</span><span>7월</span><span>9월</span><span>11월</span></div>
    </div>
  );
}

function StackedBarChart() {
  const [mode, setMode] = useState("실적");
  const [visible, setVisible] = useState([true, true, true]);
  const values = mode === "목표" ? [[36, 28, 22], [42, 25, 24], [38, 34, 20], [46, 31, 18], [49, 33, 17], [54, 29, 20]] : [[28, 24, 18], [36, 21, 19], [31, 29, 16], [42, 25, 14], [45, 28, 16], [51, 24, 18]];
  const labels = ["직접", "검색", "추천"];
  return (
    <div className="advanced-chart stacked-chart">
      <div className="advanced-chart-head"><div><strong>₩96.2M</strong><span>채널별 기여도</span></div><div className="segment-control">{["실적", "목표"].map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div></div>
      <div className="stacked-plot"><div className="chart-grid-lines"><i /><i /><i /><i /></div>{values.map((parts, index) => { const total = parts.reduce((sum, value, partIndex) => sum + (visible[partIndex] ? value : 0), 0); return <button className="stack-column" key={`${mode}-${index}`} style={{ height: `${Math.max(total, 6)}%` }} aria-label={`${index + 1}월 합계 ${total}`}><span className="chart-tooltip">{total}M</span>{parts.map((value, partIndex) => visible[partIndex] && <i key={partIndex} className={`stack-part part-${partIndex}`} style={{ flexGrow: value }} />)}</button>; })}</div>
      <div className="chart-legend">{labels.map((label, index) => <button key={label} className={visible[index] ? "active" : ""} onClick={() => setVisible((current) => current.map((value, i) => i === index ? !value : value))}><i className={`part-${index}`} />{label}</button>)}</div>
    </div>
  );
}

function PieChart() {
  const labels = ["개발", "운영", "디자인", "기획"];
  const values = [42, 28, 18, 12];
  const [selected, setSelected] = useState(0);
  return (
    <div className="advanced-chart pie-widget">
      <button className="pie-chart" onClick={() => setSelected((current) => (current + 1) % values.length)} aria-label="다음 원형 차트 항목 보기"><span><strong>{values[selected]}%</strong><small>{labels[selected]}</small></span></button>
      <div className="pie-legend">{labels.map((label, index) => <button key={label} className={selected === index ? "active" : ""} onClick={() => setSelected(index)}><i className={`pie-color-${index}`} /><span>{label}</span><b>{values[index]}%</b></button>)}</div>
    </div>
  );
}

function ScatterChart() {
  const [group, setGroup] = useState("전체");
  const [selected, setSelected] = useState<number | null>(null);
  const points = [[12, 22, "A"], [21, 38, "B"], [30, 29, "A"], [37, 53, "A"], [46, 44, "B"], [52, 68, "A"], [61, 57, "B"], [68, 79, "A"], [75, 66, "B"], [83, 88, "A"], [91, 76, "B"]] as Array<[number, number, string]>;
  return (
    <div className="advanced-chart scatter-chart">
      <div className="advanced-chart-head"><div><strong>0.78</strong><span>양의 상관관계</span></div><div className="segment-control">{["전체", "A팀", "B팀"].map((item) => <button key={item} className={group === item ? "active" : ""} onClick={() => { setGroup(item); setSelected(null); }}>{item}</button>)}</div></div>
      <div className="scatter-plot"><div className="chart-grid-lines"><i /><i /><i /><i /></div><i className="scatter-trend" />{points.map(([x, y, team], index) => { const shown = group === "전체" || group.startsWith(team); return shown && <button key={index} className={`scatter-point team-${team} ${selected === index ? "selected" : ""}`} style={{ left: `${x}%`, bottom: `${y}%` }} onClick={() => setSelected(index)} aria-label={`비용 ${x}, 전환 ${y}`}><span>비용 {x} · 전환 {y}</span></button>; })}</div>
      <div className="scatter-labels"><span>비용 낮음</span><span>비용 높음</span></div>
    </div>
  );
}

function RadarChart() {
  const [team, setTeam] = useState("A팀");
  const labels = ["기획", "실행", "협업", "품질", "속도"];
  const values = team === "A팀" ? [86, 72, 91, 78, 84] : [68, 88, 76, 92, 70];
  const points = values.map((value, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / values.length; const radius = value * .42; return `${50 + Math.cos(angle) * radius}% ${50 + Math.sin(angle) * radius}%`; }).join(", ");
  return (
    <div className="advanced-chart radar-chart">
      <div className="advanced-chart-head"><div><strong>{Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)}</strong><span>평균 역량 점수</span></div><div className="segment-control">{["A팀", "B팀"].map((item) => <button key={item} className={team === item ? "active" : ""} onClick={() => setTeam(item)}>{item}</button>)}</div></div>
      <div className="radar-stage"><i className="radar-ring ring-1" /><i className="radar-ring ring-2" /><i className="radar-ring ring-3" /><i className="radar-data" style={{ clipPath: `polygon(${points})` }} />{labels.map((label, index) => <span key={label} className={`radar-label label-${index}`}>{label}<b>{values[index]}</b></span>)}</div>
    </div>
  );
}

function HeatmapChart() {
  const [range, setRange] = useState("4주");
  const [selected, setSelected] = useState<number | null>(null);
  const count = range === "12주" ? 84 : 42;
  const values = Array.from({ length: count }, (_, index) => (index * 17 + (index % 7) * 11 + (range === "12주" ? 13 : 0)) % 96);
  return (
    <div className="advanced-chart heatmap-chart">
      <div className="advanced-chart-head"><div><strong>1,284</strong><span>{selected === null ? "전체 활동" : `${selected + 1}번째 구간 · ${values[selected]}건`}</span></div><div className="segment-control">{["4주", "12주"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => { setRange(item); setSelected(null); }}>{item}</button>)}</div></div>
      <div className={`heatmap-grid ${range === "12주" ? "wide" : ""}`}>{values.map((value, index) => <button key={`${range}-${index}`} className={selected === index ? "selected" : ""} style={{ "--heat": `${.12 + value / 115}` } as CSSProperties} onClick={() => setSelected(index)} aria-label={`${index + 1}번째 구간 활동 ${value}건`}><span>{value}건</span></button>)}</div>
      <div className="heatmap-scale"><span>낮음</span><i /><i /><i /><i /><span>높음</span></div>
    </div>
  );
}

function FunnelChart() {
  const stages = [{ label: "방문", value: 12400, width: 100 }, { label: "관심", value: 8240, width: 78 }, { label: "검토", value: 4910, width: 57 }, { label: "신청", value: 2380, width: 38 }, { label: "완료", value: 1460, width: 24 }];
  const [selected, setSelected] = useState(0);
  const conversion = selected === 0 ? 100 : Math.round(stages[selected].value / stages[0].value * 100);
  return (
    <div className="advanced-chart funnel-chart">
      <div className="funnel-summary"><strong>{stages[selected].value.toLocaleString()}</strong><span>{stages[selected].label} · 전체 대비 {conversion}%</span></div>
      <div className="funnel-steps">{stages.map((stage, index) => <button key={stage.label} className={selected === index ? "active" : ""} style={{ width: `${stage.width}%` }} onClick={() => setSelected(index)}><span>{stage.label}</span><b>{stage.value.toLocaleString()}</b></button>)}</div>
    </div>
  );
}

type CustomTableRow = { id: string; title: string; checked: boolean; date: string; status: string; priority: string };
type CustomTableColumn = { id: "text" | "check" | "date" | "combo" | "radio"; label: string };

function CustomTablePreview({ settings }: { settings: Record<string, string> }) {
  const comboOptions = (settings.comboOptions || "대기,진행,검토,완료").split(",").map((value) => value.trim()).filter(Boolean);
  const radioOptions = (settings.radioOptions || "일반,높음").split(",").map((value) => value.trim()).filter(Boolean);
  const defaultStatus = comboOptions.includes(settings.comboDefault) ? settings.comboDefault : comboOptions[0] || "진행";
  const defaultPriority = radioOptions.includes(settings.radioDefault) ? settings.radioDefault : radioOptions[0] || "일반";
  const defaultText = settings.textDefault || "새 업무";
  const [columns, setColumns] = useState<CustomTableColumn[]>([
    { id: "text", label: "텍스트" },
    { id: "check", label: "체크박스" },
    { id: "date", label: "날짜" },
    { id: "combo", label: "상태" },
    { id: "radio", label: "우선순위" },
  ]);
  const [rows, setRows] = useState<CustomTableRow[]>([
    { id: "table-row-1", title: "요구사항 검토", checked: true, date: "2026-08-12", status: defaultStatus, priority: radioOptions[1] || defaultPriority },
    { id: "table-row-2", title: "화면 설계", checked: false, date: "2026-08-18", status: defaultStatus, priority: defaultPriority },
  ]);
  const [draggedColumn, setDraggedColumn] = useState<CustomTableColumn["id"] | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<CustomTableColumn["id"], number>>({ text: 180, check: 112, date: 140, combo: 140, radio: 180 });
  const columnResize = useRef<{ id: CustomTableColumn["id"]; pointerId: number; startX: number; startWidth: number } | null>(null);

  const updateRow = (id: string, patch: Partial<CustomTableRow>) => setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  const moveColumn = (fromId: CustomTableColumn["id"], toId: CustomTableColumn["id"]) => {
    if (fromId === toId) return;
    setColumns((current) => {
      const next = [...current];
      const from = next.findIndex((column) => column.id === fromId);
      const to = next.findIndex((column) => column.id === toId);
      if (from < 0 || to < 0) return current;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const shiftColumn = (id: CustomTableColumn["id"], direction: -1 | 1) => setColumns((current) => {
    const index = current.findIndex((column) => column.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const startColumnResize = (event: React.PointerEvent<HTMLButtonElement>, id: CustomTableColumn["id"]) => {
    event.preventDefault();
    event.stopPropagation();
    columnResize.current = { id, pointerId: event.pointerId, startX: event.clientX, startWidth: columnWidths[id] };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const trackColumnResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = columnResize.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const width = Math.max(90, Math.min(360, active.startWidth + event.clientX - active.startX));
    setColumnWidths((current) => ({ ...current, [active.id]: Math.round(width) }));
  };
  const finishColumnResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    columnResize.current = null;
  };
  const addRow = () => setRows((current) => [...current, { id: newId("table-row"), title: `${defaultText} ${current.length + 1}`, checked: false, date: new Date().toISOString().slice(0, 10), status: defaultStatus, priority: defaultPriority }]);
  const gridStyle = { gridTemplateColumns: `${columns.map((column) => `minmax(${columnWidths[column.id]}px, ${columnWidths[column.id]}fr)`).join(" ")} 30px` };

  const renderCell = (column: CustomTableColumn, row: CustomTableRow) => {
    if (column.id === "text") return <input type="text" value={row.title} onChange={(event) => updateRow(row.id, { title: event.target.value })} aria-label="텍스트 입력" />;
    if (column.id === "check") return <label className="table-check"><input type="checkbox" checked={row.checked} onChange={(event) => updateRow(row.id, { checked: event.target.checked })} /><span>{row.checked ? "완료" : "대기"}</span></label>;
    if (column.id === "date") return <input type="date" value={row.date} onChange={(event) => updateRow(row.id, { date: event.target.value })} aria-label="날짜 선택" />;
    if (column.id === "combo") return <select value={row.status} onChange={(event) => updateRow(row.id, { status: event.target.value })} aria-label="상태 선택">{comboOptions.map((option) => <option key={option}>{option}</option>)}</select>;
    return <div className="table-radio">{radioOptions.map((option) => <label key={option}><input type="radio" name={`priority-${row.id}`} checked={row.priority === option} onChange={() => updateRow(row.id, { priority: option })} />{option}</label>)}</div>;
  };

  return (
    <div className="custom-table-widget">
      <div className="custom-table-toolbar"><span>머리글은 순서 변경 · 경계선은 너비 조절</span><button onClick={addRow}>＋ 행 추가</button></div>
      <div className="custom-table-scroll">
        <div className="custom-table-row custom-table-head" style={gridStyle}>
          {columns.map((column, index) => <div key={column.id} draggable onDragStart={() => setDraggedColumn(column.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedColumn) moveColumn(draggedColumn, column.id); setDraggedColumn(null); }}><span>⠿ {column.label}<small>{columnWidths[column.id]}px</small></span><span className="column-shift"><button disabled={index === 0} onClick={() => shiftColumn(column.id, -1)} aria-label={`${column.label} 왼쪽으로`}>‹</button><button disabled={index === columns.length - 1} onClick={() => shiftColumn(column.id, 1)} aria-label={`${column.label} 오른쪽으로`}>›</button></span><button type="button" className="column-resizer" draggable={false} onPointerDown={(event) => startColumnResize(event, column.id)} onPointerMove={trackColumnResize} onPointerUp={finishColumnResize} onPointerCancel={finishColumnResize} aria-label={`${column.label} 열 너비 조절`} title="좌우로 끌어 열 너비 조절" /></div>)}
          <span />
        </div>
        {rows.map((row) => <div className="custom-table-row" style={gridStyle} key={row.id}>{columns.map((column) => <div className={`custom-table-cell cell-${column.id}`} key={column.id}>{renderCell(column, row)}</div>)}<button className="table-row-delete" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} aria-label="행 삭제">×</button></div>)}
      </div>
      <div className="custom-table-footer"><span>{rows.length}개 행</span><button onClick={addRow}>＋ 새 행 추가</button></div>
    </div>
  );
}

function BoardPreview() {
  const [filter, setFilter] = useState("전체");
  const [statuses, setStatuses] = useState(["진행 중", "검토", "완료", "진행 중"]);
  const rows = [
    ["신규 고객 온보딩 플로우", "최지우", "높음"],
    ["2분기 운영 지표 정리", "김민준", "보통"],
    ["모바일 화면 QA", "박서연", "높음"],
    ["내부 가이드 업데이트", "이지훈", "낮음"],
  ];
  const filtered = rows.map((row, index) => ({ row, index })).filter(({ index }) => filter === "전체" || statuses[index] === filter);
  const cycleStatus = (index: number) => {
    const order = ["진행 중", "검토", "완료"];
    setStatuses((current) => current.map((value, i) => i === index ? order[(order.indexOf(value) + 1) % order.length] : value));
  };
  return (
    <div className="board-preview">
      <div className="board-filters">
        {["전체", "진행 중", "검토", "완료"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
        <span>{filtered.length}개 업무</span>
      </div>
      <div className="board-table" role="table">
        <div className="board-row board-head" role="row"><span>업무명</span><span>담당자</span><span>우선순위</span><span>상태</span></div>
        {filtered.map(({ row, index }) => (
          <div className="board-row" role="row" key={row[0]}>
            <strong>{row[0]}</strong><span>{row[1]}</span><span className={`priority ${row[2]}`}>{row[2]}</span>
            <button className={`status-pill status-${statuses[index].replace(" ", "")}`} onClick={() => cycleStatus(index)}>{statuses[index]}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveFeed() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const items = [
    ["MK", "김민준", "‘운영 지표’ 업무를 완료했습니다.", "방금"],
    ["SY", "박서연", "새 댓글을 남겼습니다.", "3분 전"],
    ["JW", "최지우", "디자인 검토를 요청했습니다.", "12분 전"],
  ];
  return (
    <div className="live-feed">
      <div className="live-head"><span><i /> LIVE</span><time>{now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></div>
      {items.map((item) => <div className="feed-row" key={item[1]}><span className="avatar">{item[0]}</span><p><strong>{item[1]}</strong>{item[2]}<small>{item[3]}</small></p></div>)}
    </div>
  );
}

function AssignmentPreview() {
  const [assignee, setAssignee] = useState("김민준");
  const [done, setDone] = useState([false, true, false]);
  const tasks = ["주간 성과 보고서 검토", "고객 피드백 분류", "운영 회의 아젠다 준비"];
  return (
    <div className="assign-preview">
      <div className="assign-head"><span className="avatar avatar-accent">{assignee.slice(0, 1)}</span><label>담당자<select value={assignee} onChange={(event) => setAssignee(event.target.value)}><option>김민준</option><option>박서연</option><option>최지우</option><option>이지훈</option></select></label><span className="due-chip">오늘 마감</span></div>
      <div className="task-list">
        {tasks.map((task, index) => <label key={task} className={done[index] ? "done" : ""}><input type="checkbox" checked={done[index]} onChange={() => setDone((current) => current.map((value, i) => i === index ? !value : value))} /><i />{task}</label>)}
      </div>
    </div>
  );
}

function PollPreview({ settings }: { settings: Record<string, string> }) {
  const options = [settings.option1, settings.option2, settings.option3].map((option, index) => option?.trim() || `선택지 ${index + 1}`);
  const [selected, setSelected] = useState<number | null>(null);
  const [votes, setVotes] = useState([18, 11, 7]);
  const [submitted, setSubmitted] = useState(false);
  const total = votes.reduce((sum, vote) => sum + vote, 0);

  const submitVote = () => {
    if (selected === null || submitted) return;
    setVotes((current) => current.map((vote, index) => index === selected ? vote + 1 : vote));
    setSubmitted(true);
  };

  return (
    <div className="poll-widget">
      <div className="poll-question"><span>Q</span><strong>{settings.question || "투표 질문을 입력하세요."}</strong></div>
      <div className={`poll-options ${submitted ? "show-results" : ""}`}>
        {options.map((option, index) => {
          const percentage = Math.round((votes[index] / total) * 100);
          return (
            <button key={`${index}-${option}`} className={selected === index ? "selected" : ""} onClick={() => !submitted && setSelected(index)} aria-pressed={selected === index}>
              <i style={{ "--vote-width": `${percentage}%` } as CSSProperties} />
              <span className="poll-radio" />
              <b>{option}</b>
              <em>{submitted ? `${percentage}%` : `${votes[index]}명`}</em>
            </button>
          );
        })}
      </div>
      <div className="poll-footer">
        <span>총 {total}명 참여 · 익명 투표</span>
        {submitted
          ? <button className="poll-reset" onClick={() => { setSubmitted(false); setSelected(null); }}>다시 선택</button>
          : <button className="poll-submit" disabled={selected === null} onClick={submitVote}>투표하기</button>}
      </div>
    </div>
  );
}

type KanbanStatus = "backlog" | "progress" | "review" | "done";
type KanbanCard = { id: string; title: string; status: KanbanStatus; assignee: string; priority: "높음" | "보통" | "낮음"; tag: string };

function KanbanPreview() {
  const columns: Array<{ id: KanbanStatus; label: string }> = [
    { id: "backlog", label: "대기" },
    { id: "progress", label: "진행 중" },
    { id: "review", label: "검토" },
    { id: "done", label: "완료" },
  ];
  const [cards, setCards] = useState<KanbanCard[]>([
    { id: "kb-1", title: "신규 고객 온보딩 정리", status: "backlog", assignee: "JW", priority: "높음", tag: "기획" },
    { id: "kb-2", title: "월간 운영 지표 대시보드", status: "progress", assignee: "MK", priority: "보통", tag: "데이터" },
    { id: "kb-3", title: "모바일 화면 사용성 점검", status: "progress", assignee: "SY", priority: "높음", tag: "디자인" },
    { id: "kb-4", title: "고객 안내 문구 검수", status: "review", assignee: "JH", priority: "낮음", tag: "콘텐츠" },
    { id: "kb-5", title: "주간 업무 보고서 배포", status: "done", assignee: "MK", priority: "보통", tag: "운영" },
  ]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const moveCard = (cardId: string, status: KanbanStatus) => {
    setCards((current) => current.map((card) => card.id === cardId ? { ...card, status } : card));
    setDraggingId(null);
  };

  const moveNext = (card: KanbanCard) => {
    const index = columns.findIndex((column) => column.id === card.status);
    moveCard(card.id, columns[(index + 1) % columns.length].id);
  };

  const addCard = (status: KanbanStatus) => {
    const number = cards.length + 1;
    setCards((current) => [...current, { id: newId("kanban"), title: `새 업무 ${number}`, status, assignee: "ME", priority: "보통", tag: "신규" }]);
  };

  return (
    <div className="kanban-board" aria-label="업무 칸반 보드">
      {columns.map((column) => {
        const columnCards = cards.filter((card) => card.status === column.id);
        return (
          <section className={`kanban-column column-${column.id}`} key={column.id} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); const cardId = event.dataTransfer.getData("kanban/card"); if (cardId) moveCard(cardId, column.id); }}>
            <header><span><i />{column.label}<b>{columnCards.length}</b></span><button onClick={() => addCard(column.id)} aria-label={`${column.label} 열에 업무 추가`}>＋</button></header>
            <div className="kanban-card-list">
              {columnCards.map((card) => <article key={card.id} className={`kanban-card ${draggingId === card.id ? "dragging" : ""}`} draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("kanban/card", card.id); event.dataTransfer.effectAllowed = "move"; setDraggingId(card.id); }} onDragEnd={() => setDraggingId(null)}>
                <div className="kanban-card-top"><span>{card.tag}</span><button onClick={() => moveNext(card)} aria-label={`${card.title} 다음 단계로 이동`} title="다음 단계로">→</button></div>
                <strong>{card.title}</strong>
                <footer><span className={`kanban-priority priority-${card.priority}`}>{card.priority}</span><span className="kanban-assignee">{card.assignee}</span></footer>
              </article>)}
              {columnCards.length === 0 && <div className="kanban-empty">카드를 이곳에 놓으세요</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

type GanttTask = { id: string; name: string; assignee: string; start: number; duration: number; progress: number; tone: number };
type GanttInteraction = { id: string; mode: "move" | "resize"; startX: number; start: number; duration: number; dayWidth: number };

function GanttPreview() {
  const [range, setRange] = useState<"week" | "month">("month");
  const [tasks, setTasks] = useState<GanttTask[]>([
    { id: "gantt-1", name: "요구사항 및 범위 확정", assignee: "JW", start: 1, duration: 5, progress: 100, tone: 0 },
    { id: "gantt-2", name: "화면 설계와 디자인", assignee: "SY", start: 4, duration: 8, progress: 75, tone: 1 },
    { id: "gantt-3", name: "핵심 기능 개발", assignee: "MK", start: 10, duration: 12, progress: 50, tone: 2 },
    { id: "gantt-4", name: "검수 및 배포", assignee: "JH", start: 21, duration: 7, progress: 25, tone: 3 },
  ]);
  const interaction = useRef<GanttInteraction | null>(null);
  const totalDays = range === "week" ? 14 : 30;
  const days = Array.from({ length: totalDays }, (_, index) => index + 1);

  const clampTasksToRange = (nextTotal: number) => {
    setTasks((current) => current.map((task) => {
      const duration = Math.min(task.duration, nextTotal);
      return { ...task, duration, start: Math.min(task.start, nextTotal - duration) };
    }));
  };

  const changeRange = (nextRange: "week" | "month") => {
    const nextTotal = nextRange === "week" ? 14 : 30;
    setRange(nextRange);
    clampTasksToRange(nextTotal);
  };

  const adjustTask = (id: string, patch: Partial<GanttTask>) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  };

  const startInteraction = (event: ReactPointerEvent<HTMLElement>, task: GanttTask, mode: "move" | "resize") => {
    event.preventDefault();
    event.stopPropagation();
    const track = event.currentTarget.closest(".gantt-row-track");
    if (!track) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    interaction.current = { id: task.id, mode, startX: event.clientX, start: task.start, duration: task.duration, dayWidth: track.getBoundingClientRect().width / totalDays };
  };

  const trackInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const active = interaction.current;
    if (!active || active.dayWidth <= 0) return;
    event.preventDefault();
    event.stopPropagation();
    const delta = Math.round((event.clientX - active.startX) / active.dayWidth);
    setTasks((current) => current.map((task) => {
      if (task.id !== active.id) return task;
      if (active.mode === "move") return { ...task, start: Math.max(0, Math.min(totalDays - active.duration, active.start + delta)) };
      return { ...task, duration: Math.max(1, Math.min(totalDays - active.start, active.duration + delta)) };
    }));
  };

  const finishInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
    interaction.current = null;
  };

  const moveWithKeyboard = (task: GanttTask, delta: number) => {
    adjustTask(task.id, { start: Math.max(0, Math.min(totalDays - task.duration, task.start + delta)) });
  };

  const resizeWithKeyboard = (task: GanttTask, delta: number) => {
    adjustTask(task.id, { duration: Math.max(1, Math.min(totalDays - task.start, task.duration + delta)) });
  };

  const addTask = () => {
    const index = tasks.length;
    const duration = Math.min(6, totalDays);
    const start = Math.min((index * 3) % totalDays, totalDays - duration);
    setTasks((current) => [...current, { id: newId("gantt"), name: `새 업무 ${index + 1}`, assignee: "ME", start, duration, progress: 0, tone: index % 4 }]);
  };

  return (
    <div className="gantt-board" aria-label="인터랙티브 업무 간트차트" onPointerDown={(event) => event.stopPropagation()}>
      <div className="gantt-toolbar">
        <div className="gantt-summary"><strong>{tasks.length}개 업무</strong><span>8월 프로젝트 일정</span></div>
        <div className="gantt-actions">
          <div className="gantt-range" aria-label="간트차트 표시 기간">
            <button className={range === "week" ? "active" : ""} onClick={() => changeRange("week")}>주간</button>
            <button className={range === "month" ? "active" : ""} onClick={() => changeRange("month")}>월간</button>
          </div>
          <button className="gantt-add" onClick={addTask}>＋ 업무 추가</button>
        </div>
      </div>
      <div className="gantt-scroll">
        <div className={`gantt-matrix range-${range}`}>
          <div className="gantt-header">
            <span>업무 · 담당자</span>
            <div className="gantt-days" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(18px, 1fr))` }}>
              {days.map((day) => <b key={day} className={(day - 1) % 7 > 4 ? "weekend" : ""}>{day}</b>)}
            </div>
          </div>
          {tasks.map((task) => (
            <div className="gantt-row" key={task.id}>
              <div className="gantt-task-meta">
                <span className={`gantt-avatar tone-${task.tone}`}>{task.assignee}</span>
                <div><strong>{task.name}</strong><button onClick={() => adjustTask(task.id, { progress: (task.progress + 25) % 125 })} title="클릭하여 진행률 변경">{task.progress}% 완료</button></div>
              </div>
              <div className="gantt-row-track" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(18px, 1fr))` }}>
                {days.map((day) => <i key={day} className={`gantt-grid-day ${(day - 1) % 7 > 4 ? "weekend" : ""}`} style={{ gridColumn: day }} />)}
                <div
                  className={`gantt-bar tone-${task.tone}`}
                  style={{ gridColumn: `${task.start + 1} / span ${task.duration}` }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${task.name}, ${task.start + 1}일부터 ${task.duration}일간. 좌우 방향키로 이동`}
                  onPointerDown={(event) => startInteraction(event, task, "move")}
                  onPointerMove={trackInteraction}
                  onPointerUp={finishInteraction}
                  onPointerCancel={finishInteraction}
                  onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); moveWithKeyboard(task, event.key === "ArrowLeft" ? -1 : 1); } }}
                >
                  <span style={{ width: `${task.progress}%` }} />
                  <b>{task.progress}%</b>
                  <button
                    className="gantt-resizer"
                    aria-label={`${task.name} 기간 조절. 좌우 방향키 사용`}
                    title="좌우로 끌어 기간 조절"
                    onPointerDown={(event) => startInteraction(event, task, "resize")}
                    onPointerMove={trackInteraction}
                    onPointerUp={finishInteraction}
                    onPointerCancel={finishInteraction}
                    onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); event.stopPropagation(); resizeWithKeyboard(task, event.key === "ArrowLeft" ? -1 : 1); } }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="gantt-legend"><span><i /> 완료 구간</span><span>막대 이동 · 끝점으로 기간 조절</span></div>
    </div>
  );
}

function WidgetContent({ widget }: { widget: Widget }) {
  const value = widget.settings.value ?? "";
  const caption = widget.settings.caption ?? "";
  switch (widget.type) {
    case "hero":
      return <div className="hero-widget"><span className="eyebrow">{widget.settings.eyebrow}</span><h2>{widget.title}</h2><p>{widget.settings.subtitle}</p><button>업무 시작하기 <span>→</span></button></div>;
    case "text":
      return <div className="text-widget"><p>{widget.settings.body}</p><p>레이아웃의 목적과 사용 방법을 간결하게 설명하는 영역입니다. 설정에서 내용을 자유롭게 바꿀 수 있습니다.</p></div>;
    case "button":
      return <div className="button-widget"><button>{widget.settings.label || "새 업무 만들기"}<span>＋</span></button><small>클릭 가능한 주요 액션</small></div>;
    case "form":
      return <div className="form-widget"><label>업무 제목<input placeholder="업무명을 입력하세요" /></label><label>카테고리<select defaultValue="운영"><option>운영</option><option>기획</option><option>디자인</option></select></label><button>{widget.settings.button}</button></div>;
    case "stat":
      return <div className="stat-widget"><span className="metric-icon">↗</span><strong>{value}</strong><div><b>{widget.settings.delta}</b><span>{widget.settings.caption}</span></div><div className="micro-bars">{[34, 52, 45, 64, 58, 78, 70, 91].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></div>;
    case "status":
      return <div className="status-widget"><div className="status-orbit"><i /></div><strong>{value}</strong><p>{caption}</p><div className="service-list"><span><i />API</span><span><i />WEB</span><span><i />DB</span></div></div>;
    case "progress":
      return <div className="progress-widget"><div className="progress-ring" style={{ "--progress": `${value}%` } as CSSProperties}><strong>{value}%</strong></div><div><b>목표까지 순항 중</b><p>{caption}</p><span className="positive">+8% 이번 주</span></div></div>;
    case "profile":
      return <div className="profile-widget"><span className="avatar avatar-large">{value.slice(0, 1) || "김"}</span><strong>{value}</strong><p>{caption}</p><div className="profile-meta"><span>진행 업무 <b>12</b></span><span>완료율 <b>91%</b></span></div></div>;
    case "trend":
    case "bar":
      return <MiniChart variant={widget.type} />;
    case "line":
    case "area":
      return <LineAreaChart variant={widget.type} />;
    case "stackedBar":
      return <StackedBarChart />;
    case "pie":
      return <PieChart />;
    case "scatter":
      return <ScatterChart />;
    case "radar":
      return <RadarChart />;
    case "heatmap":
      return <HeatmapChart />;
    case "funnel":
      return <FunnelChart />;
    case "donut":
      return <div className="donut-widget"><div className="donut" style={{ "--donut": `${value}%` } as CSSProperties}><div><strong>{value}%</strong><span>완료</span></div></div><div className="donut-legend"><span><i />완료 <b>{value}%</b></span><span><i />진행 <b>18%</b></span><span><i />대기 <b>8%</b></span></div></div>;
    case "gauge":
      return <div className="gauge-widget"><div className="gauge" style={{ "--gauge": `${value}%` } as CSSProperties}><div><strong>{value}</strong><span>/ 100</span></div></div><p>{caption}</p><span className="positive">목표 이상 · 안정적</span></div>;
    case "board":
      return <BoardPreview />;
    case "editor":
      return <div className="editor-widget"><div className="editor-toolbar"><button><b>B</b></button><button><i>I</i></button><button>H1</button><button>≡</button><button>☷</button><span /><button>링크</button><button>댓글</button></div><div className="editor-paper" contentEditable suppressContentEditableWarning><h3>업무 문서 제목</h3><p>이 영역을 클릭하고 바로 내용을 작성하세요. 팀이 함께 확인할 업무 배경과 목표를 정리할 수 있습니다.</p><ul><li>핵심 목표를 명확히 정의합니다.</li><li>담당자와 일정을 공유합니다.</li></ul></div></div>;
    case "live":
      return <LiveFeed />;
    case "assign":
      return <AssignmentPreview />;
    case "poll":
      return <PollPreview settings={widget.settings} />;
    case "customTable":
      return <CustomTablePreview key={`${widget.id}-${widget.settings.comboOptions}-${widget.settings.comboDefault}-${widget.settings.radioOptions}-${widget.settings.radioDefault}`} settings={widget.settings} />;
    case "kanban":
      return <KanbanPreview />;
    case "gantt":
      return <GanttPreview />;
    default:
      return null;
  }
}

function SettingsPanel({ widget, onChange, onClose, onDelete, onDuplicate }: { widget: Widget; onChange: (patch: Partial<Widget>, settings?: Record<string, string>) => void; onClose: () => void; onDelete: () => void; onDuplicate: () => void }) {
  const hasValue = ["stat", "progress", "profile", "donut", "gauge", "status"].includes(widget.type);
  const hasCaption = !["hero", "text", "button", "form"].includes(widget.type);
  const customComboOptions = (widget.settings.comboOptions || "대기,진행,검토,완료").split(",").map((value) => value.trim()).filter(Boolean);
  const customRadioOptions = (widget.settings.radioOptions || "일반,높음").split(",").map((value) => value.trim()).filter(Boolean);
  return (
    <div className="settings-panel" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
      <div className="settings-head"><div><span>ELEMENT SETTINGS</span><strong>{LABELS[widget.type]}</strong></div><button onClick={onClose} aria-label="설정 닫기">×</button></div>
      <label>제목<input value={widget.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
      {widget.type === "hero" && <><label>라벨<input value={widget.settings.eyebrow ?? ""} onChange={(event) => onChange({}, { eyebrow: event.target.value })} /></label><label>설명<textarea value={widget.settings.subtitle ?? ""} onChange={(event) => onChange({}, { subtitle: event.target.value })} /></label></>}
      {widget.type === "text" && <label>본문<textarea value={widget.settings.body ?? ""} onChange={(event) => onChange({}, { body: event.target.value })} /></label>}
      {widget.type === "button" && <label>버튼 문구<input value={widget.settings.label ?? ""} onChange={(event) => onChange({}, { label: event.target.value })} /></label>}
      {widget.type === "poll" && <><label>투표 질문<textarea value={widget.settings.question ?? ""} onChange={(event) => onChange({}, { question: event.target.value })} /></label><label>선택지 1<input value={widget.settings.option1 ?? ""} onChange={(event) => onChange({}, { option1: event.target.value })} /></label><label>선택지 2<input value={widget.settings.option2 ?? ""} onChange={(event) => onChange({}, { option2: event.target.value })} /></label><label>선택지 3<input value={widget.settings.option3 ?? ""} onChange={(event) => onChange({}, { option3: event.target.value })} /></label></>}
      {widget.type === "customTable" && <><label>콤보박스 값 · 쉼표로 구분<input value={widget.settings.comboOptions ?? "대기,진행,검토,완료"} onChange={(event) => onChange({}, { comboOptions: event.target.value })} /></label><label>콤보박스 초기값<select value={customComboOptions.includes(widget.settings.comboDefault) ? widget.settings.comboDefault : customComboOptions[0] ?? ""} onChange={(event) => onChange({}, { comboDefault: event.target.value })}>{customComboOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>라디오 버튼 값 · 쉼표로 구분<input value={widget.settings.radioOptions ?? "일반,높음"} onChange={(event) => onChange({}, { radioOptions: event.target.value })} /></label><label>라디오 버튼 초기값<select value={customRadioOptions.includes(widget.settings.radioDefault) ? widget.settings.radioDefault : customRadioOptions[0] ?? ""} onChange={(event) => onChange({}, { radioDefault: event.target.value })}>{customRadioOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>새 행 텍스트 초기값<input value={widget.settings.textDefault ?? "새 업무"} onChange={(event) => onChange({}, { textDefault: event.target.value })} /></label></>}
      {hasValue && <label>표시 값<input value={widget.settings.value ?? ""} onChange={(event) => onChange({}, { value: event.target.value })} /></label>}
      {hasCaption && <label>보조 설명<input value={widget.settings.caption ?? ""} onChange={(event) => onChange({}, { caption: event.target.value })} /></label>}
      <label>가로 크기<div className="width-buttons">{(["third", "half", "full"] as WidgetWidth[]).map((width) => <button key={width} className={widget.width === width ? "active" : ""} onClick={() => onChange({ width })}>{WIDTH_LABELS[width]}</button>)}</div></label>
      <label>세로 크기
        <div className="height-buttons">
          <button type="button" className={!widget.height || widget.height === "auto" ? "active" : ""} onClick={() => onChange({ height: "auto" })}>자동</button>
          {[180, 260, 360, 480].map((height) => <button type="button" key={height} className={widget.height === height ? "active" : ""} onClick={() => onChange({ height })}>{height === 180 ? "S" : height === 260 ? "M" : height === 360 ? "L" : "XL"}</button>)}
        </div>
        <div className="height-range">
          <input type="range" min="160" max="600" step="10" disabled={!widget.height || widget.height === "auto"} value={typeof widget.height === "number" ? widget.height : 260} onChange={(event) => onChange({ height: Number(event.target.value) })} aria-label="요소 세로 크기 세부 조절" />
          <output>{typeof widget.height === "number" ? `${widget.height}px` : "콘텐츠 기준"}</output>
        </div>
      </label>
      <div className="settings-actions"><button onClick={onDuplicate}>복제</button><button className="danger" onClick={onDelete}>삭제</button></div>
    </div>
  );
}

export default function Home() {
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [activePageId, setActivePageId] = useState(INITIAL_PAGES[0].id);
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [fontSize, setFontSize] = useState(13);
  const [workspaceName, setWorkspaceName] = useState("업무 포털 v1");
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [iconPickerPageId, setIconPickerPageId] = useState<string | null>(null);
  const [iconQuery, setIconQuery] = useState("");
  const [iconCategory, setIconCategory] = useState("전체");
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState("");
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const hydrated = useRef(false);
  const pointerDrag = useRef<{ id: string; pointerId: number } | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const loadPopoverRef = useRef<HTMLDivElement | null>(null);

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const iconPickerPage = pages.find((page) => page.id === iconPickerPageId);
  const theme = THEMES.find((item) => item.id === themeId) ?? THEMES[0];
  const filteredPageIcons = useMemo(() => {
    const query = iconQuery.trim().toLocaleLowerCase("ko-KR");
    return PAGE_ICONS.filter((icon) =>
      (iconCategory === "전체" || icon.category === iconCategory) &&
      (!query || `${icon.label} ${icon.category} ${icon.glyph}`.toLocaleLowerCase("ko-KR").includes(query)),
    );
  }, [iconCategory, iconQuery]);
  const pageTree = useMemo(() => {
    const result: Array<{ page: Page; depth: number }> = [];
    const visited = new Set<string>();
    const ids = new Set(pages.map((page) => page.id));
    const visit = (page: Page, depth: number) => {
      if (visited.has(page.id)) return;
      visited.add(page.id);
      result.push({ page, depth });
      pages.filter((candidate) => candidate.parentId === page.id).forEach((child) => visit(child, depth + 1));
    };
    pages.filter((page) => !page.parentId || !ids.has(page.parentId)).forEach((page) => visit(page, 0));
    pages.filter((page) => !visited.has(page.id)).forEach((page) => visit(page, 0));
    return result;
  }, [pages]);
  const activePagePath = useMemo(() => {
    const path: Page[] = [];
    const visited = new Set<string>();
    let current = pages.find((page) => page.id === activePageId);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      current = current.parentId ? pages.find((page) => page.id === current?.parentId) : undefined;
    }
    return path;
  }, [pages, activePageId]);

  const themeStyle = {
    "--bg": theme.bg,
    "--sidebar": theme.sidebar,
    "--panel": theme.panel,
    "--surface": theme.surface,
    "--elevated": theme.elevated,
    "--line": theme.line,
    "--text": theme.text,
    "--muted": theme.muted,
    "--accent": theme.accent,
    "--accent-2": theme.accent2,
    "--positive": theme.positive,
    "--font-step": `${fontSize - 12}px`,
    colorScheme: theme.mode,
  } as CSSProperties;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("layoutlab:saves");
      if (raw) setSavedLayouts(Object.values(JSON.parse(raw)) as SavedLayout[]);
      const draft = localStorage.getItem("layoutlab:draft");
      if (draft) {
        const parsed = JSON.parse(draft) as SavedLayout;
        if (parsed.pages?.length) {
          setPages(parsed.pages);
          setActivePageId(parsed.pages[0].id);
          setThemeId(parsed.themeId);
          setFontSize(Math.max(12, Math.min(14, parsed.fontSize ?? 13)));
          setWorkspaceName(parsed.name);
        }
      }
    } catch { /* 손상된 로컬 데이터는 기본 레이아웃으로 대체합니다. */ }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem("layoutlab:draft", JSON.stringify({ name: workspaceName, updatedAt: Date.now(), pages, themeId, fontSize }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pages, themeId, workspaceName, fontSize]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!loadOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!loadPopoverRef.current?.contains(event.target as Node)) setLoadOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [loadOpen]);

  useEffect(() => {
    if (!iconPickerPageId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIconPickerPageId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [iconPickerPageId]);

  const updateActivePage = (updater: (page: Page) => Page) => {
    setPages((current) => current.map((page) => page.id === activePageId ? updater(page) : page));
  };

  const openIconPicker = (pageId: string) => {
    setIconPickerPageId(pageId);
    setIconQuery("");
    setIconCategory("전체");
    setThemeOpen(false);
    setLoadOpen(false);
  };

  const updatePageAppearance = (pageId: string, patch: Pick<Page, "icon"> | Pick<Page, "iconTone">) => {
    setPages((current) => current.map((page) => page.id === pageId ? { ...page, ...patch } : page));
  };

  const addWidget = (type: WidgetType) => {
    const widget = makeWidget(type);
    updateActivePage((page) => ({ ...page, widgets: [...page.widgets, widget] }));
    setSelectedWidgetId(widget.id);
    setToast(`${LABELS[type]}을(를) 추가했습니다.`);
  };

  const moveWidget = (draggedId: string, targetId: string, position: "before" | "after" = "before") => {
    if (draggedId === targetId) return;
    updateActivePage((page) => {
      const from = page.widgets.findIndex((widget) => widget.id === draggedId);
      if (from < 0) return page;
      const widgets = [...page.widgets];
      const [moved] = widgets.splice(from, 1);
      if (targetId === "__end__") {
        widgets.push(moved);
        return { ...page, widgets };
      }
      const to = widgets.findIndex((widget) => widget.id === targetId);
      if (to < 0) return page;
      widgets.splice(to + (position === "after" ? 1 : 0), 0, moved);
      return { ...page, widgets };
    });
  };

  const updateDropTarget = (next: DropTarget | null) => {
    dropTargetRef.current = next;
    setDropTarget((current) => current?.targetId === next?.targetId && current?.position === next?.position ? current : next);
  };

  const startPointerReorder = (event: React.PointerEvent<HTMLButtonElement>, widgetId: string) => {
    if (preview || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    pointerDrag.current = { id: widgetId, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingWidgetId(widgetId);
    setSelectedWidgetId(null);
    updateDropTarget(null);
  };

  const trackPointerReorder = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = pointerDrag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    const underPointer = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const targetCard = underPointer?.closest<HTMLElement>("[data-widget-id]");
    if (targetCard) {
      const targetId = targetCard.dataset.widgetId;
      if (!targetId || targetId === active.id) {
        updateDropTarget(null);
        return;
      }
      const rect = targetCard.getBoundingClientRect();
      const sameVisualRow = event.clientY > rect.top + rect.height * .2 && event.clientY < rect.bottom - rect.height * .2;
      const position = sameVisualRow
        ? (event.clientX < rect.left + rect.width / 2 ? "before" : "after")
        : (event.clientY < rect.top + rect.height / 2 ? "before" : "after");
      updateDropTarget({ targetId, position });
      return;
    }
    if (underPointer?.closest(".canvas-grid")) updateDropTarget({ targetId: "__end__", position: "after" });
    else updateDropTarget(null);
  };

  const finishPointerReorder = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = pointerDrag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const destination = dropTargetRef.current;
    if (destination) {
      moveWidget(active.id, destination.targetId, destination.position);
      setToast("요소 위치를 변경했습니다.");
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointerDrag.current = null;
    setDraggingWidgetId(null);
    updateDropTarget(null);
  };

  const cancelPointerReorder = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointerDrag.current = null;
    setDraggingWidgetId(null);
    updateDropTarget(null);
  };

  const updateWidget = (id: string, patch: Partial<Widget>, settings?: Record<string, string>) => {
    updateActivePage((page) => ({ ...page, widgets: page.widgets.map((widget) => widget.id === id ? { ...widget, ...patch, settings: { ...widget.settings, ...settings } } : widget) }));
  };

  const deleteWidget = (id: string, title: string) => {
    updateActivePage((page) => ({ ...page, widgets: page.widgets.filter((widget) => widget.id !== id) }));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
    setToast(`‘${title}’ 요소를 삭제했습니다.`);
  };

  const saveLayout = () => {
    const name = workspaceName.trim();
    if (!name) { setToast("저장할 레이아웃 이름을 입력해 주세요."); return; }
    const record: SavedLayout = { name, updatedAt: Date.now(), pages, themeId, fontSize };
    const next = [record, ...savedLayouts.filter((item) => item.name !== name)];
    setSavedLayouts(next);
    localStorage.setItem("layoutlab:saves", JSON.stringify(Object.fromEntries(next.map((item) => [item.name, item]))));
    setToast(`‘${name}’ 레이아웃을 로컬에 저장했습니다.`);
  };

  const loadLayout = (layout: SavedLayout) => {
    setPages(layout.pages);
    setActivePageId(layout.pages[0].id);
    setThemeId(layout.themeId);
    setFontSize(Math.max(12, Math.min(14, layout.fontSize ?? 13)));
    setWorkspaceName(layout.name);
    setSelectedWidgetId(null);
    setLoadOpen(false);
    setToast(`‘${layout.name}’ 레이아웃을 불러왔습니다.`);
  };

  const deleteLayout = (name: string) => {
    const next = savedLayouts.filter((item) => item.name !== name);
    setSavedLayouts(next);
    localStorage.setItem("layoutlab:saves", JSON.stringify(Object.fromEntries(next.map((item) => [item.name, item]))));
  };

  const changeFontSize = (delta: number) => {
    setFontSize((current) => Math.max(12, Math.min(14, current + delta)));
  };

  const addPage = (parentId: string | null = null) => {
    const id = newId("page");
    const parent = parentId ? pages.find((page) => page.id === parentId) : undefined;
    const siblingCount = pages.filter((page) => (page.parentId ?? null) === parentId).length;
    setPages((current) => [...current, { id, name: parent ? `${parent.name} 하위 ${siblingCount + 1}` : `새 페이지 ${siblingCount + 1}`, icon: parent ? "→" : "□", iconTone: parent?.iconTone ?? "accent", parentId, widgets: [] }]);
    setActivePageId(id);
    setSelectedWidgetId(null);
    setToast(parent ? `‘${parent.name}’ 아래에 하위 페이지를 추가했습니다.` : "최상위 페이지를 추가했습니다.");
  };

  const deletePage = (pageId: string) => {
    const removing = new Set([pageId]);
    let foundChild = true;
    while (foundChild) {
      foundChild = false;
      pages.forEach((page) => {
        if (page.parentId && removing.has(page.parentId) && !removing.has(page.id)) {
          removing.add(page.id);
          foundChild = true;
        }
      });
    }
    const remaining = pages.filter((page) => !removing.has(page.id));
    if (remaining.length === 0) {
      setToast("마지막 페이지는 삭제할 수 없습니다.");
      return;
    }
    const target = pages.find((page) => page.id === pageId);
    setPages(remaining);
    if (removing.has(activePageId)) setActivePageId(remaining[0].id);
    setSelectedWidgetId(null);
    setToast(`‘${target?.name ?? "페이지"}’${removing.size > 1 ? `와 하위 페이지 ${removing.size - 1}개를` : "를"} 삭제했습니다.`);
  };

  return (
    <main className={`layout-app ${preview ? "preview-mode" : ""} ${draggingWidgetId ? "reordering" : ""}`} style={themeStyle} data-mode={theme.mode}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><i /><i /><i /></span><strong>Layout Lab</strong><em>WORKSPACE BUILDER</em></div>
        <div className="topbar-context"><span className="breadcrumb">시스템 설계 <b>/</b> 레이아웃 편집</span><label className="workspace-name"><span>프로젝트 이름</span><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></label></div>
        <div className="top-actions">
          <span className="local-state"><i /> LOCAL</span>
          <div className="font-size-control" role="group" aria-label="전체 글꼴 크기 조절"><button type="button" disabled={fontSize <= 12} onClick={() => changeFontSize(-1)} aria-label="전체 글꼴 한 단계 작게" title="글꼴 1px 작게">A−</button><output aria-live="polite">{fontSize}px</output><button type="button" disabled={fontSize >= 14} onClick={() => changeFontSize(1)} aria-label="전체 글꼴 한 단계 크게" title="글꼴 1px 크게">A＋</button></div>
          <button className={`preview-button ${preview ? "active" : ""}`} onClick={() => { setPreview((value) => !value); setThemeOpen(false); setLoadOpen(false); }}>{preview ? "편집으로" : "미리보기"}</button>
          <div className="popover-wrap" ref={loadPopoverRef}>
            <button className="secondary-button" onClick={() => { setLoadOpen((value) => !value); setThemeOpen(false); }}>불러오기 <span>⌄</span></button>
            {loadOpen && <div className="load-popover popover-panel"><div className="popover-title"><span>SAVED LOCALLY</span><strong>저장된 레이아웃</strong></div>{savedLayouts.length === 0 ? <div className="empty-saves">아직 저장된 레이아웃이 없습니다.</div> : savedLayouts.map((layout) => <div className="save-row" key={layout.name}><button onClick={() => loadLayout(layout)}><span className="save-icon">L</span><span><strong>{layout.name}</strong><small>{new Date(layout.updatedAt).toLocaleString("ko-KR")}</small></span></button><button className="save-delete" onClick={() => deleteLayout(layout.name)} aria-label={`${layout.name} 삭제`}>×</button></div>)}</div>}
          </div>
          <button className="save-button" onClick={saveLayout}>저장 <span>⌘S</span></button>
          <div className="popover-wrap">
            <button className="theme-button" onClick={() => { setThemeOpen((value) => !value); setLoadOpen(false); }} aria-label="테마 선택"><i style={{ background: theme.accent }} /><i style={{ background: theme.accent2 }} /><span>{THEMES.length}</span></button>
            {themeOpen && <div className="theme-popover popover-panel"><div className="popover-title"><span>THEME PRESETS</span><strong>통일감 있는 {THEMES.length}가지 테마</strong><p>레이어 대비와 가독성을 기준으로 구성했습니다.</p></div><div className="theme-grid">{THEMES.map((item) => <button key={item.id} className={themeId === item.id ? "active" : ""} onClick={() => setThemeId(item.id)}><span className="theme-preview" style={{ background: item.bg }}><i style={{ background: item.sidebar }} /><b style={{ background: item.accent }} /><em style={{ background: item.accent2 }} /></span><span className="theme-name">{item.name}{item.isNew && <em>NEW</em>}</span></button>)}</div></div>}
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="page-sidebar">
          <div className="user-block"><span className="avatar avatar-accent">YL</span><div><strong>워크스페이스</strong><span>관리자 모드</span></div><button>•••</button></div>
          <nav>
            <span className="nav-label">PAGES</span>
            <span className="nav-helper">각 페이지의 ＋로 하위 페이지 추가</span>
            {pageTree.map(({ page, depth }) => <div key={page.id} className={`page-nav-row ${depth > 0 ? "is-child" : ""}`} style={{ "--page-depth": Math.min(depth, 4) } as CSSProperties}><button className={`page-link ${activePageId === page.id ? "active" : ""}`} onClick={() => { setActivePageId(page.id); setSelectedWidgetId(null); }}><PageIcon glyph={page.icon} tone={page.iconTone} /><b>{page.name}</b><i>{page.widgets.length}</i></button><div className="page-row-actions"><button className="page-icon-edit" onClick={() => openIconPicker(page.id)} aria-label={`${page.name} 아이콘 변경`} title="페이지 아이콘 변경">✦</button><button className="page-child-add" onClick={() => addPage(page.id)} aria-label={`${page.name}에 하위 페이지 추가`} title="하위 페이지 추가">＋</button><button className="page-delete" onClick={() => deletePage(page.id)} aria-label={`${page.name} 삭제`} title="페이지 삭제">×</button></div></div>)}
            <button className="add-page" onClick={() => addPage(null)}><span>＋</span><b>최상위 페이지 추가</b></button>
          </nav>
          <div className="sidebar-bottom"><span><i /> 자동 임시 저장</span><small>이 기기의 브라우저에 보관</small></div>
        </aside>

        {!preview && <aside className="toolbox">
          <div className="toolbox-head"><div><span>ELEMENTS</span><h2>도구 상자</h2></div><span className="drag-hint">끌어서 배치</span></div>
          <div className="toolbox-scroll">
            {TOOLBOX.map((group) => <section key={group.category}><h3>{group.category}<span>{group.items.length}</span></h3><div className="tool-grid">{group.items.map((item) => <button key={item.type} draggable onDragStart={(event) => { event.dataTransfer.setData("widget/type", item.type); event.dataTransfer.effectAllowed = "copy"; }} onClick={() => addWidget(item.type)} title={`${item.label}: 드래그하거나 클릭하여 추가`}><span className="tool-icon">{item.icon}</span><span><strong>{item.label}</strong><small>{item.description}</small></span><i>⠿</i></button>)}</div></section>)}
          </div>
        </aside>}

        <section className="workspace-canvas" onClick={() => setSelectedWidgetId(null)}>
          <div className="canvas-head">
            <div><span className="canvas-kicker">{preview ? "LIVE PREVIEW" : "PAGE CANVAS"}</span><div className="page-title-row"><button type="button" className="page-icon-trigger" disabled={preview} onClick={(event) => { event.stopPropagation(); openIconPicker(activePage.id); }} aria-label={`${activePage.name} 아이콘 선택`} title={preview ? undefined : "페이지 아이콘 선택"}><PageIcon glyph={activePage.icon} tone={activePage.iconTone} /></button><input value={activePage.name} onChange={(event) => updateActivePage((page) => ({ ...page, name: event.target.value }))} aria-label="현재 페이지 이름" />{activePagePath.length > 1 && <span className="page-parent-path">↳ {activePagePath.slice(0, -1).map((page) => page.name).join(" / ")}</span>}<span>{activePage.widgets.length} elements</span></div></div>
            <div className="canvas-meta"><span><i className="dot-online" /> 변경사항 자동 저장</span><span>1440px</span><button aria-label="더 보기">•••</button></div>
          </div>

          <div className="canvas-scroll">
            <div className="canvas-grid" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={(event) => { event.preventDefault(); const type = event.dataTransfer.getData("widget/type") as WidgetType; if (type) addWidget(type); }}>
              {activePage.widgets.length === 0 && <div className="empty-canvas"><span>＋</span><h3>첫 요소를 배치해 보세요</h3><p>왼쪽 도구 상자에서 요소를 끌어오거나 클릭하면 이곳에 추가됩니다.</p></div>}
              {activePage.widgets.map((widget) => (
                <article
                  className={`canvas-widget width-${widget.width} ${typeof widget.height === "number" ? "height-fixed" : "height-auto"} ${selectedWidgetId === widget.id ? "selected" : ""} ${draggingWidgetId === widget.id ? "is-dragging" : ""} ${dropTarget?.targetId === widget.id ? `drop-${dropTarget.position}` : ""}`}
                  key={widget.id}
                  data-widget-id={widget.id}
                  style={typeof widget.height === "number" ? { "--widget-height": `${widget.height}px` } as CSSProperties : undefined}
                  onDragOver={(event) => { if (!preview) { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "copy"; } }}
                  onDrop={(event) => { if (preview) return; event.preventDefault(); event.stopPropagation(); const type = event.dataTransfer.getData("widget/type") as WidgetType; if (type) addWidget(type); }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="widget-head"><div>{!preview && <button type="button" className="widget-grip" title="누른 채 이동" aria-label={`${widget.title} 위치 이동`} onPointerDown={(event) => startPointerReorder(event, widget.id)} onPointerMove={trackPointerReorder} onPointerUp={finishPointerReorder} onPointerCancel={cancelPointerReorder}>⠿</button>}<div><h3>{widget.title}</h3>{widget.settings.caption && !["stat", "status", "progress", "profile", "donut", "gauge"].includes(widget.type) && <p>{widget.settings.caption}</p>}</div></div>{!preview && <div className="widget-actions"><button className={`settings-trigger ${selectedWidgetId === widget.id ? "active" : ""}`} onClick={() => setSelectedWidgetId((current) => current === widget.id ? null : widget.id)} aria-label={`${widget.title} 설정`} title="요소 설정">⚙</button><button className="delete-trigger" onClick={() => deleteWidget(widget.id, widget.title)} aria-label={`${widget.title} 삭제`} title="요소 삭제">×</button></div>}</div>
                  <div className="widget-content"><WidgetContent widget={widget} /></div>
                  {!preview && <div className="widget-drag-label">DRAG TO REORDER</div>}
                  {selectedWidgetId === widget.id && !preview && <SettingsPanel widget={widget} onClose={() => setSelectedWidgetId(null)} onChange={(patch, settings) => updateWidget(widget.id, patch, settings)} onDelete={() => deleteWidget(widget.id, widget.title)} onDuplicate={() => { const copy = { ...widget, id: newId("widget"), title: `${widget.title} 복사본` }; updateActivePage((page) => ({ ...page, widgets: [...page.widgets, copy] })); setSelectedWidgetId(copy.id); }} />}
                </article>
              ))}
              {!preview && activePage.widgets.length > 0 && <div className={`drop-more ${dropTarget?.targetId === "__end__" ? "active" : ""}`}><span>＋</span> {draggingWidgetId ? "이곳에 놓아 마지막으로 이동" : "여기에 요소 놓기"}</div>}
            </div>
          </div>
        </section>
      </div>
      {iconPickerPage && <div className="icon-picker-backdrop" onPointerDown={() => setIconPickerPageId(null)}>
        <section className="icon-picker" role="dialog" aria-modal="true" aria-labelledby="icon-picker-title" onPointerDown={(event) => event.stopPropagation()}>
          <header className="icon-picker-head">
            <div className="icon-picker-current"><PageIcon glyph={iconPickerPage.icon} tone={iconPickerPage.iconTone} /><div><span>PAGE ICON LIBRARY</span><h2 id="icon-picker-title">{iconPickerPage.name} 아이콘</h2><p>120개 아이콘과 테마 연동 색상</p></div></div>
            <button type="button" onClick={() => setIconPickerPageId(null)} aria-label="아이콘 선택 닫기">×</button>
          </header>
          <div className="icon-picker-controls">
            <label className="icon-search"><span>⌕</span><input autoFocus value={iconQuery} onChange={(event) => setIconQuery(event.target.value)} placeholder="아이콘 이름 검색" aria-label="페이지 아이콘 검색" /><b>{filteredPageIcons.length}</b></label>
            <div className="icon-tone-control"><span>테마 색상</span><div>{PAGE_ICON_TONES.map((tone) => <button type="button" key={tone.id} className={`tone-${tone.id} ${(iconPickerPage.iconTone ?? "accent") === tone.id ? "active" : ""}`} onClick={() => updatePageAppearance(iconPickerPage.id, { iconTone: tone.id })}><i />{tone.label}</button>)}</div></div>
          </div>
          <div className="icon-categories" aria-label="아이콘 분류">{["전체", ...PAGE_ICON_GROUPS.map((group) => group.category)].map((category) => <button type="button" key={category} className={iconCategory === category ? "active" : ""} onClick={() => setIconCategory(category)}>{category}</button>)}</div>
          <div className="page-icon-grid">
            {filteredPageIcons.map((icon) => <button type="button" key={icon.id} className={iconPickerPage.icon === icon.glyph ? "active" : ""} onClick={() => updatePageAppearance(iconPickerPage.id, { icon: icon.glyph })} aria-label={`${icon.label} 아이콘 선택`} title={`${icon.category} · ${icon.label}`}><PageIcon glyph={icon.glyph} tone={iconPickerPage.iconTone} /><small>{icon.label}</small></button>)}
            {filteredPageIcons.length === 0 && <div className="icon-empty">검색 조건에 맞는 아이콘이 없습니다.</div>}
          </div>
          <footer className="icon-picker-footer"><span><i /> 선택 내용은 자동 저장됩니다.</span><button type="button" onClick={() => setIconPickerPageId(null)}>선택 완료</button></footer>
        </section>
      </div>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
