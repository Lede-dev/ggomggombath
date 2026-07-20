export type Service = {
  number: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  intro: string;
  items: string[];
  concerns: string[];
  included: string[];
  checks: string[];
};

export type CasePost = {
  id: string;
  title: string;
  link: string;
  date: string;
  dateIso: string;
  category: string;
  image: string;
  images: string[];
  excerpt: string;
  content: string[];
  area: string;
  product: string;
  issues: string[];
};

export type WorkCardPost = Pick<CasePost, "id" | "title" | "date" | "dateIso" | "image" | "excerpt" | "area" | "product">;

export type BlogStats = {
  completedWorks: number;
  sourceCategory: string;
  sourceUrl: string;
};

export const primaryNavigation = [
  { label: "부분시공", path: "/services" },
  { label: "시공후기", path: "/works" },
  { label: "진행과정", path: "/process" },
  { label: "자주 묻는 질문", path: "/faq" },
] as const;

export function getNaverImageVariants(source: string) {
  const withType = (type: "s3" | "w2" | "w1") => {
    try {
      const url = new URL(source);
      if (url.hostname.endsWith("pstatic.net")) url.searchParams.set("type", type);
      return url.toString();
    } catch {
      return source;
    }
  };

  return {
    thumbnail: withType("s3"),
    medium: withType("w2"),
    large: withType("w1"),
  } as const;
}

export const brand = {
  name: "꼼꼼욕실",
  englishName: "GGOMGGOM BATH",
  logoPath: "/logo.svg?v=20260721-navy-v3",
  tagline: "바꿔야 할 곳만, 꼼꼼하게.",
  description:
    "서울·인천·경기 욕실 부분시공 전문. 변기, 세면기, 수전, 욕실장과 욕실용품을 합리적인 비용으로 깔끔하게 교체합니다.",
  serviceArea: "서울 전 지역 · 인천 · 경기",
  phone: "010-2939-2537",
  phoneHref: "tel:+821029392537",
  naverBlog: "https://blog.naver.com/refresh-bath",
  naverRss: "https://rss.blog.naver.com/refresh-bath.xml",
  youtube: "https://www.youtube.com/@%EA%BC%BC%EA%BC%BC%EC%9A%95%EC%8B%A4",
  instagram: "https://www.instagram.com/ggomggombath/",
} as const;

export const services: Service[] = [
  {
    number: "01",
    slug: "toilet-replacement",
    title: "양변기 교체",
    shortTitle: "변기 교체",
    description: "공간과 예산에 맞는 제품을 제안하고 기존 도기 철거부터 수평·마감까지 진행합니다.",
    intro: "자주 막히거나 물내림이 약한 변기는 내부 부속만의 문제가 아닐 수 있습니다. 현장 배관과 바닥 상태, 기존 도기 규격을 함께 확인한 뒤 설치 가능한 제품을 안내합니다.",
    items: ["일반형 투피스", "치마형 투피스", "원피스 변기"],
    concerns: ["물내림이 약하거나 막힘이 반복되는 경우", "도기가 깨지거나 흔들리는 경우", "악취와 누수가 반복되는 경우"],
    included: ["기존 도기 철거", "배관·플랜지 상태 확인", "새 제품 설치와 수평 조정", "작동·누수 확인과 주변 마감"],
    checks: ["욕실 전체와 기존 변기 정면 사진", "변기 옆면과 벽 사이 간격", "희망 제품명 또는 모델명", "시공 지역과 가능한 일정"],
  },
  {
    number: "02",
    slug: "washbasin-replacement",
    title: "세면기 교체",
    shortTitle: "세면대 교체",
    description: "배관 상태와 욕실 구조를 먼저 확인해 사용성과 청소 편의성을 함께 고려합니다.",
    intro: "세면대는 도기 모양뿐 아니라 급수·배수 위치와 벽면 고정 상태가 설치 가능 여부를 좌우합니다. 기존 구조를 확인해 간섭 없이 사용할 수 있는 제품을 안내합니다.",
    items: ["긴다리 세면기", "원피스 반다리", "수전 동시 교체"],
    concerns: ["도기 균열이나 흔들림이 있는 경우", "배수구 주변 누수와 냄새가 있는 경우", "낮은 높이와 좁은 사용 공간이 불편한 경우"],
    included: ["기존 세면기 철거", "급수·배수 위치 확인", "도기와 수전 설치", "배수·누수 확인과 실리콘 마감"],
    checks: ["세면대 전체 정면 사진", "하부 배관과 벽면 사진", "좌우 공간의 폭", "수전 동시 교체 여부"],
  },
  {
    number: "03",
    slug: "faucet-replacement",
    title: "수전 · 샤워 교체",
    shortTitle: "수전 교체",
    description: "누수와 노후 부속을 점검하고 매일 손이 닿는 수전과 샤워 설비를 안정적으로 교체합니다.",
    intro: "수전 누수는 본체뿐 아니라 연결 호스와 편심, 벽 안쪽 배관 상태의 영향을 받을 수 있습니다. 설치 방식과 타공 규격을 먼저 확인해 맞는 제품을 선택합니다.",
    items: ["원홀·3홀 수전", "샤워 수전", "해바라기·슬라이드바"],
    concerns: ["손잡이를 잠가도 물이 떨어지는 경우", "온수와 냉수 조절이 원활하지 않은 경우", "샤워 수전이나 호스가 부식된 경우"],
    included: ["기존 수전과 부속 철거", "연결 규격과 배관 상태 확인", "새 수전·샤워 설비 설치", "통수·누수·작동 확인"],
    checks: ["수전 전체 사진", "세면대 타공 형태 또는 벽 배관", "희망 제품과 색상", "누수 위치가 보이는 사진"],
  },
  {
    number: "04",
    slug: "bathroom-cabinet",
    title: "욕실장 · 거울 교체",
    shortTitle: "욕실장 교체",
    description: "수납 방식과 벽면 상태에 맞춰 욕실장, 거울, 선반과 액세서리를 깔끔하게 설치합니다.",
    intro: "욕실장과 거울은 벽면 재질, 기존 타공 위치, 조명과 수전 간섭을 확인해야 안전하게 설치할 수 있습니다. 필요한 수납량과 욕실 폭을 기준으로 제품을 안내합니다.",
    items: ["슬라이드 욕실장", "거울 세트", "선반·욕실 액세서리"],
    concerns: ["욕실장 문과 경첩이 손상된 경우", "거울 부식이나 수납 부족이 불편한 경우", "선반과 액세서리를 함께 정리하고 싶은 경우"],
    included: ["기존 장·거울 철거", "벽면과 타공 위치 확인", "수평을 맞춘 제품 설치", "문 작동과 고정 상태 확인"],
    checks: ["설치할 벽면 전체 사진", "가로·세로 사용 가능 공간", "조명과 수전 위치", "희망 수납 방식과 제품"],
  },
];

export const serviceBySlug = new Map(services.map((service) => [service.slug, service]));

export const reasons = [
  {
    keyword: "DETAIL",
    title: "보이지 않는 곳까지",
    description: "철거 후 배관과 바닥 상태를 확인하고, 흔들림과 누수 가능성을 줄이는 마감을 우선합니다.",
  },
  {
    keyword: "CLEAR",
    title: "필요한 시공만 명확하게",
    description: "현장 사진과 요청을 기준으로 교체 범위와 제품 선택지를 이해하기 쉽게 안내합니다.",
  },
  {
    keyword: "LOCAL",
    title: "수도권 현장 경험",
    description: "서울·인천·경기 아파트와 주거 공간의 다양한 욕실 구조를 꾸준히 시공해 왔습니다.",
  },
] as const;

export const processSteps = [
  { step: "01", title: "사진 상담", description: "교체할 공간 전체와 제품, 배관 주변 사진 및 시공 지역을 알려주세요." },
  { step: "02", title: "제품 · 비용 안내", description: "설치 조건을 확인하고 가능한 제품, 작업 범위와 예상 비용을 안내합니다." },
  { step: "03", title: "일정 확정", description: "제품과 범위를 확인한 뒤 방문 가능한 날짜와 시간을 조율합니다." },
  { step: "04", title: "방문 시공", description: "기존 제품을 철거하고 배관·바닥·벽면 상태를 확인하며 설치합니다." },
  { step: "05", title: "마감 확인", description: "수평, 작동, 누수와 주변 정리 상태를 고객과 함께 확인합니다." },
] as const;

export const faqs = [
  {
    question: "어느 지역까지 시공하나요?",
    answer: "서울 전 지역과 인천, 경기 지역을 중심으로 방문 시공합니다. 상세 지역은 상담 시 일정과 함께 확인해 주세요.",
  },
  {
    question: "사진만으로도 비용 상담이 가능한가요?",
    answer: "네. 교체할 제품 전체와 배관·바닥 주변이 보이는 사진, 현장 지역을 보내주시면 설치 가능 여부와 예상 비용을 빠르게 안내할 수 있습니다.",
  },
  {
    question: "제품은 직접 준비해도 되나요?",
    answer: "현장 규격과 설치 조건이 맞는 제품이라면 가능합니다. 구매 전 제품명과 현장 사진을 먼저 확인받는 것을 권장합니다.",
  },
  {
    question: "시공 시간은 얼마나 걸리나요?",
    answer: "단품 교체는 품목과 현장 상태에 따라 달라집니다. 철거 후 추가 보수가 필요한 경우를 포함해 상담 시 예상 시간을 안내합니다.",
  },
  {
    question: "기존 제품 철거와 폐기도 포함되나요?",
    answer: "기본 철거와 처리 범위는 품목과 현장에 따라 달라질 수 있습니다. 상담 단계에서 포함 범위를 먼저 확인해 안내합니다.",
  },
  {
    question: "현장에서 추가 비용이 생길 수 있나요?",
    answer: "사진으로 확인하기 어려운 배관 손상이나 바닥 보수 등 추가 작업이 필요한 경우가 있습니다. 작업 전 상태와 비용을 먼저 설명하고 동의 후 진행합니다.",
  },
] as const;
