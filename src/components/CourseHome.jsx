
import React from 'react';
import {
  CheckSquare,
  FileQuestion,
  FolderOpen,
  Network,
  NotebookPen,
  PlayCircle,
  Sparkles,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';

import { concepts, getCourse, quizzes } from '../data/index.js';
import { fmtDate, fmtDue, lectureLabel } from '../lib/format.js';
import { noteStatus } from '../lib/summary.js';
import { useStore } from '../store.jsx';

// 과목 홈의 학습 메뉴
const MENU = [
  {
    key: 'todo',
    title: '할 일',
    desc: '과목 전체 할 일과 마감일 확인',
    icon: CheckSquare,
  },
  {
    key: 'concept',
    title: '개념',
    desc: '개념 등장 흐름과 관계 살펴보기',
    icon: Network,
  },
  {
    key: 'notes',
    title: '필기',
    desc: '강의별 필기와 점검 기록 모아보기',
    icon: NotebookPen,
  },
  {
    key: 'quiz',
    title: '퀴즈',
    desc: '퀴즈 결과와 강의 근거 추적',
    icon: FileQuestion,
  },
  {
    key: 'courseMaterials',
    title: '자료',
    desc: '강의별 자료 확인 및 업로드',
    icon: FolderOpen,
  },
];

export default function CourseHome({ courseId }) {
  const {
    patch,
    courseLectures,
    noteChecked,
    noteTexts,
    analyzed,
    todos,
  } = useStore();

  const course = getCourse(courseId);
  const lecs = courseLectures(courseId);
  const stats = summarize({ courseId, lecs, todos, noteTexts, noteChecked });

  // 학습 메뉴 및 강의별 기능 선택
  const open = (key, lectureId = null) => {
    // 과목 전체 기능
    if (
      [
        'todo',
        'concept',
        'notes',
        'quiz',
        'courseMaterials',
      ].includes(key)
    ) {
      patch({
        courseId,
        tab: key,
      });
      return;
    }

    // 강의별 기능
    if (
      ['lecture', 'note', 'materials'].includes(key)
    ) {
      if (!lecs.length) return;

      patch({
        courseId,
        lectureId: lectureId || lecs[0].id,
        tab: key,
      });
    }
  };

  return (
    <div className="course-home">

      {/* 과목 정보 */}
      <div className="course-home-hero">
        <div>
          <span className="course-home-eyebrow">
            LECTURE HUB · 과목 홈
          </span>

          <h1>
            {course?.title || '과목'}
          </h1>

          <p>
            {course?.code} · {course?.term}
          </p>

          <p className="course-home-intro">
            강의 학습과 과목 전체의 할 일, 개념, 필기,
            퀴즈, 자료를 한곳에서 관리하세요.
          </p>
        </div>
      </div>

      {/* 학습 메뉴 */}
      <h2 className="course-home-heading">
        학습 메뉴
      </h2>

      <div className="course-home-grid">
        {MENU.map(({ key, title, desc, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className="course-home-card"
            onClick={() => open(key)}
            disabled={
              key === 'courseMaterials' && !lecs.length
            }
          >
            <span className="course-home-card-icon">
              <Icon size={22} />
            </span>

            <span className="course-home-card-text">
              <strong>{title}</strong>
              <small>{desc}</small>
              {stats[key] && (
                <span className="course-home-card-stats">
                  {stats[key].map((st) => (
                    <span key={st.label} className={`chip ${st.tone ? `chip-${st.tone}` : 'chip-plain'}`}>
                      {st.label}
                    </span>
                  ))}
                </span>
              )}
            </span>

            <ArrowRight
              size={16}
              className="course-home-arrow"
            />
          </button>
        ))}
      </div>

      {/* 강의 목록 */}
      <div className="course-home-section-head">
        <h2 className="course-home-heading">
          강의 목록
        </h2>

        <span className="muted small">
          강의를 선택하면 해당 강의의 학습 화면으로 이동합니다.
        </span>
      </div>

      {lecs.length === 0 ? (
        <div className="course-home-empty">
          등록된 강의가 없습니다.
          왼쪽 사이드바에서 강의를 추가할 수 있습니다.
        </div>
      ) : (
        <div className="course-home-lectures">
          {lecs.map((lec) => (
            <div
              className="course-home-lecture"
              key={lec.id}
            >
              <div className="course-home-lecture-main">
                <span className="course-home-lecture-no">
                  {lectureLabel(lec)}
                </span>

                <strong>
                  {lec.title}
                </strong>

                <span className="muted small">
                  <CalendarDays size={12} />
                  {lec.date
                    ? fmtDate(lec.date)
                    : '날짜 미정'}
                </span>
              </div>

              <div className="course-home-lecture-actions">
                {/* AI 분석 완료 여부 */}
                {analyzed[lec.id] && (
                  <span className="chip chip-info">
                    <Sparkles size={11} />
                    분석 완료
                  </span>
                )}

                {/* 필기 점검 기록 여부 */}
                {noteChecked[lec.id] != null && (
                  <span className="chip chip-ok">
                    필기 점검 기록
                  </span>
                )}

                {/* 강의 상세 화면 */}
                <button
                  type="button"
                  className="btn primary small"
                  onClick={() => open('lecture', lec.id)}
                >
                  <PlayCircle size={13} />
                  강의 열기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 카드별 요약 숫자 (주의가 필요한 항목은 색으로 강조)
function summarize({ courseId, lecs, todos, noteTexts, noteChecked }) {
  const out = {};

  // 할 일
  const mine = todos.filter((t) => t.courseId === courseId);
  const unconfirmed = mine.filter((t) => !t.confirmed && !t.completed).length;
  const open = mine.filter((t) => t.confirmed && !t.completed);
  const nextDue = open.map((t) => t.dueAt).filter(Boolean).sort()[0];
  out.todo = mine.length === 0
    ? [{ label: 'AI 분석 후 자동 추가' }]
    : [
      unconfirmed > 0 && { label: `확인 필요 ${unconfirmed}`, tone: 'warn' },
      { label: `진행 중 ${open.length}` },
      nextDue && { label: `다음 마감 ${fmtDue(nextDue).replace(/ \d\d:\d\d$/, '')}`, tone: 'info' },
    ].filter(Boolean);

  // 개념
  const cs = concepts.filter((c) => c.courseId === courseId);
  if (cs.length) {
    const repeated = cs.filter((c) => new Set(c.occurrences.map((o) => o.lectureId)).size >= 2).length;
    const rel = cs.reduce((n, c) => n + c.related.length, 0);
    out.concept = [{ label: `개념 ${cs.length}` }, { label: `반복 ${repeated}`, tone: 'info' }, { label: `관계 ${rel}` }];
  } else {
    out.concept = [{ label: '색인된 개념 없음' }];
  }

  // 필기
  const ns = lecs.map((l) => noteStatus(l.id, noteTexts, noteChecked));
  const written = ns.filter((n) => n.hasNote).length;
  const fresh = ns.filter((n) => n.checked && !n.stale);
  const mismatch = fresh.reduce((n, x) => n + x.mismatch, 0);
  const missing = fresh.reduce((n, x) => n + x.missing, 0);
  out.notes = [
    { label: `필기 ${written}/${lecs.length}강` },
    mismatch > 0 && { label: `불일치 ${mismatch}`, tone: 'danger' },
    missing > 0 && { label: `누락 가능성 ${missing}`, tone: 'warn' },
    written > 0 && fresh.length === 0 && { label: '점검 전' },
    ns.some((n) => n.stale) && { label: '다시 점검 필요', tone: 'warn' },
  ].filter(Boolean);

  // 퀴즈
  const qs = quizzes.filter((q) => q.courseId === courseId);
  const released = qs.filter((q) => q.resultReleased);
  const wrong = released.reduce((n, q) => n + q.items.filter((it) => it.correct === false).length, 0);
  out.quiz = qs.length === 0
    ? [{ label: '퀴즈 없음' }]
    : [
      ...released.map((q) => ({ label: `${q.title} ${q.score}/${q.maxScore}점` })),
      wrong > 0 && { label: `오답 ${wrong}`, tone: 'danger' },
      qs.length > released.length && { label: `결과 대기 ${qs.length - released.length}` },
    ].filter(Boolean);

  // 자료
  const ready = lecs.filter((l) => l.status === 'ready').length;
  out.courseMaterials = [
    { label: `강의 ${lecs.length}개` },
    { label: `자료 준비됨 ${ready}`, tone: ready ? 'ok' : undefined },
    lecs.length > ready && { label: `처리 중·실패 ${lecs.length - ready}`, tone: 'warn' },
  ].filter(Boolean);

  return out;
}
