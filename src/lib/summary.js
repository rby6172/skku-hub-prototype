// 과목 홈·과목 필기 화면에서 쓰는 요약 계산
import { notes } from '../data/index.js';

// 강의 하나의 필기 상태와 점검 결과 개수
export function noteStatus(lectureId, noteTexts, noteChecked) {
  const sample = notes[lectureId];
  const text = noteTexts[lectureId] ?? sample?.text ?? '';
  const checkedText = noteChecked[lectureId];
  const checked = checkedText != null;
  const results = checked && sample ? sample.results : [];
  const count = (type) => results.filter((r) => r.type === type).length;
  return {
    text,
    hasNote: text.trim().length > 0,
    checked,
    stale: checked && checkedText !== text,
    hasDemoResult: !!sample,
    mismatch: count('mismatch'),
    missing: count('missing'),
    insufficient: count('insufficient'),
  };
}
