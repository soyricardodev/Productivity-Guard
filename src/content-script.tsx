import React from 'react';
import ReactDOM from 'react-dom/client';
import browser from 'webextension-polyfill';
import { isSocialMediaSite } from './utils/social-media-sites';
import CommitmentModal from './components/commitment-modal';
import './index.css'; // Import CSS

// Modal container ID
const MODAL_CONTAINER_ID = 'productivity-guard-modal-container';

class ContentScript {
  private modalRoot: HTMLDivElement | null = null;
  private reactRoot: ReactDOM.Root | null = null;
  private timerId: number | null = null;
  private timerEndTime: number | null = null;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    // Only initialize on social media sites
    if (!isSocialMediaSite(window.location.href)) {
      return;
    }
    
    // Create modal container
    this.createModalContainer();
    
    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'TIMER_COMPLETE') {
        this.showTimerCompleteModal();
      }
      return true;
    });
    
    // Check if a timer is already running
    const { timerEndTime } = await browser.storage.local.get('timerEndTime');
    
    if (timerEndTime && Date.now() < timerEndTime) {
      // Timer is still running
      this.startTimer(timerEndTime);
    } else {
      // Show initial commitment modal
      this.showInitialModal();
    }
  }
  
  private createModalContainer() {
    // Create container for the modal if it doesn't exist
    if (!document.getElementById(MODAL_CONTAINER_ID)) {
      this.modalRoot = document.createElement('div');
      this.modalRoot.id = MODAL_CONTAINER_ID;
      
      // Add some base styles to ensure the modal container is in the center
      this.modalRoot.style.position = 'fixed';
      this.modalRoot.style.top = '0';
      this.modalRoot.style.left = '0';
      this.modalRoot.style.right = '0';
      this.modalRoot.style.bottom = '0';
      this.modalRoot.style.display = 'flex';
      this.modalRoot.style.alignItems = 'center';
      this.modalRoot.style.justifyContent = 'center';
      this.modalRoot.style.zIndex = '9999999';
      
      document.body.appendChild(this.modalRoot);
      this.reactRoot = ReactDOM.createRoot(this.modalRoot);
    }
  }
  
  private showInitialModal() {
    if (!this.reactRoot) return;
    
    this.reactRoot.render(
      <React.StrictMode>
        <CommitmentModal
          isOpen={true}
          onClose={this.handleClose}
          onConfirm={this.handleConfirm}
        />
      </React.StrictMode>
    );
  }
  
  private showTimerCompleteModal() {
    if (!this.reactRoot) return;
    
    this.reactRoot.render(
      <React.StrictMode>
        <CommitmentModal
          isOpen={true}
          onClose={this.handleClose}
          onConfirm={this.handleTimerComplete}
          isTimerComplete={true}
        />
      </React.StrictMode>
    );
  }
  
  private startTimer = (endTime: number) => {
    this.timerEndTime = endTime;
    
    // Clear any existing timer
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
    }
    
    const remainingTime = endTime - Date.now();
    
    if (remainingTime <= 0) {
      this.showTimerCompleteModal();
      return;
    }
    
    // Set timeout to show timer complete modal
    this.timerId = window.setTimeout(() => {
      this.showTimerCompleteModal();
    }, remainingTime);
  }
  
  private handleConfirm = async (minutes: number, commitment: string) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    
    // Save timer end time to storage
    await browser.storage.local.set({ 
      timerEndTime: endTime,
      commitment: commitment,
    });
    
    // Start the timer
    this.startTimer(endTime);
    
    // Hide the modal
    if (this.reactRoot) {
      this.reactRoot.render(null);
    }
    
    // Notify background script
    browser.runtime.sendMessage({ 
      type: 'TIMER_STARTED', 
      data: { minutes, endTime } 
    });
  }
  
  private handleTimerComplete = async () => {
    // Clear timer data
    await browser.storage.local.remove(['timerEndTime', 'commitment']);
    
    // Close the tab/window
    browser.runtime.sendMessage({ type: 'CLOSE_TAB' });
  }
  
  private handleClose = () => {
    // Close the tab/window
    browser.runtime.sendMessage({ type: 'CLOSE_TAB' });
  }
}

// Start the content script
new ContentScript();
