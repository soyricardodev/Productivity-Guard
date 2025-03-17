'use client';

import { useState, useEffect, useRef } from 'react';
import './commitment-modal.css';

type CommitmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number, commitment: string) => void;
  isTimerComplete?: boolean;
  initialTime?: number;
};

const CommitmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  isTimerComplete = false,
  initialTime = 5,
}: CommitmentModalProps) => {
  const [minutes, setMinutes] = useState<number>(initialTime);
  const [commitment, setCommitment] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isTimerComplete) {
      inputRef.current.focus();
    }
  }, [isOpen, isTimerComplete]);

  // Generate commitment text based on selected time
  useEffect(() => {
    if (!isTimerComplete) {
      setCommitment(`I want to lose ${minutes} minutes of my life instead of being productive`);
    }
  }, [minutes, isTimerComplete]);

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
            : "Hey! How much time do you want to lose?"}
        </h2>
        
        {!isTimerComplete && (
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
        
        <div className="form-group">
          <label 
            htmlFor="commitment-input" 
            className="form-label"
          >
            Type your commitment:
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
            disabled={isTimerComplete}
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
            aria-label={isTimerComplete ? "Accept commitment and close site" : "Confirm time commitment"}
            tabIndex={0}
          >
            {isTimerComplete ? "Accept & Close" : "Start Timer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommitmentModal;
