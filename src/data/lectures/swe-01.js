// Lecture 01 · 소프트웨어 공학 개요

export default {
  id: 'swe-01',
  courseId: 'swe',
  number: 1,
  title: '소프트웨어 공학 개요',
  titleEn: 'Introduction to Software Engineering',
  date: '2026-09-16',
  duration: 372,
  status: 'ready',
  videoUrl: null,
  slideFile: 'lecture01_intro.pdf',

  slides: [
    { no: 1, title: '소프트웨어 공학 개요', subtitle: 'Introduction to Software Engineering · Lecture 01', bullets: [] },
    { no: 2, title: '소프트웨어란?', bullets: ['프로그램 + 문서 + 설정 데이터', '일반 제품(generic)과 맞춤형 제품(customized)'] },
    { no: 3, title: '소프트웨어 공학이란?', bullets: ['소프트웨어 생산의 모든 측면을 다루는 공학 분야', '명세부터 유지보수까지', '비용·일정·품질의 균형'] },
    { no: 4, title: '왜 중요한가?', bullets: ['사회 전반이 소프트웨어에 의존', '개발 비용보다 변경·유지보수 비용이 큼'] },
    { no: 5, title: '소프트웨어 프로세스', bullets: ['명세 (Specification)', '개발 (Development)', '검증 (Validation)', '진화 (Evolution)'] },
    { no: 6, title: '요구사항과 이해관계자', bullets: ['요구사항: 시스템이 제공해야 할 서비스와 제약', '이해관계자: 시스템에 영향을 주거나 받는 사람들'] },
    { no: 7, title: '좋은 소프트웨어의 속성', bullets: ['유지보수성', '신뢰성·보안', '효율성', '사용성'] },
    { no: 8, title: '수업 안내', bullets: ['팀 프로젝트: 6인 1팀', '제안 발표 → SRS → 최종 발표'] },
  ],

  transcript: [
    { id: 'a1', start: 0, slide: 1, text: '안녕하세요, 소프트웨어공학개론 첫 시간입니다. 오늘은 {{se|software engineering}}이 뭔지부터 얘기해 볼게요.' },
    { id: 'a2', start: 18, slide: 2, text: '소프트웨어라고 하면 보통 프로그램만 떠올리는데, 문서랑 설정 데이터까지 다 포함하는 개념이에요.' },
    { id: 'a3', start: 38, slide: 2, text: '앱스토어에서 파는 앱 같은 건 generic product, 특정 회사 주문으로 만드는 건 customized product라고 합니다.' },
    { id: 'a4', start: 60, slide: 3, text: '그럼 {{se|소프트웨어 공학}}은 뭐냐. 소프트웨어를 만드는 모든 과정을 체계적으로 다루는 공학 분야예요.' },
    { id: 'a5', start: 82, slide: 3, text: '단순히 코딩만이 아니라 명세부터 {{maintenance|유지보수}}까지, 그리고 비용, 일정, 품질을 같이 관리하는 거죠.' },
    { id: 'a6', start: 104, slide: 4, text: '왜 중요하냐면, 지금은 은행, 병원, 교통까지 사회 전체가 소프트웨어에 의존하고 있어요.' },
    { id: 'a7', start: 124, slide: 4, text: '예를 들어 예전에 어떤 공항 수하물 시스템은 테스트를 제대로 안 해서 개항이 1년 넘게 늦어졌어요. 비용도 엄청 늘어났고요.' },
    { id: 'a8', start: 148, slide: 4, text: '그리고 실제로는 처음 개발하는 비용보다 나중에 고치고 {{maintenance|maintenance}}하는 비용이 훨씬 큽니다.' },
    { id: 'a9', start: 168, slide: 5, text: '모든 개발에는 {{process|software process}}가 있습니다. 기본 활동이 네 가지예요.' },
    { id: 'a10', start: 186, slide: 5, text: '명세, 개발, {{validation|validation}}, 그리고 진화. 이 네 가지는 다음 시간에 프로세스 모델 배울 때 계속 나옵니다.' },
    { id: 'a11', start: 210, slide: 6, text: '{{requirements|requirements}}, 요구사항은 시스템이 제공해야 하는 서비스와 제약 조건이에요.' },
    { id: 'a12', start: 232, slide: 6, text: '{{stakeholder|stakeholder}}는 시스템에 영향을 주거나 받는 사람들인데, 사용자만이 아니라 관리자, 운영자도 다 포함돼요.' },
    { id: 'a13', start: 256, slide: 7, text: '좋은 소프트웨어의 속성으로는 유지보수성, 신뢰성, 효율성, 사용성이 있어요.' },
    { id: 'a14', start: 276, slide: 7, text: '이 중에서 유지보수성이 제일 중요하다고 저는 생각해요. 시험에도 자주 나오는 부분이니까 잘 봐 두세요.' },
    { id: 'a15', start: 298, slide: 8, text: '마지막으로 수업 안내입니다. 팀 프로젝트는 6명이 한 팀이에요.' },
    { id: 'a16', start: 316, slide: 8, text: '팀은 이번 주 금요일까지 구성해서 iCampus 게시판에 올려 주세요.' },
    { id: 'a17', start: 336, slide: 8, text: '프로젝트는 제안 발표, SRS, 최종 발표 순서로 진행됩니다. 자세한 건 공지 참고하세요.' },
    { id: 'a18', start: 356, slide: 8, text: '오늘은 여기까지 할게요.' },
  ],

  findings: [
    {
      id: 'f-01-1', type: 'extra', support: 'supported',
      title: '공항 수하물 시스템 실패 사례',
      content: '테스트 부족으로 공항 개항이 1년 넘게 늦어지고 비용이 크게 늘어난 사례를 들었습니다. 슬라이드에는 없는 예시입니다.',
      evidence: ['a7'], slide: 4,
    },
    {
      id: 'f-01-2', type: 'emphasis', support: 'supported',
      title: '좋은 소프트웨어의 속성: 유지보수성',
      content: '"시험에도 자주 나오는 부분"이라고 언급했습니다. 실제 출제 여부는 알 수 없습니다.',
      evidence: ['a14'], slide: 7,
    },
    {
      id: 'f-01-3', type: 'notice', support: 'supported',
      title: '팀 구성 후 iCampus 게시판에 등록',
      content: '6인 1팀으로 구성해 iCampus 게시판에 올리기.',
      duePhrase: '이번 주 금요일까지', dueSuggested: '2026-09-18T23:59',
      evidence: ['a16'], slide: 8,
    },
  ],
};
