
import React from 'react';
import {
  FolderOpen,
  FileText,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';

import { getCourse } from '../data/index.js';
import { fmtDate, lectureLabel } from '../lib/format.js';
import { useStore } from '../store.jsx';

export default function CourseMaterials({ courseId }) {
  const {
    patch,
    courseLectures,
  } = useStore();

  const course = getCourse(courseId);
  const lectures = courseLectures(courseId);

  // 특정 강의의 기존 자료 화면으로 이동
  const openMaterials = (lectureId) => {
    patch({
      courseId,
      lectureId,
      tab: 'materials',
    });
  };

  return (
    <div className="course-home">

      {/* 화면 제목 */}
      <div className="course-home-hero">
        <div>
          <span className="course-home-eyebrow">
            LECTURE HUB · 자료
          </span>

          <h1>강의 자료</h1>

          <p>
            {course?.title} · 강의별 자료 모아보기
          </p>

          <p className="course-home-intro">
            이 과목에 등록된 강의의 자료를 확인하고,
            원하는 강의의 슬라이드, 영상, 스크립트,
            필기 파일을 관리할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 강의 목록 */}
      <div className="course-home-section-head">
        <h2 className="course-home-heading">
          강의별 자료 ({lectures.length})
        </h2>

        <span className="muted small">
          강의를 선택하면 해당 강의의 자료 화면으로 이동합니다.
        </span>
      </div>

      {lectures.length === 0 ? (
        <div className="course-home-empty">
          <FolderOpen size={28} />

          <p>
            등록된 강의가 없습니다.
          </p>

          <p className="muted small">
            왼쪽 사이드바에서 강의를 추가하면
            자료를 관리할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="course-home-lectures">
          {lectures.map((lecture) => (
            <div
              key={lecture.id}
              className="course-home-lecture"
            >
              {/* 강의 정보 */}
              <div className="course-home-lecture-main">
                <span className="course-home-lecture-no">
                  {lectureLabel(lecture)}
                </span>

                <strong>
                  {lecture.title}
                </strong>

                <span className="muted small">
                  <CalendarDays size={12} />
                  {lecture.date
                    ? fmtDate(lecture.date)
                    : '날짜 미정'}
                </span>
              </div>

              {/* 자료 화면 이동 */}
              <div className="course-home-lecture-actions">
                <span className="chip">
                  <FileText size={12} />
                  강의 자료
                </span>

                <button
                  type="button"
                  className="btn primary small"
                  onClick={() =>
                    openMaterials(lecture.id)
                  }
                >
                  <FolderOpen size={14} />
                  자료 보기
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
