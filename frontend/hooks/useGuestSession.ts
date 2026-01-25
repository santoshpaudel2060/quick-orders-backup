import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export interface GuestSessionData {
  sessionId: string;
  tableNumber: number;
  customerName: string;
  customerId: string;
  cart: {
    items: any[];
    totalAmount: number;
  };
  sessionStartTime: string;
  lastActivityTime: string;
  isActive: boolean;
}

interface UseGuestSessionReturn {
  sessionId: string | null;
  session: GuestSessionData | null;
  isLoading: boolean;
  isSessionValid: boolean;
  createSession: (
    tableNumber: number,
    customerName: string,
  ) => Promise<boolean>;
  restoreSession: (sessionId: string) => Promise<boolean>;
  updateCartInSession: (items: any[], totalAmount: number) => Promise<boolean>;
  endSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

const apiURL = process.env.NEXT_PUBLIC_API_URL;

export const useGuestSession = (): UseGuestSessionReturn => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<GuestSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);

  /**
   * Create a new guest session after QR scan
   */
  const createSession = useCallback(
    async (tableNumber: number, customerName: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        const response = await axios.post(
          `${apiURL}/api/guest-session/create`,
          {
            tableNumber,
            customerName,
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data.success) {
          const newSessionId = response.data.sessionId;
          setSessionId(newSessionId);
          setSession(response.data.session);
          setIsSessionValid(true);

          // Store in localStorage as backup
          localStorage.setItem("guestSessionId", newSessionId);
          localStorage.setItem(
            "guestSession",
            JSON.stringify(response.data.session),
          );

          toast.success("Session created successfully!");
          return true;
        }
      } catch (error: any) {
        console.error("Create session error:", error);
        const message =
          error.response?.data?.message || "Failed to create session";
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Restore session on page load/refresh
   */
  const restoreSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${apiURL}/api/guest-session/validate/${id}`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        setSessionId(id);
        setSession(response.data.session);
        setIsSessionValid(true);

        // Update localStorage
        localStorage.setItem("guestSessionId", id);
        localStorage.setItem(
          "guestSession",
          JSON.stringify(response.data.session),
        );

        return true;
      }
    } catch (error: any) {
      console.error("Restore session error:", error);
      // Session expired or invalid
      setSessionId(null);
      setSession(null);
      setIsSessionValid(false);
      localStorage.removeItem("guestSessionId");
      localStorage.removeItem("guestSession");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh session to keep it alive and get latest data
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false;

    try {
      const response = await axios.get(
        `${apiURL}/api/guest-session/${sessionId}`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setSession(response.data);
      localStorage.setItem("guestSession", JSON.stringify(response.data));
      return true;
    } catch (error: any) {
      console.error("Refresh session error:", error);
      if (error.response?.status === 404) {
        // Session expired
        setSessionId(null);
        setSession(null);
        setIsSessionValid(false);
        localStorage.removeItem("guestSessionId");
        localStorage.removeItem("guestSession");
      }
      return false;
    }
  }, [sessionId]);

  /**
   * Update cart items in session
   */
  const updateCartInSession = useCallback(
    async (items: any[], totalAmount: number): Promise<boolean> => {
      if (!sessionId) {
        toast.error("Session not found");
        return false;
      }

      try {
        const response = await axios.put(
          `${apiURL}/api/guest-session/${sessionId}/cart`,
          {
            items,
            totalAmount,
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        setSession(response.data.session);
        localStorage.setItem(
          "guestSession",
          JSON.stringify(response.data.session),
        );
        return true;
      } catch (error: any) {
        console.error("Update cart error:", error);
        toast.error("Failed to update cart");
        return false;
      }
    },
    [sessionId],
  );

  /**
   * End guest session
   */
  const endSession = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false;

    try {
      await axios.post(
        `${apiURL}/api/guest-session/${sessionId}/end`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setSessionId(null);
      setSession(null);
      setIsSessionValid(false);
      localStorage.removeItem("guestSessionId");
      localStorage.removeItem("guestSession");

      toast.success("Session ended");
      return true;
    } catch (error: any) {
      console.error("End session error:", error);
      toast.error("Failed to end session");
      return false;
    }
  }, [sessionId]);

  /**
   * Try to restore session on component mount
   */
  useEffect(() => {
    const restoreStoredSession = async () => {
      const storedSessionId =
        localStorage.getItem("guestSessionId") || sessionId;

      if (storedSessionId) {
        const restored = await restoreSession(storedSessionId);
        if (!restored) {
          // Session invalid/expired
          localStorage.removeItem("guestSessionId");
          localStorage.removeItem("guestSession");
        }
      }
    };

    restoreStoredSession();
  }, []);

  return {
    sessionId,
    session,
    isLoading,
    isSessionValid,
    createSession,
    restoreSession,
    updateCartInSession,
    endSession,
    refreshSession,
  };
};
