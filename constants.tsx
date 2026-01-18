
import React from 'react';
import { 
  Users, 
  Tv, 
  Settings, 
  Bell, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  Volume1,
  Play,
  Pause,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  Plus,
  Image as ImageIcon,
  Video,
  LayoutGrid,
  ClipboardList,
  MonitorPlay,
  ImagePlus,
  Trash2
} from 'lucide-react';

export const COLORS = {
  primary: 'indigo-500',
  secondary: 'slate-800',
  accent: 'emerald-400',
  background: 'slate-950'
};

export const ICONS = {
  Users: <Users className="w-5 h-5" />,
  Tv: <Tv className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />,
  ArrowRight: <ArrowRight className="w-5 h-5" />,
  Volume2: <Volume2 className="w-5 h-5" />,
  Volume1: <Volume1 className="w-5 h-5" />,
  VolumeX: <VolumeX className="w-5 h-5" />,
  Play: <Play className="w-5 h-5" />,
  Pause: <Pause className="w-5 h-5" />,
  Clock: <Clock className="w-5 h-5" />,
  Dashboard: <LayoutDashboard className="w-5 h-5" />,
  Shield: <ShieldCheck className="w-5 h-5" />,
  Plus: <Plus className="w-5 h-5" />,
  Image: <ImageIcon className="w-5 h-5" />,
  Video: <Video className="w-5 h-5" />,
  LayoutGrid: <LayoutGrid className="w-5 h-5" />,
  ClipboardList: <ClipboardList className="w-5 h-5" />,
  MonitorPlay: <MonitorPlay className="w-5 h-5" />,
  ImagePlus: <ImagePlus className="w-4 h-4" />,
  Trash: <Trash2 className="w-4 h-4" />
};

export const DEFAULT_VIDEO_URL = "assets/videos/promo_video.mp4";
export const LOGO_URL = "assets/logo.png";

// Photo Carousel Assets - Local Project Primary Source
export const CAROUSEL_IMAGES = [
  "assets/photos/photo1.jpg",
  "assets/photos/photo2.jpg",
  "assets/photos/photo3.jpg",
  "assets/photos/photo4.jpg",
  "assets/photos/photo5.jpg",
  "assets/photos/photo6.jpg"
];

// Local Video Assets Fallback
export const LOCAL_VIDEOS = [
  "assets/videos/video1.mp4",
  "assets/videos/video2.mp4",
  "assets/videos/video3.mp4"
];
