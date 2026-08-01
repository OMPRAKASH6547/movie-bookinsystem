import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface ITransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true },
    referenceType: String,
    referenceId: String,
  },
  { timestamps: true }
);

export const Wallet: Model<IWallet> =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
