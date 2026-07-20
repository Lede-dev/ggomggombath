export type Service = {
  number: string;
  title: string;
  description: string;
  items: string[];
};

export type CasePost = {
  title: string;
  link: string;
  date: string;
  category: string;
  image: string;
  excerpt: string;
};

export type BlogStats = {
  completedWorks: number;
  sourceCategory: string;
  sourceUrl: string;
};

export const sectionNavigation = [
  { targetId: "services", label: "부분시공", path: "/about" },
  { targetId: "cases", label: "시공후기", path: "/review" },
  { targetId: "process", label: "진행과정", path: "/process" },
  { targetId: "faq", label: "자주 묻는 질문", path: "/faq" },
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
  logoPath: "/logo.svg?v=20260721-navy-v2",
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
    title: "양변기 교체",
    description: "공간과 예산에 맞는 제품을 제안하고 기존 도기 철거부터 수평·마감까지 진행합니다.",
    items: ["일반형 투피스", "치마형 투피스", "원피스 변기"],
  },
  {
    number: "02",
    title: "세면기 교체",
    description: "배관 상태와 욕실 구조를 먼저 확인해 사용성과 청소 편의성을 함께 고려합니다.",
    items: ["긴다리 세면기", "원피스 반다리", "수전 동시 교체"],
  },
  {
    number: "03",
    title: "수전 · 샤워",
    description: "누수와 노후 부속을 점검하고 매일 손이 닿는 수전과 샤워 설비를 안정적으로 교체합니다.",
    items: ["원홀·3홀 수전", "샤워 수전", "해바라기·슬라이드바"],
  },
  {
    number: "04",
    title: "욕실장 · 액세서리",
    description: "수납 방식과 벽면 상태에 맞춰 욕실장, 거울, 선반과 액세서리를 깔끔하게 설치합니다.",
    items: ["슬라이드 욕실장", "거울 세트", "선반·욕실 액세서리"],
  },
];

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
  { step: "01", title: "사진 상담", description: "교체할 공간과 제품 사진, 지역을 보내주세요." },
  { step: "02", title: "제품 · 비용 안내", description: "설치 가능한 제품과 예상 비용을 안내합니다." },
  { step: "03", title: "방문 시공", description: "약속한 일정에 방문해 철거와 설치를 진행합니다." },
  { step: "04", title: "마감 확인", description: "수평, 작동, 누수와 주변 정리까지 함께 확인합니다." },
] as const;

export const faqs = [
  {
    question: "어느 지역까지 시공하나요?",
    answer: "서울 전 지역과 인천, 경기 지역을 중심으로 방문 시공합니다. 상세 지역은 상담 시 일정을 함께 확인해 주세요.",
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
    answer: "단품 교체는 현장 상태와 품목에 따라 달라집니다. 철거 후 추가 보수가 필요한 경우를 포함해 상담 시 예상 시간을 안내합니다.",
  },
] as const;
