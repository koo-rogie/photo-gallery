"use client";

import { useEffect, useState } from "react";
import { loadPhotos, addPhoto, deletePhoto, PhotoInfo } from "@/lib/photoStore";
import Image from "next/image";
import PhotoMap from "@/components/PhotoMap";

export default function Gallery() {
  const [photos, setPhotos] = useState<PhotoInfo[]>([]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadPhotos().then(setPhotos);
  }, []);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const photo = await addPhoto(file);
      setPhotos((prev) => [photo, ...prev]);
    }
    e.target.value = "";
  }

  async function handleDelete(id: string) {
    await deletePhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">사진 갤러리</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMap(true)}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              🗺 지도로 보기
            </button>

            <label className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
              <span>+ 사진 추가</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-48 bg-gray-100">
                {p.url ? (
                  <Image
                    src={p.url}
                    alt={p.fileName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    이미지 없음
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {p.fileName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {p.date ?? "날짜 정보 없음"}
                </p>
                <p className="text-sm text-gray-500">
                  {p.place ?? "위치 정보 없음"}
                </p>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="mt-3 text-xs text-red-500 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 지도 모달 */}
      {showMap && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMap(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                사진 위치 지도
              </h2>
              <button
                onClick={() => setShowMap(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <PhotoMap photos={photos} />
          </div>
        </div>
      )}
    </div>
  );
}