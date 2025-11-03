import { describe, it, expect } from 'vitest';
import { RELEASE_VERSION, isCompatibleVersion } from './version';

describe('Version compatibility checks', () => {
  it('should have a valid release version', () => {
    expect(RELEASE_VERSION).toBeTruthy();
    expect(RELEASE_VERSION).toMatch(/^\d+\.\d+\.\d+$/); // Semver format
  });

  it('should return false for undefined version', () => {
    expect(isCompatibleVersion(undefined)).toBe(false);
  });

  it('should return false for null version', () => {
    expect(isCompatibleVersion(null as any)).toBe(false);
  });

  it('should return false for empty string version', () => {
    expect(isCompatibleVersion('')).toBe(false);
  });

  it('should return true for matching version', () => {
    expect(isCompatibleVersion(RELEASE_VERSION)).toBe(true);
  });

  it('should return false for different version', () => {
    expect(isCompatibleVersion('0.9.0')).toBe(false);
    expect(isCompatibleVersion('2.0.0')).toBe(false);
    expect(isCompatibleVersion('1.0.1')).toBe(false);
  });
});
