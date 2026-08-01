/**
 * Seed MongoDB with demo users, movies, theatres, screens, shows, coupons.
 * Usage: npx tsx scripts/seed.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { connectDB, disconnectDB } from "../src/lib/db/mongodb";
import { User, Movie, Theatre, Screen, Show, Coupon, Wallet } from "../src/models";
import { hashPassword } from "../src/lib/auth/password";
import { SEED_MOVIES } from "../src/data/movies";
import { ROLES } from "../src/constants/roles";
import { SEAT_TYPES, MOVIE_STATUS } from "../src/constants";
import { slugify } from "../src/utils/format";

function buildSeatLayout(rows = 8, cols = 12) {
  const rowLetters = "ABCDEFGH".slice(0, rows).split("");
  const seats = [];
  for (const row of rowLetters) {
    for (let n = 1; n <= cols; n++) {
      const type =
        row <= "B"
          ? SEAT_TYPES.RECLINER
          : row <= "D"
            ? SEAT_TYPES.PREMIUM
            : SEAT_TYPES.REGULAR;
      seats.push({
        id: `${row}${n}`,
        row,
        number: n,
        type,
        price: type === SEAT_TYPES.RECLINER ? 450 : type === SEAT_TYPES.PREMIUM ? 320 : 220,
        isAvailable: true,
        isAisle: n === 3 || n === 9,
      });
    }
  }
  return { rows, columns: cols, seats };
}

async function seed() {
  await connectDB();
  console.log("Connected. Clearing collections…");

  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Theatre.deleteMany({}),
    Screen.deleteMany({}),
    Show.deleteMany({}),
    Coupon.deleteMany({}),
    Wallet.deleteMany({}),
  ]);

  const password = await hashPassword("Password1");

  const [superAdmin, admin, owner, customer] = await User.create([
    {
      name: "Super Admin",
      email: "super@cinepass.app",
      password,
      role: ROLES.SUPER_ADMIN,
      isEmailVerified: true,
      referralCode: nanoid(8).toUpperCase(),
    },
    {
      name: "Platform Admin",
      email: "admin@cinepass.app",
      password,
      role: ROLES.ADMIN,
      isEmailVerified: true,
      referralCode: nanoid(8).toUpperCase(),
    },
    {
      name: "Theatre Owner",
      email: "owner@cinepass.app",
      password,
      role: ROLES.THEATRE_OWNER,
      isEmailVerified: true,
      referralCode: nanoid(8).toUpperCase(),
    },
    {
      name: "Demo Customer",
      email: "customer@cinepass.app",
      password,
      role: ROLES.CUSTOMER,
      isEmailVerified: true,
      referralCode: nanoid(8).toUpperCase(),
      rewardPoints: 120,
    },
  ]);

  await Wallet.create([
    { userId: customer._id, balance: 500 },
    { userId: admin._id, balance: 0 },
  ]);

  const movies = await Movie.insertMany(
    SEED_MOVIES.map((m) => ({
      ...m,
      _id: undefined,
      releaseDate: new Date(m.releaseDate),
      status: m.status === "upcoming" ? MOVIE_STATUS.UPCOMING : MOVIE_STATUS.NOW_SHOWING,
    }))
  );

  const theatre = await Theatre.create({
    name: "PVR ICON Andheri",
    slug: slugify("PVR ICON Andheri"),
    address: "Infinity Mall, Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400053",
    location: { type: "Point", coordinates: [72.835, 19.136] },
    amenities: ["Dolby Atmos", "Recliners", "F&B", "Parking"],
    ownerId: owner._id,
    rating: 4.6,
    images: [],
    isActive: true,
  });

  await User.findByIdAndUpdate(owner._id, { theatreIds: [theatre._id] });

  const screen = await Screen.create({
    theatreId: theatre._id,
    name: "Audi 1",
    capacity: 96,
    screenType: "DOLBY",
    seatLayout: buildSeatLayout(),
  });

  const nowShowing = movies.filter((m) => m.status === MOVIE_STATUS.NOW_SHOWING);
  const shows = [];
  for (const movie of nowShowing.slice(0, 4)) {
    for (let d = 0; d < 3; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      const start = new Date(date);
      start.setHours(21, 15, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 2, start.getMinutes() + 30);

      shows.push({
        movieId: movie._id,
        theatreId: theatre._id,
        screenId: screen._id,
        date,
        startTime: start,
        endTime: end,
        language: movie.languages[0],
        format: "2D",
        basePrice: 220,
        pricing: [
          { seatType: SEAT_TYPES.REGULAR, price: 220 },
          { seatType: SEAT_TYPES.PREMIUM, price: 320 },
          { seatType: SEAT_TYPES.RECLINER, price: 450 },
        ],
        availableSeats: 96,
        totalSeats: 96,
        bookedSeats: [],
        isActive: true,
      });
    }
  }
  await Show.insertMany(shows);

  await Coupon.insertMany([
    {
      code: "CINEPASS50",
      description: "50% off first bookings",
      discountType: "percentage",
      discountValue: 50,
      minAmount: 200,
      maxDiscount: 250,
      usageLimit: 10000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 86400000),
      isActive: true,
    },
    {
      code: "STUDENT20",
      description: "Student special",
      discountType: "percentage",
      discountValue: 20,
      minAmount: 150,
      maxDiscount: 100,
      usageLimit: 5000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 86400000),
      isActive: true,
    },
    {
      code: "WALLET150",
      description: "Flat ₹150 off",
      discountType: "fixed",
      discountValue: 150,
      minAmount: 400,
      usageLimit: 2000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 86400000),
      isActive: true,
    },
  ]);

  console.log("\n✅ Seed complete\n");
  console.log("Accounts (password: Password1)");
  console.log("  super@cinepass.app   → Super Admin");
  console.log("  admin@cinepass.app   → Admin");
  console.log("  owner@cinepass.app   → Theatre Owner");
  console.log("  customer@cinepass.app → Customer");
  console.log(`\nMovies: ${movies.length} · Shows: ${shows.length} · Theatre: ${theatre.name}`);

  await disconnectDB();
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
