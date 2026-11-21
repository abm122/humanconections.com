/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { socialSocket, Friend } from '../services/socialSocket';
import { sounds } from '../audio/soundEngine';

interface FriendsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
}

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
  isOpen,
  onClose,
  currentRoomId,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendNameInput, setFriendNameInput] = useState('');
  const [myProfile, setMyProfile] = useState(socialSocket.getProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameEdit, setNameEdit] = useState(myProfile.name);
  const [colorEdit, setColorEdit] = useState(myProfile.color);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // Listen for friends updates from server
    const unsubs = [
      socialSocket.on('room:init', (payload: unknown) => {
        const data = payload as { friends: Friend[] };
        if (data.friends) setFriends(data.friends);
      }),
      socialSocket.on('friends:update', (payload: unknown) => {
        const data = payload as { friends: Friend[] };
        if (data.friends) setFriends(data.friends);
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendNameInput.trim()) return;

    sounds.playPop(1.3);
    const newFriend: Friend = {
      id: `usr-${Math.random().toString(36).substring(2, 7)}`,
      name: friendNameInput.trim(),
      color: ['#0284c7', '#059669', '#d97706', '#7c3aed', '#e11d48'][Math.floor(Math.random() * 5)],
      isOnline: true,
      statusText: 'Connected with Joy',
      lastActive: Date.now(),
    };

    setFriends((prev) => [newFriend, ...prev]);
    showToast(`Added ${friendNameInput.trim()} to your Joy circle!`);
    setFriendNameInput('');
  };

  const handleSendCheer = (friend: Friend) => {
    sounds.playPop(1.5);
    socialSocket.sendCheer(friend.name);
    showToast(`Sent warm cheer to ${friend.name}! ✨`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEdit.trim()) return;

    sounds.playClick();
    socialSocket.updateProfile(nameEdit.trim(), colorEdit);
    setMyProfile(socialSocket.getProfile());
    setIsEditingProfile(false);
    showToast('Profile updated!');
  };

  if (!isOpen) return null;

  const colorOptions = ['#f59e0b', '#059669', '#7c3aed', '#0284c7', '#e11d48', '#ec4899'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#18110a] border border-amber-500/30 rounded-2xl shadow-2xl p-6 text-amber-50 max-h-[90vh] flex flex-col">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-lg z-20 animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="font-heading text-lg font-bold text-amber-200">Friends & Community</h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 rounded-lg cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* My Player Identity Card */}
        <div className="p-3.5 mt-4 rounded-xl bg-amber-950/40 border border-amber-500/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm ring-2 ring-amber-400/30"
              style={{ backgroundColor: myProfile.color }}
            >
              {myProfile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-amber-100">{myProfile.name}</div>
              <div className="text-2xs text-amber-300/60 font-mono">ID: {myProfile.id}</div>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              setIsEditingProfile(!isEditingProfile);
            }}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-black/40 border border-amber-500/30 text-amber-200 hover:bg-black/60 cursor-pointer"
          >
            {isEditingProfile ? 'Done' : 'Edit'}
          </button>
        </div>

        {/* Edit Profile Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-3 p-3 bg-black/50 border border-amber-500/20 rounded-xl space-y-2.5">
            <div>
              <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/80 block mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/80 block mb-1">
                Avatar Color
              </label>
              <div className="flex gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorEdit(c)}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      colorEdit === c ? 'ring-2 ring-white scale-110' : 'opacity-70'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
            >
              Save Profile
            </button>
          </form>
        )}

        {/* Add Friend Input */}
        <form onSubmit={handleAddFriend} className="mt-4 flex gap-2">
          <input
            type="text"
            value={friendNameInput}
            onChange={(e) => setFriendNameInput(e.target.value)}
            placeholder="Add friend by name..."
            className="flex-1 px-3 py-2 rounded-xl bg-amber-950/50 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!friendNameInput.trim()}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            Add Friend
          </button>
        </form>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-amber-300/70 mb-2">
            Joyful Friends ({friends.length})
          </div>

          {friends.length === 0 ? (
            <div className="text-center py-8 text-amber-300/50 text-xs">
              No friends added yet. Add a friend or invite someone to join your table!
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 hover:border-amber-500/40 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                      style={{ backgroundColor: f.color }}
                    >
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    {f.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#18110a]" />
                    )}
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-xs text-amber-100">{f.name}</div>
                    <div className="text-2xs text-amber-300/60">{f.statusText || 'Joy seeker'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendCheer(f)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 text-2xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title={`Send Cheer to ${f.name}`}
                  >
                    <span>Send Cheer</span>
                    <span>✨</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      navigator.clipboard?.writeText(
                        `${window.location.origin}?room=${currentRoomId}`
                      );
                      showToast(`Copied room invite link for ${f.name}!`);
                    }}
                    className="p-1 text-amber-400/70 hover:text-amber-200 cursor-pointer"
                    title="Copy room invite link"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
