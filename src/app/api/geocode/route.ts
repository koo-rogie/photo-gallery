import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return Response.json({ address: null }, { status: 400 });
  }

  // 1. 카카오 먼저 시도 (국내 주소는 카카오가 훨씬 정확함)
  const kakaoAddress = await tryKakao(lat, lng);
  if (kakaoAddress) {
    return Response.json({ address: kakaoAddress });
  }

  // 2. 카카오가 못 찾으면(주로 해외) Nominatim으로 fallback
  const nominatimAddress = await tryNominatim(lat, lng);
  return Response.json({ address: nominatimAddress ?? null });
}

async function tryKakao(lat: string, lng: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
        },
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.documents?.[0]?.address?.address_name ?? null;
  } catch {
    return null;
  }
}

async function tryNominatim(lat: string, lng: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko`,
      {
        headers: {
          // Nominatim 정책상 User-Agent 필수 (없으면 요청 차단될 수 있음)
          "User-Agent": "photo-gallery-app (personal project)",
        },
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
