import React, { useEffect, useRef, useState } from 'react';
import { Check, Circle, Loader2, Play, RotateCcw, ThumbsUp, X } from 'lucide-react';
import { glossary, termLabel, SUPPORT, FINDING_TYPES } from '../data/index.js';
import { asset, fmtTime, lectureLabel } from '../lib/format.js';
import { useNav, useStore } from '../store.jsx';

// 스크립트 문장 렌더링: {{용어ID|말한 표기}} → 용어 표기 설정에 따라 표시
export function TermText({ text, highlight }) {
  const { termMode } = useStore();
  const parts = [];
  const re = /\{\{(\w+)\|([^}]+)\}\}/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Highlighted key={i++} text={text.slice(last, m.index)} q={highlight} />);
    const [, id, spoken] = m;
    const g = glossary[id];
    const shown = termLabel(id, spoken, termMode);
    const title = g ? `${g.ko} · ${g.en} (강의 원문: ${spoken})` : `사전에 없는 용어 · 원래 표기 유지`;
    parts.push(
      <span key={i++} className={`term ${g ? '' : 'term-unknown'}`} title={title}>
        <Highlighted text={shown} q={highlight} />
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Highlighted key={i++} text={text.slice(last)} q={highlight} />);
  return <>{parts}</>;
}

function Highlighted({ text, q }) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function TypeBadge({ type }) {
  const t = FINDING_TYPES[type];
  return <span className={`badge type-${type}`}>{t ? t.label : type}</span>;
}

export function SupportChip({ support }) {
  const s = SUPPORT[support];
  if (!s) return null;
  return (
    <span className={`chip chip-${s.tone}`} title="근거 지원 상태: AI 결과가 강의 근거로 얼마나 뒷받침되는지">
      {s.tone === 'ok' ? <Check size={12} /> : <Circle size={10} />}
      {s.label}
    </span>
  );
}

// 근거 위치로 이동하는 버튼: "▶ Lecture 03 · 슬라이드 9 · 07:14"
export function JumpButton({ lectureId, time, slide, showLecture = false, label }) {
  const go = useNav();
  const { getLectureAny } = useStore();
  const lec = getLectureAny(lectureId);
  if (!lec) return <span className="jump disabled">근거를 확인할 수 없음</span>;
  return (
    <button
      type="button"
      className="jump"
      onClick={(e) => {
        e.stopPropagation();
        go({ lectureId, time, slide });
      }}
      title="해당 강의 위치로 이동"
    >
      <Play size={11} fill="currentColor" />
      {label ?? (
        <>
          {showLecture && <span>{lectureLabel(lec)} ·</span>}
          {slide ? <span>슬라이드 {slide}</span> : null}
          {slide && time != null ? <span>·</span> : null}
          {time != null ? <span className="mono">{fmtTime(time)}</span> : null}
        </>
      )}
    </button>
  );
}

// 채택 · 제외 · 재검토 (학생의 검토 결정. 근거 지원 상태와는 별개)
export function ReviewButtons({ id }) {
  const { reviews, setReview } = useStore();
  const d = reviews[id];
  return (
    <div className="review" role="group" aria-label="검토 결정">
      <button type="button" className={d === 'accept' ? 'on accept' : ''} onClick={() => setReview(id, 'accept')}>
        <ThumbsUp size={13} /> 채택
      </button>
      <button type="button" className={d === 'reject' ? 'on reject' : ''} onClick={() => setReview(id, 'reject')}>
        <X size={13} /> 제외
      </button>
      <button type="button" className={d === 'revisit' ? 'on revisit' : ''} onClick={() => setReview(id, 'revisit')}>
        <RotateCcw size={13} /> 재검토
      </button>
    </div>
  );
}

// "AI가 처리 중" 연출: 단계를 하나씩 완료 표시
export function ProcessingSteps({ steps, stepMs = 750, onDone, title = 'AI 분석 중' }) {
  const [done, setDone] = useState(0);
  const finished = useRef(false);
  useEffect(() => {
    if (done >= steps.length) {
      if (!finished.current) {
        finished.current = true;
        const t = setTimeout(() => onDone?.(), 350);
        return () => clearTimeout(t);
      }
      return undefined;
    }
    const t = setTimeout(() => setDone((d) => d + 1), stepMs + Math.random() * 300);
    return () => clearTimeout(t);
  }, [done, steps.length, stepMs, onDone]);

  const pct = Math.round((done / steps.length) * 100);
  return (
    <div className="processing">
      <div className="processing-head">
        <Loader2 size={18} className="spin" />
        <strong>{title}</strong>
        <span className="muted mono">{pct}%</span>
      </div>
      <div className="progress">
        <div style={{ width: `${pct}%` }} />
      </div>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s} className={i < done ? 'done' : i === done ? 'active' : ''}>
            {i < done ? <Check size={14} /> : i === done ? <Loader2 size={14} className="spin" /> : <Circle size={10} />}
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

// 글자가 하나씩 생성되는 연출
export function Typewriter({ text, enabled = true, speed = 14, delay = 0 }) {
  const [n, setN] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) {
      setN(text.length);
      return undefined;
    }
    setN(0);
    let iv;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        setN((x) => {
          if (x >= text.length) {
            clearInterval(iv);
            return x;
          }
          return x + 2;
        });
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(iv);
    };
  }, [text, enabled, speed, delay]);
  const typing = n < text.length;
  return (
    <span>
      {text.slice(0, n)}
      {typing && <span className="caret" />}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={34} strokeWidth={1.5} />}
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

// 슬라이드 한 장 (이미지가 있으면 이미지, 없으면 데이터로 그림)
export function SlideView({ lecture, slide, annotations = [] }) {
  if (!slide) return <div className="slide slide-empty">슬라이드 없음</div>;
  return (
    <div className={`slide ${slide.bullets.length === 0 ? 'slide-title' : ''}`}>
      {slide.image ? (
        <img src={asset(slide.image)} alt={slide.title} />
      ) : (
        <div className="slide-inner">
          <div className="slide-course">{lecture.title}</div>
          <h2>{slide.title}</h2>
          {slide.subtitle && <p className="slide-sub">{slide.subtitle}</p>}
          <ul>
            {slide.bullets.map((b) => {
              const fix = annotations.find((a) => a.before && b.includes(a.before.replace(/^.*?:\s*/, '').trim()));
              return (
                <li key={b} className={fix ? 'struck' : ''}>
                  {b}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <span className="slide-no">{slide.no}</span>
      {annotations.length > 0 && (
        <div className="slide-annot">
          {annotations.map((a) => (
            <div key={a.id} className="annot-note">
              <strong>구두 정정</strong>
              <span>{a.after}</span>
            </div>
          ))}
          <small>원본 슬라이드는 수정되지 않으며, 정정은 주석으로만 표시됩니다.</small>
        </div>
      )}
    </div>
  );
}

export function Segmented({ value, onChange, options, size }) {
  return (
    <div className={`segmented ${size || ''}`} role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
