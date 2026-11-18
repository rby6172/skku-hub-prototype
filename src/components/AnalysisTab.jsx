// AI 분석: 추가 설명 · 구두 정정 · 과제 · 공지 · 강조 (미리 준비한 결과를 생성 연출과 함께 표시)
import React, { useState } from 'react';
import { ArrowRight, Info, RefreshCcw, Sparkles, Wand2 } from 'lucide-react';
import { FINDING_TYPES, getSegment } from '../data/index.js';
import { useStore } from '../store.jsx';
import { EmptyState, JumpButton, ProcessingSteps, ReviewButtons, SupportChip, TermText, TypeBadge, Typewriter } from './common.jsx';

const STEPS = [
  '음성 인식(STT) 스크립트 불러오기',
  '스크립트 구간과 슬라이드 정렬',
  '슬라이드에 없는 추가 설명 찾기',
  '구두 정정 발언 탐지',
  '과제·공지·강조 분류',
  '근거 위치 검증',
];

const ORDER = ['correction', 'extra', 'assignment', 'notice', 'emphasis'];

export default function AnalysisTab({ lecture }) {
  const { analyzed, markAnalyzed, toast, patch, reviews } = useStore();
  const [running, setRunning] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [filter, setFilter] = useState('all');
  const [hideRejected, setHideRejected] = useState(false);

  if (!lecture) return null;
  if (lecture.status !== 'ready') {
    return (
      <EmptyState icon={Sparkles} title="분석할 스크립트가 없습니다">
        스크립트 생성이 끝난 강의만 AI 분석을 할 수 있습니다. 강의 보기 탭에서 처리 상태를 확인하세요.
      </EmptyState>
    );
  }

  const isDone = analyzed[lecture.id];

  const finish = () => {
    const added = markAnalyzed(lecture.id);
    setRunning(false);
    setFresh(true);
    if (added > 0) {
      toast(`과제·공지 ${added}건을 할 일에 '미확인'으로 추가했어요.`, { label: '할 일 보기', onClick: () => patch({ tab: 'todo' }) });
    }
  };

  if (running) {
    return (
      <div className="tab-pad center-col">
        <ProcessingSteps steps={STEPS} onDone={finish} title={`${lecture.title} 분석 중`} />
      </div>
    );
  }

  if (!isDone) {
    return (
      <div className="tab-pad center-col">
        <div className="start-card">
          <Wand2 size={30} className="accent" />
          <h2>이 강의를 AI로 분석할까요?</h2>
          <p className="muted">스크립트와 슬라이드를 비교해 아래 항목을 찾고, 각 결과마다 근거가 된 강의 위치를 함께 보여 줍니다.</p>
          <div className="type-list">
            {ORDER.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <button type="button" className="btn primary big" onClick={() => setRunning(true)}>
            <Sparkles size={16} /> AI 분석 실행
          </button>
          <p className="muted small">추출한 과제·공지는 할 일 목록에 '미확인' 상태로 추가되며, 학생이 확인해야 확정됩니다.</p>
        </div>
      </div>
    );
  }

  const counts = Object.fromEntries(ORDER.map((t) => [t, lecture.findings.filter((f) => f.type === t).length]));
  const list = lecture.findings
    .filter((f) => filter === 'all' || f.type === filter)
    .filter((f) => !hideRejected || reviews[f.id] !== 'reject')
    .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));

  return (
    <div className="analysis">
      <div className="analysis-bar">
        <div className="filter-chips">
          <button type="button" className={`fchip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>
            전체 <b>{lecture.findings.length}</b>
          </button>
          {ORDER.map((t) => (
            <button key={t} type="button" className={`fchip fchip-${t} ${filter === t ? 'on' : ''}`} onClick={() => setFilter(t)} disabled={!counts[t]}>
              {FINDING_TYPES[t].label} <b>{counts[t]}</b>
            </button>
          ))}
        </div>
        <label className="check small">
          <input type="checkbox" checked={hideRejected} onChange={(e) => setHideRejected(e.target.checked)} />
          제외한 결과 숨기기
        </label>
        <button type="button" className="btn small" onClick={() => setRunning(true)} title="시연용: 분석 과정을 다시 보여 줍니다">
          <RefreshCcw size={13} /> 다시 분석
        </button>
      </div>
      <div className="notice-line">
        <Info size={14} />
        AI 분석 결과는 학습 보조 정보입니다. 교수자의 공식 공지·정정·성적을 대체하지 않으며, 근거 위치를 눌러 원래 발언을 확인할 수 있습니다.
      </div>
      <div className="finding-list">
        {list.map((f, i) => (
          <FindingCard key={f.id} f={f} lecture={lecture} animate={fresh} delay={i * 220} />
        ))}
      </div>
    </div>
  );
}

function FindingCard({ f, lecture, animate, delay }) {
  const { reviews, patch } = useStore();
  const decision = reviews[f.id];
  return (
    <article className={`finding type-border-${f.type} ${decision === 'reject' ? 'rejected' : ''} ${animate ? 'pop' : ''}`} style={animate ? { animationDelay: `${delay}ms` } : undefined}>
      <header>
        <TypeBadge type={f.type} />
        <SupportChip support={f.support} />
        {f.slide ? <span className="muted small">슬라이드 {f.slide}</span> : <span className="muted small">슬라이드 연결 없음</span>}
        <span className="grow" />
        <ReviewButtons id={f.id} />
      </header>
      <h3>{f.title}</h3>
      <p className="finding-content">
        <Typewriter text={f.content} enabled={animate} delay={delay + 200} />
      </p>
      {f.type === 'correction' && f.before && (
        <div className="before-after">
          <div>
            <span className="label">슬라이드 원문</span>
            <s>{f.before}</s>
          </div>
          <ArrowRight size={16} />
          <div>
            <span className="label">교수자 정정</span>
            <strong>{f.after}</strong>
          </div>
        </div>
      )}
      {(f.type === 'assignment' || f.type === 'notice') && (
        <div className="due-line">
          <span className="label">원래 표현</span>"{f.duePhrase}"
          <span className="muted small">→ 할 일에 미확인으로 추가됨 · 마감일은 학생이 확인 후 확정</span>
          <button type="button" className="link-btn" onClick={() => patch({ tab: 'todo' })}>
            할 일 보기
          </button>
        </div>
      )}
      <div className="evidence">
        <span className="label">근거 · 교수자 발화</span>
        {f.evidence.map((sid) => {
          const seg = getSegment(lecture.id, sid);
          if (!seg) return null;
          return (
            <div key={sid} className="quote">
              <JumpButton lectureId={lecture.id} time={seg.start} slide={seg.slide} />
              <span>
                “<TermText text={seg.text} />”
              </span>
            </div>
          );
        })}
      </div>
      {decision === 'accept' && <div className="decision-note">채택함 · 내 학습 기록에만 반영됩니다 (교수자의 공식 확인이 아님)</div>}
    </article>
  );
}
