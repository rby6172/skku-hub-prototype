
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckSquare,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { getCourse, lectures } from '../data/index.js';
import { fmtDue, lectureLabel } from '../lib/format.js';
import { useStore } from '../store.jsx';
import {
  EmptyState,
  JumpButton,
  Segmented,
} from './common.jsx';

export default function TodoTab({ lecture = null }) {
  const {
    todos,
    courseId,
    addTodo,
    getLectureAny,
  } = useStore();

  // 개별 강의에서는 '이 강의',
  // 과목 홈에서는 '이 과목'을 기본 선택
  const [scope, setScope] = useState(
    lecture ? 'lecture' : 'course'
  );

  const [status, setStatus] = useState('open');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');

  // 다른 강의나 과목으로 이동하면 기본 범위 재설정
  useEffect(() => {
    setScope(lecture ? 'lecture' : 'course');
  }, [lecture?.id, courseId]);

  // 현재 선택한 범위와 상태에 따라 필터링
  const filtered = useMemo(() => {
    return todos
      .filter((t) => {
        if (scope === 'all') {
          return true;
        }

        if (scope === 'course') {
          return t.courseId === courseId;
        }

        if (scope === 'lecture') {
          return (
            lecture != null &&
            t.courseId === courseId &&
            t.lectureId === lecture.id
          );
        }

        return false;
      })
      .filter((t) => {
        if (status === 'all') {
          return true;
        }

        if (status === 'open') {
          return !t.completed;
        }

        if (status === 'done') {
          return t.completed;
        }

        if (status === 'unconfirmed') {
          return !t.confirmed && !t.completed;
        }

        return true;
      });
  }, [todos, scope, status, courseId, lecture?.id]);

  const needConfirm = filtered.filter(
    (t) => !t.confirmed && !t.completed
  );

  const open = filtered
    .filter((t) => t.confirmed && !t.completed)
    .sort((a, b) =>
      (a.dueAt || '9999').localeCompare(
        b.dueAt || '9999'
      )
    );

  const done = filtered.filter(
    (t) => t.completed
  );

  const scopeOptions = [
    ...(lecture
      ? [{ value: 'lecture', label: '이 강의' }]
      : []),
    { value: 'course', label: '이 과목' },
    { value: 'all', label: '전체 과목' },
  ];

  const emptyTitle =
    scope === 'lecture'
      ? '이 강의에 연결된 할 일이 없습니다'
      : scope === 'course'
        ? '이 과목의 할 일이 없습니다'
        : '등록된 할 일이 없습니다';

  return (
    <div className="todo">
      {/* 범위 및 상태 필터 */}
      <div className="todo-bar">
        <Segmented
          value={scope}
          onChange={setScope}
          options={scopeOptions}
        />

        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'open', label: '진행 중' },
            {
              value: 'unconfirmed',
              label: '확인 필요',
            },
            { value: 'done', label: '완료' },
            { value: 'all', label: '전체' },
          ]}
        />

        <span className="grow" />

        <span className="muted small">
          외부 캘린더 연동과 과제 제출은 제공하지 않습니다.
        </span>
      </div>

      {/* 할 일 직접 추가 */}
      <form
        className="todo-add"
        onSubmit={(e) => {
          e.preventDefault();

          if (!title.trim()) return;

          addTodo({
            title: title.trim(),
            courseId,
            lectureId: lecture?.id ?? null,
            dueAt: due || null,
            confirmed: true,
          });

          setTitle('');
          setDue('');
        }}
      >
        <Plus size={16} className="muted" />

        <input
          placeholder={
            lecture
              ? `할 일 추가 (${lectureLabel(lecture)}에 연결)`
              : '이 과목의 할 일 추가'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="마감일"
        />

        <button
          type="submit"
          className="btn primary small"
        >
          추가
        </button>
      </form>

      {/* 할 일 목록 */}
      <div className="todo-scroll">
        {filtered.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title={emptyTitle}
          >
            AI 분석 탭에서 강의를 분석하면
            과제·공지가 여기에 '미확인'으로 추가됩니다.
            직접 추가할 수도 있습니다.
          </EmptyState>
        )}

        {/* 확인이 필요한 AI 추출 할 일 */}
        {needConfirm.length > 0 && (
          <section>
            <h3 className="todo-section warn">
              <AlertCircle size={15} />
              확인 필요

              <span className="count warn">
                {needConfirm.length}
              </span>

              <span className="muted small">
                강의에서 자동 추출된 항목입니다.
                내용과 마감일을 확인해야 확정됩니다.
              </span>
            </h3>

            {needConfirm.map((t) => (
              <TodoItem
                key={t.id}
                t={t}
                getLectureAny={getLectureAny}
              />
            ))}
          </section>
        )}

        {/* 진행 중인 할 일 */}
        {open.length > 0 && (
          <section>
            <h3 className="todo-section">
              진행 중 · 마감 순
            </h3>

            {open.map((t) => (
              <TodoItem
                key={t.id}
                t={t}
                getLectureAny={getLectureAny}
              />
            ))}
          </section>
        )}

        {/* 완료된 할 일 */}
        {done.length > 0 && (
          <section>
            <h3 className="todo-section muted">
              완료
            </h3>

            {done.map((t) => (
              <TodoItem
                key={t.id}
                t={t}
                getLectureAny={getLectureAny}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

// 개별 할 일 카드
function TodoItem({ t, getLectureAny }) {
  const { updateTodo, removeTodo } = useStore();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(t.title);
  const [due, setDue] = useState(
    t.dueAt || t.dueSuggested || ''
  );

  const lec = t.lectureId
    ? getLectureAny(t.lectureId)
    : null;

  const course = getCourse(t.courseId);

  const finding =
    t.originFindingId &&
    lec?.findings?.find(
      (f) => f.id === t.originFindingId
    );

  const evidenceSeg =
    finding && lectures[lec.id]?.transcript?.find(
      (s) =>
        s.id ===
        finding.evidence[
          finding.evidence.length - 1
        ]
    );

  return (
    <div
      className={`todo-item ${
        t.completed ? 'done' : ''
      } ${
        !t.confirmed && !t.completed
          ? 'unconfirmed'
          : ''
      }`}
    >
      {/* 완료 체크 */}
      <input
        type="checkbox"
        checked={t.completed}
        onChange={(e) =>
          updateTodo(t.id, {
            completed: e.target.checked,
          })
        }
        aria-label={
          t.completed ? '다시 열기' : '완료'
        }
        title={
          t.completed ? '다시 열기' : '완료'
        }
      />

      <div className="todo-main">
        {/* 제목 수정 */}
        {editing ? (
          <form
            className="row gap-s"
            onSubmit={(e) => {
              e.preventDefault();

              updateTodo(t.id, {
                title: title.trim() || t.title,
              });

              setEditing(false);
            }}
          >
            <input
              autoFocus
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />

            <button
              type="submit"
              className="btn small primary"
            >
              저장
            </button>
          </form>
        ) : (
          <div className="todo-title">
            {t.title}

            {t.auto && (
              <span
                className="chip chip-ai"
                title="강의 분석에서 자동 추출됨"
              >
                <Sparkles size={11} />
                AI 추출
              </span>
            )}

            {!t.confirmed && !t.completed && (
              <span className="chip chip-warn">
                미확인
              </span>
            )}
          </div>
        )}

        {/* 과목, 강의, 마감일, 근거 */}
        <div className="todo-meta">
          <span>{course?.title}</span>

          {lec && (
            <span>
              · {lectureLabel(lec)}
            </span>
          )}

          {t.confirmed && (
            <span
              className={`due ${
                t.dueAt ? '' : 'muted'
              }`}
            >
              <CalendarClock size={13} />
              {t.dueAt
                ? fmtDue(t.dueAt)
                : '마감일 없음'}
            </span>
          )}

          {evidenceSeg && (
            <JumpButton
              lectureId={lec.id}
              time={evidenceSeg.start}
              slide={evidenceSeg.slide}
              showLecture
              label={<>근거 발언 보기</>}
            />
          )}
        </div>

        {/* AI 추출 항목 마감일 확인 */}
        {!t.confirmed && !t.completed && (
          <div className="confirm-box">
            <div>
              <span className="label">
                강의에서 말한 표현
              </span>
              "{t.duePhrase || '날짜 언급 없음'}"

              {t.dueSuggested ? (
                <span className="muted small">
                  {' '}· 추정 마감:{' '}
                  {fmtDue(t.dueSuggested)}
                  {' '}(확정 전)
                </span>
              ) : (
                <span className="muted small">
                  {' '}· 날짜가 모호해 마감일을
                  추정하지 않았습니다
                </span>
              )}
            </div>

            <div className="row gap-s">
              <input
                type="datetime-local"
                value={due}
                onChange={(e) =>
                  setDue(e.target.value)
                }
                aria-label="확정할 마감일"
              />

              <button
                type="button"
                className="btn small primary"
                disabled={!due}
                onClick={() =>
                  updateTodo(t.id, {
                    confirmed: true,
                    dueAt: due,
                  })
                }
              >
                이 날짜로 확정
              </button>

              <button
                type="button"
                className="btn small"
                onClick={() =>
                  updateTodo(t.id, {
                    confirmed: true,
                    dueAt: null,
                  })
                }
              >
                마감일 없이 확정
              </button>
            </div>
          </div>
        )}

        {t.confirmed && t.duePhrase && (
          <div className="muted small">
            원래 표현: "{t.duePhrase}"
          </div>
        )}
      </div>

      {/* 수정 및 삭제 */}
      <div className="todo-actions">
        <button
          type="button"
          className="icon-btn"
          aria-label="수정"
          onClick={() =>
            setEditing((e) => !e)
          }
        >
          <Pencil size={14} />
        </button>

        <button
          type="button"
          className="icon-btn"
          aria-label="삭제"
          onClick={() => {
            if (
              window.confirm(
                `'${t.title}' 할 일을 삭제할까요?`
              )
            ) {
              removeTodo(t.id);
            }
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
