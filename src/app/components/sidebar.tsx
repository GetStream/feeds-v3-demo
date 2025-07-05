import { MdHome, MdSearch, MdNotificationsNone, MdBookmarkBorder, MdPerson, MdTrendingUp } from 'react-icons/md';

const sidebarItems = [
  { icon: MdHome, label: 'Home', active: true },
  { icon: MdSearch, label: 'Explore' },
  { icon: MdNotificationsNone, label: 'Notifications' },
  { icon: MdBookmarkBorder, label: 'Bookmarks' },
  { icon: MdTrendingUp, label: 'Trending' },
  { icon: MdPerson, label: 'Profile' },
];

export default function Sidebar() {
  return (
    <div className="flex flex-col items-start flex-[0.2] p-4 min-w-[250px] space-y-2">
      {/* Logo/Brand */}
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold text-blue-500">FeedsApp</h1>
      </div>
      
      {/* Navigation Items */}
      {sidebarItems.map(({ icon: Icon, label, active }) => (
        <div 
          key={label} 
          className={`flex items-center space-x-4 py-3 px-4 rounded-full cursor-pointer transition-all duration-200 w-full ${
            active 
              ? 'bg-blue-500 text-white shadow-lg' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Icon className="text-xl" />
          <span className="text-lg font-medium">{label}</span>
        </div>
      ))}
      
      {/* User Profile Section */}
      <div className="mt-auto pt-8 border-t border-gray-700 w-full">
        <div className="flex items-center space-x-3 px-4 py-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            D
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">Demo User</div>
            <div className="text-gray-400 text-sm">@demo-user-1</div>
          </div>
        </div>
      </div>
    </div>
  );
}