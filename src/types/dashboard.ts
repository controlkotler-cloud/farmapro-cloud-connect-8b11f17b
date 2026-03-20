
export interface DashboardStats {
  totalPoints: number;
  level: number;
  coursesCompleted: number;
  resourcesDownloaded: number;
  forumPosts: number;
  challengesCompleted: number;
}

export interface ActivityItem {
  type: string;
  title: string;
  date: string;
  points: number;
}
