import React, { useState, useEffect, useRef } from 'react';
import browser from 'webextension-polyfill';
import './mini-timer.css';

type TimerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface MiniTimerProps {
  timerEndTime: number;
  position?: TimerPosition;
  onTimerComplete?: () => void;
}

const MiniTimer: React.FC<MiniTimerProps> = ({
  timerEndTime,
  position = 'bottom-right',
  onTimerComplete
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<TimerPosition>(position);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const configRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Update timer immediately
    updateRemainingTime();
    
    // Set interval to update timer every second
    timerRef.current = window.setInterval(updateRemainingTime, 1000);
    
    // Load user preference for position
    loadPosition();
    
    // Add event listener to close config when clicking outside
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [timerEndTime]);
  
  const handleClickOutside = (event: MouseEvent) => {
    if (configRef.current && !configRef.current.contains(event.target as Node)) {
      setIsConfigOpen(false);
    }
  };
  
  const loadPosition = async () => {
    try {
      const { timerPosition } = await browser.storage.local.get('timerPosition');
      if (timerPosition) {
        setCurrentPosition(timerPosition);
      }
    } catch (error) {
      console.error('Error loading timer position:', error);
    }
  };
  
  const savePosition = async (newPosition: TimerPosition) => {
    try {
      await browser.storage.local.set({ timerPosition: newPosition });
      setCurrentPosition(newPosition);
      setIsConfigOpen(false);
    } catch (error) {
      console.error('Error saving timer position:', error);
    }
  };
  
  const updateRemainingTime = () => {
    const now = Date.now();
    const timeLeft = timerEndTime - now;
    
    if (timeLeft <= 0) {
      setTimeRemaining('00:00');
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (onTimerComplete) {
        onTimerComplete();
      }
      return;
    }
    
    // Format time remaining
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    // Format with leading zeros
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    setTimeRemaining(`${formattedMinutes}:${formattedSeconds}`);
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const toggleConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfigOpen(!isConfigOpen);
  };
  
  const getPositionLabel = (pos: TimerPosition): string => {
    switch (pos) {
      case 'top-left': return 'Top Left';
      case 'top-right': return 'Top Right';
      case 'bottom-left': return 'Bottom Left';
      case 'bottom-right': return 'Bottom Right';
      default: return 'Bottom Right';
    }
  };
  
  return (
    <div className={`mini-timer ${currentPosition} ${isMinimized ? 'minimized' : ''}`}>
      {!isMinimized && (
        <>
          <div className="mini-timer-header">
            <span className="mini-timer-title">Time Remaining</span>
            <div className="mini-timer-controls">
              <button 
                className="mini-timer-config-btn"
                onClick={toggleConfig}
                aria-label="Configure timer"
              >
                ⚙️
              </button>
              <button 
                className="mini-timer-minimize-btn"
                onClick={toggleMinimize}
                aria-label="Minimize timer"
              >
                −
              </button>
            </div>
          </div>
          <div className="mini-timer-display">{timeRemaining}</div>
          
          {isConfigOpen && (
            <div className="mini-timer-config" ref={configRef}>
              <label htmlFor="position-select" className="config-label">
                Position:
              </label>
              <select
                id="position-select"
                value={currentPosition}
                onChange={(e) => savePosition(e.target.value as TimerPosition)}
                className="position-select"
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
          )}
        </>
      )}
      
      {isMinimized && (
        <button 
          className="mini-timer-expand-btn"
          onClick={toggleMinimize}
          aria-label="Expand timer"
        >
          {timeRemaining}
        </button>
      )}
    </div>
  );
};

export default MiniTimer;
