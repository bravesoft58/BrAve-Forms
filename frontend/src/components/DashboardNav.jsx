import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/ui';
import useAuthStore from '../store/authStore';

// Import MUI icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import QrCodeIcon from '@mui/icons-material/QrCode';

export function DashboardNav() {
  const location = useLocation();
  const { user } = useAuthStore();

  // Define nav items based on user role
  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: <DashboardIcon className="h-5 w-5" />,
      roles: ['admin', 'foreman', 'inspector'],
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: <FolderIcon className="h-5 w-5" />,
      roles: ['admin', 'foreman', 'inspector'],
    },
    {
      title: 'Logs',
      href: '/logs',
      icon: <AssignmentIcon className="h-5 w-5" />,
      roles: ['admin', 'foreman', 'inspector'],
    }
  ];

  // Add role-specific items
  if (user && user.role === 'admin') {
    navItems.push(
      {
        title: 'Users',
        href: '/users',
        icon: <PeopleIcon className="h-5 w-5" />,
        roles: ['admin'],
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: <SettingsIcon className="h-5 w-5" />,
        roles: ['admin'],
      }
    );
  }

  if (user && (user.role === 'admin' || user.role === 'foreman')) {
    navItems.push({
      title: 'QR Codes',
      href: '/qrcodes',
      icon: <QrCodeIcon className="h-5 w-5" />,
      roles: ['admin', 'foreman'],
    });
  }

  // Filter nav items based on user role
  const filteredNavItems = user 
    ? navItems.filter(item => item.roles.includes(user.role))
    : navItems;

  return (
    <nav className="flex flex-col space-y-1">
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
            location.pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'transparent'
          )}
        >
          <span className="mr-2">{item.icon}</span>
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 