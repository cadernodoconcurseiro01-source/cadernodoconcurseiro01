import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Timer, BookOpen, Layers, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { path: '/subjects', label: 'Matérias', icon: BookOpen },
  { path: '/flashcards', label: 'Flashcards', icon: Layers },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-soft transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">
              StudyFlow
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-soft" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
