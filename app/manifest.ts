import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "꼼꼼욕실",
    short_name: "꼼꼼욕실",
    description: "서울·인천·경기 욕실 부분시공 전문",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#0b4f7b",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

