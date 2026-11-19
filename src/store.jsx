// 앱 전체 상태 (서버 없이 브라우저 localStorage에 저장)
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { courses, lectures, getSegment } from './data/index.js';
import { uid } from './lib/format.js';
import { clearFiles } from './lib/fileStore.js';

const STORAGE_KEY = 'skkuhub-demo-v1';

const initialState = {
  screen: 'icampus', // icampus | hub
  courseId: 'swe',
  lectureId: 'swe-03',
  tab: 'home',
  termMode: 'spoken', // spoken(원문) | ko | en
  sidebarOpen: true,
  analyzed: {}, // lectureId -> true
  reviews: {}, // findingId/resultId -> accept | reject | revisit
  todos: [],
  noteTexts: {}, // lectureId -> text
  noteChecked: {}, // lectureId -> 점검 당시 필기 텍스트
  quizTraced: {}, // `${quizId}-${no}` -> true
  customLectures: [], // 학생이 직접 추가한 강의
  lectureVideo: {}, // lectureId -> 업로드한 파일 id (강의 영상으로 사용)
  retried: {}, // 실패한 강의의 재시도 표시
  selectedConceptId: null,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

const StoreContext = createContext(null);
const PlayerContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(load);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* 저장 실패해도 화면은 동작 */
    }
  }, [state]);

  const patch = useCallback((p) => setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })), []);

  const toast = useCallback((message, action) => {
    const id = uid();
    setToasts((t) => [...t, { id, message, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // ---------- 강의 조회 (데이터 + 직접 추가한 강의) ----------
  const getLectureAny = useCallback(
    (id) => lectures[id] || state.customLectures.find((l) => l.id === id),
    [state.customLectures]
  );
  const courseLectures = useCallback(
    (courseId) => {
      const course = courses.find((c) => c.id === courseId);
      const base = course ? course.lectureIds.map((id) => lectures[id]) : [];
      const custom = state.customLectures.filter((l) => l.courseId === courseId);
      return [...base, ...custom].sort((a, b) => a.number - b.number);
    },
    [state.customLectures]
  );

  const addLecture = useCallback(
    (courseId, title, date) => {
      const existing = courseLectures(courseId);
      const number = existing.length ? Math.max(...existing.map((l) => l.number)) + 1 : 1;
      const lec = {
        id: `custom-${uid()}`,
        courseId,
        number,
        title: title || `Lecture ${String(number).padStart(2, '0')}`,
        titleEn: '',
        date: date || '',
        duration: 0,
        status: 'empty',
        videoUrl: null,
        slides: [],
        transcript: [],
        findings: [],
        custom: true,
      };
      patch((s) => ({ customLectures: [...s.customLectures, lec], lectureId: lec.id, tab: 'materials' }));
      return lec;
    },
    [courseLectures, patch]
  );

  // ---------- 할 일 ----------
  const addTodo = useCallback(
    (todo) => patch((s) => ({ todos: [...s.todos, { id: uid(), createdAt: Date.now(), completed: false, confirmed: true, ...todo }] })),
    [patch]
  );
  const updateTodo = useCallback(
    (id, p) => patch((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
    [patch]
  );
  const removeTodo = useCallback((id) => patch((s) => ({ todos: s.todos.filter((t) => t.id !== id) })), [patch]);

  // AI 분석 완료 → 과제·공지를 할 일에 '미확인'으로 추가
  const markAnalyzed = useCallback(
    (lectureId) => {
      const lec = lectures[lectureId];
      const existing = new Set(state.todos.map((t) => t.originFindingId));
      const newTodos = (lec?.findings || [])
        .filter((f) => (f.type === 'assignment' || f.type === 'notice') && !existing.has(f.id))
        .map((f) => ({
          id: uid(),
          title: f.title,
          courseId: lec.courseId,
          lectureId,
          originFindingId: f.id,
          duePhrase: f.duePhrase,
          dueSuggested: f.dueSuggested,
          dueAt: null,
          confirmed: false,
          completed: false,
          auto: true,
          createdAt: Date.now(),
        }));
      setState((s) => ({ ...s, analyzed: { ...s.analyzed, [lectureId]: true }, todos: [...s.todos, ...newTodos] }));
      return newTodos.length;
    },
    [state.todos]
  );

  const setReview = useCallback(
    (id, decision) => patch((s) => ({ reviews: { ...s.reviews, [id]: s.reviews[id] === decision ? undefined : decision } })),
    [patch]
  );

  const resetDemo = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      await clearFiles();
    } catch {
      /* ignore */
    }
    setState(initialState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      patch,
      toast,
      toasts,
      dismissToast,
      getLectureAny,
      courseLectures,
      addLecture,
      addTodo,
      updateTodo,
      removeTodo,
      markAnalyzed,
      setReview,
      resetDemo,
    }),
    [state, patch, toast, toasts, dismissToast, getLectureAny, courseLectures, addLecture, addTodo, updateTodo, removeTodo, markAnalyzed, setReview, resetDemo]
  );

  return (
    <StoreContext.Provider value={value}>
      <PlayerProvider>{children}</PlayerProvider>
    </StoreContext.Provider>
  );
}

// ---------- 재생 상태 (자주 바뀌므로 따로 관리) ----------
function PlayerProvider({ children }) {
  const { lectureId, getLectureAny } = useContext(StoreContext);
  const lecture = getLectureAny(lectureId);
  const duration = lecture?.duration || 0;

  const [time, setTimeState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [seekNonce, setSeekNonce] = useState(0);
  const [videoActive, setVideoActive] = useState(false);
  const timeRef = useRef(0);
  const pendingRef = useRef(null);

  const setTime = useCallback((t) => {
    timeRef.current = t;
    setTimeState(t);
  }, []);

  const seek = useCallback(
    (t) => {
      setTime(Math.max(0, Math.min(t, duration || t)));
      setSeekNonce((n) => n + 1);
    },
    [duration, setTime]
  );

  // 다른 강의로 이동할 때 도착 후 이동할 시각을 예약
  const queueSeek = useCallback((lid, t) => {
    pendingRef.current = { lectureId: lid, time: t };
  }, []);

  // 강의가 바뀌면 예약된 시각(없으면 처음)으로
  useEffect(() => {
    setPlaying(false);
    const p = pendingRef.current;
    pendingRef.current = null;
    const t = p && p.lectureId === lectureId ? p.time : 0;
    timeRef.current = t;
    setTimeState(t);
    setSeekNonce((n) => n + 1);
  }, [lectureId]);

  // 영상이 없을 때: 슬라이드 재생 모드 (가상 시계)
  useEffect(() => {
    if (!playing || videoActive) return undefined;
    const iv = setInterval(() => {
      const next = timeRef.current + 0.25 * rate;
      if (next >= duration) {
        setTime(duration);
        setPlaying(false);
      } else {
        setTime(next);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [playing, videoActive, rate, duration, setTime]);

  const value = useMemo(
    () => ({ time, setTime, playing, setPlaying, rate, setRate, seek, queueSeek, seekNonce, videoActive, setVideoActive, duration }),
    [time, setTime, playing, rate, seek, queueSeek, seekNonce, videoActive, duration]
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

export function usePlayer() {
  return useContext(PlayerContext);
}

// 어느 화면에서든 "그 강의의 그 시점/슬라이드로 이동"
export function useNav() {
  const store = useStore();
  const player = usePlayer();

  return useCallback(
    ({ lectureId, time, slide, segmentId }) => {
      const lec = store.getLectureAny(lectureId);
      if (!lec) return;
      let t = time;
      if (t == null && segmentId) t = getSegment(lectureId, segmentId)?.start;
      if (t == null && slide) t = lec.transcript.find((s) => s.slide === slide)?.start;
      if (t == null) t = 0;
      if (lectureId !== store.lectureId) {
        player.queueSeek(lectureId, t);
        store.patch({ screen: 'hub', courseId: lec.courseId, lectureId, tab: 'lecture' });
      } else {
        store.patch({ screen: 'hub', tab: 'lecture' });
        player.seek(t);
      }
      player.setPlaying(false);
    },
    [store, player]
  );
}
