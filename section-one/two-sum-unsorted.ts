// Returns the indices of two numbers in `nums` that add up to `k`.
// Time O(N), space O(N).
export function twoSumUnsorted(nums: number[], k: number): [number, number] {
  const indexByValue = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const complementIndex = indexByValue.get(k - nums[i]);
    if (complementIndex !== undefined) {
      return [complementIndex, i];
    }
    indexByValue.set(nums[i], i);
  }

  throw new Error("No two numbers add up to k");
}
