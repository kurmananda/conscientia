'use client';

import { getAvatarStyle, getInitials } from '@/lib/avatar';

export default function ProfileAvatar({ seed, name, email, size = 96 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-syncopate font-bold text-white shadow-lg"
      style={{
        ...getAvatarStyle(seed),
        width: size,
        height: size,
        fontSize: size * 0.36,
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }}
    >
      {getInitials(name, email)}
    </div>
  );
}
