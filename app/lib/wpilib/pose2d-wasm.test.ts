// Node.js test for Pose2d using WASM
import type { MainModule } from 'app/lib/generated/wpimath/wpimath_wasm';
import { beforeAll, describe, expect, it } from 'vitest';

import { getWpimathModule } from '~/lib/wpilib/index';

describe('Pose2d WASM', () => {
  let module: MainModule;

  beforeAll(async () => {
    const loadedModule = await getWpimathModule();
    module = loadedModule;
  });

  describe('Factory functions', () => {
    it('should create Translation2d from coordinates', () => {
      const translation = module.createTranslation2d(1.5, 2.5);
      expect(translation).toBeDefined();
      expect(translation.getX()).toBeCloseTo(1.5, 5);
      expect(translation.getY()).toBeCloseTo(2.5, 5);
      translation.delete();
    });

    it('should create Rotation2d from radians', () => {
      const rotation = module.createRotation2dFromRadians(Math.PI / 4);
      expect(rotation).toBeDefined();
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 4, 5);
      expect(rotation.getDegrees()).toBeCloseTo(45, 5);
      rotation.delete();
    });

    it('should create Pose2d from coordinates and rotation', () => {
      const pose = module.createPose2d(1.0, 2.0, Math.PI / 2);
      expect(pose).toBeDefined();
      expect(pose.getX()).toBeCloseTo(1.0, 5);
      expect(pose.getY()).toBeCloseTo(2.0, 5);
      expect(pose.getRotation().getRadians()).toBeCloseTo(Math.PI / 2, 5);
      pose.delete();
    });
  });

  describe('Translation2d', () => {
    it('should get X and Y coordinates', () => {
      const translation = module.createTranslation2d(3.0, 4.0);
      expect(translation.getX()).toBeCloseTo(3.0, 5);
      expect(translation.getY()).toBeCloseTo(4.0, 5);
      translation.delete();
    });

    it('should calculate distance between translations', () => {
      const t1 = module.createTranslation2d(0, 0);
      const t2 = module.createTranslation2d(3, 4);
      const distance = t1.getDistance(t2);
      expect(distance).toBeCloseTo(5.0, 5); // 3-4-5 triangle
      t1.delete();
      t2.delete();
    });

    it('should calculate norm (magnitude)', () => {
      const translation = module.createTranslation2d(3, 4);
      const norm = translation.getNorm();
      expect(norm).toBeCloseTo(5.0, 5); // sqrt(3^2 + 4^2) = 5
      translation.delete();
    });
  });

  describe('Rotation2d', () => {
    it('should convert between radians and degrees', () => {
      const rotation = module.createRotation2dFromRadians(Math.PI / 3);
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 3, 5);
      expect(rotation.getDegrees()).toBeCloseTo(60, 5);
      rotation.delete();
    });

    it('should calculate cosine and sine', () => {
      const rotation = module.createRotation2dFromRadians(Math.PI / 4);
      expect(rotation.getCos()).toBeCloseTo(Math.cos(Math.PI / 4), 5);
      expect(rotation.getSin()).toBeCloseTo(Math.sin(Math.PI / 4), 5);
      rotation.delete();
    });

    it('should handle zero rotation', () => {
      const rotation = module.createRotation2dFromRadians(0);
      expect(rotation.getRadians()).toBe(0);
      expect(rotation.getDegrees()).toBe(0);
      expect(rotation.getCos()).toBeCloseTo(1, 5);
      expect(rotation.getSin()).toBeCloseTo(0, 5);
      rotation.delete();
    });
  });

  describe('Pose2d', () => {
    it('should create default pose at origin', () => {
      const pose = new module.Pose2d();
      expect(pose.getX()).toBe(0);
      expect(pose.getY()).toBe(0);
      expect(pose.getRotation().getRadians()).toBe(0);
      pose.delete();
    });

    it('should create pose from translation and rotation', () => {
      const translation = module.createTranslation2d(5.0, 6.0);
      const rotation = module.createRotation2dFromRadians(Math.PI / 4);
      const pose = new module.Pose2d(translation, rotation);

      expect(pose.getX()).toBeCloseTo(5.0, 5);
      expect(pose.getY()).toBeCloseTo(6.0, 5);
      expect(pose.getRotation().getRadians()).toBeCloseTo(Math.PI / 4, 5);

      pose.delete();
      translation.delete();
      rotation.delete();
    });

    it('should get translation and rotation components', () => {
      const pose = module.createPose2d(1.0, 2.0, Math.PI / 6);
      const translation = pose.getTranslation();
      const rotation = pose.getRotation();

      expect(translation.getX()).toBeCloseTo(1.0, 5);
      expect(translation.getY()).toBeCloseTo(2.0, 5);
      expect(rotation.getRadians()).toBeCloseTo(Math.PI / 6, 5);

      pose.delete();
      translation.delete();
      rotation.delete();
    });

    it('should transform pose by a transform', () => {
      // Create a pose at (0, 0) facing 0 degrees
      const pose = module.createPose2d(0, 0, 0);

      // Create a transform: translate by (1, 0) and rotate by 0
      const translation = module.createTranslation2d(1, 0);
      const rotation = module.createRotation2dFromRadians(0);
      const transform = new module.Transform2d(translation, rotation);

      // Transform the pose
      const transformed = pose.transformBy(transform);

      // Should be at (1, 0) with 0 rotation
      expect(transformed.getX()).toBeCloseTo(1.0, 5);
      expect(transformed.getY()).toBeCloseTo(0.0, 5);
      expect(transformed.getRotation().getRadians()).toBeCloseTo(0, 5);

      pose.delete();
      transform.delete();
      transformed.delete();
      translation.delete();
      rotation.delete();
    });

    it('should calculate relative pose', () => {
      // Create two poses
      const from = module.createPose2d(0, 0, 0);
      const to = module.createPose2d(1, 1, Math.PI / 2);

      // Calculate relative pose
      const relative = to.relativeTo(from);

      // Relative pose should be (1, 1) with PI/2 rotation
      expect(relative.getX()).toBeCloseTo(1.0, 5);
      expect(relative.getY()).toBeCloseTo(1.0, 5);
      expect(relative.getRotation().getRadians()).toBeCloseTo(Math.PI / 2, 5);

      from.delete();
      to.delete();
      relative.delete();
    });

    it('should handle pose transformation with rotation', () => {
      // Create a pose at (0, 0) facing 0 degrees
      const pose = module.createPose2d(0, 0, 0);

      // Create a transform: translate by (1, 0) and rotate by PI/2
      const translation = module.createTranslation2d(1, 0);
      const rotation = module.createRotation2dFromRadians(Math.PI / 2);
      const transform = new module.Transform2d(translation, rotation);

      // Transform the pose
      const transformed = pose.transformBy(transform);

      // Should be at (1, 0) with PI/2 rotation
      expect(transformed.getX()).toBeCloseTo(1.0, 5);
      expect(transformed.getY()).toBeCloseTo(0.0, 5);
      expect(transformed.getRotation().getRadians()).toBeCloseTo(
        Math.PI / 2,
        5,
      );

      pose.delete();
      transform.delete();
      transformed.delete();
      translation.delete();
      rotation.delete();
    });
  });

  describe('Real-world scenario: robot path', () => {
    it('should calculate a simple path transformation', () => {
      // Start at origin facing forward (0 degrees)
      const start = module.createPose2d(0, 0, 0);

      // Move forward 1 meter
      const forward1m = module.createTranslation2d(1, 0);
      const noRotation = module.createRotation2dFromRadians(0);
      const moveForward = new module.Transform2d(forward1m, noRotation);
      const afterMove = start.transformBy(moveForward);

      expect(afterMove.getX()).toBeCloseTo(1.0, 5);
      expect(afterMove.getY()).toBeCloseTo(0.0, 5);

      // Turn 90 degrees
      const turn90 = module.createTranslation2d(0, 0);
      const rotate90 = module.createRotation2dFromRadians(Math.PI / 2);
      const turnTransform = new module.Transform2d(turn90, rotate90);
      const afterTurn = afterMove.transformBy(turnTransform);

      expect(afterTurn.getX()).toBeCloseTo(1.0, 5);
      expect(afterTurn.getY()).toBeCloseTo(0.0, 5);
      expect(afterTurn.getRotation().getRadians()).toBeCloseTo(Math.PI / 2, 5);

      // Move forward 1 meter (now in Y direction)
      const afterSecondMove = afterTurn.transformBy(moveForward);

      // After moving forward while facing 90 degrees, we should be at (1, 1)
      expect(afterSecondMove.getX()).toBeCloseTo(1.0, 5);
      expect(afterSecondMove.getY()).toBeCloseTo(1.0, 5);

      // Clean up
      start.delete();
      afterMove.delete();
      afterTurn.delete();
      afterSecondMove.delete();
      moveForward.delete();
      turnTransform.delete();
      forward1m.delete();
      noRotation.delete();
      turn90.delete();
      rotate90.delete();
    });
  });
});
