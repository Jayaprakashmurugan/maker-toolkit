// Your YouTube videos, newest first. Add one entry per video; the thumbnail is copied at build time,
// so visitors never load anything from YouTube until they click.
//
// The id is the part after "watch?v=" in the video's URL: youtube.com/watch?v=dQw4w9WgXcQ → 'dQw4w9WgXcQ'.

export interface Video {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** As shown on YouTube, e.g. '12:34'. */
  duration?: string;
  description?: string;
}

export const videos: Video[] = [
  // { id: 'VIDEO_ID', title: 'Trigger conditions in 5 minutes', date: '2026-11-01', duration: '5:12', description: '…' },
];

export const watchUrl = (v: Video) => `https://www.youtube.com/watch?v=${v.id}`;
export const videoThumb = (v: Video) => `/videos/thumbs/${v.id}.jpg`;
