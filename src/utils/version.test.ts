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

  it('should return true for same major version (backward compatible)', () => {
    // Minor and patch version differences are compatible (2.x.x is compatible with 2.y.z)
    const [currentMajor] = RELEASE_VERSION.split('.').map(Number);
    const sameMajor = `${currentMajor}.0.0`;
    const sameMajorPatch = `${currentMajor}.0.1`;
    const sameMajorMinor = `${currentMajor}.14.0`;
    const sameMajorBoth = `${currentMajor}.15.1`;
    const sameMajorMax = `${currentMajor}.99.99`;
    
    expect(isCompatibleVersion(sameMajor)).toBe(true);
    expect(isCompatibleVersion(sameMajorPatch)).toBe(true);
    expect(isCompatibleVersion(sameMajorMinor)).toBe(true);
    expect(isCompatibleVersion(sameMajorBoth)).toBe(true);
    expect(isCompatibleVersion(sameMajorMax)).toBe(true);
  });

  it('should return false for different major version (breaking changes)', () => {
    const [currentMajor] = RELEASE_VERSION.split('.').map(Number);
    const prevMajor = `${currentMajor - 1}.9.0`;
    const nextMajor = `${currentMajor + 1}.0.0`;
    const futureMajor = `${currentMajor + 2}.1.4`;
    
    expect(isCompatibleVersion(prevMajor)).toBe(false);
    expect(isCompatibleVersion(nextMajor)).toBe(false);
    expect(isCompatibleVersion(futureMajor)).toBe(false);
  });

  it('should return false for invalid version format', () => {
    expect(isCompatibleVersion('1.0')).toBe(false);
    expect(isCompatibleVersion('v1.0.0')).toBe(false);
    expect(isCompatibleVersion('invalid')).toBe(false);
  });
});
