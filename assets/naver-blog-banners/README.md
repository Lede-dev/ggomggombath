# 꼼꼼욕실 네이버 블로그 배너

모든 PNG 파일의 가로 크기는 2,000px입니다.

`public/logo.svg`를 수정한 뒤 프로젝트 루트에서 아래 명령을 실행하면 모든 배너와 `public/og.png`의 로고가 갱신됩니다.

```powershell
npm run export:banners
```

## 중앙 966px 안전 영역 적용본

중요 콘텐츠는 `x=517`부터 `x=1482`까지의 중앙 966px 안에 배치되어 있습니다.

- `ggomggombath-naver-safe-2000x500.png`
- `ggomggombath-naver-safe-2000x700.png`
- `ggomggombath-naver-safe-2000x900.png`

네이버 블로그 스킨에서 화면 폭이나 기기에 따라 좌우가 잘릴 수 있을 때 사용하세요.

## 안전 영역 미적용 전체 폭 버전

- `ggomggombath-naver-full-2000x500.png`
- `ggomggombath-naver-full-2000x700.png`
- `ggomggombath-naver-full-2000x900.png`

배너 전체 폭이 그대로 노출되는 레이아웃이나 별도 홍보 이미지에 사용하세요.
