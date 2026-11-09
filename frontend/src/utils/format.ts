export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  // TODO: Implement logic here
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(timestamp: bigint | number): string {
  // TODO: Implement logic here
  const ms = Number(timestamp) * 1000;
  return new Date(ms).toISOString();
}
