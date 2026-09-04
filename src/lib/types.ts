export type HackerNewsItemType = 'job' | 'story' | 'comment' | 'poll' | 'pollopt';

export interface HackerNewsItem {
  id: number;
  type?: HackerNewsItemType;
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  deleted?: boolean;
  parent?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface FeedItem extends HackerNewsItem {
  type: 'job' | 'story';
  title: string;
  time: number;
}

export interface CommentItem extends HackerNewsItem {
  type: 'comment';
  time: number;
}

export interface CommentNode {
  item: CommentItem;
  replies: CommentNode[];
  replyIds: number[];
  replyCount: number;
}

export type CommentSort = 'newest' | 'replies';
