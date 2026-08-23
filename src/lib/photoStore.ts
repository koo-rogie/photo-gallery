// src/lib/photoStore.ts
import { set, get, del } from "idb-keyval";
import { parseExifWithFallback, resolvePreviewBlob } from "./exif";
import { reverseGeocode } from "./geocode";

export type PhotoInfo = {
  id: string;
  fileName: string;
  date?: string;
  place?: string;
  lat?: number;
  lng?: number;
  url?: string;
};

type PhotoMeta = Omit<PhotoInfo, "url">;

const STORAGE_KEY = "photos";

function readMetaList(): PhotoMeta[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function writeMetaList(list: PhotoMeta[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// 저장된 메타데이터 + IndexedDB 이미지 복원
export async function loadPhotos(): Promise<PhotoInfo[]> {
  const saved = readMetaList();

  return Promise.all(
    saved.map(async (p) => {
      // 캐싱된 미리보기가 있으면 그걸 바로 사용 (재변환 없이 빠름)
      try {
        const cached = await get(`${p.id}-preview`);
        if (cached) {
          return { ...p, url: URL.createObjectURL(cached) };
        }
      } catch {
        // 캐시 없음, 아래에서 원본으로 재처리
      }

      // 캐싱 안 된 경우(예전 사진 등)만 원본에서 재변환
      try {
        const original = await get(p.id);
        if (!original) return { ...p, url: undefined };
        const blob = await resolvePreviewBlob(original, p.fileName);
        return { ...p, url: blob ? URL.createObjectURL(blob) : undefined };
      } catch {
        return { ...p, url: undefined };
      }
    })
  );
}

// 새 사진 추가 (EXIF 파싱 + 지오코딩 + 저장 + 미리보기 캐싱까지 한번에)
export async function addPhoto(file: File): Promise<PhotoInfo> {
  const id = crypto.randomUUID();
  const meta = await parseExifWithFallback(file);

  let place: string | undefined;
  if (meta?.latitude && meta?.longitude) {
    place = await reverseGeocode(meta.latitude, meta.longitude);
  }

  await set(id, file); // 원본 저장

  const previewBlob = await resolvePreviewBlob(file);
  if (previewBlob) {
    await set(`${id}-preview`, previewBlob); // 변환 결과 캐싱
  }

  const url = previewBlob ? URL.createObjectURL(previewBlob) : undefined;

  const photoMeta: PhotoMeta = {
    id,
    fileName: file.name,
    date: meta?.DateTimeOriginal?.toLocaleString?.() ?? undefined,
    place,
    lat: meta?.latitude,
    lng: meta?.longitude,
  };

  writeMetaList([photoMeta, ...readMetaList()]);

  return { ...photoMeta, url };
}

// 삭제
export async function deletePhoto(id: string): Promise<void> {
  await del(id);
  await del(`${id}-preview`);
  writeMetaList(readMetaList().filter((p) => p.id !== id));
}