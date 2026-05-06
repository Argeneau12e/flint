"use client";

import { useEffect, useState } from "react";

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

interface CommentsProps {
  invoiceId: string;
  readOnly?: boolean;
}

export default function Comments({ invoiceId, readOnly = false }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/invoice/comments?invoiceId=${invoiceId}`);
        const data = await res.json();
        if (data.comments) {
          setComments(data.comments);
        }
      } catch (err) {
        console.error('Fetch comments error:', err);
      }
    };

    fetchComments();
  }, [invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/invoice/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          text: newComment,
        }),
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setComments([...comments, data.comment]);
        setNewComment("");
      }
    } catch (err) {
      console.error('Submit comment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium mb-4" style={{ color: "#f7f7f5" }}>
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      <div className="space-y-3 mb-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "#888" }}>
                {comment.author}
              </span>
              <span className="text-xs" style={{ color: "#555" }}>
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm" style={{ color: "#aaa" }}>
              {comment.text}
            </p>
          </div>
        ))}
      </div>

      {/* Add comment */}
      {!readOnly && (
        <form onSubmit={handleSubmit}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f7f7f5",
            }}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 liquid-btn"
            >
              {loading ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
