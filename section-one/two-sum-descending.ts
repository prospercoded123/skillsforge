export function twoSumDescending(nums: number[], k: number): [number, number] {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === k) {
      return [left, right];
    }
    if (sum > k) {
      left++;
    } else {
      right--;
    }
  }

  throw new Error('No two numbers add up to k');
}
