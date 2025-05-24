import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  Timestamp,
  // getDoc, // Removed duplicate import
  query, // Added query
  where, // Added where
  orderBy, // Added orderBy
  getDocs, // Added getDocs
  QueryDocumentSnapshot, // Added QueryDocumentSnapshot for typing
} from "firebase/firestore";
import { db } from "../firebase"; // Assuming db is exported from firebase.ts

export interface RedirectLog {
  id?: string; // Optional: ID is usually handled by Firestore
  userId: string;
  targetUrl: string;
  startTime: Timestamp; // Use Firestore Timestamp
  endTime?: Timestamp; // Use Firestore Timestamp
  durationMinutes?: number;
}

export interface DailyLog {
  id?: string; // Optional: ID is {userId}_{YYYYMMDD}
  userId: string;
  date: string; // YYYYMMDD format
  totalDurationMinutes: number;
  goalMinutes: number;
  achieved: boolean;
}

export function useLogs() {
  const addRedirectLog = async (
    userId: string,
    targetUrl: string
  ): Promise<string | null> => {
    try {
      const startTime = Timestamp.now(); // Use Firestore Timestamp
      const redirectLogRef = await addDoc(collection(db, "redirectLogs"), {
        userId,
        targetUrl,
        startTime,
      });
      return redirectLogRef.id;
    } catch (error) {
      console.error("Error adding redirect log:", error);
      return null;
    }
  };

  const updateRedirectLogAndCreateDailyLog = async (
    redirectLogId: string,
    userId: string,
    goalMinutesPerDay: number
  ): Promise<void> => {
    try {
      const endTime = Timestamp.now(); // Use Firestore Timestamp
      const redirectLogRef = doc(db, "redirectLogs", redirectLogId);
      const redirectLogSnap = await getDoc(redirectLogRef);

      if (!redirectLogSnap.exists()) {
        console.error("Redirect log not found");
        return;
      }

      const redirectLogData = redirectLogSnap.data() as RedirectLog;
      // Calculate duration in minutes, rounded up
      const durationMilliseconds = endTime.toMillis() - redirectLogData.startTime.toMillis();
      const durationMinutes = Math.ceil(durationMilliseconds / (1000 * 60));

      await updateDoc(redirectLogRef, {
        endTime,
        durationMinutes,
      });

      const date = new Date();
      const dateString = `${date.getFullYear()}${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
      const dailyLogId = `${userId}_${dateString}`;
      const dailyLogRef = doc(db, "dailyLogs", dailyLogId);
      const dailyLogSnap = await getDoc(dailyLogRef);

      let newTotalDurationMinutes = durationMinutes;
      if (dailyLogSnap.exists()) {
        const dailyLogData = dailyLogSnap.data() as DailyLog;
        newTotalDurationMinutes += dailyLogData.totalDurationMinutes;
      }

      const achieved = newTotalDurationMinutes <= goalMinutesPerDay;

      await setDoc(
        dailyLogRef,
        {
          userId,
          date: dateString,
          totalDurationMinutes: newTotalDurationMinutes,
          goalMinutes: goalMinutesPerDay,
          achieved,
        },
        { merge: true } // Upsert behavior
      );
    } catch (error) {
      console.error("Error updating redirect log or creating daily log:", error);
    }
  };

  return {
    addRedirectLog,
    updateRedirectLogAndCreateDailyLog,
  getDailyLog, // Export getDailyLog
  getMonthlyLogs, // Export getMonthlyLogs
  };
}

// Helper function to get current date in YYYYMMDD format
const getCurrentDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
};

// Function to fetch a daily log
const getDailyLog = async (userId: string): Promise<DailyLog | null> => {
  if (!userId) return null;
  const dateString = getCurrentDateString();
  const dailyLogId = `${userId}_${dateString}`;
  const dailyLogRef = doc(db, "dailyLogs", dailyLogId);

  try {
    const dailyLogSnap = await getDoc(dailyLogRef);
    if (dailyLogSnap.exists()) {
      return dailyLogSnap.data() as DailyLog;
    }
    return null;
  } catch (error) {
    console.error("Error fetching daily log:", error);
    return null;
  }
};

// Function to fetch all daily logs for a given user, year, and month
const getMonthlyLogs = async (
  userId: string,
  year: number,
  month: number // 1-indexed month
): Promise<DailyLog[]> => {
  if (!userId) return [];

  const monthString = month.toString().padStart(2, "0");
  // Firestore queries are on document fields, not IDs directly in this manner for ranges on sub-parts of ID.
  // We will query by userId and a range on the 'date' field.
  // The 'date' field is YYYYMMDD.
  const startDateString = `${year}${monthString}01`;
  // Calculate the last day of the month
  const lastDay = new Date(year, month, 0).getDate(); // month is 1-indexed, Date constructor month is 0-indexed
  const endDateString = `${year}${monthString}${lastDay.toString().padStart(2, "0")}`;

  const logsCollectionRef = collection(db, "dailyLogs");
  const q = query(
    logsCollectionRef,
    where("userId", "==", userId),
    where("date", ">=", startDateString),
    where("date", "<=", endDateString),
    orderBy("date", "asc") // Order by date to ensure logs are sequential
  );

  try {
    const querySnapshot = await getDocs(q);
    const logs: DailyLog[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot) => { // Typed docSnap
      logs.push({ id: docSnap.id, ...docSnap.data() } as DailyLog);
    });
    return logs;
  } catch (error) {
    console.error("Error fetching monthly logs:", error);
    return [];
  }
};
