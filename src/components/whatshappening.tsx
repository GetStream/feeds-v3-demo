export default function Whatshappening() {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4">
      <h2 className="text-lg font-semibold text-white mb-4">
        What's happening?
      </h2>
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
  );
}
