import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  movieId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  likes: number;
  isApproved: boolean;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userAvatar: String,
    rating: { type: Number, required: true, min: 1, max: 10 },
    title: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 2000 },
    likes: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
