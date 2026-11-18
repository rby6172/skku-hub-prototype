# 시연 데이터 작성법 (데이터 담당용)

화면에 나오는 모든 강의 내용은 `src/data/` 폴더의 파일에서 읽어 옵니다.
코드를 몰라도 아래 형식만 지키면 내용을 바꿀 수 있습니다. 엑셀로 정리해서 넘겨 주면 구현 담당이 AI로 변환해도 됩니다.

| 파일 | 내용 |
|---|---|
| `lectures/swe-01.js` ~ `swe-03.js` | 강의 1개 = 파일 1개 (슬라이드, 스크립트, AI 분석 결과) |
| `glossary.js` | 전공용어 사전 (한글 / 영어 표기) |
| `concepts.js` | 개념 색인 · Concept Chain |
| `references.js` | 교재·참고 자료 목록 |
| `notes.js` | 개인 필기 예시와 필기 점검 결과 |
| `quizzes.js` | iCampus 퀴즈 결과와 근거 추적 결과 |
| `index.js` | 과목 목록 (새 강의 파일을 추가하면 여기에도 등록) |

---

## 1. 강의 파일 (`lectures/swe-03.js` 참고)

```js
export default {
  id: 'swe-03',            // 고유 ID (과목-번호)
  courseId: 'swe',
  number: 3,               // 강의 순서 (개념 등장 순서를 정할 때 사용)
  title: '애자일 방법론',
  date: '2026-10-07',
  duration: 700,           // 강의 길이(초). 영상이 있으면 영상 길이와 맞추기
  status: 'ready',         // ready | processing | failed | empty
  videoUrl: '/videos/swe-03.mp4',  // 영상이 없으면 null → "슬라이드 재생 모드"
  slides: [ ... ],
  transcript: [ ... ],
  findings: [ ... ],
};
```

### 강의 영상 넣기
- `public/videos/` 폴더에 mp4를 넣고 `videoUrl: '/videos/파일명.mp4'`로 적으면 됩니다.
- 또는 앱의 **자료 탭에서 영상 업로드 → "강의 영상으로 사용"**을 눌러도 재생됩니다 (그 브라우저에서만).

### 슬라이드
```js
{ no: 9, title: 'XP 릴리스 주기', bullets: ['릴리스 주기: 2~3개월', '...'] }
```
- 실제 슬라이드 이미지를 쓰고 싶으면 PPT를 PNG로 내보내 `public/slides/swe-03/9.png`에 넣고 `image: '/slides/swe-03/9.png'`를 추가하세요.

### 스크립트 (가장 중요)
```js
{ id: 's24', start: 434, slide: 9, text: '아, 이거 제가 잘못 적었네요. 2~3개월이 아니라 2~3주가 맞습니다.' }
```
- `start`: 이 문장이 시작하는 시각(초). 7분 14초 → 434
- `slide`: 이 문장이 설명하는 슬라이드 번호
- `end`는 안 적어도 됩니다 (다음 문장의 start로 자동 계산)
- **전공용어 표시**: `{{용어ID|실제로 말한 표기}}` 형식으로 쓰면 상단의 "용어 원문/한글/EN" 전환이 적용됩니다.
  - 예: `{{sprint|sprint}}라고 하는데` → 한글 모드에서 "스프린트"로 표시
  - 용어ID는 `glossary.js`에 있어야 합니다. 없으면 말한 그대로 표시됩니다.

> Whisper 같은 STT로 영상을 한 번 돌리면 시작 시각과 문장이 나오니, 그 결과에 `slide` 번호만 붙이면 됩니다.

### AI 분석 결과 (findings)
```js
{
  id: 'f-03-1',
  type: 'correction',      // correction(구두 정정) | extra(추가 설명) | assignment(과제) | notice(공지) | emphasis(강조)
  support: 'supported',    // supported(뒷받침됨) | uncertain(미확정) | conflict(상충) | insufficient(근거 부족)
  title: 'XP 릴리스 주기 정정',
  content: '설명 문장',
  before: '릴리스 주기: 2~3개월', after: '릴리스 주기: 2~3주',  // 정정일 때만. before는 슬라이드 문장과 같게
  duePhrase: '다음 주 수요일 자정까지', dueSuggested: '2026-10-14T23:59',  // 과제·공지일 때만
  evidence: ['s23', 's24'], // 근거가 된 스크립트 문장 id
  slide: 9,
}
```
- 과제·공지(`assignment`, `notice`)는 AI 분석을 실행하면 할 일 목록에 "미확인"으로 자동 추가됩니다.
- 정정의 `before`가 슬라이드 문장과 같으면, 분석 후 슬라이드에 취소선과 정정 주석이 표시됩니다.

---

## 2. 개념 (`concepts.js`)
```js
{
  id: 'incremental', courseId: 'swe', term: 'incremental',   // term = glossary 용어ID
  occurrences: [
    { lectureId: 'swe-02', segmentId: 'b11', role: 'intro' },   // intro 처음 소개 | explain 다시 설명 | apply 예제·적용
    { lectureId: 'swe-03', segmentId: 's18', role: 'explain' },
  ],
  related: [{ conceptId: 'agile', relation: 'prerequisite', lectureId: 'swe-02', segmentId: 'b13' }],
  references: [{ refId: 'tb', section: 'Ch. 2.1.2', page: 49, quote: '요약 문장' }],
}
```
- 두 강의 이상에 나오면 자동으로 "반복 개념"으로 표시됩니다.
- `related`는 강의에서 두 개념의 관계를 실제로 말한 문장(segmentId)이 있을 때만 넣어 주세요.
- 교재 `quote`는 저작권 때문에 원문 대신 **직접 요약한 문장**을 쓰세요.

## 3. 필기 (`notes.js`)
- `text`: 학생 필기 원문
- `results[].noteLine`: 문제가 된 필기 줄을 **공백까지 똑같이** 적어야 필기에 색이 칠해집니다.
- `type`: missing(누락 가능성) | mismatch(불일치) | insufficient(근거 부족)

## 4. 퀴즈 (`quizzes.js`)
- `answerReleased: false`인 문항은 근거 추적 버튼 대신 "공식 정답 미공개" 안내가 나옵니다.
- `trace`: 관련 강의 위치 상위 3개 (`segmentId` 또는 `slide`) + 관련도(0~1)

## 5. 새 강의 추가 순서
1. `lectures/swe-04.js`를 만든다 (swe-03.js 복사해서 수정)
2. `index.js`의 `import`와 `rawLectures`에 추가
3. `courses`의 `lectureIds`에 `'swe-04'` 추가
