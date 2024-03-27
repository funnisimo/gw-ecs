const SQRT_2_PI = Math.sqrt(2 * Math.PI);
// https://www.math.net/gaussian-distribution
export function gaussian(mu: number, stddev: number, x: number): number {
  return (
    (1 / (stddev * SQRT_2_PI)) *
    Math.exp(-Math.pow(x - mu, 2) / (2 * stddev * stddev))
  );
}
