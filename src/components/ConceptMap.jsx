// 과목 전체 개념 지도: 개념이 처음 나온 강의 순서대로 배치하고, 강의에서 설명한 관계를 선으로 잇는다.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Map as MapIcon } from 'lucide-react';
import { glossary } from '../data/index.js';
import { lectureLabel } from '../lib/format.js';

// 관계 종류별 선 모양 (parent → child 방향으로 화살표)
export const REL_STYLE = {
  prerequisite: { color: '#2f6fed', label: '먼저 배우는 개념 → 이어지는 개념' },
  extends: { color: '#7048e8', label: '상위 개념 → 세부 개념' },
  example: { color: '#0c8599', label: '개념 → 대표적인 예' },
  contrast: { color: '#d9480f', label: '서로 비교하는 개념', dashed: true },
};

const NODE_H = 40;
const ROW_H = 54;
const HEAD_H = 34;
const PAD = 16;

function shortName(c, termMode) {
  const g = glossary[c.term];
  if (!g) return c.term;
  return termMode === 'en' ? g.en : g.ko;
}

// 관계를 위→아래(부모→자식) 방향으로 바꿔 줌. 비교(contrast)는 방향 없음
function directed(from, to, relation) {
  if (relation === 'contrast') return null;
  if (relation === 'example') return { parent: to, child: from };
  return { parent: from, child: to };
}

// 글자 폭을 실제로 재서 노드 안에 맞춤: 한 줄에 안 들어가면 두 줄(작은 글씨)로
let measureCtx = null;
function textWidth(text, size) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  measureCtx.font = `650 ${size}px ${family}`;
  return measureCtx.measureText(text).width;
}
function clip(text, size, maxW) {
  if (textWidth(text, size) <= maxW) return text;
  let t = text;
  while (t.length > 1 && textWidth(`${t}…`, size) > maxW) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}
function fitLabel(name, maxW) {
  if (textWidth(name, 12.5) <= maxW) return { lines: [name], size: 12.5 };
  const words = name.split(' ');
  if (words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i += 1) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const w = Math.max(textWidth(a, 11), textWidth(b, 11));
      if (!best || w < best.w) best = { a, b, w };
    }
    return { lines: [clip(best.a, 11, maxW), clip(best.b, 11, maxW)], size: 11 };
  }
  return { lines: [clip(name, 11.5, maxW)], size: 11.5 };
}

function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export default function ConceptMap({ list, lectures, selectedId, termMode, onSelect }) {
  const wrapRef = useRef(null);
  const width = Math.max(useWidth(wrapRef), 720);
  const [hoverId, setHoverId] = useState(null);
  const [open, setOpen] = useState(true);

  const layout = useMemo(() => {
    const order = new Map(lectures.map((l, i) => [l.id, i]));
    const ids = new Set(list.map((c) => c.id));

    // 개념이 처음 나온 강의
    const lecOf = {};
    list.forEach((c) => {
      const idx = c.occurrences.map((o) => order.get(o.lectureId)).filter((i) => i != null);
      lecOf[c.id] = idx.length ? Math.min(...idx) : null;
    });
    const nodes = list.filter((c) => lecOf[c.id] != null);

    const edges = [];
    nodes.forEach((c) =>
      c.related.forEach((r) => {
        if (!ids.has(r.conceptId) || lecOf[r.conceptId] == null) return;
        const d = directed(c.id, r.conceptId, r.relation);
        edges.push({
          key: `${c.id}-${r.relation}-${r.conceptId}`,
          from: d ? d.parent : c.id,
          to: d ? d.child : r.conceptId,
          relation: r.relation,
          directed: !!d,
        });
      }),
    );

    // 같은 강의 안에서는 부모 개념을 왼쪽, 세부 개념을 오른쪽 열에 둠
    const depth = Object.fromEntries(nodes.map((c) => [c.id, 0]));
    for (let k = 0; k < 4; k += 1) {
      edges.forEach((e) => {
        if (e.directed && lecOf[e.from] === lecOf[e.to]) depth[e.to] = Math.min(2, Math.max(depth[e.to], depth[e.from] + 1));
      });
    }

    // 열 구성: (강의, 깊이)
    const lecIdx = [...new Set(nodes.map((c) => lecOf[c.id]))].sort((a, b) => a - b);
    const cols = [];
    lecIdx.forEach((li) => {
      const maxD = Math.max(...nodes.filter((c) => lecOf[c.id] === li).map((c) => depth[c.id]));
      for (let d = 0; d <= maxD; d += 1) cols.push({ li, d, items: nodes.filter((c) => lecOf[c.id] === li && depth[c.id] === d).map((c) => c.id) });
    });

    // 선이 덜 꼬이도록 이웃 개념의 평균 위치로 정렬 (barycenter)
    const nb = {};
    edges.forEach((e) => {
      (nb[e.from] = nb[e.from] || []).push(e.to);
      (nb[e.to] = nb[e.to] || []).push(e.from);
    });
    const pos = {};
    const setPos = () => cols.forEach((col) => col.items.forEach((id, i) => { pos[id] = (i + 0.5) / col.items.length; }));
    setPos();
    for (let pass = 0; pass < 6; pass += 1) {
      const seq = pass % 2 ? [...cols].reverse() : cols;
      seq.forEach((col) => {
        const score = (id) => {
          const ns = (nb[id] || []).filter((n) => !col.items.includes(n));
          return ns.length ? ns.reduce((s, n) => s + pos[n], 0) / ns.length : pos[id];
        };
        col.items.sort((a, b) => score(a) - score(b));
        col.items.forEach((id, i) => { pos[id] = (i + 0.5) / col.items.length; });
      });
    }

    // 좌표
    const rows = Math.max(...cols.map((c) => c.items.length), 1);
    const height = HEAD_H + rows * ROW_H + PAD;
    const colW = (width - PAD * 2) / Math.max(cols.length, 1);
    const nodeW = Math.min(150, colW - 26);
    const xy = {};
    cols.forEach((col, ci) => {
      const cx = PAD + colW * (ci + 0.5);
      const top = HEAD_H + ((rows - col.items.length) * ROW_H) / 2 + (ROW_H - NODE_H) / 2;
      col.items.forEach((id, i) => { xy[id] = { x: cx, y: top + i * ROW_H + NODE_H / 2, ci }; });
    });

    // 강의 구역 (배경 띠 + 제목)
    const bands = lecIdx.map((li) => {
      const cis = cols.map((c, i) => (c.li === li ? i : -1)).filter((i) => i >= 0);
      return { lecture: lectures[li], x: PAD + colW * cis[0], w: colW * cis.length };
    });

    const byId = Object.fromEntries(nodes.map((c) => [c.id, c]));
    const lecturesOf = (c) => [...new Set(c.occurrences.map((o) => order.get(o.lectureId)).filter((i) => i != null))].sort((a, b) => a - b);

    return { nodes, edges, xy, bands, height, nodeW, byId, lecturesOf };
  }, [list, lectures, width]);

  const { nodes, edges, xy, bands, height, nodeW, byId, lecturesOf } = layout;
  // 마우스를 올린 개념은 주변만 남기고 흐리게, 선택한 개념은 연결선만 진하게
  const focus = hoverId || selectedId;
  const near = new Set(hoverId ? [hoverId, ...edges.filter((e) => e.from === hoverId || e.to === hoverId).flatMap((e) => [e.from, e.to])] : []);

  const pathFor = (e) => {
    const a = xy[e.from];
    const b = xy[e.to];
    const hw = nodeW / 2;
    if (a.ci === b.ci) {
      // 같은 열: 오른쪽으로 휘어 돌아가는 곡선
      const x = a.x + hw;
      const bend = 30 + Math.abs(b.y - a.y) * 0.12;
      return `M ${x} ${a.y} C ${x + bend} ${a.y}, ${x + bend} ${b.y}, ${x + 3} ${b.y}`;
    }
    const dir = b.x > a.x ? 1 : -1;
    const x1 = a.x + hw * dir;
    const x2 = b.x - (hw + 3) * dir;
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${x2} ${b.y}`;
  };

  return (
    <section className="concept-map panel" ref={wrapRef}>
      <div className="concept-map-head">
        <strong>
          <MapIcon size={15} /> 과목 개념 지도
        </strong>
        <span className="muted small">
          개념 {nodes.length}개 · 관계 {edges.length}개 · 개념은 처음 나온 강의에 놓이고, 선은 강의에서 실제로 설명한 관계입니다.
        </span>
        <span className="grow" />
        <button type="button" className="btn small" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {open ? '접기' : '펼치기'}
        </button>
      </div>

      {open && (
        <>
          <div className="concept-map-legend">
            {Object.entries(REL_STYLE).map(([k, v]) => (
              <span key={k} className="legend-item">
                <svg width="26" height="10" aria-hidden="true">
                  <line x1="1" y1="5" x2="25" y2="5" stroke={v.color} strokeWidth="2" strokeDasharray={v.dashed ? '4 3' : undefined} />
                </svg>
                {v.label}
              </span>
            ))}
            <span className="legend-item">
              <span className="legend-repeat" /> 두 강의 이상 등장(반복 개념)
            </span>
          </div>

          <div className="concept-map-scroll">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="과목 개념 지도">
              <defs>
                {Object.entries(REL_STYLE).map(([k, v]) => (
                  <marker key={k} id={`cm-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={v.color} />
                  </marker>
                ))}
              </defs>

              {bands.map((b, i) => (
                <g key={b.lecture.id}>
                  <rect x={b.x + 3} y={2} width={b.w - 6} height={height - 4} rx="10" fill={i % 2 ? '#f6f8fc' : '#fbfcfe'} stroke="#e8edf5" />
                  <text x={b.x + 14} y={22} fontSize="11.5" fontWeight="700" fill="#2f6fed">
                    {lectureLabel(b.lecture)}
                  </text>
                  <text x={b.x + 84} y={22} fontSize="11.5" fill="#6b7486">
                    {b.lecture.title.length > Math.floor(b.w / 13) ? `${b.lecture.title.slice(0, Math.floor(b.w / 13) - 1)}…` : b.lecture.title}
                  </text>
                </g>
              ))}

              {edges.map((e) => {
                const st = REL_STYLE[e.relation] || REL_STYLE.prerequisite;
                const on = !focus || e.from === focus || e.to === focus;
                const faded = hoverId ? 0.12 : 0.4;
                return (
                  <path
                    key={e.key}
                    d={pathFor(e)}
                    fill="none"
                    stroke={st.color}
                    strokeWidth={on && focus ? 2.4 : 1.6}
                    strokeDasharray={st.dashed ? '5 4' : undefined}
                    markerEnd={e.directed ? `url(#cm-arrow-${e.relation})` : undefined}
                    opacity={on ? 0.95 : faded}
                  >
                    <title>{`${shortName(byId[e.from], termMode)} → ${shortName(byId[e.to], termMode)} · ${st.label}`}</title>
                  </path>
                );
              })}

              {nodes.map((c) => {
                const p = xy[c.id];
                const sel = c.id === selectedId;
                const dim = hoverId && !near.has(c.id);
                const ls = lecturesOf(c);
                const repeated = ls.length >= 2;
                const name = shortName(c, termMode);
                const label = fitLabel(name, nodeW - 14);
                const twoLines = label.lines.length > 1;
                return (
                  <g
                    key={c.id}
                    className="cm-node"
                    role="button"
                    tabIndex={0}
                    aria-label={`${name}, ${ls.map((i) => lectureLabel(lectures[i])).join(', ')}`}
                    aria-pressed={sel}
                    opacity={dim ? 0.35 : 1}
                    onMouseEnter={() => setHoverId(c.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onFocus={() => setHoverId(c.id)}
                    onBlur={() => setHoverId(null)}
                    onClick={() => onSelect(c.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        onSelect(c.id);
                      }
                    }}
                  >
                    <rect
                      x={p.x - nodeW / 2}
                      y={p.y - NODE_H / 2}
                      width={nodeW}
                      height={NODE_H}
                      rx="9"
                      fill={sel ? '#2f6fed' : '#ffffff'}
                      stroke={sel ? '#2f6fed' : repeated ? '#7aa2f7' : '#cfd8e6'}
                      strokeWidth={repeated && !sel ? 2 : 1.2}
                    />
                    {label.lines.map((line, i) => (
                      <text
                        key={i}
                        x={p.x}
                        y={twoLines ? p.y - 3 + i * 13 : p.y - 2}
                        textAnchor="middle"
                        fontSize={label.size}
                        fontWeight="650"
                        fill={sel ? '#fff' : '#1c2433'}
                      >
                        {line}
                      </text>
                    ))}
                    {!twoLines && (
                      <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize="9.5" fill={sel ? '#dbe7ff' : '#7b8496'} className="mono">
                        {ls.map((i) => `L${String(lectures[i].number).padStart(2, '0')}`).join(' · ')}
                      </text>
                    )}
                    <title>{`${name} (${ls.map((i) => lectureLabel(lectures[i])).join(', ')}) — 클릭하면 아래에 자세한 내용이 나옵니다`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </>
      )}
    </section>
  );
}
