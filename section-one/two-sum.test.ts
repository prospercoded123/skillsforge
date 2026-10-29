import { test } from "node:test";
import assert from "node:assert/strict";
import { twoSumUnsorted } from "./two-sum-unsorted.ts";
import { twoSumDescending } from "./two-sum-descending.ts";

test("twoSumUnsorted", () => {
  assert.deepEqual(twoSumUnsorted([2, 7, 11, 15], 9), [0, 1]);
  assert.deepEqual(twoSumUnsorted([3, 2, 4], 6), [1, 2]);
  assert.deepEqual(twoSumUnsorted([3, 3], 6), [0, 1]);
  assert.deepEqual(twoSumUnsorted([1, 5, 8, 3, 2], 11), [2, 3]);
});

test("twoSumDescending", () => {
  assert.deepEqual(twoSumDescending([15, 11, 7, 2], 9), [2, 3]);
  assert.deepEqual(twoSumDescending([10, 8, 5, 3, 2, 1], 10), [1, 4]);
  // Several pairs are valid for these inputs, so accept any of them.
  assert.ok(isOneOf(twoSumDescending([20, 14, 11, 8, 4, 1], 15), [[1, 5], [2, 4]]));
  assert.ok(isOneOf(twoSumDescending([9, 7, 4, 3, 1], 10), [[0, 4], [1, 3]]));
});

function isOneOf(pair: number[], options: number[][]): boolean {
  return options.some(([a, b]) => pair[0] === a && pair[1] === b);
}
