import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BUSINESS_RESULT_IMAGE,
  getBusinessResultImage
} from './searchResultPresentation';

describe('getBusinessResultImage', () => {
  it('uses the canonical business photo before legacy image fields', () => {
    expect(
      getBusinessResultImage({
        photo: 'https://res.cloudinary.com/zipco/image/upload/business.jpg',
        image: 'https://example.test/legacy.jpg'
      })
    ).toBe('https://res.cloudinary.com/zipco/image/upload/business.jpg');
  });

  it('keeps legacy image compatibility when photo is missing', () => {
    expect(getBusinessResultImage({ imageUrl: 'https://example.test/image.jpg' })).toBe(
      'https://example.test/image.jpg'
    );
  });

  it('uses the default image only when no usable photo exists', () => {
    expect(getBusinessResultImage({ photo: '  ' })).toBe(
      DEFAULT_BUSINESS_RESULT_IMAGE
    );
  });
});
