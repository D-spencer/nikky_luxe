const CLOUDINARY_HOST = "res.cloudinary.com";

function transformCloudinaryUrl(url: string, resourceType: "image" | "video", transformation: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== CLOUDINARY_HOST) return url;

    const marker = `/${resourceType}/upload/`;
    if (!parsed.pathname.includes(marker)) return url;

    parsed.pathname = parsed.pathname.replace(marker, `${marker}${transformation}/`);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function cloudinaryImageUrl(url: string, width: number) {
  const safeWidth = Math.max(64, Math.min(2000, Math.round(width)));
  return transformCloudinaryUrl(
    url,
    "image",
    `c_limit,w_${safeWidth}/f_auto/q_auto:good`
  );
}

export function cloudinaryVideoUrl(url: string, width = 1280) {
  const safeWidth = Math.max(320, Math.min(1920, Math.round(width)));
  return transformCloudinaryUrl(
    url,
    "video",
    `c_limit,w_${safeWidth}/f_auto/q_auto:good`
  );
}
