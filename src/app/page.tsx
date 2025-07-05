import Sidebar from './components/sidebar';
import FeedView from './components/feed';

export default function Home() {
  return (
    <main className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <div className="flex-[0.25] border-r border-gray-800">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 p-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-white">Home</h1>
            <p className="text-gray-400 text-sm mt-1">Your personalized feed</p>
          </div>
        </div>
        
        {/* Feed Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4">
            <FeedView />
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div className="flex-[0.3] hidden xl:block p-4 border-l border-gray-800">
        <div className="sticky top-4">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">What's happening?</h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">Trending</div>
                <div className="text-white font-medium">#StreamSDK</div>
                <div className="text-gray-400 text-sm">1.2K posts</div>
              </div>
              <div className="p-4 bg-zinc-800 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">Trending</div>
                <div className="text-white font-medium">#RealTimeFeeds</div>
                <div className="text-gray-400 text-sm">856 posts</div>
              </div>
              <div className="p-4 bg-zinc-800 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">Trending</div>
                <div className="text-white font-medium">#NextJS</div>
                <div className="text-gray-400 text-sm">2.1K posts</div>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-2xl p-6 border border-gray-800 mt-4">
            <h2 className="text-lg font-semibold text-white mb-4">Who to follow</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div>
                    <div className="text-white font-medium">Stream Team</div>
                    <div className="text-gray-400 text-sm">@stream</div>
                  </div>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                  Follow
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                    N
                  </div>
                  <div>
                    <div className="text-white font-medium">Next.js</div>
                    <div className="text-gray-400 text-sm">@nextjs</div>
                  </div>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                  Follow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
