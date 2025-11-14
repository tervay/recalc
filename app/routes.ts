import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('arm', 'routes/arm.tsx'),
  route('belts', 'routes/belts.tsx'),
  route('chains', 'routes/chains.tsx'),
  route('flywheel', 'routes/flywheel.tsx'),
  route('intake', 'routes/intake.tsx'),
  route('linear', 'routes/linear.tsx'),
  route('motors', 'routes/motors.tsx'),
  route('ratio', 'routes/ratio.tsx'),
  route('gears', 'routes/gears.tsx'),
  route('ratio-finder', 'routes/ratio-finder.tsx'),
] satisfies RouteConfig;
