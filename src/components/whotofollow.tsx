"use client";
import { useWhoToFollow } from "../hooks/useWhoToFollow";
import { Avatar } from "./avatar";
import { Loading } from "./loading";
import { UserActions } from "./userActions";
import Link from "next/link";

export function WhoToFollow() {
  const { whoToFollow, isLoading } = useWhoToFollow();

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 mt-4 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
      <h2 className="text-lg font-semibold text-white mb-4">Who to follow</h2>
      {isLoading ? (
        <div className="text-white">
          <div>
            <Loading message="" />
          </div>
        </div>
      ) : whoToFollow.length ? (
        <>
          {whoToFollow.map((user) => (
            <div key={user.id} className="space-y-4 my-5">
              <div className="flex items-center justify-between min-w-0">
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center space-x-3 min-w-0 flex-1 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="flex-shrink-0">
                    <Avatar userName={user.name} size="md" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate overflow-hidden whitespace-nowrap">
                      {user.name || user.id}
                    </div>
                    <div className="text-gray-400 text-xs truncate overflow-hidden whitespace-nowrap">
                      @{user.id}
                    </div>
                  </div>
                </Link>
                <div className="flex-shrink-0">
                  <UserActions targetUserId={user.id} />
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="text-white">
          <div>You&apos;re all caught up with your follows!</div>
          <div className="text-gray-400 text-xs">
            Keep an eye out for fresh recommendations as the community grows.
          </div>
        </div>
      )}
    </div>
  );
}
