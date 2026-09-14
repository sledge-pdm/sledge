/**
 * @description await every promise, then rethrow the first that failed.
 *
 *   `Promise.all` settles the moment one of them rejects, leaving the rest running. for work that holds
 *   something - the window an exclusive operation has taken, a history stack held open for a read - that is
 *   wrong: the caller's cleanup would run while those are still going. this gives back the same result and
 *   the same error, only after everything has actually stopped.
 */
export async function settleAll<T>(promises: readonly Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(promises);

  const rejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (rejected) throw rejected.reason;

  return results.map((result) => (result as PromiseFulfilledResult<T>).value);
}
