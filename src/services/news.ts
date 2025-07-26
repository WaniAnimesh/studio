/**
 * @fileoverview Service for fetching traffic-related news from NewsData.io.
 */
import fetch from 'node-fetch';

const NEWS_API_KEY = process.env.NEWS_API_KEY; // 'pub_b2506e27eb4a4f39a31799725467cbe2'
const NEWS_API_URL = 'https://newsdata.io/api/1/news';

export interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  pubDate: string;
}

/**
 * Fetches recent traffic-related news articles for Bengaluru.
 * @returns A promise that resolves to an array of news articles.
 */
export async function getNewsTrafficReports(): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn("News API key is not configured. Skipping news fetch.");
    return [];
  }

  try {
    // Note: The 'country' parameter with 'qInTitle' might be more effective on a paid plan.
    // 'q' is a broad search for free tier.
    const query = 'Bengaluru traffic OR Bangalore traffic';
    const response = await fetch(`${NEWS_API_URL}?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en&country=in`);

    if (!response.ok) {
      // The free tier of NewsData.io might have strict rate limits.
      if (response.status === 429) {
        console.warn("Rate limit exceeded for NewsData.io API.");
        return [];
      }
      throw new Error(`News API request failed with status: ${response.status}`);
    }

    const data: any = await response.json();

    if (data.status === 'success' && data.results) {
      return data.results.map((article: any) => ({
        article_id: article.article_id,
        title: article.title,
        link: article.link,
        pubDate: article.pubDate,
      }));
    } else {
      console.warn("Received non-success status from News API:", data.status);
      return [];
    }

  } catch (error) {
    console.error("Error fetching data from News API:", error);
    return [];
  }
}