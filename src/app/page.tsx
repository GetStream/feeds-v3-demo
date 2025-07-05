import Sidebar from './components/sidebar';
import FeedView from './components/feed';

export default function Home() {
  return (
    <main className="flex min-h-screen max-w-[1300px] mx-auto px-2 text-white bg-black">
      <Sidebar />
      <div className="flex-1 border-x border-gray-700 overflow-y-scroll h-screen">
        <div className="sticky top-0 z-10 bg-black border-b border-gray-700 p-4">
          <h2 className="text-xl font-bold">Home</h2>
        </div>
        <div className="p-4">
          <FeedView />
        </div>
      </div>
      <div className="flex-[0.3] hidden lg:block p-4">
        <div className="bg-zinc-900 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-white">What's happening?</h2>
        </div>
      </div>
    </main>
  );
}
