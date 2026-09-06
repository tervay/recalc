import Measurement from '~/lib/models/Measurement';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import type { Vendor } from '~/lib/types/common';

export interface SwerveModuleRatioOption {
  name: string;
  ratio: Ratio;
}

export interface SwerveModule {
  vendor: Vendor;
  name: string;
  driveRatioOptions: SwerveModuleRatioOption[];
  steeringRatio: Ratio;
  wheelDiameter: Measurement;
}

export const ALL_SWERVE_MODULES: SwerveModule[] = [
  {
    vendor: 'SDS',
    name: 'MK5n',
    driveRatioOptions: [
      { name: 'R1', ratio: new Ratio(7.03, RatioType.REDUCTION) },
      { name: 'R2', ratio: new Ratio(6.03, RatioType.REDUCTION) },
      { name: 'R3', ratio: new Ratio(5.27, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(287 / 11, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'SDS',
    name: 'MK5i',
    driveRatioOptions: [
      { name: 'R1', ratio: new Ratio(7.03, RatioType.REDUCTION) },
      { name: 'R2', ratio: new Ratio(6.03, RatioType.REDUCTION) },
      { name: 'R3', ratio: new Ratio(5.27, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(26, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'SDS',
    name: 'MK4n',
    driveRatioOptions: [
      { name: 'L1+', ratio: new Ratio(7.13, RatioType.REDUCTION) },
      { name: 'L2+', ratio: new Ratio(5.9, RatioType.REDUCTION) },
      { name: 'L3+', ratio: new Ratio(5.36, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(18.75, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'SDS',
    name: 'MK4i',
    driveRatioOptions: [
      { name: 'L1', ratio: new Ratio(8.14, RatioType.REDUCTION) },
      { name: 'L1+', ratio: new Ratio(7.13, RatioType.REDUCTION) },
      { name: 'L2', ratio: new Ratio(6.75, RatioType.REDUCTION) },
      { name: 'L2+', ratio: new Ratio(5.9, RatioType.REDUCTION) },
      { name: 'L3', ratio: new Ratio(6.12, RatioType.REDUCTION) },
      { name: 'L3+', ratio: new Ratio(5.36, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(150 / 7, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'SDS',
    name: 'MK4c',
    driveRatioOptions: [
      { name: 'L1+', ratio: new Ratio(7.13, RatioType.REDUCTION) },
      { name: 'L2+', ratio: new Ratio(5.9, RatioType.REDUCTION) },
      { name: 'L3+', ratio: new Ratio(5.36, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(12.8, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'WCP',
    name: 'X2',
    driveRatioOptions: [
      { name: 'X1 (10T)', ratio: new Ratio(7.67, RatioType.REDUCTION) },
      { name: 'X1 (11T)', ratio: new Ratio(6.98, RatioType.REDUCTION) },
      { name: 'X1 (12T)', ratio: new Ratio(6.39, RatioType.REDUCTION) },
      { name: 'X2 (10T)', ratio: new Ratio(6.82, RatioType.REDUCTION) },
      { name: 'X2 (11T)', ratio: new Ratio(6.2, RatioType.REDUCTION) },
      { name: 'X2 (12T)', ratio: new Ratio(5.68, RatioType.REDUCTION) },
      { name: 'X3 (10T)', ratio: new Ratio(6.48, RatioType.REDUCTION) },
      { name: 'X3 (11T)', ratio: new Ratio(5.89, RatioType.REDUCTION) },
      { name: 'X3 (12T)', ratio: new Ratio(5.4, RatioType.REDUCTION) },
      { name: 'X4 (10T)', ratio: new Ratio(5.67, RatioType.REDUCTION) },
      { name: 'X4 (11T)', ratio: new Ratio(5.15, RatioType.REDUCTION) },
      { name: 'X4 (12T)', ratio: new Ratio(4.73, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(12.1, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'WCP',
    name: 'X2c',
    driveRatioOptions: [
      { name: 'X1 (10T)', ratio: new Ratio(7.67, RatioType.REDUCTION) },
      { name: 'X1 (11T)', ratio: new Ratio(6.98, RatioType.REDUCTION) },
      { name: 'X1 (12T)', ratio: new Ratio(6.39, RatioType.REDUCTION) },
      { name: 'X2 (10T)', ratio: new Ratio(6.82, RatioType.REDUCTION) },
      { name: 'X2 (11T)', ratio: new Ratio(6.2, RatioType.REDUCTION) },
      { name: 'X2 (12T)', ratio: new Ratio(5.68, RatioType.REDUCTION) },
      { name: 'X3 (10T)', ratio: new Ratio(6.48, RatioType.REDUCTION) },
      { name: 'X3 (11T)', ratio: new Ratio(5.89, RatioType.REDUCTION) },
      { name: 'X3 (12T)', ratio: new Ratio(5.4, RatioType.REDUCTION) },
      { name: 'X4 (10T)', ratio: new Ratio(5.67, RatioType.REDUCTION) },
      { name: 'X4 (11T)', ratio: new Ratio(5.15, RatioType.REDUCTION) },
      { name: 'X4 (12T)', ratio: new Ratio(4.73, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(12.1, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'WCP',
    name: 'X2i',
    driveRatioOptions: [
      { name: 'X1 (10T)', ratio: new Ratio(7.67, RatioType.REDUCTION) },
      { name: 'X1 (11T)', ratio: new Ratio(6.98, RatioType.REDUCTION) },
      { name: 'X1 (12T)', ratio: new Ratio(6.39, RatioType.REDUCTION) },
      { name: 'X2 (10T)', ratio: new Ratio(6.82, RatioType.REDUCTION) },
      { name: 'X2 (11T)', ratio: new Ratio(6.2, RatioType.REDUCTION) },
      { name: 'X2 (12T)', ratio: new Ratio(5.68, RatioType.REDUCTION) },
      { name: 'X3 (10T)', ratio: new Ratio(6.48, RatioType.REDUCTION) },
      { name: 'X3 (11T)', ratio: new Ratio(5.89, RatioType.REDUCTION) },
      { name: 'X3 (12T)', ratio: new Ratio(5.4, RatioType.REDUCTION) },
      { name: 'X4 (10T)', ratio: new Ratio(5.67, RatioType.REDUCTION) },
      { name: 'X4 (11T)', ratio: new Ratio(5.15, RatioType.REDUCTION) },
      { name: 'X4 (12T)', ratio: new Ratio(4.73, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(12.1, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'WCP',
    name: 'X2t',
    driveRatioOptions: [
      { name: 'X1 (10T)', ratio: new Ratio(7.67, RatioType.REDUCTION) },
      { name: 'X1 (11T)', ratio: new Ratio(6.98, RatioType.REDUCTION) },
      { name: 'X1 (12T)', ratio: new Ratio(6.39, RatioType.REDUCTION) },
      { name: 'X2 (10T)', ratio: new Ratio(6.82, RatioType.REDUCTION) },
      { name: 'X2 (11T)', ratio: new Ratio(6.2, RatioType.REDUCTION) },
      { name: 'X2 (12T)', ratio: new Ratio(5.68, RatioType.REDUCTION) },
      { name: 'X3 (10T)', ratio: new Ratio(6.48, RatioType.REDUCTION) },
      { name: 'X3 (11T)', ratio: new Ratio(5.89, RatioType.REDUCTION) },
      { name: 'X3 (12T)', ratio: new Ratio(5.4, RatioType.REDUCTION) },
      { name: 'X4 (10T)', ratio: new Ratio(5.67, RatioType.REDUCTION) },
      { name: 'X4 (11T)', ratio: new Ratio(5.15, RatioType.REDUCTION) },
      { name: 'X4 (12T)', ratio: new Ratio(4.73, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(12.1, RatioType.REDUCTION),
    wheelDiameter: new Measurement(4, 'in'),
  },
  {
    vendor: 'WCP',
    name: 'X2S',
    driveRatioOptions: [
      { name: 'X1 (15T)', ratio: new Ratio(6.0, RatioType.REDUCTION) },
      { name: 'X1 (16T)', ratio: new Ratio(5.63, RatioType.REDUCTION) },
      { name: 'X1 (17T)', ratio: new Ratio(5.29, RatioType.REDUCTION) },
      { name: 'X2 (17T)', ratio: new Ratio(4.94, RatioType.REDUCTION) },
      { name: 'X2 (18T)', ratio: new Ratio(4.67, RatioType.REDUCTION) },
      { name: 'X2 (19T)', ratio: new Ratio(4.42, RatioType.REDUCTION) },
      { name: 'X3 (19T)', ratio: new Ratio(4.11, RatioType.REDUCTION) },
      { name: 'X3 (20T)', ratio: new Ratio(3.9, RatioType.REDUCTION) },
      { name: 'X3 (21T)', ratio: new Ratio(3.71, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(25.9, RatioType.REDUCTION),
    wheelDiameter: new Measurement(3.5, 'in'),
  },
  {
    vendor: 'WCP',
    name: 'X2St',
    driveRatioOptions: [
      { name: 'X1 (15T)', ratio: new Ratio(6.0, RatioType.REDUCTION) },
      { name: 'X1 (16T)', ratio: new Ratio(5.63, RatioType.REDUCTION) },
      { name: 'X1 (17T)', ratio: new Ratio(5.29, RatioType.REDUCTION) },
      { name: 'X2 (17T)', ratio: new Ratio(4.94, RatioType.REDUCTION) },
      { name: 'X2 (18T)', ratio: new Ratio(4.67, RatioType.REDUCTION) },
      { name: 'X2 (19T)', ratio: new Ratio(4.42, RatioType.REDUCTION) },
      { name: 'X3 (19T)', ratio: new Ratio(4.11, RatioType.REDUCTION) },
      { name: 'X3 (20T)', ratio: new Ratio(3.9, RatioType.REDUCTION) },
      { name: 'X3 (21T)', ratio: new Ratio(3.71, RatioType.REDUCTION) },
    ],
    steeringRatio: new Ratio(25.9, RatioType.REDUCTION),
    wheelDiameter: new Measurement(3.5, 'in'),
  },
];
