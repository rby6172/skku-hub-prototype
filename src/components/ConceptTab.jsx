// 개념 색인 · Concept Chain: 개념이 어느 강의·슬라이드·시점에 나왔는지 강의 순서대로 추적
import React, { useEffect, useMemo, useState } from 'react';
import { BookMarked, Link2, Network, Repeat, Search } from 'lucide-react';
import { concepts, conceptName, glossary, references, resolveAnchor, getCourse, ROLE } from '../data/index.js';
import { fmtDate, lectureLabel } from '../lib/format.js';
import { useStore } from '../store.jsx';
import { EmptyState, JumpButton, TermText } from './common.jsx';

const OUT = { prerequisite: '이 개념을 바탕으로 배우는 개념', extends: '세부·확장 개념', contrast: '비교 대상', example: '이 개념이 속한 상위 개념' };
const IN = { prerequisite: '먼저 알아야 하는 개념', extends: '상위 개념', contrast: '비교 대상', example: '대표적인 예' };

function lectureSet(c) {
  return [...new Set(c.occurrences.map((o) => o.lectureId))];
}

export default function ConceptTab({ courseId }) {
  const { termMode, selectedConceptId, patch, courseLectures } = useStore();
  const [q, setQ] = useState('');
  const [onlyRepeated, setOnlyRepeated] = useState(false);
  const list = useMemo(() => concepts.filter((c) => c.courseId === courseId), [courseId]);
  const lecs = courseLectures(courseId);

  const shown = list
    .filter((c) => !onlyRepeated || lectureSet(c).length >= 2)
    .filter((c) => {
      if (!q.trim()) return true;
      const g = glossary[c.term];
      return `${g?.ko} ${g?.en}`.toLowerCase().includes(q.toLowerCase());
    })
    .sort((a, b) => lectureSet(b).length - lectureSet(a).length);

  const selected = list.find((c) => c.id === selectedConceptId) || shown[0];

  useEffect(() => {
    if (selected && selected.id !== selectedConceptId) patch({ selectedConceptId: selected.id });
  }, [selected, selectedConceptId, patch]);

  if (!list.length) {
    return (
      <EmptyState icon={Network} title="색인된 개념이 없습니다">
        {getCourse(courseId)?.title}에는 색인이 끝난 슬라이드·스크립트가 없습니다.
      </EmptyState>
    );
  }

  const indexed = lecs.filter((l) => l.status === 'ready');
  const excluded = lecs.filter((l) => l.status !== 'ready');

  return (
    <div className="concepts">
      <aside className="concept-list panel">
        <div className="panel-head">
          <strong>개념 목록</strong>
          <span className="muted small">{shown.length}개</span>
        </div>
        <div className="script-tools">
          <Search size={14} />
          <input placeholder="개념 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="check small pad-x">
          <input type="checkbox" checked={onlyRepeated} onChange={(e) => setOnlyRepeated(e.target.checked)} />
          반복 개념만 (두 강의 이상)
        </label>
        <div className="concept-items">
          {shown.map((c) => {
            const ls = lectureSet(c);
            return (
              <button key={c.id} type="button" className={`concept-item ${selected?.id === c.id ? 'on' : ''}`} onClick={() => patch({ selectedConceptId: c.id })}>
                <span className="concept-name">{conceptName(c, termMode)}</span>
                <span className="concept-meta">
                  {ls.length >= 2 && (
                    <span className="chip chip-info">
                      <Repeat size={11} /> 반복
                    </span>
                  )}
                  <span className="muted small mono">{ls.map((id) => id.split('-')[1]).map((n) => `L${n}`).join(' · ')}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
      {selected && <ConceptDetail c={selected} indexed={indexed} excluded={excluded} />}
    </div>
  );
}

function ConceptDetail({ c, indexed, excluded }) {
  const { termMode, patch, getLectureAny } = useStore();
  const g = glossary[c.term];
  const byLecture = useMemo(() => {
    const groups = {};
    c.occurrences.forEach((o) => {
      const a = resolveAnchor(o);
      if (!a) return;
      (groups[o.lectureId] = groups[o.lectureId] || []).push({ ...o, ...a });
    });
    return Object.entries(groups)
      .map(([lid, items]) => ({ lecture: getLectureAny(lid), items: items.sort((x, y) => x.time - y.time) }))
      .sort((a, b) => a.lecture.number - b.lecture.number);
  }, [c, getLectureAny]);

  const first = byLecture[0]?.items[0];
  const incoming = concepts.flatMap((o) => o.related.filter((r) => r.conceptId === c.id).map((r) => ({ ...r, from: o })));
  const outgoing = c.related.map((r) => ({ ...r, to: concepts.find((x) => x.id === r.conceptId) })).filter((r) => r.to);
  const repeated = byLecture.length >= 2;

  return (
    <section className="concept-detail">
      <header className="concept-head">
        <div>
          <h2>{termMode === 'en' ? g.en : g.ko}</h2>
          <span className="muted">{termMode === 'en' ? g.ko : g.en}</span>
        </div>
        {repeated && (
          <span className="chip chip-info">
            <Repeat size={12} /> 반복 개념 · {byLecture.length}개 강의
          </span>
        )}
      </header>
      {first && (
        <p className="chain-summary">
          <strong>{lectureLabel(first.lecture)}</strong>에서 처음 소개
          {byLecture.length > 1 && (
            <>
              {' → '}
              {byLecture
                .slice(1)
                .map((g2) => lectureLabel(g2.lecture))
                .join(', ')}
              에서 다시 등장
            </>
          )}
          <span className="muted small"> · 검색 범위: {indexed.map((l) => lectureLabel(l)).join(', ')}</span>
          {excluded.length > 0 && <span className="muted small"> (제외: {excluded.map((l) => `${lectureLabel(l)} – 색인 미완료`).join(', ')})</span>}
        </p>
      )}

      <div className="concept-cols">
        <div className="chain">
          <h3 className="sub-h">
            <Link2 size={15} /> Concept Chain
          </h3>
          {byLecture.map(({ lecture, items }, gi) => (
            <div key={lecture.id} className="chain-group">
              <div className="chain-lecture">
                <span className="chain-dot" />
                <strong>
                  {lectureLabel(lecture)} · {lecture.title}
                </strong>
                <span className="muted small">{fmtDate(lecture.date)}</span>
              </div>
              {items.map((o, i) => (
                <div key={`${o.segmentId}-${i}`} className="chain-item">
                  <span className={`role role-${o.role}`}>{gi === 0 && i === 0 ? '처음 소개된 곳' : ROLE[o.role]}</span>
                  <p>
                    “<TermText text={o.text} />”
                  </p>
                  <JumpButton lectureId={lecture.id} time={o.time} slide={o.slide} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="concept-side">
          {(outgoing.length > 0 || incoming.length > 0) && (
            <div className="side-block">
              <h3 className="sub-h">
                <Network size={15} /> 관련 개념
              </h3>
              {incoming.map((r) => {
                const a = resolveAnchor(r);
                return (
                  <div key={`in-${r.from.id}`} className="relation">
                    <span className="rel-label">{IN[r.relation]}</span>
                    <button type="button" className="rel-name" onClick={() => patch({ selectedConceptId: r.from.id })}>
                      {conceptName(r.from, termMode)}
                    </button>
                    {a && (
                      <div className="rel-quote">
                        “<TermText text={a.text} />” <JumpButton lectureId={r.lectureId} time={a.time} slide={a.slide} showLecture />
                      </div>
                    )}
                  </div>
                );
              })}
              {outgoing.map((r) => {
                const a = resolveAnchor(r);
                return (
                  <div key={`out-${r.to.id}`} className="relation">
                    <span className="rel-label">{OUT[r.relation]}</span>
                    <button type="button" className="rel-name" onClick={() => patch({ selectedConceptId: r.to.id })}>
                      {conceptName(r.to, termMode)}
                    </button>
                    {a && (
                      <div className="rel-quote">
                        “<TermText text={a.text} />” <JumpButton lectureId={r.lectureId} time={a.time} slide={a.slide} showLecture />
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="muted small">관계는 강의에서 실제로 설명한 발언이 있을 때만 표시합니다.</p>
            </div>
          )}

          <div className="side-block">
            <h3 className="sub-h">
              <BookMarked size={15} /> 교재·참고 자료
            </h3>
            {c.references.length === 0 ? (
              <p className="muted small">등록한 참고 자료에서 관련 구절 없음 · 검색 범위: 등록·색인된 PDF</p>
            ) : (
              c.references.map((r, i) => {
                const ref = references.find((x) => x.id === r.refId);
                return (
                  <div key={i} className="ref-item">
                    <div className="ref-head">
                      <span className="chip chip-ref">{ref?.kind}</span>
                      <strong>{ref?.title}</strong>
                    </div>
                    <div className="muted small">
                      {r.section} · p.{r.page}
                      {ref?.edition ? ` · ${ref.edition}` : ''}
                    </div>
                    <p className="ref-quote">“{r.quote}”</p>
                  </div>
                );
              })
            )}
            <p className="muted small">참고 자료 구절은 강의 내용·교수자 발언과 구분해 표시합니다. (시연용 예시 문장)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
