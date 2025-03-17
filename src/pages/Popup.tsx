import { useState, useEffect, useRef } from 'react';
import browser from 'webextension-polyfill';
import "../popup.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimerInfo {
  timerEndTime: number | null;
  commitment: string | null;
}

export default function() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [timerInfo, setTimerInfo] = useState<TimerInfo>({ timerEndTime: null, commitment: null });
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Function to update the time remaining display
  const updateTimeRemaining = () => {
    if (!timerInfo.timerEndTime) return;
    
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
  };

  // Effect to set up the timer and clean it up
  useEffect(() => {
    // Clear any existing interval
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    // Set up a new interval if we have timer info
    if (timerInfo.timerEndTime) {
      updateTimeRemaining(); // Update immediately
      timerRef.current = window.setInterval(updateTimeRemaining, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [timerInfo.timerEndTime]);

  // Effect to get initial data
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
    
    // Listen for storage changes to update timer in real-time
    const handleStorageChange = (changes: { [key: string]: browser.Storage.StorageChange }, areaName: string) => {
      if (areaName === 'local') {
        if (changes.timerEndTime) {
          const newTimerEndTime = changes.timerEndTime.newValue;
          const newCommitment = changes.commitment?.newValue || timerInfo.commitment;
          
          setTimerInfo({
            timerEndTime: newTimerEndTime,
            commitment: newCommitment
          });
        }
      }
    };
    
    browser.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);
  
  // Handle reset timer button click
  const handleResetTimer = async () => {
    await browser.storage.local.remove(['timerEndTime', 'commitment']);
    setTimerInfo({ timerEndTime: null, commitment: null });
    setTimeRemaining('');
    setIsResetDialogOpen(false);
    
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
    <div className="flex flex-col w-[90%] mx-auto min-h-[400px] p-4">
      <div className="flex flex-col items-center mb-5 text-center">
        <img src="/icon-with-shadow.svg" className="w-20 h-20 mb-2" alt="Productivity Guard Logo" />
        <h1 className="text-2xl font-bold text-white m-0">Productivity Guard</h1>
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Site</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium my-2 break-all">{formatUrl(currentUrl)}</p>
            <Badge variant={isBlocked ? "destructive" : "success"} className="px-3 py-1.5 text-sm font-semibold">
              {isBlocked ? '🚫 Blocked Site' : '✅ Allowed Site'}
            </Badge>
          </CardContent>
        </Card>
        
        {timerInfo.timerEndTime && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Timer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center my-2 text-destructive">{timeRemaining}</div>
              <p className="text-sm italic text-muted-foreground text-center my-3">{timerInfo.commitment}</p>
            </CardContent>
            <CardFooter>
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">Reset Timer</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Reset Timer</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to reset your timer? This will remove your commitment and allow you to access blocked sites again.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleResetTimer}>Reset Timer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        )}
        
        {!timerInfo.timerEndTime && isBlocked && (
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-6">
              <p className="my-2 text-sm leading-relaxed">This site is on your blocked list.</p>
              <p className="my-2 text-sm leading-relaxed">Open the site to set your usage timer.</p>
            </CardContent>
          </Card>
        )}
        
        {!isBlocked && !timerInfo.timerEndTime && (
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="pt-6">
              <p className="my-2 text-sm leading-relaxed">You're browsing a productive site! 👍</p>
              <p className="my-2 text-sm leading-relaxed">Productivity Guard helps limit your time on distracting sites.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="mt-5 text-center">
        <p className="text-xs text-muted-foreground m-0">Version 1.0.0</p>
      </div>
    </div>
  )
}
