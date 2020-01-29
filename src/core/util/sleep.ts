/**
 * Get a promise that doesn't resolve for `ms` milliseconds
 */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
export default sleep;
