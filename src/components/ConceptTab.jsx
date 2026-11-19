
import React, { useEffect, useMemo, useState } from 'react';
import { BookMarked, Link2, Network, Repeat, Search } from 'lucide-react';
import {
  concepts,
  conceptName,
  glossary,
  references,
  resolveAnchor,
  getCourse,
  ROLE
} from '../data/index.js';
import { fmtDate, lectureLabel } from '../lib/format.js';
import { useStore } from '../store.jsx';
import { EmptyState, JumpButton, TermText } from './common.jsx';
import ConceptMap from './ConceptMap.jsx';

const OUT = {
  prerequisite: '이 개념을 바탕으로 배우는 개념',
  extends: '세부·확장 개념',
  contrast: '비교 대상',
  example: '이 개념이 속한 상위 개념'
};

const IN = {
  prerequisite: '먼저 알아야 하는 개념',
  extends: '상위 개념',
  contrast: '비교 대상',
  example: '대표적인 예'
};

function lectureSet(c) {
  return [...new Set(c.occurrences.map((o) => o.lectureId))];
}

// 개념 관계 그래프
function ConceptGraph({ current, incoming, outgoing, termMode, onSelect }) {
  const relations = [
    ...incoming.map((r) => ({
      id: `in-${r.from.id}-${r.relation}`,
      concept: r.from,
      relation: r.relation,
      label: IN[r.relation] || r.relation,
      direction: 'incoming'
    })),
    ...outgoing.map((r) => ({
      id: `out-${r.to.id}-${r.relation}`,
      concept: r.to,
      relation: r.relation,
      label: OUT[r.relation] || r.relation,
      direction: 'outgoing'
    }))
  ];

  if (relations.length === 0) return null;

  // 데이터 저장 방향이 아닌 실제 개념 관계를 기준으로 배치
  function getPosition(r) {
    if (r.relation === 'contrast') {
      return 'side';
    }

    if (r.relation === 'extends') {
      return r.direction === 'incoming' ? 'top' : 'bottom';
    }

    if (r.relation === 'example') {
      return r.direction === 'incoming' ? 'bottom' : 'top';
    }

    if (r.relation === 'prerequisite') {
      return r.direction === 'incoming' ? 'top' : 'bottom';
    }

    return 'side';
  }

  const top = relations.filter((r) => getPosition(r) === 'top');
  const bottom = relations.filter((r) => getPosition(r) === 'bottom');
  const side = relations.filter((r) => getPosition(r) === 'side');

  const nodeWidth = 150;
  const nodeHeight = 52;
  const gap = 16;
  const padding = 24;
  const sideGap = 46;

  // 상위·하위 노드가 여러 개일 때 필요한 너비
  const verticalCount = Math.max(top.length, bottom.length, 1);
  const verticalWidth =
    verticalCount * nodeWidth +
    (verticalCount - 1) * gap;

  // 비교 대상이 여러 개라면 오른쪽으로 나란히 배치
  const sideWidth =
    side.length * nodeWidth +
    Math.max(side.length - 1, 0) * gap;

  const hasSide = side.length > 0;

  const width = Math.max(
    380,
    verticalWidth + padding * 2,
    hasSide
      ? nodeWidth + sideGap + sideWidth + padding * 2
      : 0
  );

  // 비교 대상이 있을 경우 현재 개념을 왼쪽으로 이동
  const centerX = hasSide
    ? padding + nodeWidth / 2 +
      Math.max(0, (verticalWidth - nodeWidth) / 2)
    : width / 2;

  const topY = 16;
  const centerY = top.length > 0 ? 160 : 40;
  const bottomY = centerY + 120;

  const height = bottom.length > 0
    ? bottomY + nodeHeight + 25
    : centerY + nodeHeight + 25;

  // 상위·하위 노드는 현재 개념을 중심으로 정렬
  function arrangeVertical(items, y) {
    const total =
      items.length * nodeWidth +
      (items.length - 1) * gap;

    const start = centerX - total / 2;

    return items.map((item, i) => ({
      ...item,
      x: start + i * (nodeWidth + gap),
      y
    }));
  }

  const topNodes = arrangeVertical(top, topY);
  const bottomNodes = arrangeVertical(bottom, bottomY);

  // 비교 대상은 현재 개념 오른쪽, 같은 높이에 배치
  const sideStartX = centerX + nodeWidth / 2 + sideGap;

  const sideNodes = side.map((item, i) => ({
    ...item,
    x: sideStartX + i * (nodeWidth + gap),
    y: centerY
  }));

  const currentName = conceptName(current, termMode === 'en' ? 'en' : 'ko');

  function renderNode(node) {
    const name = conceptName(node.concept, termMode === 'en' ? 'en' : 'ko');

    return (
      <g
        key={node.id}
        role="button"
        tabIndex={0}
        aria-label={`${name}, ${node.label}`}
        onClick={() => onSelect(node.concept.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(node.concept.id);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <rect
          x={node.x}
          y={node.y}
          width={nodeWidth}
          height={nodeHeight}
          rx="9"
          fill="#f1f5f9"
          stroke="#cbd5e1"
        />

        <text
          x={node.x + nodeWidth / 2}
          y={node.y + 17}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
        >
          {node.label.length > 20
            ? `${node.label.slice(0, 19)}…`
            : node.label}
        </text>

        <text
          x={node.x + nodeWidth / 2}
          y={node.y + 36}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#1e293b"
        >
          {name.length > 15
            ? `${name.slice(0, 14)}…`
            : name}
        </text>

        <title>{`${name} · ${node.label}`}</title>
      </g>
    );
  }

  return (
    <div className="concept-graph-wrap">
      <div className="concept-graph-title">
        <Network size={14} />
        <strong>개념 관계도</strong>
        <span>{relations.length}개 관계</span>
      </div>

      <div className="concept-graph-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{ maxWidth: '100%', height: 'auto' }}
          role="group"
          aria-label={`${currentName}의 개념 관계 그래프`}
        >
          {/* 상위 개념 → 선택한 개념 */}
          {topNodes.map((node) => {
            const x = node.x + nodeWidth / 2;
            const startY = node.y + nodeHeight;

            return (
              <path
                key={`line-${node.id}`}
                d={`M ${x} ${startY}
                    C ${x} ${startY + 30},
                      ${centerX} ${centerY - 30},
                      ${centerX} ${centerY}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.8"
              />
            );
          })}

          {/* 선택한 개념 → 하위 개념 */}
          {bottomNodes.map((node) => {
            const x = node.x + nodeWidth / 2;

            return (
              <path
                key={`line-${node.id}`}
                d={`M ${centerX} ${centerY + nodeHeight}
                    C ${centerX} ${centerY + nodeHeight + 30},
                      ${x} ${node.y - 30},
                      ${x} ${node.y}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.8"
              />
            );
          })}

          {/* 선택한 개념 ↔ 비교 대상: 가로 점선 */}
          {sideNodes.map((node) => (
            <path
              key={`line-${node.id}`}
              d={`M ${centerX + nodeWidth / 2}
                    ${centerY + nodeHeight / 2}
                  L ${node.x}
                    ${node.y + nodeHeight / 2}`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.8"
              strokeDasharray="5 4"
            />
          ))}

          {/* 상위 개념 */}
          {topNodes.map(renderNode)}

          {/* 현재 선택한 개념 */}
          <g>
            <rect
              x={centerX - nodeWidth / 2}
              y={centerY}
              width={nodeWidth}
              height={nodeHeight}
              rx="9"
              fill="#2563eb"
            />

            <text
              x={centerX}
              y={centerY + 17}
              textAnchor="middle"
              fontSize="10"
              fill="#dbeafe"
            >
              선택한 개념
            </text>

            <text
              x={centerX}
              y={centerY + 36}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#ffffff"
            >
              {currentName.length > 15
                ? `${currentName.slice(0, 14)}…`
                : currentName}
            </text>

            <title>{currentName}</title>
          </g>

          {/* 하위 개념 */}
          {bottomNodes.map(renderNode)}

          {/* 비교 대상 */}
          {sideNodes.map(renderNode)}
        </svg>
      </div>

      <p
        className="muted small"
        style={{ margin: '8px 0 0' }}
      >
        상위·선행 개념은 위쪽, 세부·확장 개념과 대표적인
        예시는 아래쪽에 표시합니다. 비교 대상은 오른쪽에
        점선으로 연결합니다. 연결된 개념을 클릭하면 해당
        개념으로 이동하고, 각 관계의 강의 근거는 오른쪽
        "관련 개념 근거"에서 볼 수 있습니다.
      </p>
    </div>
  );
}

export default function ConceptTab({ courseId }) {
  const {
    termMode,
    selectedConceptId,
    patch,
    courseLectures
  } = useStore();

  const [q, setQ] = useState('');
  const [onlyRepeated, setOnlyRepeated] = useState(false);

  const list = useMemo(
    () => concepts.filter((c) => c.courseId === courseId),
    [courseId]
  );

  const lecs = courseLectures(courseId);

  const shown = list
    .filter((c) => !onlyRepeated || lectureSet(c).length >= 2)
    .filter((c) => {
      if (!q.trim()) return true;

      const g = glossary[c.term];

      return `${g?.ko} ${g?.en}`
        .toLowerCase()
        .includes(q.toLowerCase());
    })
    .sort(
      (a, b) =>
        lectureSet(b).length - lectureSet(a).length
    );

  const selected =
    list.find((c) => c.id === selectedConceptId) || shown[0];

  useEffect(() => {
    if (selected && selected.id !== selectedConceptId) {
      patch({ selectedConceptId: selected.id });
    }
  }, [selected, selectedConceptId, patch]);

  if (!list.length) {
    return (
      <EmptyState
        icon={Network}
        title="색인된 개념이 없습니다"
      >
        {getCourse(courseId)?.title}에는 색인이 끝난
        슬라이드·스크립트가 없습니다.
      </EmptyState>
    );
  }

  const indexed = lecs.filter(
    (l) => l.status === 'ready'
  );

  const excluded = lecs.filter(
    (l) => l.status !== 'ready'
  );

  return (
    <div className="concept-page">
      <ConceptMap
        list={list}
        lectures={indexed}
        selectedId={selected?.id}
        termMode={termMode}
        onSelect={(id) => {
          setQ('');
          setOnlyRepeated(false);
          patch({ selectedConceptId: id });
        }}
      />

    <div className="concepts">
      <aside className="concept-list panel">
        <div className="panel-head">
          <strong>개념 목록</strong>
          <span className="muted small">
            {shown.length}개
          </span>
        </div>

        <div className="script-tools">
          <Search size={14} />
          <input
            placeholder="개념 찾기"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <label className="check small pad-x">
          <input
            type="checkbox"
            checked={onlyRepeated}
            onChange={(e) =>
              setOnlyRepeated(e.target.checked)
            }
          />
          반복 개념만 (두 강의 이상)
        </label>

        <div className="concept-items">
          {shown.map((c) => {
            const ls = lectureSet(c);

            return (
              <button
                key={c.id}
                type="button"
                className={`concept-item ${
                  selected?.id === c.id ? 'on' : ''
                }`}
                onClick={() =>
                  patch({ selectedConceptId: c.id })
                }
              >
                <span className="concept-name">
                  {conceptName(c, termMode)}
                </span>

                <span className="concept-meta">
                  {ls.length >= 2 && (
                    <span className="chip chip-info">
                      <Repeat size={11} />
                      반복
                    </span>
                  )}

                  <span className="muted small mono">
                    {ls
                      .map((id) => id.split('-')[1])
                      .map((n) => `L${n}`)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {selected && (
        <ConceptDetail
          c={selected}
          indexed={indexed}
          excluded={excluded}
        />
      )}
    </div>
    </div>
  );
}

function ConceptDetail({ c, indexed, excluded }) {
  const {
    termMode,
    patch,
    getLectureAny
  } = useStore();

  const g = glossary[c.term];

  const byLecture = useMemo(() => {
    const groups = {};

    c.occurrences.forEach((o) => {
      const a = resolveAnchor(o);

      if (!a) return;

      (groups[o.lectureId] =
        groups[o.lectureId] || []).push({
        ...o,
        ...a
      });
    });

    return Object.entries(groups)
      .map(([lid, items]) => ({
        lecture: getLectureAny(lid),
        items: items.sort(
          (x, y) => x.time - y.time
        )
      }))
      .sort(
        (a, b) =>
          a.lecture.number - b.lecture.number
      );
  }, [c, getLectureAny]);

  const first = byLecture[0]?.items[0];

  const incoming = concepts.flatMap((o) =>
    o.related
      .filter((r) => r.conceptId === c.id)
      .map((r) => ({
        ...r,
        from: o
      }))
  );

  const outgoing = c.related
    .map((r) => ({
      ...r,
      to: concepts.find(
        (x) => x.id === r.conceptId
      )
    }))
    .filter((r) => r.to);

  const repeated = byLecture.length >= 2;

  return (
    <section className="concept-detail">
      <header className="concept-head">
        <div>
          <h2>
            {termMode === 'en' ? g.en : g.ko}
          </h2>

          <span className="muted">
            {termMode === 'en' ? g.ko : g.en}
          </span>
        </div>

        {repeated && (
          <span className="chip chip-info">
            <Repeat size={12} />
            반복 개념 · {byLecture.length}개 강의
          </span>
        )}
      </header>

      {first && (
        <p className="chain-summary">
          <strong>
            {lectureLabel(first.lecture)}
          </strong>
          에서 처음 소개

          {byLecture.length > 1 && (
            <>
              {' → '}
              {byLecture
                .slice(1)
                .map((g2) =>
                  lectureLabel(g2.lecture)
                )
                .join(', ')}
              에서 다시 등장
            </>
          )}

          <span className="muted small">
            {' '}· 검색 범위:{' '}
            {indexed
              .map((l) => lectureLabel(l))
              .join(', ')}
          </span>

          {excluded.length > 0 && (
            <span className="muted small">
              {' '}(제외:{' '}
              {excluded
                .map(
                  (l) =>
                    `${lectureLabel(l)} – 색인 미완료`
                )
                .join(', ')}
              )
            </span>
          )}
        </p>
      )}

      {(outgoing.length > 0 || incoming.length > 0) && (
        <div className="concept-graph-wide">
          <h3 className="sub-h">
            <Network size={15} />
            관련 개념
          </h3>

          <ConceptGraph
            current={c}
            incoming={incoming}
            outgoing={outgoing}
            termMode={termMode}
            onSelect={(id) =>
              patch({
                selectedConceptId: id
              })
            }
          />
        </div>
      )}

      <div className="concept-cols">
        <div className="chain">
          <h3 className="sub-h">
            <Link2 size={15} />
            Concept Chain
          </h3>

          {byLecture.map(
            ({ lecture, items }, gi) => (
              <div
                key={lecture.id}
                className="chain-group"
              >
                <div className="chain-lecture">
                  <span className="chain-dot" />

                  <strong>
                    {lectureLabel(lecture)} ·{' '}
                    {lecture.title}
                  </strong>

                  <span className="muted small">
                    {fmtDate(lecture.date)}
                  </span>
                </div>

                {items.map((o, i) => (
                  <div
                    key={`${o.segmentId}-${i}`}
                    className="chain-item"
                  >
                    <span
                      className={`role role-${o.role}`}
                    >
                      {gi === 0 && i === 0
                        ? '처음 소개된 곳'
                        : ROLE[o.role]}
                    </span>

                    <p>
                      “<TermText text={o.text} />”
                    </p>

                    <JumpButton
                      lectureId={lecture.id}
                      time={o.time}
                      slide={o.slide}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="concept-side">
          {(outgoing.length > 0 ||
            incoming.length > 0) && (
            <div className="side-block">
              <h3 className="sub-h">
                <Network size={15} />
                관련 개념 근거
              </h3>

              {incoming.map((r) => {
                const a = resolveAnchor(r);

                return (
                  <div
                    key={`in-${r.from.id}`}
                    className="relation"
                  >
                    <span className="rel-label">
                      {IN[r.relation]}
                    </span>

                    <button
                      type="button"
                      className="rel-name"
                      onClick={() =>
                        patch({
                          selectedConceptId:
                            r.from.id
                        })
                      }
                    >
                      {conceptName(
                        r.from,
                        termMode
                      )}
                    </button>

                    {a && (
                      <div className="rel-quote">
                        “<TermText text={a.text} />”{' '}
                        <JumpButton
                          lectureId={r.lectureId}
                          time={a.time}
                          slide={a.slide}
                          showLecture
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {outgoing.map((r) => {
                const a = resolveAnchor(r);

                return (
                  <div
                    key={`out-${r.to.id}`}
                    className="relation"
                  >
                    <span className="rel-label">
                      {OUT[r.relation]}
                    </span>

                    <button
                      type="button"
                      className="rel-name"
                      onClick={() =>
                        patch({
                          selectedConceptId:
                            r.to.id
                        })
                      }
                    >
                      {conceptName(
                        r.to,
                        termMode
                      )}
                    </button>

                    {a && (
                      <div className="rel-quote">
                        “<TermText text={a.text} />”{' '}
                        <JumpButton
                          lectureId={r.lectureId}
                          time={a.time}
                          slide={a.slide}
                          showLecture
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <p className="muted small">
                관계는 강의에서 실제로 설명한
                발언이 있을 때만 표시합니다.
              </p>
            </div>
          )}

          <div className="side-block">
            <h3 className="sub-h">
              <BookMarked size={15} />
              교재·참고 자료
            </h3>

            {c.references.length === 0 ? (
              <p className="muted small">
                등록한 참고 자료에서 관련 구절
                없음 · 검색 범위: 등록·색인된 PDF
              </p>
            ) : (
              c.references.map((r, i) => {
                const ref = references.find(
                  (x) => x.id === r.refId
                );

                return (
                  <div
                    key={i}
                    className="ref-item"
                  >
                    <div className="ref-head">
                      <span className="chip chip-ref">
                        {ref?.kind}
                      </span>

                      <strong>
                        {ref?.title}
                      </strong>
                    </div>

                    <div className="muted small">
                      {r.section} · p.{r.page}
                      {ref?.edition
                        ? ` · ${ref.edition}`
                        : ''}
                    </div>

                    <p className="ref-quote">
                      “{r.quote}”
                    </p>
                  </div>
                );
              })
            )}

            <p className="muted small">
              참고 자료 구절은 강의 내용·교수자
              발언과 구분해 표시합니다.
              (시연용 예시 문장)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
