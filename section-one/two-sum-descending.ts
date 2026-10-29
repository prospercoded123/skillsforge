// Returns the indices of two numbers in `nums` (sorted descending) that add up to `k`.
// Time O(N), auxiliary space O(1).
export function twoSumDescending(nums: number[], k: number): [number, number] {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === k) {
      return [left, right];
    }
    // Sum too big: move left to a smaller value. Sum too small: move right to a larger value.
    if (sum > k) {
      left++;
    } else {
      right--;
    }
  }

  throw new Error("No two numbers add up to k");
}
