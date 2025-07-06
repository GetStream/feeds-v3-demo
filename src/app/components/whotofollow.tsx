"use client"
import { useWhoToFollow } from "../../hooks/useWhoToFollow";
import { Avatar } from "./avatar";
import { UserActions } from "./userActions";

export function WhoToFollow() {
    const {  whoToFollow } = useWhoToFollow();

    return (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-gray-800 mt-4">
            <h2 className="text-lg font-semibold text-white mb-4">Who to follow</h2>
            {whoToFollow.map(user=><div key={user.id} className="space-y-4 my-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar 
                    userName={user.name}
                    size="md"
                  />
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-gray-400 text-xs">@{user.id}</div>
                  </div>
                </div>
                <UserActions targetUserId={user.id} />
              </div>
            </div>)}
          </div>
    )
}