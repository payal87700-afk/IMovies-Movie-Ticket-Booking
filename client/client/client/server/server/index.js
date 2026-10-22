
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Booking from "./models/Booking.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]
  })
);

app.use(express.json());

// Movie data
const movies = [
  {
    id: 1,
    title: "The Space Journey",
    genre: "Adventure / Sci-Fi",
    duration: "2h 10m",
    rating: "8.4",
    price: 180,
    emoji: "🚀",
    description: "A team travels beyond the stars to discover a new world."
  },
  {
    id: 2,
    title: "Mystery at Midnight",
    genre: "Mystery / Thriller",
    duration: "1h 55m",
    rating: "8.1",
    price: 160,
    emoji: "🕵️",
    description: "A clever detective follows clues hidden across the city."
  },
  {
    id: 3,
    title: "The Funny Family",
    genre: "Comedy / Family",
    duration: "2h 00m",
    rating: "7.9",
    price: 150,
    emoji: "😂",
    description: "One family, one trip, and a whole lot of funny surprises."
  },
  {
    id: 4,
    title: "Ocean Secrets",
    genre: "Drama / Adventure",
    duration: "2h 05m",
    rating: "8.2",
    price: 170,
    emoji: "🌊",
    description: "An underwater expedition uncovers an extraordinary secret."
  },
  {
    id: 5,
    title: "Robot Dreams",
    genre: "Animation / Sci-Fi",
    duration: "1h 45m",
    rating: "8.6",
    price: 140,
    emoji: "🤖",
    description: "A curious robot learns what makes every person unique."
  },
  {
    id: 6,
    title: "City of Lights",
    genre: "Romance / Drama",
    duration: "2h 15m",
    rating: "7.8",
    price: 190,
    emoji: "🌆",
    description: "Two artists find inspiration in a city that never sleeps."
  }
];

// Demo storage is used if MongoDB is not configured.
let memoryBookings = [];
let mongoConnected = false;

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoConnected
      ? "MongoDB connected"
      : "Demo mode (memory storage)"
  });
});

// Get movies
app.get("/api/movies", (_req, res) => {
  res.json(movies);
});

// Get bookings
app.get("/api/bookings", async (_req, res) => {
  try {
    const bookings = mongoConnected
      ? await Booking.find().sort({ createdAt: -1 }).limit(50)
      : memoryBookings;

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not load bookings."
    });
  }
});

// Create a booking
app.post("/api/bookings", async (req, res) => {
  const { movieId, showtime, seats, customerName } = req.body;

  const movie = movies.find(
    (item) => item.id === Number(movieId)
  );

  if (
    !movie ||
    !showtime ||
    !Array.isArray(seats) ||
    seats.length === 0 ||
    !customerName?.trim()
  ) {
    return res.status(400).json({
      message:
        "Please provide a movie, showtime, at least one seat and your name."
    });
  }

  // Validate seat names such as A1, B5 and F10.
  if (
    seats.some(
      (seat) =>
        typeof seat !== "string" ||
        !/^[A-F](10|[1-9])$/.test(seat)
    )
  ) {
    return res.status(400).json({
      message: "One or more seat selections are invalid."
    });
  }

  // Prevent duplicate seats within the same request.
  if (new Set(seats).size !== seats.length) {
    return res.status(400).json({
      message: "Duplicate seats are not allowed."
    });
  }

  try {
    const existing = mongoConnected
      ? await Booking.find({
          movieId: movie.id,
          showtime
        })
      : memoryBookings.filter(
          (booking) =>
            booking.movieId === movie.id &&
            booking.showtime === showtime
        );

    const alreadyTaken = new Set(
      existing.flatMap((booking) => booking.seats)
    );

    const conflict = seats.find((seat) =>
      alreadyTaken.has(seat)
    );

    if (conflict) {
      return res.status(409).json({
        message: `Seat ${conflict} has already been booked for this show. Please select another seat.`
      });
    }

    const booking = {
      bookingCode: `IM${Date.now().toString().slice(-8)}`,
      movieId: movie.id,
      movieTitle: movie.title,
      showtime,
      seats,
      totalAmount: movie.price * seats.length,
      customerName: customerName.trim()
    };

    if (mongoConnected) {
      const saved = await Booking.create(booking);
      return res.status(201).json(saved);
    }

    const saved = {
      ...booking,
      _id: booking.bookingCode,
      createdAt: new Date()
    };

    memoryBookings.unshift(saved);

    return res.status(201).json(saved);
  } catch (error) {
    console.error("Booking error:", error);

    res.status(500).json({
      message: "Booking failed. Please try again."
    });
  }
});

// Start the server
async function start() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      mongoConnected = true;
      console.log("Connected to MongoDB.");
    } catch (error) {
      console.error(
        "MongoDB connection failed; starting in demo mode:",
        error.message
      );
    }
  } else {
    console.log(
      "MONGO_URI not set: starting in demo mode. Bookings reset on restart."
    );
  }

  app.listen(PORT, () => {
    console.log(`IMovies API running on port ${PORT}`);
  });
}

start();
