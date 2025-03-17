export const SOCIAL_MEDIA_SITES = [
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'tiktok.com',
  'reddit.com',
  'linkedin.com',
  'youtube.com',
  'pinterest.com',
  'snapchat.com',
  'tumblr.com',
  'discord.com',
  'whatsapp.com',
  'telegram.org',
  'messenger.com',
  'twitch.tv',
];

export const isSocialMediaSite = (url: string): boolean => {
  const hostname = new URL(url).hostname;
  return SOCIAL_MEDIA_SITES.some(site => 
    hostname === site || hostname.endsWith(`.${site}`)
  );
};
