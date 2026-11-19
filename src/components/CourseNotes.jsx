
import React from 'react';
import {
  NotebookPen,
  CheckCircle2,
  Clock3,
  ArrowRight,
  FileText,
  PenLine,
  AlertTriangle,
} from 'lucide-react';

import { getCourse } from '../data/index.js';
import { fmtDate, lectureLabel } from '../lib/format.js';
import { noteStatus } from '../lib/summary.js';
import { useStore } from '../store.jsx';

const LECTURE_STATUS = { processing: '스크립트 처리 중', failed: '처리 실패', empty: '자료 없음' };

export default function CourseNotes({ courseId }) {
  const {
    patch,
    courseLectures,
    noteTexts,
    noteChecked,
  } = useStore();

  const course = getCourse(courseId);
  const lectures = courseLectures(courseId);

  // 과목의 모든 강의를 보여 주고, 필기가 없는 강의는 '필기 없음'으로 표시
  const noteItems = lectures.map((lecture) => {
    const st = noteStatus(lecture.id, noteTexts, noteChecked);
    const preview = st.text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' / ');

    return {
      lecture,
      st,
      preview,
      hasNote: st.hasNote,
      hasChecked: st.checked,
      isUpToDate: st.checked && !st.stale,
    };
  });

  const writtenCount = noteItems.filter((n) => n.hasNote).length;

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
        강의별 필기 (작성 {writtenCount} / {noteItems.length}강)
      </h2>

      {noteItems.length === 0 ? (
        <div className="course-home-empty">
          <NotebookPen size={28} />

          <p>등록된 강의가 없습니다.</p>

          <p className="muted small">
            왼쪽에서 강의를 추가하면 강의별 필기를
            여기에서 모아 볼 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="course-home-lectures">
          {noteItems.map(
            ({
              lecture,
              st,
              preview,
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
                    {LECTURE_STATUS[lecture.status] && (
                      <span className="chip chip-warn">
                        <AlertTriangle size={12} />
                        {LECTURE_STATUS[lecture.status]}
                      </span>
                    )}

                    {!hasNote ? (
                      <span className="chip chip-plain">
                        <FileText size={12} />
                        필기 없음
                      </span>
                    ) : (
                      <span className="chip chip-plain">
                        <FileText size={12} />
                        필기 있음
                      </span>
                    )}

                    {hasNote && (hasChecked && isUpToDate ? (
                      <span className="chip chip-ok">
                        <CheckCircle2 size={12} />
                        점검 완료
                      </span>
                    ) : hasChecked ? (
                      <span className="chip chip-warn">
                        <Clock3 size={12} />
                        점검 후 필기 변경됨 · 다시 점검 필요
                      </span>
                    ) : (
                      <span className="chip chip-plain">
                        <Clock3 size={12} />
                        점검 전
                      </span>
                    ))}

                    {isUpToDate && st.mismatch > 0 && (
                      <span className="chip chip-danger">불일치 {st.mismatch}</span>
                    )}
                    {isUpToDate && st.missing > 0 && (
                      <span className="chip chip-warn">누락 가능성 {st.missing}</span>
                    )}
                    {isUpToDate && st.insufficient > 0 && (
                      <span className="chip chip-plain">근거 부족 {st.insufficient}</span>
                    )}
                  </div>

                  {preview && (
                    <p className="note-preview muted small">{preview}</p>
                  )}
                </div>

                {/* 해당 강의 필기로 이동 */}
                {hasNote ? (
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={() => openNote(lecture.id)}
                  >
                    필기 확인 및 점검
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => openNote(lecture.id)}
                  >
                    <PenLine size={13} />
                    필기 작성하기
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
