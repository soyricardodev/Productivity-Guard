import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import "./Popup.css";

interface TimerInfo {
  timerEndTime: number | null;
  commitment: string | null;
}

export default function() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [timerInfo, setTimerInfo] = useState<TimerInfo>({ timerEndTime: null, commitment: null });
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Get the current tab information
    const getCurrentTab = async () => {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
        
        // Check if current URL is blocked
        try {
          // Import dynamically to avoid including the function in the popup bundle
          const { isSocialMediaSite } = await import('../utils/social-media-sites');
          setIsBlocked(isSocialMediaSite(tabs[0].url));
        } catch (error) {
          console.error('Error checking if site is blocked:', error);
        }
      }
    };
    
    // Get timer information from storage
    const getTimerInfo = async () => {
      const data = await browser.storage.local.get(['timerEndTime', 'commitment']);
      if (data.timerEndTime) {
        setTimerInfo({
          timerEndTime: data.timerEndTime,
          commitment: data.commitment || null
        });
      }
    };
    
    getCurrentTab();
    getTimerInfo();
    
    // Set up timer update interval
    const intervalId = setInterval(updateTimeRemaining, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Update the time remaining display
  const updateTimeRemaining = () => {
    if (timerInfo.timerEndTime) {
      const now = Date.now();
      const timeLeft = timerInfo.timerEndTime - now;
      
      if (timeLeft <= 0) {
        setTimeRemaining('Time\'s up!');
        return;
      }
      
      // Format time remaining
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }
  };
  
  // Handle reset timer button click
  const handleResetTimer = async () => {
    await browser.storage.local.remove(['timerEndTime', 'commitment']);
    setTimerInfo({ timerEndTime: null, commitment: null });
    setTimeRemaining('');
    
    // Reload the current tab to trigger the commitment modal again
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await browser.tabs.reload(tabs[0].id);
    }
  };
  
  // Format URL for display
  const formatUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <img src="/icon-with-shadow.svg" className="popup-logo" alt="Productivity Guard Logo" />
        <h1 className="popup-title">Productivity Guard</h1>
      </div>
      
      <div className="popup-content">
        <div className="site-info">
          <h2>Current Site</h2>
          <p className="site-url">{formatUrl(currentUrl)}</p>
          <div className={`site-status ${isBlocked ? 'blocked' : 'allowed'}`}>
            {isBlocked ? '🚫 Blocked Site' : '✅ Allowed Site'}
          </div>
        </div>
        
        {timerInfo.timerEndTime && (
          <div className="timer-info">
            <h2>Active Timer</h2>
            <div className="timer-display">{timeRemaining}</div>
            <p className="commitment-text">{timerInfo.commitment}</p>
            <button 
              className="reset-button" 
              onClick={handleResetTimer}
            >
              Reset Timer
            </button>
          </div>
        )}
        
        {!timerInfo.timerEndTime && isBlocked && (
          <div className="warning-message">
            <p>This site is on your blocked list.</p>
            <p>Open the site to set your usage timer.</p>
          </div>
        )}
        
        {!isBlocked && !timerInfo.timerEndTime && (
          <div className="info-message">
            <p>You're browsing a productive site! 👍</p>
            <p>Productivity Guard helps limit your time on distracting sites.</p>
          </div>
        )}
      </div>
      
      <div className="popup-footer">
        <p className="version-info">Version 1.0.0</p>
      </div>
    </div>
  )
}
