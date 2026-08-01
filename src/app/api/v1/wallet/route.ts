import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { Wallet, Transaction } from "@/models/Wallet";
import { cache } from "@/lib/redis/client";

async function getDemoWallet(userId: string) {
  const key = `demo_wallet:${userId}`;
  const raw = await cache.get(key);
  if (raw) return JSON.parse(raw) as { balance: number; currency: string };
  const wallet = { balance: 100, currency: "INR" };
  await cache.set(key, JSON.stringify(wallet), 60 * 60 * 24 * 30);
  return wallet;
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    try {
      await connectDB();
      let wallet = await Wallet.findOne({ userId: req.user.sub });
      if (!wallet) {
        wallet = await Wallet.create({ userId: req.user.sub, balance: 100 });
      }
      const txns = await Transaction.find({ userId: req.user.sub })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      return successResponse({ wallet, transactions: txns });
    } catch {
      const wallet = await getDemoWallet(req.user.sub);
      const txnRaw = await cache.get(`demo_wallet_txns:${req.user.sub}`);
      const transactions = txnRaw ? JSON.parse(txnRaw) : [
        {
          type: "credit",
          amount: 100,
          description: "Welcome bonus",
          createdAt: new Date().toISOString(),
        },
      ];
      return successResponse({ wallet, transactions, demo: true });
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Wallet fetch failed",
      500
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { amount, type = "topup", code } = await req.json();

    if (type === "giftcard" && code) {
      const credit = code.toUpperCase() === "GIFT500" ? 500 : 100;
      try {
        await connectDB();
        let wallet = await Wallet.findOne({ userId: req.user.sub });
        if (!wallet) wallet = await Wallet.create({ userId: req.user.sub, balance: 0 });
        wallet.balance += credit;
        await wallet.save();
        await Transaction.create({
          walletId: wallet._id,
          userId: req.user.sub,
          type: "credit",
          amount: credit,
          balanceAfter: wallet.balance,
          description: `Gift card ${code}`,
        });
        return successResponse({ wallet, credited: credit }, "Gift card redeemed");
      } catch {
        const wallet = await getDemoWallet(req.user.sub);
        wallet.balance += credit;
        await cache.set(`demo_wallet:${req.user.sub}`, JSON.stringify(wallet));
        return successResponse({ wallet, credited: credit, demo: true }, "Gift card redeemed");
      }
    }

    const topup = Number(amount);
    if (!topup || topup < 1) return errorResponse("Invalid amount", 422);

    try {
      await connectDB();
      let wallet = await Wallet.findOne({ userId: req.user.sub });
      if (!wallet) wallet = await Wallet.create({ userId: req.user.sub, balance: 0 });
      wallet.balance += topup;
      await wallet.save();
      await Transaction.create({
        walletId: wallet._id,
        userId: req.user.sub,
        type: "credit",
        amount: topup,
        balanceAfter: wallet.balance,
        description: "Wallet top-up",
      });
      return successResponse({ wallet }, "Top-up successful");
    } catch {
      const wallet = await getDemoWallet(req.user.sub);
      wallet.balance += topup;
      await cache.set(`demo_wallet:${req.user.sub}`, JSON.stringify(wallet));
      return successResponse({ wallet, demo: true }, "Top-up successful (demo)");
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Wallet update failed",
      400
    );
  }
});
