'use client';

import { useState, useEffect, useRef } from 'react';
import './commitment-modal.css';

type CommitmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number, commitment: string) => void;
  isTimerComplete?: boolean;
  isTimerActive?: boolean;
  initialTime?: number;
  activeCommitment?: string;
};

const CommitmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  isTimerComplete = false,
  isTimerActive = false,
  initialTime = 5,
  activeCommitment = '',
}: CommitmentModalProps) => {
  const [minutes, setMinutes] = useState<number>(initialTime);
  const [commitment, setCommitment] = useState<string>("");
  const [remainingTime, setRemainingTime] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const timerEndTimeRef = useRef<number | null>(null);
  
  // Focus the input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isTimerComplete && !isTimerActive) {
      inputRef.current.focus();
    }
  }, [isOpen, isTimerComplete, isTimerActive]);

  // Generate commitment text based on selected time
  useEffect(() => {
    if (!isTimerComplete && !isTimerActive) {
      setCommitment(`I want to lose ${minutes} minutes of my life instead of being productive`);
    } else if (isTimerActive && activeCommitment) {
      setCommitment(activeCommitment);
    }
  }, [minutes, isTimerComplete, isTimerActive, activeCommitment]);

  // Set up real-time timer for active timer
  useEffect(() => {
    if (isTimerActive && initialTime > 0) {
      // Calculate end time based on initialTime (in minutes)
      const now = Date.now();
      const endTime = now + (initialTime * 60 * 1000);
      timerEndTimeRef.current = endTime;
      
      // Update timer immediately
      updateRemainingTime();
      
      // Set interval to update timer every second
      timerRef.current = window.setInterval(updateRemainingTime, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, initialTime]);
  
  // Function to update the remaining time display
  const updateRemainingTime = () => {
    if (!timerEndTimeRef.current) return;
    
    const now = Date.now();
    const timeLeft = timerEndTimeRef.current - now;
    
    if (timeLeft <= 0) {
      setRemainingTime('Time\'s up!');
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      return;
    }
    
    // Format time remaining
    const mins = Math.floor(timeLeft / (1000 * 60));
    const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    setRemainingTime(`${mins}m ${secs}s remaining`);
  };

  const handleConfirm = () => {
    onConfirm(minutes, commitment);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="modal-container"
        tabIndex={0}
      >
        <h2 className="modal-title">
          {isTimerComplete 
            ? "Time's up!" 
            : isTimerActive
              ? "You already have an active timer!"
              : "Hey! How much time do you want to lose?"}
        </h2>
        
        {!isTimerComplete && !isTimerActive && (
          <div className="form-group">
            <label 
              htmlFor="time-select" 
              className="form-label"
            >
              Select time (minutes):
            </label>
            <select
              id="time-select"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="form-select"
              aria-label="Select time in minutes"
            >
              {[1, 5, 10, 15, 30, 45, 60].map((value) => (
                <option key={value} value={value}>
                  {value} {value === 1 ? 'minute' : 'minutes'}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {isTimerActive && (
          <div className="form-group">
            <p className="timer-message">
              You have an active timer on another social media site.
            </p>
            <div className="active-timer-display">
              {remainingTime}
            </div>
            <p className="timer-message">
              All social media sites are blocked until your timer expires.
            </p>
          </div>
        )}
        
        <div className="form-group">
          <label 
            htmlFor="commitment-input" 
            className="form-label"
          >
            {isTimerActive ? "Your commitment:" : "Type your commitment:"}
          </label>
          <input
            ref={inputRef}
            id="commitment-input"
            type="text"
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-input"
            placeholder="Type your commitment here"
            aria-label="Type your commitment"
            disabled={isTimerComplete || isTimerActive}
          />
        </div>
        
        <div className="button-group">
          {!isTimerComplete && (
            <button
              onClick={onClose}
              className="button button-secondary"
              aria-label="Cancel and exit site"
              tabIndex={0}
            >
              Exit Site
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="button button-primary"
            aria-label={
              isTimerComplete 
                ? "Accept commitment and close site" 
                : isTimerActive 
                  ? "Acknowledge and exit site" 
                  : "Confirm time commitment"
            }
            tabIndex={0}
          >
            {isTimerComplete 
              ? "Accept & Close" 
              : isTimerActive 
                ? "Acknowledge & Exit" 
                : "Start Timer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommitmentModal;
