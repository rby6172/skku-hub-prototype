
import React from 'react';
import {
  NotebookPen,
  CheckCircle2,
  Clock3,
  ArrowRight,
  FileText,
} from 'lucide-react';

import { getCourse, notes } from '../data/index.js';
import { fmtDate, lectureLabel } from '../lib/format.js';
import { useStore } from '../store.jsx';

export default function CourseNotes({ courseId }) {
  const {
    patch,
    courseLectures,
    noteTexts,
    noteChecked,
  } = useStore();

  const course = getCourse(courseId);
  const lectures = courseLectures(courseId);

  // 필기가 있거나 점검 기록이 있는 강의 추출
  const noteItems = lectures
    .map((lecture) => {
      const sample = notes[lecture.id];

      const text =
        noteTexts[lecture.id] ?? sample?.text ?? '';

      const checkedText = noteChecked[lecture.id];

      const hasNote = text.trim().length > 0;
      const hasChecked = checkedText != null;

      return {
        lecture,
        hasNote,
        hasChecked,
        isUpToDate:
          hasChecked && checkedText === text,
      };
    })
    .filter((item) => item.hasNote || item.hasChecked);

  const openNote = (lectureId) => {
    patch({
      courseId,
      lectureId,
      tab: 'note',
    });
  };

  return (
    <div className="course-home">
      {/* 화면 제목 */}
      <div className="course-home-hero">
        <div>
          <span className="course-home-eyebrow">
            LECTURE HUB · 필기
          </span>

          <h1>필기</h1>

          <p>
            {course?.title} · 강의별 필기 모아보기
          </p>

          <p className="course-home-intro">
            강의에서 작성한 필기를 한곳에서 확인하고,
            필요한 강의의 필기 점검을 이어서 진행할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 필기 목록 */}
      <h2 className="course-home-heading">
        강의별 필기 ({noteItems.length})
      </h2>

      {noteItems.length === 0 ? (
        <div className="course-home-empty">
          <NotebookPen size={28} />

          <p>아직 작성된 필기가 없습니다.</p>

          <p className="muted small">
            강의를 선택하고 필기 점검 화면에서
            필기를 작성하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="course-home-lectures">
          {noteItems.map(
            ({
              lecture,
              hasNote,
              hasChecked,
              isUpToDate,
            }) => (
              <div
                key={lecture.id}
                className="course-home-lecture"
                style={{
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {/* 강의 정보 */}
                  <div
                    className="course-home-lecture-main"
                    style={{
                      marginBottom: 10,
                    }}
                  >
                    <span className="course-home-lecture-no">
                      {lectureLabel(lecture)}
                    </span>

                    <strong>{lecture.title}</strong>

                    <span className="muted small">
                      {lecture.date
                        ? fmtDate(lecture.date)
                        : '날짜 미정'}
                    </span>
                  </div>

                  {/* 필기 유무 및 점검 상태 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    {hasNote && (
                      <span className="chip">
                        <FileText size={12} />
                        필기 있음
                      </span>
                    )}

                    {hasChecked && isUpToDate ? (
                      <span className="chip chip-ok">
                        <CheckCircle2 size={12} />
                        점검 완료
                      </span>
                    ) : hasChecked ? (
                      <span className="chip chip-info">
                        <Clock3 size={12} />
                        점검 후 필기 변경됨
                      </span>
                    ) : (
                      <span className="chip">
                        <Clock3 size={12} />
                        점검 전
                      </span>
                    )}
                  </div>
                </div>

                {/* 해당 강의 필기로 이동 */}
                <button
                  type="button"
                  className="btn primary small"
                  onClick={() => openNote(lecture.id)}
                >
                  필기 확인 및 점검
                  <ArrowRight size={14} />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
