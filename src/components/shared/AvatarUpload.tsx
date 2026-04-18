'use client';
import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadAvatar } from '@/lib/api/storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface AvatarUploadProps {
  /** visual size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** show as square/rounded-2xl instead of circle (for vendor logos) */
  square?: boolean;
  className?: string;
}

const SIZE = {
  sm: { container: 'w-12 h-12', text: 'text-base', camera: 'w-5 h-5', icon: 10 },
  md: { container: 'w-16 h-16', text: 'text-xl',   camera: 'w-6 h-6', icon: 11 },
  lg: { container: 'w-20 h-20', text: 'text-2xl',  camera: 'w-7 h-7', icon: 12 },
  xl: { container: 'w-24 h-24', text: 'text-3xl',  camera: 'w-8 h-8', icon: 13 },
};

export function AvatarUpload({ size = 'md', square = false, className }: AvatarUploadProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const initial = displayName.slice(0, 1).toUpperCase();
  const { container, text, camera, icon } = SIZE[size];
  const radius = square ? 'rounded-2xl' : 'rounded-full';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.uid) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop grande (max 5 Mo)');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles').update({ avatar_url: url }).eq('id', user.uid);
      setUser({ ...user, avatarUrl: url });
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className ?? ''}`}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Avatar */}
      <div className={`${container} ${radius} overflow-hidden`}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-white font-bold ${text}`}
            style={{ background: 'linear-gradient(135deg, var(--nafa-orange), #e55a00)' }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Camera button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`absolute -bottom-1 -right-1 ${camera} rounded-full flex items-center justify-center border-2 border-white`}
        style={{ background: uploading ? 'var(--nafa-gray-400)' : 'var(--nafa-orange)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        aria-label="Changer la photo"
      >
        {uploading
          ? <Loader2 size={icon} strokeWidth={2} className="text-white animate-spin" />
          : <Camera size={icon} strokeWidth={2} className="text-white" />
        }
      </motion.button>
    </div>
  );
}
