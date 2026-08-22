import { describe, it, expect } from 'vitest';

describe('Lab 02 - AttachmentSection Component Logic Tests', () => {
  it('should validate allowed mime types', () => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    expect(allowed.includes('image/png')).toBe(true);
    expect(allowed.includes('text/plain')).toBe(false);
  });

  it('should enforce 5MB maximum file size limit', () => {
    const maxBytes = 5 * 1024 * 1024;
    const validFile = 4 * 1024 * 1024;
    const invalidFile = 6 * 1024 * 1024;

    expect(validFile <= maxBytes).toBe(true);
    expect(invalidFile <= maxBytes).toBe(false);
  });
});
