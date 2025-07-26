/**
 * @fileoverview Service for fetching traffic-related data from Reddit.
 */
import fetch from 'node-fetch';

const REDDIT_API_URL = 'https://www.reddit.com/r/bangalore/search.json';
const SEARCH_KEYWORDS = [
  'traffic', 'jam', 'accident', 'silk board', 
  'electronic city', 'marathahalli', 'road closure'
].join(' OR ');

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  created_utc: number;
}

/**
 * Fetches recent traffic-related posts from the r/bangalore subreddit.
 * @returns A promise that resolves to an array of Reddit posts.
 */
export async function getRedditTrafficReports(): Promise<RedditPost[]> {
  try {
    const response = await fetch(`${REDDIT_API_URL}?q=${encodeURIComponent(SEARCH_KEYWORDS)}&sort=new&restrict_sr=on&limit=25`);
    if (!response.ok) {
      throw new Error(`Reddit API request failed with status: ${response.status}`);
    }

    const data: any = await response.json();
    
    if (!data.data || !data.data.children) {
      console.warn("Received unexpected data structure from Reddit API");
      return [];
    }
    
    const posts: RedditPost[] = data.data.children.map((post: any) => ({
      id: post.data.id,
      title: post.data.title,
      url: `https://www.reddit.com${post.data.permalink}`,
      created_utc: post.data.created_utc,
    }));
    
    return posts;

  } catch (error) {
    console.error("Error fetching data from Reddit:", error);
    // Return an empty array in case of error to avoid breaking the app
    return [];
  }
}