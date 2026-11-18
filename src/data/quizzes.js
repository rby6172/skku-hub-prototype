// iCampus 퀴즈 결과 (iCampus 연동을 가정한 시연용 데이터)
// resultReleased: 결과(점수·정오) 공개 여부 / item.answerReleased: 공식 정답 공개 여부
// 공식 정답이 공개된 문항만 "강의 근거 추적"을 쓸 수 있습니다.
// trace: 미리 준비한 근거 검색 결과 (segmentId 또는 slide)

const quizzes = [
  {
    id: 'quiz3', courseId: 'swe', title: 'Quiz 3', range: 'Lecture 02–03', date: '2026-10-14',
    resultReleased: true, score: 6, maxScore: 10,
    items: [
      {
        no: 1, question: '폭포수 모델이 가장 적합한 프로젝트는?',
        choices: ['요구사항이 자주 바뀌는 스타트업 앱', '요구사항이 안정적이고 명확한 프로젝트', 'UI를 빠르게 검증해야 하는 프로젝트', '고객이 매일 개발에 참여하는 프로젝트'],
        response: 2, answer: 2, answerReleased: true, correct: true, points: 2,
        trace: [
          { lectureId: 'swe-02', segmentId: 'b8', relevance: 0.93 },
          { lectureId: 'swe-02', slide: 5, relevance: 0.81 },
          { lectureId: 'swe-03', segmentId: 's14', relevance: 0.62 },
        ],
      },
      {
        no: 2, question: 'XP(Extreme Programming)의 일반적인 릴리스 주기로 옳은 것은?',
        choices: ['1~2일', '2~3주', '2~3개월', '1년'],
        response: 3, answer: 2, answerReleased: true, correct: false, points: 0,
        trace: [
          { lectureId: 'swe-03', segmentId: 's24', relevance: 0.96, note: '교수자의 구두 정정 (슬라이드 9의 "2~3개월" → "2~3주")' },
          { lectureId: 'swe-03', segmentId: 's23', relevance: 0.74, note: '정정 전 슬라이드 내용을 읽은 부분' },
          { lectureId: 'swe-03', segmentId: 's16', relevance: 0.58 },
        ],
      },
      {
        no: 3, question: '애자일 선언문의 가치에 해당하지 않는 것은?',
        choices: ['개인과 상호작용', '작동하는 소프트웨어', '포괄적인 문서를 가장 우선함', '변화에 대응'],
        response: 3, answer: 3, answerReleased: true, correct: true, points: 2,
        trace: [
          { lectureId: 'swe-03', segmentId: 's7', relevance: 0.91 },
          { lectureId: 'swe-03', segmentId: 's10', relevance: 0.88 },
          { lectureId: 'swe-03', segmentId: 's8', relevance: 0.86 },
        ],
      },
      {
        no: 4, question: 'Scrum에서 스프린트의 일반적인 길이는?',
        choices: ['1~4주', '1~2개월', '3~6개월', '정해진 길이 없음'],
        response: 2, answer: 1, answerReleased: true, correct: false, points: 0,
        trace: [
          { lectureId: 'swe-03', segmentId: 's27', relevance: 0.95 },
          { lectureId: 'swe-03', slide: 10, relevance: 0.9 },
          { lectureId: 'swe-03', segmentId: 's26', relevance: 0.55 },
        ],
      },
      {
        no: 5, question: '점진적 개발의 장점을 한 가지 서술하시오.',
        choices: null,
        response: '고객 피드백을 빨리 받을 수 있다.', answer: null, answerReleased: false, correct: true, points: 2,
        trace: [],
      },
    ],
  },
  {
    id: 'quiz4', courseId: 'swe', title: 'Quiz 4', range: 'Lecture 04', date: '2026-10-21',
    resultReleased: false, score: null, maxScore: 10,
    items: [],
  },
];

export default quizzes;
