import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  increment,
  serverTimestamp, // To use for reaction createdAt
} from "firebase/firestore";
import { db } from "../firebase";

export interface Reaction {
  id?: string;
  fromUserId: string;
  type: "like" | "fire" | "stamp"; // Example reaction types
  createdAt: Timestamp;
}

export interface TimelinePost {
  id: string; // Firestore document ID
  userId: string;
  userName?: string; // Optional: denormalized for display
  iconURL?: string; // Optional: denormalized for display
  date: Timestamp | string; // Can be Firestore Timestamp or YYYYMMDD string
  result: "achieved" | "failed";
  durationMinutes: number;
  goalMinutes: number;
  comment?: string;
  likes: number; // Aggregated count
}

export function useTimeline() {
  const getTimelinePosts = async (
    limitCount: number = 20
  ): Promise<TimelinePost[]> => {
    const postsCollectionRef = collection(db, "timelinePosts");
    // Assuming 'date' is a field that can be ordered.
    // If 'date' is a string YYYYMMDD, this will work. If it's a Timestamp, it will also work.
    // For consistency and better querying, Firestore Timestamps are preferred for date fields.
    const q = query(
      postsCollectionRef,
      orderBy("date", "desc"),
      limit(limitCount)
    );

    try {
      const querySnapshot = await getDocs(q);
      const posts: TimelinePost[] = [];
      querySnapshot.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...docSnap.data() } as TimelinePost);
      });
      return posts;
    } catch (error) {
      console.error("Error fetching timeline posts:", error);
      return [];
    }
  };

  const addReaction = async (
    postId: string,
    fromUserId: string,
    reactionType: Reaction["type"]
  ): Promise<void> => {
    if (!postId || !fromUserId) {
      console.error("Post ID or User ID is missing for reaction");
      return;
    }
    try {
      const postRef = doc(db, "timelinePosts", postId);
      const reactionsCollectionRef = collection(postRef, "reactions");

      // Add the reaction document
      await addDoc(reactionsCollectionRef, {
        fromUserId,
        type: reactionType,
        createdAt: serverTimestamp(), // Use server timestamp for consistency
      });

      // Update the likes count on the parent post
      // We'll only increment for 'like' type for this example,
      // but this could be configured based on reactionType.
      if (reactionType === "like") {
        await updateDoc(postRef, {
          likes: increment(1),
        });
      }
      // If other reactions should also increment a general 'reactionCount' or specific counts,
      // that logic would go here. For now, only 'like' affects 'likes'.
    } catch (error) {
      console.error("Error adding reaction:", error);
      // Consider re-throwing or handling more gracefully
    }
  };

  return {
    getTimelinePosts,
    addReaction,
  };
}
