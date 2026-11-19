
import React, { useState } from 'react';
import {
  CheckCircle2,
  FileQuestion,
  Lock,
  Search,
  XCircle,
} from 'lucide-react';

import {
  quizzes,
  resolveAnchor,
  getCourse,
} from '../data/index.js';

import {
  fmtDate,
  lectureLabel,
} from '../lib/format.js';

import { useStore } from '../store.jsx';

import {
  EmptyState,
  JumpButton,
  ProcessingSteps,
  TermText,
} from './common.jsx';

// "Lecture 02", "Lecture 02–03" 등의 범위에서
// 강의 번호를 추출
function getLectureNumber(lecture) {
  if (!lecture) return null;

  const label = lectureLabel(lecture);
  const match = String(label).match(/(\d+)/);

  return match ? Number(match[1]) : null;
}

// 퀴즈에 명시된 강의 범위 확인
function quizMatchesLecture(quiz, lecture) {
  if (!lecture) return true;

  // 명시적인 강의 ID 연결이 있는 경우 우선 사용
  if (Array.isArray(quiz.lectureIds)) {
    return quiz.lectureIds.includes(lecture.id);
  }

  if (quiz.lectureId != null) {
    return quiz.lectureId === lecture.id;
  }

  const lectureNo = getLectureNumber(lecture);

  if (lectureNo === null) return false;

  const range = String(quiz.range || '')
    .replace(/[–—~〜～]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  // Lecture 02-03, Lecture 02 - Lecture 03
  const rangeMatch = range.match(
    /Lecture\s*0*(\d+)\s*-\s*(?:Lecture\s*)?0*(\d+)/i
  );

  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    return (
      lectureNo >= Math.min(start, end) &&
      lectureNo <= Math.max(start, end)
    );
  }

  // Lecture 04
  const singleMatch = range.match(
    /^Lecture\s*0*(\d+)$/i
  );

  if (singleMatch) {
    return lectureNo === Number(singleMatch[1]);
  }

  return false;
}

export default function QuizTab({
  courseId,
  lecture = null,
}) {
  const list = quizzes.filter(
    (q) =>
      q.courseId === courseId &&
      quizMatchesLecture(q, lecture)
  );

  // 선택된 강의나 과목이 바뀌어도
  // 이전 퀴즈 선택이 남지 않도록 처리
  const [selectedQuizId, setSelectedQuizId] =
    useState(null);

  const [wrongOnly, setWrongOnly] =
    useState(false);

  const defaultQuiz =
    list.find((q) => q.resultReleased) ||
    list[0];

  const quiz =
    list.find((q) => q.id === selectedQuizId) ||
    defaultQuiz;

  if (!list.length) {
    return (
      <EmptyState
        icon={FileQuestion}
        title={
          lecture
            ? '이 강의에 연결된 퀴즈가 없습니다'
            : '가져온 퀴즈 결과가 없습니다'
        }
      >
        {lecture
          ? `${lectureLabel(lecture)}에 연결된 퀴즈가 없습니다. 다른 강의의 퀴즈는 과목 홈의 퀴즈 메뉴에서 확인할 수 있습니다.`
          : `${getCourse(courseId)?.title}에서 학생에게 공개된 퀴즈 결과가 없습니다.`}
      </EmptyState>
    );
  }

  const items =
    quiz?.items.filter(
      (it) =>
        !wrongOnly || it.correct === false
    ) || [];

  return (
    <div className="quiz">
      <aside className="quiz-list panel">
        <div className="panel-head">
          <strong>
            {lecture
              ? `${lectureLabel(lecture)} 퀴즈`
              : 'iCampus 퀴즈'}
          </strong>
        </div>

        {list.map((q) => (
          <button
            key={q.id}
            type="button"
            className={`quiz-item ${
              q.id === quiz.id ? 'on' : ''
            }`}
            onClick={() =>
              setSelectedQuizId(q.id)
            }
          >
            <strong>{q.title}</strong>

            <span className="muted small">
              {q.range} · {fmtDate(q.date)}
            </span>

            {q.resultReleased ? (
              <span className="chip chip-ok">
                결과 공개 · {q.score}/{q.maxScore}
              </span>
            ) : (
              <span className="chip chip-muted">
                <Lock size={11} />
                결과 미공개
              </span>
            )}
          </button>
        ))}

        <p className="muted small pad">
          iCampus 연동을 가정한 시연 데이터입니다.
          퀴즈 제출·채점은 iCampus에서만 이루어지며
          Hub는 기록을 바꾸지 않습니다.
        </p>
      </aside>

      <section className="quiz-detail">
        {!quiz.resultReleased ? (
          <EmptyState
            icon={Lock}
            title={`${quiz.title}는 아직 결과가 공개되지 않았습니다`}
          >
            진행 중이거나 결과·정답이 공개되지 않은
            퀴즈는 근거 추적을 제공하지 않습니다.
          </EmptyState>
        ) : (
          <>
            <div className="analysis-bar">
              <strong>
                {quiz.title} · {quiz.range}
              </strong>

              <span className="muted small">
                {
                  quiz.items.filter(
                    (i) => i.correct === false
                  ).length
                }
                문항 오답 · {quiz.score}/{quiz.maxScore}점
              </span>

              <span className="grow" />

              <label className="check small">
                <input
                  type="checkbox"
                  checked={wrongOnly}
                  onChange={(e) =>
                    setWrongOnly(e.target.checked)
                  }
                />
                오답만 보기 (iCampus 정오 정보 기준)
              </label>
            </div>

            <div className="quiz-items">
              {items.map((it) => (
                <QuizItem
                  key={`${quiz.id}-${it.no}`}
                  quiz={quiz}
                  it={it}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function QuizItem({ quiz, it }) {
  const key = `${quiz.id}-${it.no}`;

  const { quizTraced, patch } = useStore();

  const [running, setRunning] =
    useState(false);

  const traced = quizTraced[key];

  const canTrace =
    it.answerReleased &&
    it.answer != null;

  return (
    <article
      className={`quiz-card ${
        it.correct === false ? 'wrong' : ''
      }`}
    >
      <header>
        <span className="q-no">
          Q{it.no}
        </span>

        {it.correct === true && (
          <span className="chip chip-ok">
            <CheckCircle2 size={12} />
            정답
          </span>
        )}

        {it.correct === false && (
          <span className="chip chip-danger">
            <XCircle size={12} />
            오답
          </span>
        )}

        <span className="muted small">
          {it.points}점
        </span>
      </header>

      <p className="q-text">
        {it.question}
      </p>

      {it.choices ? (
        <ol className="choices">
          {it.choices.map((c, i) => {
            const n = i + 1;
            const mine = it.response === n;
            const ans =
              it.answerReleased &&
              it.answer === n;

            return (
              <li
                key={i}
                className={`${
                  mine ? 'mine' : ''
                } ${ans ? 'answer' : ''}`}
              >
                <span className="c-no">
                  {n}
                </span>

                {c}

                {mine && (
                  <span className="c-tag mine">
                    내 답
                  </span>
                )}

                {ans && (
                  <span className="c-tag answer">
                    공식 정답
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="short-answer">
          <span className="label">
            내 답
          </span>
          {' '}
          {it.response}
        </div>
      )}

      {!canTrace ? (
        <div className="locked">
          <Lock size={14} />
          공식 정답이 공개되지 않았습니다
          (점수만 공개). 정답이 없는 문항은
          AI가 정답을 추측하지 않으며
          강의 근거 추적을 제공하지 않습니다.
        </div>
      ) : running ? (
        <ProcessingSteps
          steps={[
            '문항·공식 정답 확인',
            '같은 과목의 슬라이드·스크립트 검색',
            '관련도 순 정렬',
          ]}
          stepMs={500}
          title="강의 근거 검색 중"
          onDone={() => {
            setRunning(false);

            patch((s) => ({
              quizTraced: {
                ...s.quizTraced,
                [key]: true,
              },
            }));
          }}
        />
      ) : !traced ? (
        <button
          type="button"
          className="btn trace-btn"
          onClick={() => setRunning(true)}
        >
          <Search size={14} />
          강의 근거 추적
        </button>
      ) : (
        <div className="trace">
          <div className="trace-head">
            <span className="label">
              관련 강의 위치 · 상위{' '}
              {it.trace?.length || 0}개
            </span>

            <span className="muted small">
              검색 범위: {quiz.range}
              {' '}슬라이드·스크립트 (색인 완료)
            </span>
          </div>

          {(it.trace || []).map((t, i) => {
            const a = resolveAnchor(t);

            if (!a) return null;

            return (
              <div
                key={i}
                className="trace-item"
              >
                <span className="rank">
                  {i + 1}
                </span>

                <div className="trace-body">
                  <div className="trace-loc">
                    <strong>
                      {lectureLabel(a.lecture)}
                    </strong>

                    <span className="muted small">
                      {a.kind === 'script'
                        ? '스크립트'
                        : '슬라이드'}
                    </span>

                    <span
                      className="relevance"
                      title="관련도"
                    >
                      <span
                        style={{
                          width: `${
                            Math.round(
                              t.relevance * 100
                            )
                          }%`,
                        }}
                      />
                    </span>

                    <span className="muted small mono">
                      {Math.round(
                        t.relevance * 100
                      )}%
                    </span>
                  </div>

                  <p>
                    “<TermText text={a.text} />”
                  </p>

                  {t.note && (
                    <p className="trace-note">
                      {t.note}
                    </p>
                  )}
                </div>

                <JumpButton
                  lectureId={a.lecture.id}
                  time={a.time}
                  slide={a.slide}
                />
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
