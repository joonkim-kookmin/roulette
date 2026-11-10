/* =========================================================
 * 퀴즈 문제 풀 (여기만 수정하면 문제가 바뀝니다)
 * ---------------------------------------------------------
 * - 활성(active: true) 문제 중에서 매번 무작위로 3문제가 출제됩니다.
 *   (출제 개수는 config.js 의 questionsPerPlay 에서 변경)
 * - 보기(options)는 여러 개 체크할 수 있고, 하나만 골라도 정답 보기 전체가 표시됩니다.
 * - 오답 보기를 넣고 싶으면 correct: false 로 적으면 됩니다.
 * - explanation(해설)은 선택 사항입니다. 비워두면 기본 문구가 나옵니다.
 * - 새 문제를 쓰면 active: false → true 로 바꿔 주세요.
 * - 마지막 보기 뒤에는 쉼표(,)를 넣지 않습니다.
 * - 문자열 안에 작은따옴표(')를 쓸 때는 바깥을 큰따옴표(")로 감싸 주세요.
 * ========================================================= */

window.QUIZ_QUESTIONS = [
  {
    id: "q01",
    active: true,
    category: "국민대 소개",
    question: "국민대학교에 대해 맞는 설명에 대한 것만 체크해 주세요!",
    options: [
      { text: "국민대학교는 '도전하는 국민인'이라는 인재상을 가지고 있어요", correct: true },
      { text: "전국대학 최초 대학연합체 사업 ‘쿼드러플 크라운’ 달성(미래자동차·차세대통신·환경·글로벌 공생 분야)했어요", correct: true },
      { text: "국민대학교는 디자인·콘텐츠, 모빌리티, 양자, AI+X, 로봇, 첨단소재·반도체, 물·에너지·환경, 바이오 등 8대 특성화 분야를 육성하고 있어요", correct: true }
    ],
    explanation: ""
  },
  {
    id: "q02",
    active: true,
    category: "2027 신설",
    question: "2027학년도 국민대학교에 신설하는 대학 또는 학과를 체크해 주세요!",
    options: [
      { text: "양자융합대학", correct: true },
      { text: "바이오융합대학", correct: true },
      { text: "양자융합공학과", correct: true },
      { text: "제약공학과", correct: true }
    ],
    explanation: ""
  },
  {
    id: "q03",
    active: true,
    category: "학사 제도",
    question: "국민대학교 전부(과)제도에 맞는 설명을 체크해 주세요",
    options: [
      { text: "1학년 1학기 말에 바로 전부(과)를 신청할 수 있어요", correct: true },
      { text: "전부(과)는 횟수에 제한 없이 할 수 있어요", correct: true },
      { text: "인문, 자연, 예체능 전공선택이 자유로워요", correct: true },
      { text: "오메가 교육시스템을 통해 다른학과를 체험한 후 전공 변경 신청도 가능해요", correct: true }
    ],
    explanation: ""
  },
  {
    id: "q04",
    active: true,
    category: "셔틀버스",
    question: "다음 중 국민대학교 셔틀버스를 운행하고 있는 지하철역을 모두 고르면?",
    options: [
      { text: "1호선, 2호선 시청역", correct: true },
      { text: "2호선, 8호선 잠실역", correct: true },
      { text: "2호선 신촌역", correct: true },
      { text: "3호선 압구정역", correct: true },
      { text: "4호선 길음역", correct: true },
      { text: "5호선 광화문역", correct: true },
      { text: "3호선, 6호선 불광역", correct: true }
    ],
    explanation: ""
  },
  {
    id: "q05",
    active: true,
    category: "진로·취업",
    question: "국민대학교가 우리 아이의 진로·취업을 위해 지원하는 것을 모두 체크해 주세요!",
    options: [
      { text: "교내외 채용정보를 알려줘요", correct: true },
      { text: "진로탐색·진로설정 프로그램을 운영해요", correct: true },
      { text: "자기소개서 특강, 모의면접 등 취업 준비를 도와줘요", correct: true },
      { text: "현장실습과 인턴십 기회를 제공해요", correct: true },
      { text: "진로·취업 고민을 1:1로 상담해 줘요", correct: true }
    ],
    explanation: "이 모든 지원은 국민대학교 경력개발지원단에서 받을 수 있어요."
  },
  {
    id: "q06",
    active: true,
    category: "진로·취업",
    question: "취업 준비도 수업으로 배워요! 국민대학교 진로·취업 교과목에 대해 맞는 설명을 체크해 주세요!",
    options: [
      { text: "자유교양 교과목으로 들을 수 있어요", correct: true },
      { text: "교내외 진로·취업 전문가가 강의해요", correct: true },
      { text: "수강 부담을 줄이기 위해 상대평가 대신 Pass/Non Pass로 성적을 처리해요", correct: true },
      { text: "저학년·고학년에 맞춘 맞춤형 교과목이 있어요", correct: true },
      { text: "공기업, 대기업, 외국계 기업 등 희망 기업 유형별로 다양한 교과목이 있어요", correct: true }
    ],
    explanation: "이 모든 지원은 국민대학교 경력개발지원단에서 받을 수 있어요."
  },
  {
    id: "q07",
    active: true,
    category: "진로·취업",
    question: "전공 고민부터 면접 준비까지! 국민대학교에서 받을 수 있는 진로·취업 상담을 모두 체크해 주세요!",
    options: [
      { text: "전공 고민(복수전공·부전공), 진로탐색 등 진로상담을 받을 수 있어요", correct: true },
      { text: "맞춤형 취업 방법, 자소서 첨삭 등 취업상담을 받을 수 있어요", correct: true },
      { text: "1:1 모의면접을 볼 수 있어요", correct: true },
      { text: "MBTI 성격검사, 직업흥미검사 등 심리검사를 받을 수 있어요", correct: true },
      { text: "현직에 있는 졸업 동문과 온라인으로 상담할 수 있어요", correct: true }
    ],
    explanation: "이 모든 지원은 국민대학교 경력개발지원단에서 받을 수 있어요."
  },

  /* ---------- 아래는 추가용 빈 칸 (내용 작성 후 active: true) ---------- */
  {
    id: "q08", active: false, category: "[분류]",
    question: "[문제 8 입력]",
    options: [
      { text: "[보기 1]", correct: true },
      { text: "[보기 2]", correct: true },
      { text: "[보기 3]", correct: true }
    ],
    explanation: ""
  },
  {
    id: "q09", active: false, category: "[분류]",
    question: "[문제 9 입력]",
    options: [
      { text: "[보기 1]", correct: true },
      { text: "[보기 2]", correct: true },
      { text: "[보기 3]", correct: true }
    ],
    explanation: ""
  },
  {
    id: "q10", active: false, category: "[분류]",
    question: "[문제 10 입력]",
    options: [
      { text: "[보기 1]", correct: true },
      { text: "[보기 2]", correct: true },
      { text: "[보기 3]", correct: true }
    ],
    explanation: ""
  }
];
