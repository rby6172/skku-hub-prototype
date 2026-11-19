
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

import { getCourse } from '../data/index.js';
import { fmtDate, lectureLabel } from '../lib/format.js';
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
    analyzed,
  } = useStore();

  const course = getCourse(courseId);
  const lecs = courseLectures(courseId);

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
