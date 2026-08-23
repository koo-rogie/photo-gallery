// src/lib/kakaoMap.ts
declare global {
  interface Window {
    kakao: any;
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadKakaoMapSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("서버에서는 로드할 수 없음"));
  }

  if (window.kakao?.maps) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("카카오맵 SDK 로드 실패"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}
