import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
  ownerId: mongoose.Types.ObjectId;
  theatreId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  note?: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export type HandoverStatus = "pending" | "submitted" | "accepted" | "disputed" | "settled";
export type ShiftCode = "morning" | "afternoon" | "evening" | "night" | "full_day";

export interface ICashClosing extends Document {
  ownerId: mongoose.Types.ObjectId;
  theatreId: mongoose.Types.ObjectId;
  counterId: string;
  staffId: mongoose.Types.ObjectId;
  date: Date;
  shift: ShiftCode;
  openingCash: number;
  closingCash: number;
  expectedCash: number;
  variance: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  walletSales: number;
  onlineSales: number;
  discounts: number;
  couponsUsed: number;
  ticketsSold: number;
  refunds: number;
  handoverStatus: HandoverStatus;
  handedOverTo?: mongoose.Types.ObjectId;
  handedOverAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  note?: string;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true, index: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    note: String,
    date: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const CashClosingSchema = new Schema<ICashClosing>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true, index: true },
    counterId: { type: String, required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now, index: true },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "full_day"],
      default: "full_day",
      index: true,
    },
    openingCash: { type: Number, default: 0 },
    closingCash: { type: Number, default: 0 },
    expectedCash: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    cardSales: { type: Number, default: 0 },
    upiSales: { type: Number, default: 0 },
    walletSales: { type: Number, default: 0 },
    onlineSales: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    couponsUsed: { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 },
    handoverStatus: {
      type: String,
      enum: ["pending", "submitted", "accepted", "disputed", "settled"],
      default: "pending",
      index: true,
    },
    handedOverTo: { type: Schema.Types.ObjectId, ref: "User" },
    handedOverAt: Date,
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acceptedAt: Date,
    note: String,
  },
  { timestamps: true }
);

CashClosingSchema.index({ ownerId: 1, date: -1, counterId: 1 });
CashClosingSchema.index({ ownerId: 1, handoverStatus: 1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export const CashClosing: Model<ICashClosing> =
  mongoose.models.CashClosing ||
  mongoose.model<ICashClosing>("CashClosing", CashClosingSchema);
