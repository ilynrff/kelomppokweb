import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type AvailabilitySlot = { time: string; available: boolean; status: string };
type Court = { id: string; venueId: string; name: string; location: string; pricePerHour: number; image?: string | null; description?: string | null };
type Venue = { id: string; name: string; location: string; description?: string | null; thumbnail?: string | null; courts: Court[] };

const loadSnapScript = (clientKey: string, isProduction: boolean): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).snap) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Midtrans Snap script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export function useBooking() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<AvailabilitySlot[]>([]);

  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isToastOpen, setIsToastOpen] = useState(false);

  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  useEffect(() => {
    fetchJson<Venue[]>("/api/venues")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid response");
        setVenues(data);
        
        // Flatten all courts from all venues
        const allCourts = data.flatMap(v => v.courts);
        setCourts(allCourts);

        const params = new URLSearchParams(window.location.search);
        const urlCourtId = params.get("courtId");
        if (urlCourtId) {
          const targetCourt = allCourts.find((c: Court) => c.id === urlCourtId);
          if (targetCourt) {
            setSelectedVenue(targetCourt.venueId);
            setSelectedCourt(urlCourtId);
          }
        }
      })
      .catch((err: unknown) => {
        console.error("Error fetching venues/courts:", err);
        setVenues([]);
        setCourts([]);
        setError(getErrorMessage(err) || "Gagal memuat data lapangan");
        setIsToastOpen(true);
      });
  }, []);

  useEffect(() => {
    if (!selectedCourt) {
      setTimeSlots([]);
      setSelectedSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    setError("");
    setSuccessMsg("");

    const isoDate = selectedDate.toISOString().slice(0, 10);
    fetchJson<AvailabilitySlot[]>(`/api/courts/availability?courtId=${selectedCourt}&date=${isoDate}`)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid response");
        setTimeSlots(data);
      })
      .catch((err: unknown) => {
        console.error("Error fetching availability:", err);
        setTimeSlots([]);
        setError(getErrorMessage(err) || "Gagal memuat jadwal");
        setIsToastOpen(true);
      })
      .finally(() => setIsLoadingSlots(false));
  }, [selectedCourt, selectedDate]);

  const toggleSlot = (time: string) => {
    setSelectedSlots((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort(),
    );
  };

  const checkout = async (equipmentPackage = "NONE", equipmentPrice = 0) => {
    if (isLoading) return;
    
    if (status !== "authenticated" || !session?.user) {
      setError("Anda harus login untuk melakukan booking.");
      setIsToastOpen(true);
      setTimeout(() => router.push("/login"), 800);
      return;
    }

    if (!selectedCourt || selectedSlots.length === 0) {
      setError("Mohon pilih lapangan dan jam bermain.");
      setIsToastOpen(true);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    const isoDate = selectedDate.toISOString().slice(0, 10);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selectedCourt,
          date: isoDate,
          timeSlots: selectedSlots,
          equipmentPackage,
          equipmentPrice,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(result?.error || "Gagal melakukan booking.");
        setIsToastOpen(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push(`/booking/summary/${result.id}`);
    } catch (e: unknown) {
      setIsLoading(false);
      setError(getErrorMessage(e) || "Terjadi kesalahan koneksi server.");
      setIsToastOpen(true);
    }
  };

  return {
    venues,
    selectedVenue,
    setSelectedVenue,
    courts,
    timeSlots,
    isLoadingSlots,
    dates,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    setSelectedSlots,
    toggleSlot,
    checkout,
    isLoading,
    error,
    successMsg,
    isToastOpen,
    setIsToastOpen,
  };
}
