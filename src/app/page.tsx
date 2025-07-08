import Sidebar from "../components/sidebar";
import FeedView from "../components/home";
import { WhoToFollow } from "../components/whotofollow";
import Whatshappening from "@/components/whatshappening";

export default function Home() {
  return (
    <main className="grid grid-cols-[280px_auto_350px] gap-5 min-h-screen bg-black mx-auto w-[1280px]">
      {/* Sidebar */}
      <div className="flex-[0.25] border-r border-gray-800">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Feed Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <FeedView />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="flex-[0.3] hidden xl:block p-4 border-l border-gray-800">
        <div className="sticky top-4">
          <Whatshappening />
          <WhoToFollow />
        </div>
      </div>
    </main>
  );
}
