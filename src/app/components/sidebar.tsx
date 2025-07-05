import { MdHome, MdSearch, MdNotificationsNone, MdBookmarkBorder, MdPerson } from 'react-icons/md';

const sidebarItems = [
  { icon: MdHome, label: 'Home' },
  { icon: MdSearch, label: 'Explore' },
  { icon: MdNotificationsNone, label: 'Notifications' },
  { icon: MdBookmarkBorder, label: 'Bookmarks' },
  { icon: MdPerson, label: 'Profile' },
];

export default function Sidebar() {
  return (
    <div className="flex flex-col items-start flex-[0.2] p-4 min-w-[250px]">
      {sidebarItems.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center space-x-4 py-2 px-4 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
          <Icon className="text-xl" />
          <h2 className="text-lg font-bold">{label}</h2>
        </div>
      ))}
    </div>
  );
}