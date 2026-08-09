"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

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
  | "donut"
  | "gauge"
  | "board"
  | "editor"
  | "live"
  | "assign";

type WidgetWidth = "third" | "half" | "full";

type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  width: WidgetWidth;
  settings: Record<string, string>;
};

type Page = {
  id: string;
  name: string;
  icon: string;
  widgets: Widget[];
};

type Theme = {
  id: string;
  name: string;
  mode: "dark" | "light";
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
    { type: "donut", label: "도넛 차트", icon: "◉", description: "비중 분석" },
    { type: "gauge", label: "게이지", icon: "◔", description: "달성 현황" },
  ]},
  { category: "업무 도구", items: [
    { type: "board", label: "업무 게시판", icon: "B", description: "필터 가능한 목록" },
    { type: "editor", label: "콘텐츠 에디터", icon: "E", description: "문서 작성" },
    { type: "live", label: "실시간 피드", icon: "L", description: "자동 갱신 카드" },
    { type: "assign", label: "담당자 배정", icon: "A", description: "사람과 업무 연결" },
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
  const fullTypes: WidgetType[] = ["hero", "text", "form", "trend", "bar", "board", "editor", "live"];
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
    donut: { value: "74", caption: "완료 비율" },
    gauge: { value: "82", caption: "서비스 목표" },
    board: { caption: "팀 전체 업무" },
    editor: { caption: "공유 문서" },
    live: { caption: "팀 활동을 실시간으로 확인합니다." },
    assign: { caption: "업무 담당자와 마감일" },
  };
  return {
    id: newId("widget"),
    type,
    title: LABELS[type],
    width: fullTypes.includes(type) ? "full" : "third",
    settings: defaults[type] ?? {},
    ...overrides,
  };
}

const INITIAL_PAGES: Page[] = [
  {
    id: "dashboard",
    name: "워크 대시보드",
    icon: "⌘",
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
  { id: "projects", name: "프로젝트", icon: "◇", widgets: [makeWidget("progress", { title: "진행 중인 프로젝트", width: "half" }), makeWidget("assign", { title: "담당 업무", width: "half" }), makeWidget("board", { title: "프로젝트 보드" })] },
  { id: "board", name: "업무 게시판", icon: "▤", widgets: [makeWidget("hero", { title: "팀 업무 게시판", settings: { subtitle: "담당자, 우선순위, 진행 상태를 한 곳에서 관리합니다.", eyebrow: "TEAM BOARD" } }), makeWidget("board", { title: "전체 업무" })] },
  { id: "content", name: "문서 에디터", icon: "✎", widgets: [makeWidget("editor", { title: "새 업무 문서" })] },
  { id: "people", name: "팀과 담당자", icon: "◎", widgets: [makeWidget("profile", { title: "프로젝트 리드", width: "third" }), makeWidget("assign", { title: "업무 배정", width: "full" })] },
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
    default:
      return null;
  }
}

function SettingsPanel({ widget, onChange, onClose, onDelete, onDuplicate }: { widget: Widget; onChange: (patch: Partial<Widget>, settings?: Record<string, string>) => void; onClose: () => void; onDelete: () => void; onDuplicate: () => void }) {
  const hasValue = ["stat", "progress", "profile", "donut", "gauge", "status"].includes(widget.type);
  const hasCaption = !["hero", "text", "button", "form"].includes(widget.type);
  return (
    <div className="settings-panel" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
      <div className="settings-head"><div><span>ELEMENT SETTINGS</span><strong>{LABELS[widget.type]}</strong></div><button onClick={onClose} aria-label="설정 닫기">×</button></div>
      <label>제목<input value={widget.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
      {widget.type === "hero" && <><label>라벨<input value={widget.settings.eyebrow ?? ""} onChange={(event) => onChange({}, { eyebrow: event.target.value })} /></label><label>설명<textarea value={widget.settings.subtitle ?? ""} onChange={(event) => onChange({}, { subtitle: event.target.value })} /></label></>}
      {widget.type === "text" && <label>본문<textarea value={widget.settings.body ?? ""} onChange={(event) => onChange({}, { body: event.target.value })} /></label>}
      {widget.type === "button" && <label>버튼 문구<input value={widget.settings.label ?? ""} onChange={(event) => onChange({}, { label: event.target.value })} /></label>}
      {hasValue && <label>표시 값<input value={widget.settings.value ?? ""} onChange={(event) => onChange({}, { value: event.target.value })} /></label>}
      {hasCaption && <label>보조 설명<input value={widget.settings.caption ?? ""} onChange={(event) => onChange({}, { caption: event.target.value })} /></label>}
      <label>가로 크기<div className="width-buttons">{(["third", "half", "full"] as WidgetWidth[]).map((width) => <button key={width} className={widget.width === width ? "active" : ""} onClick={() => onChange({ width })}>{WIDTH_LABELS[width]}</button>)}</div></label>
      <div className="settings-actions"><button onClick={onDuplicate}>복제</button><button className="danger" onClick={onDelete}>삭제</button></div>
    </div>
  );
}

export default function Home() {
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [activePageId, setActivePageId] = useState(INITIAL_PAGES[0].id);
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [workspaceName, setWorkspaceName] = useState("업무 포털 v1");
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState("");
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const hydrated = useRef(false);
  const pointerDrag = useRef<{ id: string; pointerId: number } | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const theme = THEMES.find((item) => item.id === themeId) ?? THEMES[0];

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
          setWorkspaceName(parsed.name);
        }
      }
    } catch { /* 손상된 로컬 데이터는 기본 레이아웃으로 대체합니다. */ }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem("layoutlab:draft", JSON.stringify({ name: workspaceName, updatedAt: Date.now(), pages, themeId }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pages, themeId, workspaceName]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateActivePage = (updater: (page: Page) => Page) => {
    setPages((current) => current.map((page) => page.id === activePageId ? updater(page) : page));
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

  const saveLayout = () => {
    const name = workspaceName.trim();
    if (!name) { setToast("저장할 레이아웃 이름을 입력해 주세요."); return; }
    const record: SavedLayout = { name, updatedAt: Date.now(), pages, themeId };
    const next = [record, ...savedLayouts.filter((item) => item.name !== name)];
    setSavedLayouts(next);
    localStorage.setItem("layoutlab:saves", JSON.stringify(Object.fromEntries(next.map((item) => [item.name, item]))));
    setToast(`‘${name}’ 레이아웃을 로컬에 저장했습니다.`);
  };

  const loadLayout = (layout: SavedLayout) => {
    setPages(layout.pages);
    setActivePageId(layout.pages[0].id);
    setThemeId(layout.themeId);
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

  const addPage = () => {
    const id = newId("page");
    setPages((current) => [...current, { id, name: `새 페이지 ${current.length + 1}`, icon: "□", widgets: [] }]);
    setActivePageId(id);
    setSelectedWidgetId(null);
  };

  return (
    <main className={`layout-app ${preview ? "preview-mode" : ""} ${draggingWidgetId ? "reordering" : ""}`} style={themeStyle} data-mode={theme.mode}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><i /><i /><i /></span><strong>Layout Lab</strong><em>WORKSPACE BUILDER</em></div>
        <div className="topbar-context"><span className="breadcrumb">시스템 설계 <b>/</b> 레이아웃 편집</span><label className="workspace-name"><span>프로젝트 이름</span><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></label></div>
        <div className="top-actions">
          <span className="local-state"><i /> LOCAL</span>
          <button className={`preview-button ${preview ? "active" : ""}`} onClick={() => { setPreview((value) => !value); setThemeOpen(false); setLoadOpen(false); }}>{preview ? "편집으로" : "미리보기"}</button>
          <div className="popover-wrap">
            <button className="secondary-button" onClick={() => { setLoadOpen((value) => !value); setThemeOpen(false); }}>불러오기 <span>⌄</span></button>
            {loadOpen && <div className="load-popover popover-panel"><div className="popover-title"><span>SAVED LOCALLY</span><strong>저장된 레이아웃</strong></div>{savedLayouts.length === 0 ? <div className="empty-saves">아직 저장된 레이아웃이 없습니다.</div> : savedLayouts.map((layout) => <div className="save-row" key={layout.name}><button onClick={() => loadLayout(layout)}><span className="save-icon">L</span><span><strong>{layout.name}</strong><small>{new Date(layout.updatedAt).toLocaleString("ko-KR")}</small></span></button><button className="save-delete" onClick={() => deleteLayout(layout.name)} aria-label={`${layout.name} 삭제`}>×</button></div>)}</div>}
          </div>
          <button className="save-button" onClick={saveLayout}>저장 <span>⌘S</span></button>
          <div className="popover-wrap">
            <button className="theme-button" onClick={() => { setThemeOpen((value) => !value); setLoadOpen(false); }} aria-label="테마 선택"><i style={{ background: theme.accent }} /><i style={{ background: theme.accent2 }} /><span>20</span></button>
            {themeOpen && <div className="theme-popover popover-panel"><div className="popover-title"><span>THEME PRESETS</span><strong>통일감 있는 20가지 테마</strong><p>레이어 대비와 가독성을 기준으로 구성했습니다.</p></div><div className="theme-grid">{THEMES.map((item) => <button key={item.id} className={themeId === item.id ? "active" : ""} onClick={() => setThemeId(item.id)}><span className="theme-preview" style={{ background: item.bg }}><i style={{ background: item.sidebar }} /><b style={{ background: item.accent }} /><em style={{ background: item.accent2 }} /></span><span>{item.name}</span></button>)}</div></div>}
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="page-sidebar">
          <div className="user-block"><span className="avatar avatar-accent">YL</span><div><strong>워크스페이스</strong><span>관리자 모드</span></div><button>•••</button></div>
          <nav>
            <span className="nav-label">PAGES</span>
            {pages.map((page) => <button key={page.id} className={activePageId === page.id ? "active" : ""} onClick={() => { setActivePageId(page.id); setSelectedWidgetId(null); }}><span>{page.icon}</span><b>{page.name}</b><i>{page.widgets.length}</i></button>)}
            <button className="add-page" onClick={addPage}><span>＋</span><b>새 페이지 추가</b></button>
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
            <div><span className="canvas-kicker">{preview ? "LIVE PREVIEW" : "PAGE CANVAS"}</span><div className="page-title-row"><input value={activePage.name} onChange={(event) => updateActivePage((page) => ({ ...page, name: event.target.value }))} aria-label="현재 페이지 이름" /><span>{activePage.widgets.length} elements</span></div></div>
            <div className="canvas-meta"><span><i className="dot-online" /> 변경사항 자동 저장</span><span>1440px</span><button aria-label="더 보기">•••</button></div>
          </div>

          <div className="canvas-scroll">
            <div className="canvas-grid" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={(event) => { event.preventDefault(); const type = event.dataTransfer.getData("widget/type") as WidgetType; if (type) addWidget(type); }}>
              {activePage.widgets.length === 0 && <div className="empty-canvas"><span>＋</span><h3>첫 요소를 배치해 보세요</h3><p>왼쪽 도구 상자에서 요소를 끌어오거나 클릭하면 이곳에 추가됩니다.</p></div>}
              {activePage.widgets.map((widget) => (
                <article
                  className={`canvas-widget width-${widget.width} ${selectedWidgetId === widget.id ? "selected" : ""} ${draggingWidgetId === widget.id ? "is-dragging" : ""} ${dropTarget?.targetId === widget.id ? `drop-${dropTarget.position}` : ""}`}
                  key={widget.id}
                  data-widget-id={widget.id}
                  onDragOver={(event) => { if (!preview) { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "copy"; } }}
                  onDrop={(event) => { if (preview) return; event.preventDefault(); event.stopPropagation(); const type = event.dataTransfer.getData("widget/type") as WidgetType; if (type) addWidget(type); }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="widget-head"><div>{!preview && <button type="button" className="widget-grip" title="누른 채 이동" aria-label={`${widget.title} 위치 이동`} onPointerDown={(event) => startPointerReorder(event, widget.id)} onPointerMove={trackPointerReorder} onPointerUp={finishPointerReorder} onPointerCancel={cancelPointerReorder}>⠿</button>}<div><h3>{widget.title}</h3>{widget.settings.caption && !["stat", "status", "progress", "profile", "donut", "gauge"].includes(widget.type) && <p>{widget.settings.caption}</p>}</div></div>{!preview && <button className={`settings-trigger ${selectedWidgetId === widget.id ? "active" : ""}`} onClick={() => setSelectedWidgetId((current) => current === widget.id ? null : widget.id)} aria-label={`${widget.title} 설정`}>⚙</button>}</div>
                  <WidgetContent widget={widget} />
                  {!preview && <div className="widget-drag-label">DRAG TO REORDER</div>}
                  {selectedWidgetId === widget.id && !preview && <SettingsPanel widget={widget} onClose={() => setSelectedWidgetId(null)} onChange={(patch, settings) => updateWidget(widget.id, patch, settings)} onDelete={() => { updateActivePage((page) => ({ ...page, widgets: page.widgets.filter((item) => item.id !== widget.id) })); setSelectedWidgetId(null); }} onDuplicate={() => { const copy = { ...widget, id: newId("widget"), title: `${widget.title} 복사본` }; updateActivePage((page) => ({ ...page, widgets: [...page.widgets, copy] })); setSelectedWidgetId(copy.id); }} />}
                </article>
              ))}
              {!preview && activePage.widgets.length > 0 && <div className={`drop-more ${dropTarget?.targetId === "__end__" ? "active" : ""}`}><span>＋</span> {draggingWidgetId ? "이곳에 놓아 마지막으로 이동" : "여기에 요소 놓기"}</div>}
            </div>
          </div>
        </section>
      </div>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
