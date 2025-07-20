import { ActivityResponse } from "@stream-io/feeds-client";
import { UserAvatar } from "./userActions";
import { UserActions } from "./userActions";
import { useUser } from "../hooks/useUser";
import { Trash2 } from "lucide-react";
import ReactionsPanel from "./reaction";
import { useFeedActions } from "../hooks";
import CommentsPanel from "./comment";
import Link from "next/link";

export default function Activity({ activity }: { activity: ActivityResponse }) {
  const { user } = useUser();
  const { handleDeleteActivity } = useFeedActions();

  return (
    <article className="border-b border-b-2 border-gray-800 shadow-sm my-15 transition-colors activity">
      <div className="flex items-start space-x-3 mb-4">
        {activity.user?.id ? (
          <Link href={`/profile/${activity.user.id}`}>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <UserAvatar userId={activity.user?.name || "..."} />
            </div>
          </Link>
        ) : (
          <UserAvatar userId={activity.user?.name || "..."} />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              {activity.user?.id ? (
                <Link
                  href={`/profile/${activity.user.id}`}
                  className="font-semibold text-white truncate overflow-hidden whitespace-nowrap max-w-[50%] hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {activity.user?.name || activity.user?.id || "..."}
                </Link>
              ) : (
                <span className="font-semibold text-white truncate overflow-hidden whitespace-nowrap max-w-[50%]">
                  {activity.user?.name || activity.user?.id || "..."}
                </span>
              )}
              {activity.created_at && (
                <span className="text-sm text-gray-400">
                  {new Date(activity.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {activity.user?.id && activity.user.id !== user?.id && (
                <UserActions targetUserId={activity.user.id} />
              )}
              {activity.user?.id === user?.id && (
                <button
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="remove-activity text-red-400 hover:bg-gray-700 rounded-full cursor-pointer transition-colors p-2"
                  title="Delete activity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-200 text-lg leading-relaxed">
            {activity.text || activity.type}
          </p>
        </div>
      </div>

      <ReactionsPanel activity={activity} />
      <CommentsPanel activity={activity} />
    </article>
  );
}
