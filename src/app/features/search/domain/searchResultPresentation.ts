export const DEFAULT_BUSINESS_RESULT_IMAGE =
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80';

export function getBusinessResultImage(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_BUSINESS_RESULT_IMAGE;
  }

  const result = value as Record<string, unknown>;
  const candidates = [
    result.photo,
    result.image,
    result.imageUrl,
    result.logoUrl
  ];
  const image = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate.trim().length > 0
  );

  return image?.trim() ?? DEFAULT_BUSINESS_RESULT_IMAGE;
}
