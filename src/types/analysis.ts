export interface AnalysisResult {
  language: string;
  summary: string;
  lines: { code: string; explanation: string }[];
  concepts: string[];
  issues: { type: "warning" | "improvement" | "error"; text: string }[];
  complexity: { time: string; space: string };
}

export interface HistoryItem {
  id: number;
  code: string;
  lang: string;
  summary: string;
  time: string;
  full: AnalysisResult;
  fullCode: string;
}

export const SAMPLES = [
  {
    lang: "javascript",
    code: `function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    else if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
  },
  {
    lang: "python",
    code: `def fibonacci(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fibonacci(n-1) + fibonacci(n-2)\n    return memo[n]`,
  },
  {
    lang: "javascript",
    code: `const debounce = (fn, delay) => {\n  let timeoutId;\n  return (...args) => {\n    if (timeoutId) clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn(...args), delay);\n  };\n};`,
  },
];
