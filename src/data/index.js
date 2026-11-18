// 모든 시연 데이터를 모아서 화면에서 쓰기 좋게 정리하는 파일
// 새 강의를 추가하려면: lectures 폴더에 파일을 만들고 아래 rawLectures와 courses에 추가하세요.

import swe01 from './lectures/swe-01.js';
import swe02 from './lectures/swe-02.js';
import swe03 from './lectures/swe-03.js';
import { os01, os02 } from './lectures/others.js';
import glossary from './glossary.js';
import concepts from './concepts.js';
import references from './references.js';
import notes from './notes.js';
import quizzes from './quizzes.js';

export const courses = [
  { id: 'swe', title: '소프트웨어공학개론', code: 'SWE3002-42', term: '2026-2학기', lectureIds: ['swe-01', 'swe-02', 'swe-03'] },
  { id: 'os', title: '운영체제', code: 'SWE3004-41', term: '2026-2학기', lectureIds: ['os-01', 'os-02'] },
  { id: 'net', title: '컴퓨터네트웍개론', code: 'SWE2009-43', term: '2026-2학기', lectureIds: [] },
];

const rawLectures = [swe01, swe02, swe03, os01, os02];

// 스크립트 구간의 end를 다음 구간의 start로 채워 넣는다
function normalize(lecture) {
  const transcript = lecture.transcript.map((seg, i, arr) => ({
    ...seg,
    end: seg.end ?? (arr[i + 1] ? arr[i + 1].start : lecture.duration),
  }));
  return { ...lecture, transcript };
}

export const lectures = Object.fromEntries(rawLectures.map((l) => [l.id, normalize(l)]));

export { glossary, concepts, references, notes, quizzes };

export function getCourse(courseId) {
  return courses.find((c) => c.id === courseId);
}

export function getLecture(lectureId) {
  return lectures[lectureId];
}

export function getSegment(lectureId, segmentId) {
  return lectures[lectureId]?.transcript.find((s) => s.id === segmentId);
}

// 특정 시각에 재생 중인 스크립트 구간
export function segmentAt(lecture, time) {
  const t = lecture.transcript;
  for (let i = t.length - 1; i >= 0; i--) {
    if (time >= t[i].start) return t[i];
  }
  return t[0];
}

// 슬라이드에 연결된 스크립트 구간들 (같은 슬라이드를 여러 번 설명해도 모두 나옴)
export function segmentsForSlide(lecture, slideNo) {
  return lecture.transcript.filter((s) => s.slide === slideNo);
}

// 위치 정보 {lectureId, segmentId} 또는 {lectureId, slide} → 시간·슬라이드·인용문으로 풀기
export function resolveAnchor(anchor) {
  const lecture = lectures[anchor.lectureId];
  if (!lecture) return null;
  if (anchor.segmentId) {
    const seg = lecture.transcript.find((s) => s.id === anchor.segmentId);
    if (!seg) return null;
    return { lecture, time: seg.start, slide: seg.slide, text: seg.text, kind: 'script' };
  }
  if (anchor.slide) {
    const slide = lecture.slides.find((s) => s.no === anchor.slide);
    const first = segmentsForSlide(lecture, anchor.slide)[0];
    return {
      lecture,
      time: first ? first.start : null,
      slide: anchor.slide,
      text: slide ? `${slide.title} — ${slide.bullets.join(' / ')}` : '',
      kind: 'slide',
    };
  }
  return null;
}

// 문장 안의 {{용어ID|말한 표기}}를 표시 모드에 맞게 바꾼 일반 텍스트
export function plainText(text, mode = 'spoken') {
  return text.replace(/\{\{(\w+)\|([^}]+)\}\}/g, (_, id, spoken) => termLabel(id, spoken, mode));
}

export function termLabel(id, spoken, mode) {
  const g = glossary[id];
  if (!g || mode === 'spoken') return spoken;
  return mode === 'ko' ? g.ko : g.en;
}

export function conceptName(concept, mode) {
  const g = glossary[concept.term];
  if (!g) return concept.term;
  if (mode === 'en') return g.en;
  if (mode === 'ko') return g.ko;
  return `${g.ko} (${g.en})`;
}

// 과목 전체 검색: 슬라이드, 스크립트, 개념
export function searchCourse(courseId, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const course = getCourse(courseId);
  const results = [];
  for (const lid of course.lectureIds) {
    const lec = lectures[lid];
    for (const seg of lec.transcript) {
      const variants = ['spoken', 'ko', 'en'].map((m) => plainText(seg.text, m).toLowerCase());
      if (variants.some((v) => v.includes(q))) {
        results.push({ type: 'script', lecture: lec, time: seg.start, slide: seg.slide, text: plainText(seg.text, 'spoken') });
      }
    }
    for (const sl of lec.slides) {
      const hay = `${sl.title} ${sl.subtitle ?? ''} ${sl.bullets.join(' ')}`.toLowerCase();
      if (hay.includes(q)) {
        const first = segmentsForSlide(lec, sl.no)[0];
        results.push({ type: 'slide', lecture: lec, time: first?.start ?? null, slide: sl.no, text: `${sl.title} — ${sl.bullets.join(' / ')}` });
      }
    }
  }
  for (const c of concepts.filter((c) => c.courseId === courseId)) {
    const g = glossary[c.term];
    if (g && (g.ko.toLowerCase().includes(q) || g.en.toLowerCase().includes(q))) {
      results.unshift({ type: 'concept', concept: c, text: `${g.ko} (${g.en})` });
    }
  }
  return results;
}

export const FINDING_TYPES = {
  correction: { label: '구두 정정', short: '정정' },
  extra: { label: '추가 설명', short: '추가 설명' },
  assignment: { label: '과제', short: '과제' },
  notice: { label: '공지', short: '공지' },
  emphasis: { label: '강조', short: '강조' },
};

export const SUPPORT = {
  supported: { label: '뒷받침됨', tone: 'ok' },
  uncertain: { label: '미확정', tone: 'warn' },
  conflict: { label: '상충', tone: 'danger' },
  insufficient: { label: '근거 부족', tone: 'muted' },
};

export const ROLE = {
  intro: '처음 소개',
  explain: '다시 설명',
  apply: '예제·적용',
};

export const RELATION = {
  prerequisite: '먼저 알아야 하는 개념',
  extends: '확장·세부 개념',
  contrast: '비교 대상',
  example: '대표적인 예',
};
