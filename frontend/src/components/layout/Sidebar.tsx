import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, PlusCircle, Clock, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { path: '/generate', label: 'Generate Debate', icon: PlusCircle },
  { path: '/sessions', label: 'Previous Sessions', icon: Clock },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-[#0D0D0F] border-r border-[#1E1E22] flex-shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1E1E22]">
        <div className="w-8 h-8 rounded-lg bg-[#E8A930] flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-[#0A0A0B]" strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="text-[15px] font-bold text-[#F0F0F0] leading-tight whitespace-nowrap">VendorIQ</div>
              <div className="text-[10px] text-[#6B6B72] font-medium tracking-wider uppercase whitespace-nowrap">AI Decision Intelligence</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
          const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
          return (
            <NavLink key={path} to={path}>
              <motion.div
                whileHover={{ backgroundColor: '#1C1C21' }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 relative overflow-hidden ${
                  isActive
                    ? 'bg-[#1A1500] text-[#E8A930]'
                    : 'text-[#A0A0A8] hover:text-[#F0F0F0]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#E8A930] rounded-r" />
                )}
                <Icon size={18} className="flex-shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[13px] font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Profile + Toggle */}
      <div className="border-t border-[#1E1E22] p-2 flex flex-col gap-2">
        {/* Profile */}
        {user && (
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[#E8A930] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#0A0A0B]">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="text-[12px] font-medium text-[#F0F0F0] whitespace-nowrap">{user.name}</div>
                  <div className="text-[10px] text-[#6B6B72] whitespace-nowrap">{user.role}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Logout */}
        <button 
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B72] hover:text-[#DC2626] hover:bg-[#DC2626]/5 transition-colors duration-150 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[12px]">
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-8 rounded-lg text-[#6B6B72] hover:text-[#F0F0F0] hover:bg-[#1C1C21] transition-colors duration-150"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
