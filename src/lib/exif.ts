// src/lib/exif.ts
import exifr from "exifr";

function isHeic(file: File | Blob, fileName = "") {
  const name = file instanceof File ? file.name : fileName;
  const type = file instanceof File ? file.type : "";
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    /\.hei[cf]$/i.test(name)
  );
}

/**
 * EXIF 파싱 (날짜, GPS 등).
 * exifr이 GPS를 못 찾은 경우에만 exifreader로 한 번 더 시도.
 */
export async function parseExifWithFallback(file: File) {
  const meta = await exifr.parse(file, { gps: true });

  if (meta?.latitude && meta?.longitude) {
    return meta;
  }

  try {
    const ExifReader = (await import("exifreader")).default;
    const buf = await file.arrayBuffer();
    const tags = ExifReader.load(buf, { expanded: true });

    return {
      ...meta,
      latitude: tags.gps?.Latitude,
      longitude: tags.gps?.Longitude,
    };
  } catch {
    return meta;
  }
}

/**
 * 화면 표시용 미리보기 Blob 생성.
 * HEIC/HEIF면 heic-to로 JPEG 변환, 실패하면 undefined.
 * 일반 이미지는 원본 그대로 반환.
 */
export async function getPreviewBlob(
  file: File | Blob,
  fileName = ""
): Promise<Blob | undefined> {
  if (!isHeic(file, fileName)) {
    return file;
  }

  try {
    const { heicTo } = await import("heic-to");
    return await heicTo({ blob: file, type: "image/jpeg", quality: 0.8 });
  } catch {
    return undefined;
  }
}

/**
 * heic-to가 실패했을 때 마지막 수단.
 * HEIC 내부에 박혀있는 저해상도 썸네일(보통 JPEG)을 대신 꺼내서 보여줌.
 */
export async function getThumbnailBlob(file: File): Promise<Blob | undefined> {
  try {
    const thumbnail = await exifr.thumbnail(file);
    if (!thumbnail) return undefined;
    return new Blob([thumbnail as BlobPart], { type: "image/jpeg" });
  } catch {
    return undefined;
  }
}

/**
 * 미리보기 Blob을 구하는 통합 함수.
 * 1. 일반 이미지 / heic-to 변환 성공 → 그 결과 사용
 * 2. 변환 실패 → 내장 썸네일로 대체
 * 3. 그마저 실패 → undefined
 */
export async function resolvePreviewBlob(
  file: File | Blob,
  fileName = ""
): Promise<Blob | undefined> {
  const blob = await getPreviewBlob(file, fileName);
  if (blob) return blob;

  if (file instanceof File) {
    return getThumbnailBlob(file);
  }

  return undefined;
}