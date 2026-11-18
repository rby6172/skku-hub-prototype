// 필기 점검 (Note Gap): 내 필기를 강의 내용과 비교해 누락·불일치 후보를 보여 줌
import React, { useRef, useState } from 'react';
import { AlertTriangle, FileUp, NotebookPen, Pencil, ScanSearch } from 'lucide-react';
import { notes, getSegment } from '../data/index.js';
import { useStore } from '../store.jsx';
import { EmptyState, JumpButton, ProcessingSteps, ReviewButtons, SupportChip, TermText } from './common.jsx';

const STEPS = ['필기 텍스트 확인', '강의 슬라이드·스크립트와 문장 비교', '구두 정정 반영 여부 확인', '누락·불일치 후보 분류', '근거 위치 검증'];
const TYPE = {
  missing: { label: '누락 가능성', cls: 'missing' },
  mismatch: { label: '불일치', cls: 'mismatch' },
  insufficient: { label: '근거 부족', cls: 'insufficient' },
};

export default function NoteTab({ lecture }) {
  const { noteTexts, noteChecked, patch } = useStore();
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState('all');
  const fileRef = useRef(null);
  if (!lecture) return null;

  const sample = notes[lecture.id];
  const text = noteTexts[lecture.id] ?? sample?.text ?? '';
  const checkedText = noteChecked[lecture.id];
  const checked = checkedText != null;
  const stale = checked && checkedText !== text;
  const results = checked && sample ? sample.results : [];
  const shown = results.filter((r) => filter === 'all' || r.type === filter);

  const setText = (v) => patch((s) => ({ noteTexts: { ...s.noteTexts, [lecture.id]: v } }));

  const loadFile = (file) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      window.alert('이 프로토타입에서는 텍스트 필기(.txt, .md)만 불러올 수 있습니다. PDF·이미지 필기는 OCR 후 텍스트를 확인하는 단계가 필요합니다.');
      return;
    }
    const r = new FileReader();
    r.onload = () => setText(String(r.result));
    r.readAsText(file, 'utf-8');
  };

  const lines = text.split('\n');
  const flagged = new Map(results.map((r) => [r.noteLine, r]));

  return (
    <div className="notes">
      <section className="note-left panel">
        <div className="panel-head">
          <strong>
            <NotebookPen size={15} /> 내 필기
          </strong>
          <span className="muted small">{sample?.fileName || '직접 입력'}</span>
          <span className="grow" />
          <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>
            <FileUp size={13} /> 불러오기
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
          {checked && !editing && (
            <button type="button" className="btn small" onClick={() => setEditing(true)}>
              <Pencil size={13} /> 편집
            </button>
          )}
        </div>
        {!checked || editing ? (
          <textarea
            className="note-editor"
            value={text}
            placeholder="필기를 붙여 넣거나 .txt 파일을 불러오세요."
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <div className="note-view">
            {lines.map((l, i) => {
              const r = flagged.get(l);
              return (
                <div key={i} className={`note-line ${r ? `flag-${TYPE[r.type].cls}` : ''}`} title={r ? r.title : undefined}>
                  <span className="note-text">{l || ' '}</span>
                  {r &&<span className={`note-flag flag-${TYPE[r.type].cls}`}>{TYPE[r.type].label}</span>}
                </div>
              );
            })}
          </div>
        )}
        <div className="note-foot">
          <span className="muted small">점검은 학생이 확인한 텍스트로만 진행하며, 필기는 자동으로 수정되지 않습니다.</span>
          <button
            type="button"
            className="btn primary"
            disabled={!text.trim() || running}
            onClick={() => {
              setEditing(false);
              setRunning(true);
            }}
          >
            <ScanSearch size={15} /> {checked ? '다시 점검' : '필기 점검 실행'}
          </button>
        </div>
      </section>

      <section className="note-right">
        {running ? (
          <div className="center-col tab-pad">
            <ProcessingSteps
              steps={STEPS}
              stepMs={650}
              title="필기 점검 중"
              onDone={() => {
                setRunning(false);
                patch((s) => ({ noteChecked: { ...s.noteChecked, [lecture.id]: text } }));
              }}
            />
          </div>
        ) : !checked ? (
          <EmptyState icon={ScanSearch} title="필기 점검 결과가 여기에 표시됩니다">
            내 필기를 이 강의의 슬라이드·스크립트와 비교해 빠뜨린 내용(누락 가능성)과 강의와 다르게 적은 내용(불일치)을 찾습니다.
          </EmptyState>
        ) : !sample ? (
          <EmptyState icon={AlertTriangle} title="시연용 점검 결과가 없는 강의입니다">
            이 프로토타입에서는 Lecture 03의 필기 점검 결과만 미리 준비되어 있습니다.
          </EmptyState>
        ) : (
          <>
            {stale && (
              <div className="stale-banner">
                <AlertTriangle size={15} /> 필기가 바뀌어 아래 결과는 <b>오래됨</b> 상태입니다. 다시 점검하세요.
              </div>
            )}
            <div className="analysis-bar">
              <div className="filter-chips">
                <button type="button" className={`fchip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>
                  전체 <b>{results.length}</b>
                </button>
                {Object.entries(TYPE).map(([k, v]) => (
                  <button key={k} type="button" className={`fchip fchip-note-${v.cls} ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
                    {v.label} <b>{results.filter((r) => r.type === k).length}</b>
                  </button>
                ))}
              </div>
            </div>
            <div className={`finding-list ${stale ? 'is-stale' : ''}`}>
              {shown.map((r) => (
                <article key={r.id} className={`finding note-border-${TYPE[r.type].cls}`}>
                  <header>
                    <span className={`badge note-${TYPE[r.type].cls}`}>{TYPE[r.type].label}</span>
                    <SupportChip support={r.support} />
                    <span className="grow" />
                    <ReviewButtons id={`${lecture.id}-${r.id}`} />
                  </header>
                  <h3>{r.title}</h3>
                  <div className="compare">
                    <div>
                      <span className="label">내 필기</span>
                      <code>{r.noteLine.trim()}</code>
                    </div>
                  </div>
                  <p className="finding-content">{r.explanation}</p>
                  {r.evidence.length > 0 && (
                    <div className="evidence">
                      <span className="label">강의 근거</span>
                      {r.evidence.map((sid) => {
                        const seg = getSegment(lecture.id, sid);
                        return seg ? (
                          <div key={sid} className="quote">
                            <JumpButton lectureId={lecture.id} time={seg.start} slide={seg.slide} />
                            <span>
                              “<TermText text={seg.text} />”
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
