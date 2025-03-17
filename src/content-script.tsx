import React from 'react';
import ReactDOM from 'react-dom/client';
import browser from 'webextension-polyfill';
import { isSocialMediaSite } from './utils/social-media-sites';
import CommitmentModal from './components/commitment-modal';
import MiniTimer from './components/mini-timer';

// Container IDs
const MODAL_CONTAINER_ID = 'productivity-guard-modal-container';
const MINI_TIMER_CONTAINER_ID = 'productivity-guard-mini-timer-container';

// Create a functional content script
const initializeContentScript = async () => {
  // Only initialize on social media sites
  if (!isSocialMediaSite(window.location.href)) {
    return;
  }
  
  // Create containers
  const modalContainer = createContainer(MODAL_CONTAINER_ID, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999999',
  });
  
  const miniTimerContainer = createContainer(MINI_TIMER_CONTAINER_ID, {
    position: 'fixed',
    zIndex: '9999998',
    pointerEvents: 'none'
  });
  
  // Create React roots
  const modalRoot = ReactDOM.createRoot(modalContainer);
  const miniTimerRoot = ReactDOM.createRoot(miniTimerContainer);
  
  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TIMER_COMPLETE') {
      showTimerCompleteModal(modalRoot);
    }
    return true;
  });
  
  // Check if any timer is already running
  const { timerEndTime, commitment } = await browser.storage.local.get(['timerEndTime', 'commitment']);
  
  if (timerEndTime && Date.now() < timerEndTime) {
    // Timer is still running - show timer active modal on all social media sites
    showTimerActiveModal(modalRoot, timerEndTime, commitment || '');
    showMiniTimer(miniTimerRoot, timerEndTime);
  } else {
    // No active timer - show initial commitment modal
    showInitialModal(modalRoot);
  }
};

// Helper function to create container
const createContainer = (id: string, styles: Record<string, string>) => {
  // Create container if it doesn't exist
  if (!document.getElementById(id)) {
    const container = document.createElement('div');
    container.id = id;
    
    // Apply styles
    Object.entries(styles).forEach(([key, value]) => {
      container.style[key as any] = value;
    });
    
    document.body.appendChild(container);
    return container;
  }
  
  return document.getElementById(id) as HTMLDivElement;
};

// Show initial commitment modal
const showInitialModal = (root: ReactDOM.Root) => {
  root.render(
    <React.StrictMode>
      <CommitmentModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </React.StrictMode>
  );
};

// Show timer active modal
const showTimerActiveModal = (root: ReactDOM.Root, endTime: number, activeCommitment: string) => {
  // Calculate remaining time
  const remainingMinutes = Math.max(0, Math.floor((endTime - Date.now()) / (60 * 1000)));
  
  root.render(
    <React.StrictMode>
      <CommitmentModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleClose}
        isTimerActive={true}
        initialTime={remainingMinutes}
        activeCommitment={activeCommitment}
      />
    </React.StrictMode>
  );
};

// Show mini timer
const showMiniTimer = (root: ReactDOM.Root, endTime: number) => {
  root.render(
    <React.StrictMode>
      <MiniTimer 
        timerEndTime={endTime}
        onTimerComplete={handleTimerComplete}
      />
    </React.StrictMode>
  );
};

// Show timer complete modal
const showTimerCompleteModal = (root: ReactDOM.Root) => {
  root.render(
    <React.StrictMode>
      <CommitmentModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleTimerComplete}
        isTimerComplete={true}
      />
    </React.StrictMode>
  );
};

// Handle confirm button click
const handleConfirm = async (minutes: number, commitment: string) => {
  const endTime = Date.now() + minutes * 60 * 1000;
  
  // Save timer end time to storage
  await browser.storage.local.set({ 
    timerEndTime: endTime,
    commitment: commitment,
  });
  
  // Hide the modal
  const modalContainer = document.getElementById(MODAL_CONTAINER_ID);
  if (modalContainer) {
    const modalRoot = ReactDOM.createRoot(modalContainer);
    modalRoot.render(null);
  }
  
  // Show mini timer
  const miniTimerContainer = document.getElementById(MINI_TIMER_CONTAINER_ID);
  if (miniTimerContainer) {
    const miniTimerRoot = ReactDOM.createRoot(miniTimerContainer);
    showMiniTimer(miniTimerRoot, endTime);
  }
  
  // Notify background script
  browser.runtime.sendMessage({ 
    type: 'TIMER_STARTED', 
    data: { minutes, endTime, commitment } 
  });
};

// Handle timer complete
const handleTimerComplete = async () => {
  // Clear timer data
  await browser.storage.local.remove(['timerEndTime', 'commitment']);
  
  // Close the tab/window
  browser.runtime.sendMessage({ type: 'CLOSE_TAB' });
};

// Handle close button click
const handleClose = () => {
  // Close the tab/window
  browser.runtime.sendMessage({ type: 'CLOSE_TAB' });
};

// Start the content script
initializeContentScript();
