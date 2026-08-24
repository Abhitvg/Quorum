'use client';
import { api } from "@/lib/api";


import { useState } from 'react';
import { useTrackToggle, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import DictionaryModal from './DictionaryModal';
import MeetingToolsModal from './MeetingToolsModal';
import AssistantPanel from './AssistantPanel';
import Whiteboard from './Whiteboard';
import LivePolls from './LivePolls';
import MeetingTimer from './MeetingTimer';
import HandRaiseQueue from './HandRaiseQueue';
import MeetingChat from './MeetingChat';
import SharedNotes from './SharedNotes';
import SpeakerStatsPanel from './SpeakerStatsPanel';
import VideoFilters from './VideoFilters';
import FocusMode from './FocusMode';
import MoodCheck from './MoodCheck';
import MeetingAgenda from './MeetingAgenda';

export default function MeetingControls() {
  const room = useRoomContext();
  const { toggle: toggleMic, enabled: isMicEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
    room,
  });
  
  const { toggle: toggleCam, enabled: isCamEnabled } = useTrackToggle({
    source: Track.Source.Camera,
    room,
  });
  
  const { toggle: toggleScreen, enabled: isScreenEnabled } = useTrackToggle({
    source: Track.Source.ScreenShare,
    room,
  });

  const [showDictionary, setShowDictionary] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showHandRaise, setShowHandRaise] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSpeakerStats, setShowSpeakerStats] = useState(false);
  const [showVideoFilters, setShowVideoFilters] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  
  return (
    <>
      {/* Local Identity Pill - Bottom Left */}
      <div className="absolute bottom-8 left-8 z-50">
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface-900/40 backdrop-blur-md border border-white/10 shadow-glow">
          <span className="font-semibold text-white/90 text-sm tracking-wide">
            {room.localParticipant.name || room.localParticipant.identity || 'Local User'}
          </span>
          {/* Signal Indicator */}
          <div className="flex items-end gap-[2px] h-3.5 opacity-80">
            <div className="w-1 bg-white h-1/3 rounded-sm" />
            <div className="w-1 bg-white h-2/3 rounded-sm" />
            <div className="w-1 bg-white h-full rounded-sm" />
          </div>
        </div>
      </div>

      <div className="meeting-controls absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full control-bar-pill animate-spring-up w-max mx-auto border-glow">
          
          {/* Microphone */}
          <button
            onClick={() => toggleMic()}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              isMicEnabled 
                ? 'bg-white/10 text-white hover:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                : 'bg-status-error/20 text-status-error hover:bg-status-error/30'
            }`}
            title="Toggle Microphone"
          >
            {isMicEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Camera */}
          <button
            onClick={() => toggleCam()}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              isCamEnabled 
                ? 'bg-white/10 text-white hover:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                : 'bg-status-error/20 text-status-error hover:bg-status-error/30'
            }`}
            title="Toggle Camera"
          >
            {isCamEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => toggleScreen()}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              isScreenEnabled 
                ? 'bg-accent/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title="Screen Share"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Assistant (Box Icon) */}
          <button
            onClick={() => setShowAssistant(true)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              showAssistant 
                ? 'bg-accent/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title="Assistant"
          >
            <span className="text-xl leading-none">🧊</span>
          </button>

          {/* Agenda (Notebook) */}
          <button
            onClick={() => setShowAgenda(true)}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              showAgenda 
                ? 'bg-accent/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title="Meeting Agenda"
          >
            <span className="text-xl leading-none">📝</span>
          </button>

          {/* Focus Mode */}
          <button
            onClick={() => setShowFocusMode(true)}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              showFocusMode 
                ? 'bg-accent/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title="Focus Mode"
          >
            <span className="text-xl leading-none">🎯</span>
          </button>

          {/* Reactions */}
          <div className="relative group shrink-0">
            <button className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300" title="React">
              <span className="text-xl leading-none">😊</span>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:flex items-center gap-2 p-2 rounded-2xl glass-strong border-glow shadow-card animate-spring-up">
              {['👍', '❤️', '👏', '😂', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    const payload = JSON.stringify({ type: 'reaction', emoji });
                    const data = new TextEncoder().encode(payload);
                    room.localParticipant.publishData(data, { reliable: true });
                    const event = new CustomEvent('local-reaction', { detail: emoji });
                    window.dispatchEvent(event);
                  }}
                  className="w-10 h-10 rounded-xl hover:bg-surface-600 hover:scale-110 active:scale-90 transition-all text-2xl flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Hand Raise */}
          <button
            onClick={() => setShowHandRaise(true)}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              showHandRaise ? 'bg-yellow-500/30 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title="Raise Hand"
          >
            <span className="text-xl leading-none">✋</span>
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(true)}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              showChat ? 'bg-accent/30 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title="Chat"
          >
            <span className="text-xl leading-none">💬</span>
          </button>

          {/* Tools / Red Toolbox */}
          <button
            onClick={() => setShowTools(!showTools)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              showTools ? 'bg-red-500/30 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title="Meeting Tools"
          >
            <span className="text-xl leading-none">🧰</span>
          </button>

          {/* Summon Agent */}
          <div className="relative group shrink-0 hidden sm:block">
            <button
              onClick={async () => {
                try {
                  const meetingId = window.location.pathname.split('/').pop();
                  if (!meetingId) return;
                  await api.meetings.summonAgent(meetingId);
                  console.log('Summoning Quo agent...');
                } catch (e) {
                  console.error('Failed to summon agent', e);
                }
              }}
              className={`px-4 h-11 rounded-full flex items-center justify-center transition-all duration-300 font-medium bg-surface-800/80 text-white hover:bg-surface-700`}
              title="Summon Quo Agent"
            >
              <span className="mr-1.5 opacity-80">🤖</span>
              <span>Summon Quo</span>
            </button>
          </div>

          {/* End Call */}
          <button
            onClick={() => room.disconnect(true)}
            className="px-6 h-11 shrink-0 rounded-full bg-[#f43f5e] text-white font-bold hover:bg-[#e11d48] shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] transition-all duration-300 ml-1 tracking-wide"
          >
            Leave
          </button>
        </div>
      </div>

      <AssistantPanel isOpen={showAssistant} onClose={() => setShowAssistant(false)} />
      <DictionaryModal isOpen={showDictionary} onClose={() => setShowDictionary(false)} />
      <MeetingToolsModal isOpen={showTools} onClose={() => setShowTools(false)} />
      <Whiteboard isOpen={showWhiteboard} onClose={() => setShowWhiteboard(false)} />
      <LivePolls isOpen={showPolls} onClose={() => setShowPolls(false)} />
      <MeetingTimer />
      <HandRaiseQueue isOpen={showHandRaise} onClose={() => setShowHandRaise(false)} />
      <MeetingChat isOpen={showChat} onClose={() => setShowChat(false)} />
      <SharedNotes isOpen={showNotes} onClose={() => setShowNotes(false)} />
      <SpeakerStatsPanel isOpen={showSpeakerStats} onClose={() => setShowSpeakerStats(false)} />
      <VideoFilters isOpen={showVideoFilters} onClose={() => setShowVideoFilters(false)} />
      <FocusMode isOpen={showFocusMode} onClose={() => setShowFocusMode(false)} />
      <MoodCheck isOpen={showMoodCheck} onClose={() => setShowMoodCheck(false)} />
      <MeetingAgenda isOpen={showAgenda} onClose={() => setShowAgenda(false)} />
    </>
  );
}
