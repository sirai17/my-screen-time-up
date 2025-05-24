import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTimeline, TimelinePost, Reaction } from "../hooks/useTimeline"; // Ensure Reaction is exported if needed here, or just its type
import { Timestamp } from "firebase/firestore"; // For type checking

// Helper to format date
const formatDate = (date: Timestamp | string | undefined): string => {
  if (!date) return "Unknown date";
  if (typeof date === "string") {
    // Assuming YYYYMMDD string
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${month}/${day}/${year}`;
  }
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  return "Invalid date";
};

const Timeline: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { getTimelinePosts, addReaction } = useTimeline();

  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPosts = await getTimelinePosts(20); // Fetch latest 20 posts
      setPosts(fetchedPosts);
    } catch (err) {
      console.error("Error fetching timeline posts:", err);
      setError("Failed to load timeline posts.");
    } finally {
      setIsLoading(false);
    }
  }, [getTimelinePosts]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    } else {
      setPosts([]); // Clear posts if user logs out
    }
  }, [user, fetchPosts]);

  const handleReactionClick = async (
    postId: string,
    reactionType: Reaction["type"]
  ) => {
    if (!user) {
      setError("You must be logged in to react.");
      return;
    }
    try {
      await addReaction(postId, user.uid, reactionType);
      // Optimistic update for likes
      if (reactionType === "like") {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
      // For a more robust solution, you might re-fetch the specific post or all posts
      // fetchPosts(); // Or fetch just the updated post
    } catch (err) {
      console.error("Error adding reaction:", err);
      setError("Failed to add reaction.");
    }
  };

  if (authLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading authentication status...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p>Please sign in to view the timeline.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading timeline posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>No timeline posts yet. Be the first to share your progress!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Timeline</h1>
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white shadow-md rounded-lg p-6 border border-gray-200"
        >
          <div className="flex items-center mb-4">
            <img
              src={post.iconURL || "https://via.placeholder.com/50"} // Placeholder icon
              alt={post.userName || "User"}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <p className="font-semibold text-lg">
                {post.userName || "Anonymous User"}
              </p>
              <p className="text-gray-500 text-sm">
                {formatDate(post.date)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                post.result === "achieved"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {post.result === "achieved" ? "🔥 Achieved" : "💥 Failed Goal"}
            </span>
          </div>

          <p className="text-gray-700 mb-2">
            Used <strong>{post.durationMinutes} min</strong> / Goal{" "}
            <strong>{post.goalMinutes} min</strong>
          </p>

          {post.comment && (
            <p className="text-gray-600 italic bg-gray-50 p-3 rounded-md">
              "{post.comment}"
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleReactionClick(post.id, "like")}
                className="flex items-center text-blue-500 hover:text-blue-700 transition-colors duration-150"
                aria-label="Like post"
              >
                <span role="img" aria-label="like icon" className="mr-1">👍</span> Like ({post.likes})
              </button>
              {/* Add other reaction buttons here if needed, e.g., "fire" or "stamp" */}
              {/* Example for a "fire" reaction - assuming it doesn't update 'likes' directly */}
              <button
                onClick={() => handleReactionClick(post.id, "fire")}
                className="flex items-center text-orange-500 hover:text-orange-700 transition-colors duration-150"
                aria-label="Fire reaction"
              >
                 <span role="img" aria-label="fire icon" className="mr-1">🔥</span> Fire
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {post.likes} {post.likes === 1 ? "like" : "likes"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
