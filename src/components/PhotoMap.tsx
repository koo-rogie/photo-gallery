// src/components/PhotoMap.tsx
"use client";

import { useEffect, useRef } from "react";
import { loadKakaoMapSdk } from "@/lib/kakaoMap";
import { PhotoInfo } from "@/lib/photoStore";

export default function PhotoMap({ photos }: { photos: PhotoInfo[] }) {
  const mapRef = useRef<HTMLDivElement>(null);

  const located = photos.filter(
    (p): p is PhotoInfo & { lat: number; lng: number } =>
      typeof p.lat === "number" && typeof p.lng === "number",
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadKakaoMapSdk();
      } catch (e) {
        console.error(e);
        return;
      }
      if (cancelled || !mapRef.current) return;

      const kakao = window.kakao;
      const center =
        located.length > 0
          ? new kakao.maps.LatLng(located[0].lat, located[0].lng)
          : new kakao.maps.LatLng(37.5665, 126.978); // 기본: 서울

      const map = new kakao.maps.Map(mapRef.current, {
        center,
        level: 6,
      });

      located.forEach((photo) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(photo.lat, photo.lng),
          map,
        });

        const info = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px;font-size:12px;">${photo.place ?? photo.fileName}</div>`,
        });

        kakao.maps.event.addListener(marker, "mouseover", () =>
          info.open(map, marker),
        );
        kakao.maps.event.addListener(marker, "mouseout", () => info.close());
      });

      // 마커 여러 개면 전체가 보이게 범위 조정
      if (located.length > 1) {
        const bounds = new kakao.maps.LatLngBounds();
        located.forEach((p) =>
          bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)),
        );
        map.setBounds(bounds);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [located]);

  if (located.length === 0) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        위치 정보가 있는 사진이 없어요
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-80 rounded-xl" />;
}
