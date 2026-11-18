import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpenText, Brain, CheckSquare, ChevronRight, FileQuestion, FolderOpen, Network, NotebookPen,
  PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Search, Settings2, Sparkles, AlertTriangle, Loader2, Inbox,
} from 'lucide-react';
import { courses, searchCourse, conceptName, getCourse } from '../data/index.js';
import { fmtDate, fmtTime, lectureLabel } from '../lib/format.js';
import { useNav, useStore } from '../store.jsx';
import { EmptyState, Segmented } from './common.jsx';
import LectureTab from './LectureTab.jsx';
import AnalysisTab from './AnalysisTab.jsx';
import TodoTab from './TodoTab.jsx';
import ConceptTab from './ConceptTab.jsx';
import NoteTab from './NoteTab.jsx';
import QuizTab from './QuizTab.jsx';
import MaterialsTab from './MaterialsTab.jsx';

const TABS = [
  { key: 'lecture', label: '강의 보기', icon: BookOpenText },
  { key: 'analysis', label: 'AI 분석', icon: Sparkles },
  { key: 'todo', label: '할 일', icon: CheckSquare },
  { key: 'concept', label: '개념', icon: Network },
  { key: 'note', label: '필기 점검', icon: NotebookPen },
  { key: 'quiz', label: '퀴즈', icon: FileQuestion },
  { key: 'materials', label: '자료', icon: FolderOpen },
];

export default function Hub() {
  const store = useStore();
  const { courseId, lectureId, tab, sidebarOpen, patch, getLectureAny, courseLectures, todos } = store;
  const course = getCourse(courseId);
  const lecs = courseLectures(courseId);
  const lecture = getLectureAny(lectureId);
  const lectureInCourse = lecture && lecture.courseId === courseId;

  // 선택된 강의가 현재 과목에 없으면 첫 강의로
  useEffect(() => {
    if (!lectureInCourse && lecs.length) patch({ lectureId: lecs[lecs.length - 1].id });
  }, [lectureInCourse, lecs, patch]);

  const unconfirmed = todos.filter((t) => !t.confirmed && !t.completed).length;
  const courseLevelTabs = ['todo', 'concept', 'quiz'];

  let content;
  if (!lecs.length && !courseLevelTabs.includes(tab)) {
    content = (
      <EmptyState icon={Inbox} title="등록된 강의가 없습니다" action={<AddLectureButton courseId={courseId} big />}>
        iCampus에서 가져온 강의가 없거나 아직 자료가 올라오지 않았습니다. 강의를 직접 추가하고 슬라이드·영상을 업로드할 수 있습니다.
      </EmptyState>
    );
  } else if (!lectureInCourse && !courseLevelTabs.includes(tab)) {
    content = null;
  } else {
    content = {
      lecture: <LectureTab lecture={lecture} />,
      analysis: <AnalysisTab lecture={lecture} />,
      todo: <TodoTab lecture={lectureInCourse ? lecture : null} />,
      concept: <ConceptTab courseId={courseId} />,
      note: <NoteTab lecture={lecture} />,
      quiz: <QuizTab courseId={courseId} />,
      materials: <MaterialsTab lecture={lecture} />,
    }[tab];
  }

  return (
    <div className={`hub ${sidebarOpen ? '' : 'collapsed'}`}>
      {sidebarOpen && <CourseSidebar />}
      <main className="hub-main">
        <header className="hub-header">
          <button type="button" className="icon-btn" aria-label="사이드바 접기/펴기" onClick={() => patch({ sidebarOpen: !sidebarOpen })}>
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <div className="crumb">
            <span className="crumb-app">Lecture Hub</span>
            <ChevronRight size={14} />
            <span>{course?.title}</span>
            {lectureInCourse && (
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
        <nav className="tabs" role="tablist">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => patch({ tab: key })}>
              <Icon size={15} />
              {label}
              {key === 'todo' && unconfirmed > 0 && <span className="count warn">{unconfirmed}</span>}
            </button>
          ))}
          <span className="tabs-spacer" />
          <span className="proto-badge" title="AI 분석 결과는 시연을 위해 미리 준비한 데이터입니다">
            <Brain size={13} /> 프로토타입 · AI 결과는 시연 데이터
          </span>
        </nav>
        <div className="hub-content">{content}</div>
      </main>
    </div>
  );
}

function CourseSidebar() {
  const { courseId, lectureId, patch, courseLectures, retried } = useStore();
  return (
    <aside className="sidebar">
      <div className="sidebar-title">내 과목</div>
      {courses.map((c) => {
        const open = c.id === courseId;
        const lecs = courseLectures(c.id);
        return (
          <div key={c.id} className="course-group">
            <button
              type="button"
              className={`course-item ${open ? 'on' : ''}`}
              onClick={() => {
                const last = lecs[lecs.length - 1];
                patch({ courseId: c.id, ...(last ? { lectureId: last.id } : {}) });
              }}
            >
              <span>{c.title}</span>
              <span className="muted small">{lecs.length}</span>
            </button>
            {open && (
              <ul className="lecture-list">
                {lecs.map((l) => {
                  const status = retried[l.id] && l.status === 'failed' ? 'processing' : l.status;
                  return (
                    <li key={l.id}>
                      <button type="button" className={`lecture-item ${l.id === lectureId ? 'on' : ''}`} onClick={() => patch({ lectureId: l.id })}>
                        <span className="lec-no">{lectureLabel(l)}</span>
                        <span className="lec-title">{l.title}</span>
                        <span className="lec-meta">
                          {l.date ? fmtDate(l.date) : '날짜 미정'}
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
      {status === 'processing' ? <Loader2 size={10} className="spin" /> : status === 'failed' ? <AlertTriangle size={10} /> : <span className="dot" />}
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
      <button type="button" className={big ? 'btn primary' : 'add-lecture'} onClick={() => setOpen(true)}>
        <Plus size={14} /> 강의 추가
      </button>
    );
  }
  return (
    <form
      className="add-lecture-form"
      onSubmit={(e) => {
        e.preventDefault();
        addLecture(courseId, title.trim(), date);
        setOpen(false);
        setTitle('');
        setDate('');
      }}
    >
      <input autoFocus placeholder="강의 제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="강의 날짜" />
      <div className="row gap-s">
        <button type="submit" className="btn primary small">
          추가
        </button>
        <button type="button" className="btn small" onClick={() => setOpen(false)}>
          취소
        </button>
      </div>
    </form>
  );
}

function TermToggle() {
  const { termMode, patch } = useStore();
  return (
    <div className="term-toggle" title="전공용어 표기만 바뀌고, 저장된 스크립트와 시간 정보는 그대로입니다">
      <span className="muted small">용어</span>
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
  const results = q.trim().length >= 1 ? searchCourse(courseId, q).slice(0, 12) : [];

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
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
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      {open && q.trim() && (
        <div className="search-pop">
          {results.length === 0 ? (
            <div className="search-empty">일치 결과 없음 · 검색 범위: {getCourse(courseId)?.title}의 색인 완료 자료</div>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                type="button"
                className="search-item"
                onClick={() => {
                  setOpen(false);
                  if (r.type === 'concept') patch({ tab: 'concept', selectedConceptId: r.concept.id });
                  else go({ lectureId: r.lecture.id, time: r.time, slide: r.slide });
                }}
              >
                <span className={`search-kind kind-${r.type}`}>{{ script: '스크립트', slide: '슬라이드', concept: '개념' }[r.type]}</span>
                <span className="search-text">{r.type === 'concept' ? conceptName(r.concept, termMode) : r.text}</span>
                {r.type !== 'concept' && (
                  <span className="search-loc mono">
                    {lectureLabel(r.lecture)} · S{r.slide}
                    {r.time != null ? ` · ${fmtTime(r.time)}` : ''}
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
      <button type="button" className="icon-btn" aria-label="시연 설정" onClick={() => setOpen((o) => !o)}>
        <Settings2 size={18} />
      </button>
      {open && (
        <div className="menu" onMouseLeave={() => setOpen(false)}>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('분석 실행 기록, 할 일, 검토 결정, 업로드한 파일을 모두 지우고 처음 상태로 돌립니다. 계속할까요?')) return;
              await resetDemo();
              setOpen(false);
              toast('시연 데이터를 초기화했습니다.');
            }}
          >
            <RotateCcw size={14} /> 시연 데이터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
