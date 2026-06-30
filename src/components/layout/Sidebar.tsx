'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sun, 
  LayoutDashboard, 
  PlusCircle, 
  FolderOpen, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({ userName, userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Helper to extract initials for the avatar
  const getInitials = (name: string) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const navLinks = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Novo Projeto',
      href: '/projeto/novo',
      icon: PlusCircle,
    },
    {
      label: 'Meus Projetos',
      href: '/dashboard#projetos',
      icon: FolderOpen,
    },
    {
      label: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
    },
  ];

  const handleLinkClick = (href: string) => {
    setIsMobileOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-sidebar-toggle"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Mobile Close Button */}
        <button 
          className="mobile-sidebar-close"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X size={24} />
        </button>

        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sun size={24} className="text-amber-500" />
          </div>
          {!isCollapsed && <span className="sidebar-logo-text">Solaire</span>}
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          {!isCollapsed && <div className="sidebar-section-label">Menu Principal</div>}
          
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href.startsWith('/dashboard') && pathname === '/dashboard');
            
            return (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.href)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={link.label}
              >
                <Icon size={20} className="sidebar-link-icon" />
                {!isCollapsed && <span className="sidebar-link-label">{link.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Identity Section */}
        <div className="sidebar-user">
          <div className="sidebar-avatar" title={userName}>
            {getInitials(userName)}
          </div>
          
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-email">{userEmail}</div>
            </div>
          )}

          {!isCollapsed && (
            <button 
              onClick={onLogout}
              className="sidebar-logout-btn"
              title="Sair da conta"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button 
          className="sidebar-collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label="Alternar menu"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
