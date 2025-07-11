"use client";

import { useState } from "react";
import { Send, Image, Smile } from "lucide-react";
import { useUser } from "../hooks/useUser";
import { Avatar } from "./avatar";
import { useFeedActions } from "@/hooks";

export function Composer() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const maxLength = 280; // Twitter-like character limit
  const { user } = useUser();
  const { handlePost } = useFeedActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length > maxLength) return;
    setLoading(true);
    await handlePost(text.trim());
    setText("");
    setLoading(false);
  };

  const characterCount = text.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl p-4 shadow-sm mb-4 border border-transparent ${
        isActive ? "border-zinc-500" : "bg-zinc-900"
      }`}
    >
      <div className="flex items-start space-x-3">
        <Avatar userName={user?.name} userId={user?.id} size="md" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening?"
            rows={3}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            className="w-full p-3 border-0 bg-transparent text-white placeholder-gray-400 resize-none !outline-none text-lg"
            disabled={loading}
          />

          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-400/10"
                title="Add image"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-400/10"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOverLimit
                      ? "bg-red-500"
                      : isNearLimit
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isOverLimit
                      ? "text-red-400"
                      : isNearLimit
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                >
                  {characterCount}/{maxLength}
                </span>
              </div>
              <button
                type="submit"
                disabled={!text.trim() || loading || isOverLimit}
                className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
