"use client";

import { create } from "zustand";
import type { Movie } from "@/types";

interface BookingState {
  movie: Movie | null;
  theatreId: string | null;
  theatreName: string | null;
  showId: string | null;
  showTime: string | null;
  date: string | null;
  selectedSeats: string[];
  totalAmount: number;
  couponCode: string | null;
  discount: number;
  setMovie: (movie: Movie) => void;
  setTheatre: (id: string, name: string) => void;
  setShow: (id: string, time: string, date: string) => void;
  toggleSeat: (seatId: string, price: number) => void;
  setCoupon: (code: string | null, discount: number) => void;
  clear: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  movie: null,
  theatreId: null,
  theatreName: null,
  showId: null,
  showTime: null,
  date: null,
  selectedSeats: [],
  totalAmount: 0,
  couponCode: null,
  discount: 0,
  setMovie: (movie) => set({ movie }),
  setTheatre: (theatreId, theatreName) => set({ theatreId, theatreName }),
  setShow: (showId, showTime, date) => set({ showId, showTime, date }),
  toggleSeat: (seatId, price) => {
    const { selectedSeats, totalAmount } = get();
    if (selectedSeats.includes(seatId)) {
      set({
        selectedSeats: selectedSeats.filter((s) => s !== seatId),
        totalAmount: Math.max(0, totalAmount - price),
      });
    } else if (selectedSeats.length < 10) {
      set({
        selectedSeats: [...selectedSeats, seatId],
        totalAmount: totalAmount + price,
      });
    }
  },
  setCoupon: (couponCode, discount) => set({ couponCode, discount }),
  clear: () =>
    set({
      movie: null,
      theatreId: null,
      theatreName: null,
      showId: null,
      showTime: null,
      date: null,
      selectedSeats: [],
      totalAmount: 0,
      couponCode: null,
      discount: 0,
    }),
}));
