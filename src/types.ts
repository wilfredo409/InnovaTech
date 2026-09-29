export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  contentSnippet: string;
  content: string;
  imageUrl?: string;
  categories: string[];
  topic?: Topic;
  sourceUrl?: string;
  createdAt?: string;
  audioUrl?: string;
  lang?: string;
  contentLang?: string;
  videoId?: string;
  podcastTitle?: string;
  podcastCreator?: string;
  podcastImage?: string;
  episodeNumber?: string | number;
  seasonNumber?: string | number;
  podcastSummary?: string;
}

export type Topic = "latest" | "ai" | "hardware" | "software" | "gadgets" | "videos" | "podcasts";
