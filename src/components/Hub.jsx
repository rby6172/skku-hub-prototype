
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  Brain,
  ChevronRight,
  FolderOpen,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  AlertTriangle,
  Loader2,
  Inbox,
  CheckSquare,
  FileQuestion,
} from 'lucide-react';

import {
  courses,
  searchCourse,
  conceptName,
  getCourse,
} from '../data/index.js';

import {
  fmtDate,
  fmtTime,
  lectureLabel,
} from '../lib/format.js';

import { useNav, useStore } from '../store.jsx';
import { EmptyState, Segmented } from './common.jsx';

import LectureTab from './LectureTab.jsx';
import AnalysisTab from './AnalysisTab.jsx';
import TodoTab from './TodoTab.jsx';
import ConceptTab from './ConceptTab.jsx';
import NoteTab from './NoteTab.jsx';
import QuizTab from './QuizTab.jsx';
import MaterialsTab from './MaterialsTab.jsx';
import CourseHome from './CourseHome.jsx';
import CourseNotes from './CourseNotes.jsx';
import CourseMaterials from './CourseMaterials.jsx';

// 강의별 상단 탭
const LECTURE_TABS = [
  { key: 'lecture', label: '강의 보기', icon: BookOpenText },
  { key: 'analysis', label: 'AI 분석', icon: Sparkles },
  { key: 'lectureTodo', label: '할 일', icon: CheckSquare },
  { key: 'note', label: '필기 점검', icon: NotebookPen },
  { key: 'lectureQuiz', label: '퀴즈', icon: FileQuestion },
  { key: 'materials', label: '자료', icon: FolderOpen },
];

// 과목 전체 기능
const COURSE_LEVEL_KEYS = [
  'home',
  'todo',
  'concept',
  'notes',
  'quiz',
  'courseMaterials',
];

// 강의별 기능
const LECTURE_LEVEL_KEYS = LECTURE_TABS.map(
  (item) => item.key
);

export default function Hub() {
  const {
    courseId,
    lectureId,
    tab,
    sidebarOpen,
    patch,
    getLectureAny,
    courseLectures,
  } = useStore();

  const course = getCourse(courseId);
  const lecs = courseLectures(courseId);

  const lecture = getLectureAny(lectureId);
  const lectureInCourse =
    lecture && lecture.courseId === courseId;

  // 과목 자료 목록에서 진입했는지 기록
  const [materialsFromCourse, setMaterialsFromCourse] =
    useState(false);

  const previousNavigation = useRef({
    tab,
    courseId,
    lectureId,
  });

  useEffect(() => {
    if (!lectureInCourse && lecs.length > 0) {
      patch({ lectureId: lecs[0].id });
    }
  }, [lectureInCourse, lecs, patch]);

  useEffect(() => {
    const previous = previousNavigation.current;

    if (
      previous.tab === 'courseMaterials' &&
      tab === 'materials' &&
      previous.courseId === courseId
    ) {
      setMaterialsFromCourse(true);
    } else if (
      COURSE_LEVEL_KEYS.includes(tab) ||
      previous.courseId !== courseId
    ) {
      setMaterialsFromCourse(false);
    } else if (
      previous.lectureId !== lectureId &&
      previous.tab !== 'courseMaterials'
    ) {
      setMaterialsFromCourse(false);
    } else if (
      previous.tab !== tab &&
      tab !== 'materials'
    ) {
      setMaterialsFromCourse(false);
    }

    previousNavigation.current = {
      tab,
      courseId,
      lectureId,
    };
  }, [tab, courseId, lectureId]);

  const isLectureTab =
    LECTURE_LEVEL_KEYS.includes(tab);

  const isCourseMaterialsDetail =
    tab === 'materials' && materialsFromCourse;

  const goBack = () => {
    if (isCourseMaterialsDetail) {
      setMaterialsFromCourse(false);
      patch({ tab: 'courseMaterials' });
    } else {
      setMaterialsFromCourse(false);
      patch({ tab: 'home' });
    }
  };

  let content = null;

  if (
    lecs.length === 0 &&
    !COURSE_LEVEL_KEYS.includes(tab)
  ) {
    content = (
      <EmptyState
        icon={Inbox}
        title="등록된 강의가 없습니다"
        action={
          <AddLectureButton courseId={courseId} big />
        }
      >
        강의를 직접 추가하고 슬라이드·영상을
        업로드할 수 있습니다.
      </EmptyState>
    );
  } else if (isLectureTab && !lectureInCourse) {
    content = null;
  } else {
    switch (tab) {
      case 'home':
        content = <CourseHome courseId={courseId} />;
        break;

      case 'todo':
        content = <TodoTab lecture={null} />;
        break;

      case 'concept':
        content = <ConceptTab courseId={courseId} />;
        break;

      case 'notes':
        content = <CourseNotes courseId={courseId} />;
        break;

      case 'quiz':
        content = (
          <QuizTab
            courseId={courseId}
            lecture={null}
          />
        );
        break;

      case 'courseMaterials':
        content = (
          <CourseMaterials courseId={courseId} />
        );
        break;

      case 'lecture':
        content = <LectureTab lecture={lecture} />;
        break;

      case 'analysis':
        content = <AnalysisTab lecture={lecture} />;
        break;

      case 'lectureTodo':
        content = <TodoTab lecture={lecture} />;
        break;

      case 'note':
        content = <NoteTab lecture={lecture} />;
        break;

      case 'lectureQuiz':
        content = (
          <QuizTab
            courseId={courseId}
            lecture={lecture}
          />
        );
        break;

      case 'materials':
        content = <MaterialsTab lecture={lecture} />;
        break;

      default:
        content = <CourseHome courseId={courseId} />;
    }
  }

  return (
    <div className={`hub ${sidebarOpen ? '' : 'collapsed'}`}>
      {sidebarOpen && <CourseSidebar />}

      <main className="hub-main">
        <header className="hub-header">
          <button
            type="button"
            className="icon-btn"
            aria-label="사이드바 접기/펴기"
            onClick={() =>
              patch({ sidebarOpen: !sidebarOpen })
            }
          >
            {sidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>

          <div className="crumb">
            <span className="crumb-app">
              Lecture Hub
            </span>

            <ChevronRight size={14} />

            <button
              type="button"
              className="crumb-course-link"
              onClick={() => {
                setMaterialsFromCourse(false);
                patch({ tab: 'home' });
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
              }}
            >
              {course?.title}
            </button>

            {lectureInCourse && isLectureTab && (
              <>
                <ChevronRight size={14} />
                <strong>
                  {lectureLabel(lecture)} · {lecture.title}
                </strong>
              </>
            )}
          </div>

          <GlobalSearch courseId={courseId} />
          <TermToggle />
          <DemoMenu />
        </header>

        {/* 과목 전체 화면 */}
        {tab !== 'home' && !isLectureTab && (
          <div className="tabs">
            <button
              type="button"
              className="tab"
              onClick={goBack}
            >
              <ArrowLeft size={16} />
              과목 홈으로
            </button>

            <span className="tabs-spacer" />

            <span className="proto-badge">
              <Brain size={13} />
              프로토타입 · AI 결과는 시연 데이터
            </span>
          </div>
        )}

        {/* 과목 자료 목록에서 들어온 상세 자료 */}
        {isCourseMaterialsDetail && (
          <div className="tabs">
            <button
              type="button"
              className="tab"
              onClick={goBack}
            >
              <ArrowLeft size={16} />
              강의 자료 목록으로
            </button>

            <span className="tabs-spacer" />

            <span className="proto-badge">
              <Brain size={13} />
              프로토타입 · AI 결과는 시연 데이터
            </span>
          </div>
        )}

        {/* 개별 강의 화면: 6개 탭 */}
        {isLectureTab && !isCourseMaterialsDetail && (
          <div className="tabs">
            <button
              type="button"
              className="tab"
              onClick={goBack}
            >
              <ArrowLeft size={16} />
              과목 홈으로
            </button>

            <span
              style={{
                width: 1,
                height: 20,
                background: 'var(--border, #ddd)',
                margin: '0 8px',
                flexShrink: 0,
              }}
            />

            <nav
              role="tablist"
              aria-label="강의별 학습 기능"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {LECTURE_TABS.map(
                ({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    className={`tab ${
                      tab === key ? 'on' : ''
                    }`}
                    onClick={() => patch({ tab: key })}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                )
              )}
            </nav>

            <span className="tabs-spacer" />

            <span className="proto-badge">
              <Brain size={13} />
              프로토타입 · AI 결과는 시연 데이터
            </span>
          </div>
        )}

        <div className="hub-content">
          {content}
        </div>
      </main>
    </div>
  );
}

// 과목 및 강의 사이드바
function CourseSidebar() {
  const {
    courseId,
    lectureId,
    tab,
    patch,
    courseLectures,
    retried,
  } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        내 과목
      </div>

      {courses.map((c) => {
        const isCurrentCourse = c.id === courseId;
        const lecs = courseLectures(c.id);

        return (
          <div key={c.id} className="course-group">
            <button
              type="button"
              className={`course-item ${
                isCurrentCourse ? 'on' : ''
              }`}
              onClick={() => {
                const first = lecs[0];

                patch({
                  courseId: c.id,
                  ...(first
                    ? { lectureId: first.id }
                    : {}),
                  tab: 'home',
                });
              }}
            >
              <span>{c.title}</span>
              <span className="muted small">
                {lecs.length}
              </span>
            </button>

            {isCurrentCourse && (
              <ul className="lecture-list">
                {lecs.map((l) => {
                  const status =
                    retried[l.id] &&
                    l.status === 'failed'
                      ? 'processing'
                      : l.status;

                  const selected =
                    l.id === lectureId &&
                    LECTURE_LEVEL_KEYS.includes(tab);

                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        className={`lecture-item ${
                          selected ? 'on' : ''
                        }`}
                        onClick={() =>
                          patch({
                            courseId: c.id,
                            lectureId: l.id,
                            tab: 'lecture',
                          })
                        }
                      >
                        <span className="lec-no">
                          {lectureLabel(l)}
                        </span>

                        <span className="lec-title">
                          {l.title}
                        </span>

                        <span className="lec-meta">
                          {l.date
                            ? fmtDate(l.date)
                            : '날짜 미정'}

                          <StatusDot status={status} />
                        </span>
                      </button>
                    </li>
                  );
                })}

                <li>
                  <AddLectureButton courseId={c.id} />
                </li>
              </ul>
            )}
          </div>
        );
      })}
    </aside>
  );
}

function StatusDot({ status }) {
  const map = {
    ready: ['ok', '준비됨'],
    processing: ['info', '처리 중'],
    failed: ['danger', '처리 실패'],
    empty: ['muted', '자료 없음'],
  };

  const [tone, label] = map[status] || map.empty;

  return (
    <span className={`status status-${tone}`}>
      {status === 'processing' ? (
        <Loader2 size={10} className="spin" />
      ) : status === 'failed' ? (
        <AlertTriangle size={10} />
      ) : (
        <span className="dot" />
      )}
      {label}
    </span>
  );
}

function AddLectureButton({ courseId, big }) {
  const { addLecture } = useStore();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        className={big ? 'btn primary' : 'add-lecture'}
        onClick={() => setOpen(true)}
      >
        <Plus size={14} />
        강의 추가
      </button>
    );
  }

  return (
    <form
      className="add-lecture-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;

        addLecture(courseId, title.trim(), date);
        setOpen(false);
        setTitle('');
        setDate('');
      }}
    >
      <input
        autoFocus
        placeholder="강의 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="강의 날짜"
      />

      <div className="row gap-s">
        <button
          type="submit"
          className="btn primary small"
        >
          추가
        </button>

        <button
          type="button"
          className="btn small"
          onClick={() => setOpen(false)}
        >
          취소
        </button>
      </div>
    </form>
  );
}

function TermToggle() {
  const { termMode, patch } = useStore();

  return (
    <div
      className="term-toggle"
      title="전공용어 표기만 바뀌고, 저장된 스크립트와 시간 정보는 그대로입니다"
    >
      <span className="muted small">
        용어
      </span>

      <Segmented
        size="small"
        value={termMode}
        onChange={(v) => patch({ termMode: v })}
        options={[
          { value: 'spoken', label: '원문' },
          { value: 'ko', label: '한글' },
          { value: 'en', label: 'EN' },
        ]}
      />
    </div>
  );
}

function GlobalSearch({ courseId }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const { termMode, patch } = useStore();
  const go = useNav();
  const ref = useRef(null);

  const results =
    q.trim().length >= 1
      ? searchCourse(courseId, q).slice(0, 12)
      : [];

  useEffect(() => {
    const onDoc = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDoc);

    return () =>
      document.removeEventListener(
        'mousedown',
        onDoc
      );
  }, []);

  return (
    <div className="search" ref={ref}>
      <Search size={15} />

      <input
        placeholder="이 과목에서 검색 (예: 스프린트, refactoring)"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />

      {open && q.trim() && (
        <div className="search-pop">
          {results.length === 0 ? (
            <div className="search-empty">
              일치 결과 없음 · 검색 범위:{' '}
              {getCourse(courseId)?.title}의 색인 완료 자료
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                type="button"
                className="search-item"
                onClick={() => {
                  setOpen(false);

                  if (r.type === 'concept') {
                    patch({
                      tab: 'concept',
                      selectedConceptId: r.concept.id,
                    });
                  } else {
                    go({
                      lectureId: r.lecture.id,
                      time: r.time,
                      slide: r.slide,
                    });
                  }
                }}
              >
                <span
                  className={`search-kind kind-${r.type}`}
                >
                  {{
                    script: '스크립트',
                    slide: '슬라이드',
                    concept: '개념',
                  }[r.type]}
                </span>

                <span className="search-text">
                  {r.type === 'concept'
                    ? conceptName(r.concept, termMode)
                    : r.text}
                </span>

                {r.type !== 'concept' && (
                  <span className="search-loc mono">
                    {lectureLabel(r.lecture)} · S{r.slide}
                    {r.time != null
                      ? ` · ${fmtTime(r.time)}`
                      : ''}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DemoMenu() {
  const { resetDemo, toast } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="menu-wrap">
      <button
        type="button"
        className="icon-btn"
        aria-label="시연 설정"
        onClick={() => setOpen((o) => !o)}
      >
        <Settings2 size={18} />
      </button>

      {open && (
        <div
          className="menu"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={async () => {
              if (
                !window.confirm(
                  '분석 실행 기록, 할 일, 검토 결정, 업로드한 파일을 모두 지우고 처음 상태로 돌립니다. 계속할까요?'
                )
              ) {
                return;
              }

              await resetDemo();
              setOpen(false);
              toast('시연 데이터를 초기화했습니다.');
            }}
          >
            <RotateCcw size={14} />
            시연 데이터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
