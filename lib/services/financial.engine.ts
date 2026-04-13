export const runIdempotent = async (tx: any, key: string, scope: string, fn: () => Promise<any>) => {
  const existing = await tx.idempotencyKey.findUnique({ where: { key } });

  if (existing?.response) return existing.response;

  const result = await fn();

  await tx.idempotencyKey.upsert({
    where: { key },
    update: { response: result },
    create: { key, scope, response: result },
  });

  return result;
};

export const withWalletLock = async (tx: any, walletId: string, fn: () => Promise<any>) => {
  await tx.$executeRaw`SELECT id FROM "Wallet" WHERE id = ${walletId} FOR UPDATE`;
  return fn();
};

export const addLedger = async (tx: any, data: any) => {
  
  const last = await tx.ledgerEntry.findFirst({
    where: { walletId: data.walletId },
    orderBy: { createdAt: "desc" },
  });

  const balanceAfter = (last?.balanceAfter || 0) + (data.amount);

  await tx.ledgerEntry.create({
    data: { ...data, balanceAfter },
  });
};