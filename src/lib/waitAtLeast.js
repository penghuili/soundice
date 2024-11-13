import { waitForSeconds } from '../shared/js/waitForSeconds';

export async function waitAtLeast(ms, promise) {
  const [result] = await Promise.all([promise, waitForSeconds(ms / 1000)]);

  return result;
}
