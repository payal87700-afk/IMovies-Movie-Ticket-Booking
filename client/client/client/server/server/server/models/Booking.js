
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true
    },
    movieId: {
      type: Number,
      required: true
    },
    movieTitle: {
      type: String,
      required: true
    },
    showtime: {
      type: String,
      required: true
    },
    seats: {
      type: [String],
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Booking", bookingSchema);
