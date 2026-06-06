export function itIfSolr(description, testFn, timeout) {
  const SOLR_AUTH = process.env.SOLR_AUTH;
  if (!SOLR_AUTH) {
    return it.skip(description, testFn, timeout);
  }
  return it(description, testFn, timeout);
}
