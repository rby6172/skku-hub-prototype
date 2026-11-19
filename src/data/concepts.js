// 개념 색인 (Concept Chain) — 시연용 예시 데이터
// occurrences: 개념이 나온 위치. segmentId로 적으면 시간·슬라이드는 자동으로 찾아 줍니다.
//   role: intro(처음 소개) | explain(다시 설명) | apply(예제·적용)
// related: 다른 개념과의 관계와, 그 관계를 설명한 실제 발언(segmentId)
// references: 교재·참고 자료 구절 (references.js의 id)

const concepts = [
  {
    id: 'se', courseId: 'swe', term: 'se',
    occurrences: [
      { lectureId: 'swe-01', segmentId: 'a4', role: 'intro' },
      { lectureId: 'swe-01', segmentId: 'a5', role: 'explain' },
      { lectureId: 'swe-02', segmentId: 'b2', role: 'explain' },
    ],
    related: [{ conceptId: 'process', relation: 'extends', lectureId: 'swe-02', segmentId: 'b3' }],
    references: [{ refId: 'tb', section: 'Ch. 1.1', page: 19, quote: '소프트웨어 공학은 명세부터 운영 이후의 유지보수까지, 소프트웨어 생산의 모든 측면을 다루는 공학 분야이다.' }],
  },
  {
    id: 'process', courseId: 'swe', term: 'process',
    occurrences: [
      { lectureId: 'swe-01', segmentId: 'a9', role: 'intro' },
      { lectureId: 'swe-01', segmentId: 'a10', role: 'explain' },
      { lectureId: 'swe-02', segmentId: 'b3', role: 'explain' },
      { lectureId: 'swe-02', segmentId: 'b4', role: 'apply' },
    ],
    related: [
      { conceptId: 'waterfall', relation: 'extends', lectureId: 'swe-02', segmentId: 'b4' },
      { conceptId: 'incremental', relation: 'extends', lectureId: 'swe-02', segmentId: 'b4' },
      { conceptId: 'prototyping', relation: 'extends', lectureId: 'swe-02', segmentId: 'b4' },
    ],
    references: [{ refId: 'tb', section: 'Ch. 2', page: 44, quote: '모든 소프트웨어 프로세스에는 명세, 설계·구현, 검증, 진화라는 기본 활동이 포함된다.' }],
  },
  {
    id: 'requirements', courseId: 'swe', term: 'requirements',
    occurrences: [
      { lectureId: 'swe-01', segmentId: 'a11', role: 'intro' },
      { lectureId: 'swe-02', segmentId: 'b6', role: 'explain' },
      { lectureId: 'swe-02', segmentId: 'b8', role: 'apply' },
      { lectureId: 'swe-03', segmentId: 's3', role: 'apply' },
    ],
    related: [
      { conceptId: 'prototyping', relation: 'prerequisite', lectureId: 'swe-02', segmentId: 'b16' },
      { conceptId: 'userstory', relation: 'extends', lectureId: 'swe-03', segmentId: 's17' },
    ],
    references: [{ refId: 'tb', section: 'Ch. 4.1', page: 102, quote: '요구사항은 시스템이 제공해야 하는 서비스와 시스템 운영에 대한 제약을 기술한 것이다.' }],
  },
  {
    id: 'stakeholder', courseId: 'swe', term: 'stakeholder',
    occurrences: [{ lectureId: 'swe-01', segmentId: 'a12', role: 'intro' }],
    related: [],
    references: [],
  },
  {
    id: 'waterfall', courseId: 'swe', term: 'waterfall',
    occurrences: [
      { lectureId: 'swe-02', segmentId: 'b5', role: 'intro' },
      { lectureId: 'swe-02', segmentId: 'b9', role: 'explain' },
      { lectureId: 'swe-03', segmentId: 's2', role: 'explain' },
    ],
    related: [{ conceptId: 'plandriven', relation: 'example', lectureId: 'swe-02', segmentId: 'b7' }],
    references: [{ refId: 'tb', section: 'Ch. 2.1.1', page: 47, quote: '폭포수 모델은 각 단계를 순서대로 진행하는 계획 중심 프로세스의 예로, 단계별 산출물을 승인한 뒤 다음 단계로 넘어간다.' }],
  },
  {
    id: 'plandriven', courseId: 'swe', term: 'plandriven',
    occurrences: [
      { lectureId: 'swe-02', segmentId: 'b7', role: 'intro' },
      { lectureId: 'swe-03', segmentId: 's4', role: 'explain' },
      { lectureId: 'swe-03', segmentId: 's14', role: 'apply' },
    ],
    related: [{ conceptId: 'agile', relation: 'contrast', lectureId: 'swe-03', segmentId: 's13' }],
    references: [{ refId: 'tb', section: 'Ch. 3.2', page: 76, quote: '계획 중심 개발과 애자일 개발 중 무엇이 적합한지는 시스템의 규모, 안전 요구, 팀의 특성에 따라 달라진다.' }],
  },
  {
    id: 'incremental', courseId: 'swe', term: 'incremental',
    occurrences: [
      { lectureId: 'swe-02', segmentId: 'b11', role: 'intro' },
      { lectureId: 'swe-02', segmentId: 'b12', role: 'explain' },
      { lectureId: 'swe-03', segmentId: 's12', role: 'apply' },
      { lectureId: 'swe-03', segmentId: 's18', role: 'explain' },
    ],
    related: [
      { conceptId: 'agile', relation: 'prerequisite', lectureId: 'swe-02', segmentId: 'b13' },
      { conceptId: 'xp', relation: 'prerequisite', lectureId: 'swe-03', segmentId: 's18' },
    ],
    references: [{ refId: 'tb', section: 'Ch. 2.1.2', page: 49, quote: '점진적 개발은 초기 버전을 만들어 사용자 의견을 받고, 여러 버전을 거쳐 시스템을 완성해 가는 방식이다.' }],
  },
  {
    id: 'agile', courseId: 'swe', term: 'agile',
    occurrences: [
      { lectureId: 'swe-02', segmentId: 'b13', role: 'intro' },
      { lectureId: 'swe-03', segmentId: 's1', role: 'explain' },
      { lectureId: 'swe-03', segmentId: 's3', role: 'explain' },
      { lectureId: 'swe-03', segmentId: 's31', role: 'explain' },
    ],
    related: [{ conceptId: 'manifesto', relation: 'extends', lectureId: 'swe-03', segmentId: 's6' }],
    references: [
      { refId: 'tb', section: 'Ch. 3.1', page: 72, quote: '애자일 방법은 짧은 반복으로 작동하는 소프트웨어를 자주 전달하고 변화에 빠르게 대응하는 것을 목표로 한다.' },
      { refId: 'manifesto', section: '본문', page: 1, quote: '공개된 애자일 선언문은 네 가지 가치와 열두 가지 원칙으로 구성된다.' },
    ],
  },
  {
    id: 'manifesto', courseId: 'swe', term: 'manifesto',
    occurrences: [
      { lectureId: 'swe-03', segmentId: 's6', role: 'intro' },
      { lectureId: 'swe-03', segmentId: 's7', role: 'explain' },
      { lectureId: 'swe-03', segmentId: 's31', role: 'explain' },
    ],
    related: [],
    references: [{ refId: 'manifesto', section: '본문', page: 1, quote: '공개된 애자일 선언문은 네 가지 가치와 열두 가지 원칙으로 구성된다.' }],
  },
  {
    id: 'xp', courseId: 'swe', term: 'xp',
    occurrences: [
      { lectureId: 'swe-03', segmentId: 's15', role: 'intro' },
      { lectureId: 'swe-03', segmentId: 's16', role: 'explain' },
      { lectureId: 'swe-03', segmentId: 's24', role: 'explain' },
    ],
    related: [
      { conceptId: 'agile', relation: 'example', lectureId: 'swe-03', segmentId: 's15' },
      { conceptId: 'userstory', relation: 'extends', lectureId: 'swe-03', segmentId: 's17' },
      { conceptId: 'pair', relation: 'extends', lectureId: 'swe-03', segmentId: 's19' },
      { conceptId: 'tdd', relation: 'extends', lectureId: 'swe-03', segmentId: 's21' },
      { conceptId: 'refactoring', relation: 'extends', lectureId: 'swe-03', segmentId: 's22' },
      { conceptId: 'scrum', relation: 'contrast', lectureId: 'swe-03', segmentId: 's26' },
    ],
    references: [{ refId: 'tb', section: 'Ch. 3.2', page: 78, quote: 'XP는 짧은 릴리스, 테스트 우선 개발, 짝 프로그래밍 같은 실천 방법을 강조하는 대표적인 애자일 방법이다.' }],
  },
  {
    id: 'userstory', courseId: 'swe', term: 'userstory',
    occurrences: [
      { lectureId: 'swe-03', segmentId: 's17', role: 'intro' },
      { lectureId: 'swe-03', segmentId: 's25', role: 'apply' },
    ],
    related: [],
    references: [{ refId: 'tb', section: 'Ch. 3.2.1', page: 80, quote: '사용자 스토리는 사용자가 시스템으로 하고 싶은 일을 짧게 적은 카드로, 계획과 추정의 단위가 된다.' }],
  },
  {
    id: 'pair', courseId: 'swe', term: 'pair',
    occurrences: [
      { lectureId: 'swe-03', segmentId: 's19', role: 'intro' },
      { lectureId: 'swe-03', segmentId: 's20', role: 'explain' },
    ],
    related: [],
    references: [{ refId: 'tb', section: 'Ch. 3.2.4', page: 85, quote: '짝 프로그래밍에서는 두 개발자가 한 컴퓨터에서 함께 작업하며 서로의 코드를 즉시 검토한다.' }],
  },
  {
    id: 'tdd', courseId: 'swe', term: 'tdd',
    occurrences: [{ lectureId: 'swe-03', segmentId: 's21', role: 'intro' }],
    related: [],
    references: [],
  },
  {
    id: 'refactoring', courseId: 'swe', term: 'refactoring',
    occurrences: [
      { lectureId: 'swe-02', segmentId: 'b15', role: 'intro' },
      { lectureId: 'swe-03', segmentId: 's22', role: 'explain' },
    ],
    related: [],
    references: [{ refId: 'tb', section: 'Ch. 3.2.3', page: 83, quote: '리팩토링은 동작을 바꾸지 않으면서 코드 구조를 개선해 변경을 쉽게 만드는 활동이다.' }],
  },
  {
    id: 'scrum', courseId: 'swe', term: 'scrum',
    occurrences: [{ lectureId: 'swe-03', segmentId: 's26', role: 'intro' }],
    related: [{ conceptId: 'sprint', relation: 'extends', lectureId: 'swe-03', segmentId: 's27' }],
    references: [{ refId: 'tb', section: 'Ch. 3.3', page: 88, quote: '스크럼은 애자일 프로젝트 관리를 위한 프레임워크로, 스프린트라는 고정된 기간 단위로 작업을 진행한다.' }],
  },
  {
    id: 'sprint', courseId: 'swe', term: 'sprint',
    occurrences: [{ lectureId: 'swe-03', segmentId: 's27', role: 'intro' }],
    related: [],
    references: [],
  },
  {
    id: 'prototyping', courseId: 'swe', term: 'prototyping',
    occurrences: [{ lectureId: 'swe-02', segmentId: 'b16', role: 'intro' }, { lectureId: 'swe-02', segmentId: 'b17', role: 'apply' }],
    related: [],
    references: [],
  },
];

export default concepts;
