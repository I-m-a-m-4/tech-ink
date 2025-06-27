
import { MessageSquare, Database, TrendingUp, Mail, ArrowRight, Heart, MessageCircle, Share2, Twitter, Youtube, Instagram, Menu, Newspaper, BarChart3, Rss, Cog, Monitor, PenLine, Gem, LogOut, BookOpenText, Trophy, BadgeCheck, Shield, Flame, Sparkle, BrainCircuit, Rocket, Crown, Star, ShieldHalf } from "lucide-react";

export const Icons = {
  logo: () => (
    <span className="font-black text-xl tracking-tighter">
      Tech<span className="text-primary">Ink</span>
    </span>
  ),
  google: () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.26-4.8 2.26-4.12 0-7.48-3.4-7.48-7.55s3.36-7.55 7.48-7.55c2.32 0 3.82 1.04 4.7 1.94l2.6-2.58C18.96 3.24 16.2 2 12.48 2 7.1 2 3.1 6.02 3.1 11.26s4.02 9.26 9.38 9.26c5.48 0 9.08-3.82 9.08-9.12 0-.6-.06-1.12-.15-1.62H12.48z" fill="currentColor"/>
    </svg>
  ),
  message: MessageSquare,
  database: Database,
  trending: TrendingUp,
  mail: Mail,
  arrowRight: ArrowRight,
  heart: Heart,
  comment: MessageCircle,
  share: Share2,
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  menu: Menu,
  news: Newspaper,
  insights: BarChart3,
  feed: Rss,
  cog: Cog,
  monitor: Monitor,
  pen: PenLine,
  gem: Gem,
  logout: LogOut,
  story: BookOpenText,
  trophy: Trophy,
  badgeCheck: BadgeCheck,
  shield: Shield,
  flame: Flame,
  shieldHalf: ShieldHalf,
  sparkle: Sparkle,
  brainCircuit: BrainCircuit,
  rocket: Rocket,
  crown: Crown,
  star: Star,
};
