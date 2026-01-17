
// confs
const API_BASE_URL = "http://localhost:8081";
// Ttypes
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  location?: string;
  headline?: string;
  about?: string;
  dateOfBirth?: string;
  experiences?: Experience[];
  projects?: Project[];
  skills?: Skill[];
  certificates?: Certificate[];
  connections?: string[];
  following?: string[];
  createdAt: string;
}

export interface FeedPost {
  _id: string;
  content: string;
  media?: { 
    type: string; 
    url: string; 
    _id: string 
  }[];
  author: {
    id: string;
    type: "User" | "Company";
    details: {
      _id: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      image?: string;
      logo?: string;
    };
  };
  reactions?: ReactionStats;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  __v?: number;
  userReaction?: {
    _id: string;
    target: {
      id: string;
      type: string;
    };
    userId: string;
    reactionType: ReactionType;
    createdAt: string;
    __v?: number;
  } | null;
}

export interface Company {
  _id: string;
  name: string;
  email: string;
  location?: string;
  description?: string;
  website?: string;
  logo?: string;
  followers?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    image?: string;
    headline?: string;
  }>;
  createdAt: string;
  __v?: number;
}

export interface Experience {
  _id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  current?: boolean;
}

export interface Project {
  _id: string;
  title: string;       
  link?: string;       
  technologies?: string[]; 
  description?: string; 
  startDate?: string;
  endDate?: string;
}

export interface Skill {
  _id: string;
  name: string;
  level?: string;
}


export interface Certificate {
  _id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  url?: string;
}

export interface Post {
  _id: string;
  content: string;
  media?: { url: string; type: string; _id?: string }[];
  author: {
    id: string;
    type: "User" | "Company";
    details: {
      _id: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      image?: string;
      logo?: string;
    };
  };
  authorType?: "User" | "Company"; 
  reactions?: ReactionStats;
  commentsCount?: number;
  likesCount?: number;
  createdAt: string;
  updatedAt?: string;
  useAI?: boolean;
  __v?: number;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  companyId: {
    _id: string;
    name: string;
    logo?: string;
  };
  location: string;
  type: "full-time" | "part-time" | "internship" | "freelance" | "contract";
  salaryRange: string;
  duration?: string;
  startDate?: string;
  deadline?: string;
  isActive: boolean;
  applicants?: Applicant[];
  createdAt: string;
  updatedAt: string;
  requirements?: string[];
  skillsRequired?: string[];
  isSaved?: boolean;
}

export interface Comment {
  _id: string;
  content: string;
  author: {
    id: string;
    type: "User" | "Company";
    details: {
      _id: string;
      firstName?: string;
      lastName?: string;
      name?: string;      
      image?: string;     
      logo?: string;     
    };
  };
  postId: string;
  parentCommentId?: string | null;
  createdAt: string;
  __v?: number;
  userReaction?: {
    _id: string;
    target: {
      id: string;
      type: string;
    };
    userId: string;
    reactionType: ReactionType;
    createdAt: string;
    __v?: number;
  } | null;
}

export type ReactionType = "like" | "love" | "dislike" | "encourage" | "haha";

export interface ReactionStats {
  total: number;
  like: number;
  love: number;
  dislike: number;
  encourage: number;
  haha: number;
}



export interface Applicant {
  userId: User;
  resumeUrl: string;
  additionalAttachment?: {
    path: string;
    type: "video" | "document" | "image";
  };
  status: "pending" | "accepted" | "rejected";
  score: number;
  aiScore?: {
    overall: number;
    skills: number;
    experience: number;
    education: number;
    culturalFit: number;
  };
  appliedAt: string;
}
export interface CommentsResponse {
  success: boolean;
  data: {
    comments?: Comment[];   
    replies?: Comment[];   
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}


export interface Message {
  _id: string;
  senderId: string;
  senderType: "User" | "Company";
  receiverId: string;
  receiverType: "User" | "Company";
  content: string;
  attachments?: { type: string; url: string; originalName?: string }[];
  isRead: boolean;
  createdAt: string;
}


export interface Conversation {
  _id: string;
  participant: User| Company;
  lastMessage: Message;
  participantType: "User" | "Company";
  unreadCount: number;
}



export interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  image?: string;
}

export interface PopulatedCompany {
  _id: string;
  name?: string;
  logo?: string;
}

export interface Notification {
  _id: string;
  type:
    | "new_post"
    | "reaction"
    | "comment"
    | "reply"
    | "job_offer"
    | "connection_request"
    | "connection_accepted"
    | "job_application"
    | "company_post"
    | "MESSAGE";

  sender: {
    id: PopulatedUser | PopulatedCompany;
    type: "User" | "Company";
  };

  receiver: {
    id: string;
    type: "User" | "Company";
  };

  entity: {
    id: any;
    type: string;
  };

  isRead: boolean;
  createdAt: string;
}

export interface Connection {
  _id: string;
  requester: User;
  recipient: User;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export interface TrendingTopic {
  tag: string;
  count: number;
  posts: string;
  rank: number;
}


class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken() {
    return this.token;
  }

  getBaseUrl() {
    return this.baseUrl;
  }
async getUserConnectionsCount(userId: string) {
  try {
    const connections = await this.getMyConnections();
    return { success: true, count: connections.length };
  } catch {

   
  }
}

async getUserReactions() {
  return this.request<{ success: boolean; data: any[] }>("/api/users/reactions");
}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
  const errorBody = await response.json().catch(() => ({}));
  const error: any = new Error(errorBody.message || "Request failed");
  error.status = response.status;
  throw error;
}

    return response.json();
  }



  async signupUser(data: FormData) {
    return this.request<{ success: boolean; token: string; user: User }>("/signup/user", {
      method: "POST",
      body: data,
    });
  }

  async signupCompany(data: FormData) {
    return this.request<{ success: boolean; token: string; company: Company }>("/signup/company", {
      method: "POST",
      body: data,
    });
  }

  async login(email: string, password: string) {
    return this.request<{
      success: boolean;
      token: string;
      role: "User" | "Company";
      accountType: "user" | "company";
      user?: User;
      company?: Company;
    }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async loginUser(email: string, password: string) {
    return this.request<{
      success: boolean;
      token: string;
      user: User;
    }>("/login/user", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async loginCompany(email: string, password: string) {
    return this.request<{
      success: boolean;
      token: string;
      company: Company;
    }>("/login/company", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async loginWithGoogle(googleToken: string) {
    return this.request<{ success: boolean; token: string; user: User }>("/login/google", {
      method: "POST",
      body: JSON.stringify({ googleToken }),
    });
  }

  async getSession() {
    return this.request<{
      success: boolean;
      isAuthenticated: boolean;
      role?: "User" | "Company";
      accountType?: "user" | "company";
      user?: User;
      company?: Company;
    }>("/session");
  }

  // profile of user -(current one)
  async getUserProfile() {
    return this.request<User>("/api/users/profile");
  }

async getPublicProfile(userId: string) {
    return this.request<User>(`/api/users/profile/${userId}`);
  }

async updateUserProfile(userId: string, data: FormData) {
    return this.request<{ success: boolean; data: User }>(`/api/users/profile/update`, {
      method: "PUT",
      body: data,
    });
}

  async getFollowingList() {
    return this.request<{ success: boolean; data: Company[] }>("/api/users/following");
  }

  async followCompany(companyId: string) {
    return this.request<{ success: boolean }>(`/api/users/follow/${companyId}`, { method: "POST" });
  }

  async unfollowCompany(companyId: string) {
    return this.request<{ success: boolean }>(`/api/users/unfollow/${companyId}`, { method: "POST" });
  }

  async getUserSuggestions(limit = 5) {
  return this.request<User[]>(`/api/users/suggestions/users?limit=${limit}`);
}

  async getCompanySuggestions(limit = 5) {
    return this.request<{ success: boolean; data: Company[] }>(`/api/users/suggestions/companies?limit=${limit}`);
  }
  
  getCompanyJobsByCompanyId(companyId: string): Promise<{ success: boolean; data: any[] }> {
  return this.request(`/api/jobs/companies/${companyId}/jobs`, {
    method: "GET",
  });
  }

  async downloadResume() {
    const response = await fetch(`${this.baseUrl}/api/users/resume/download`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.blob();
  }

  
  async getActiveJobs(page = 1, limit = 10) {
  return this.getJobs({ page, limit });
}


  // job
  async getJobs(params: { location?: string; type?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.location) query.append('location', params.location);
    if (params.type) query.append('type', params.type);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request<{ success: boolean; data: Job[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/jobs?${query.toString()}`);
  }

  // crud for user
  async addExperience(data: Omit<Experience, "_id">) {
    return this.request<{ success: boolean; data: Experience }>("/api/users/experiences", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateExperience(id: string, data: Partial<Experience>) {
    return this.request<{ success: boolean; data: Experience }>(`/api/users/experiences/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async getCompanyById(companyId: string): Promise<Company> {
  return this.request<Company>(`/api/companies/${companyId}`);
}

  async deleteExperience(id: string) {
  const response = await this.request<{ 
    success?: boolean; 
    message?: string;
    data?: any;
  }>(`/api/users/experiences/${id}`, { 
    method: "DELETE" 
  });
  

  if (response.success !== undefined) {
    return response;
  }
  

  return { success: true, message: response.message || 'Deleted successfully' };
}


  async addProject(data: Omit<Project, "_id">) {
    return this.request<{ success: boolean; data: Project }>("/api/users/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>) {
    return this.request<{ success: boolean; data: Project }>(`/api/users/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

 async deleteProject(id: string) {
  const response = await this.request<{ 
    success?: boolean; 
    message?: string;
    data?: any;
  }>(`/api/users/projects/${id}`, { 
    method: "DELETE" 
  });
  
  if (response.success !== undefined) {
    return response;
  }
  
  return { success: true, message: response.message || 'Deleted successfully' };
}


  async addSkill(data: Omit<Skill, "_id">) {
    return this.request<{ success: boolean; data: Skill }>("/api/users/skills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSkill(id: string, data: Partial<Skill>) {
    return this.request<{ success: boolean; data: Skill }>(`/api/users/skills/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSkill(id: string) {
  const response = await this.request<{ 
    success?: boolean; 
    message?: string;
    data?: any;
  }>(`/api/users/skills/${id}`, { 
    method: "DELETE" 
  });
  
  if (response.success !== undefined) {
    return response;
  }
  
  return { success: true, message: response.message || 'Deleted successfully' };
}

  async addCertificate(data: Omit<Certificate, "_id">) {
    return this.request<{ success: boolean; data: Certificate }>("/api/users/certificates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCertificate(id: string, data: Partial<Certificate>) {
    return this.request<{ success: boolean; data: Certificate }>(`/api/users/certificates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCertificate(id: string) {
  const response = await this.request<{ 
    success?: boolean; 
    message?: string;
    data?: any;
  }>(`/api/users/certificates/${id}`, { 
    method: "DELETE" 
  });
  
  if (response.success !== undefined) {
    return response;
  }
  
  return { success: true, message: response.message || 'Deleted successfully' };
}

  // Company
  async getCompanyProfile() {
    return this.request<Company>("/api/companies/profile");
  }
  async updateCompanyProfile(companyId: string, data: FormData) {
  return this.request<{ 
    message?: string; 
    company?: Company; 
    success?: boolean; 
    data?: Company 
  }>(`/api/companies/profile/${companyId}`, {
    method: "PUT",
    body: data,
  });
}

  async getWeekEngagements() {
    return this.request<{ success: boolean; data: any }>("/api/companies/engagements/week");
  }

  async getCompanyJobs() {
    return this.request<{ success: boolean; data: Job[] }>("/api/companies/jobs");
  }

  async getJobApplicants(jobId: string) {
    return this.request<{ success: boolean; data: Applicant[] }>(`/api/companies/jobs/${jobId}/applicants`);
  }

  async deleteCompanyJob(jobId: string) {
    return this.request<{ success: boolean }>(`/api/companies/jobs/${jobId}`, { method: "DELETE" });
  }

  // posts
  async createPost(data: FormData) {
    return this.request<{ success: boolean; data: Post }>("/api/posts", {
      method: "POST",
      body: data,
    });
  }

  async getFeed(page = 1, limit = 10) {
  return this.request<{ 
    success: boolean; 
    data: {
      posts: FeedPost[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    };
  }>(`/api/posts/feed?page=${page}&limit=${limit}`);
}

  async searchPosts(query: string, page = 1, limit = 10) {
    return this.request<{ success: boolean; data: Post[]; pagination: any }>(`/api/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  async getPost(postId: string) {
    return this.request<{ success: boolean; data: Post }>(`/api/posts/${postId}`);
  }

  async updatePost(postId: string, data: { content?: string; useAI?: boolean }) {
    return this.request<{ success: boolean; data: Post }>(`/api/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePost(postId: string) {
    return this.request<{ success: boolean }>(`/api/posts/${postId}`, { method: "DELETE" });
  }
  async getAllUsers() {
    return this.request<User[]>('/api/users/all');
  }

  
  async getAllCompanies() {
    return this.request<Company[]>('/api/companies/all');
  }

  async getUserPosts(userId: string, page = 1, limit = 10) {
  return this.request<{ 
    success: boolean; 
    data: {
      posts: Post[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }
  }>(`/api/posts/user/${userId}?page=${page}&limit=${limit}`);
}

  async getCompanyPosts(companyId: string, page = 1, limit = 10) {
  return this.request<{ 
    success: boolean; 
    data: {
      posts: Post[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }
  }>(`/api/posts/company/${companyId}?page=${page}&limit=${limit}`);
}

  // the commments
  async createComment(postId: string, data: { content: string; parentCommentId?: string; useAI?: boolean }) {
    return this.request<{ success: boolean; data: Comment }>(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPostComments(postId: string, page = 1, limit = 20) {
  return this.request<CommentsResponse>(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
}

async getCommentReplies(commentId: string, page = 1, limit = 20) {
  return this.request<CommentsResponse>(`/api/posts/comments/${commentId}/replies?page=${page}&limit=${limit}`);
}

  async deleteComment(commentId: string) {
    return this.request<{ success: boolean }>(`/api/posts/comments/${commentId}`, { method: "DELETE" });
  }

  

  // reacts
  async addReaction(targetType: "Post" | "Comment" | "Message", targetId: string, reactionType: ReactionType) {
    return this.request<{ success: boolean }>(`/api/posts/reactions/${targetType}/${targetId}`, {
      method: "POST",
      body: JSON.stringify({ reactionType }),
    });
  }

  async removeReaction(targetType: "Post" | "Comment" | "Message", targetId: string) {
    return this.request<{ success: boolean }>(`/api/posts/reactions/${targetType}/${targetId}`, { method: "DELETE" });
  }

  async getReactions(targetType: "Post" | "Comment" | "Message", targetId: string, page = 1, limit = 20) {
    return this.request<{ success: boolean; data: any[] }>(`/api/posts/reactions/${targetType}/${targetId}?page=${page}&limit=${limit}`);
  }

  async getUserReaction(targetType: "Post" | "Comment" | "Message", targetId: string) {
    return this.request<{ success: boolean; data: { reactionType: ReactionType } | null }>(`/api/posts/reactions/${targetType}/${targetId}/user`);
  }

  async getReactionStats(targetType: "Post" | "Comment" | "Message", targetId: string) {
    return this.request<{ success: boolean; data: ReactionStats }>(`/api/posts/reactions/${targetType}/${targetId}/stats`);
  }

  // jobs
  async getAllJobs(params?: { location?: string; type?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.location) queryParams.append("location", params.location);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    return this.request<{ success: boolean; data: Job[]; pagination: any }>(`/api/jobs?${queryParams}`);
  }


  async getJobById(jobId: string) {
    return this.request<Job>(`/api/jobs/${jobId}`);
  }

async applyToJob(jobId: string, formData: FormData) {
  return this.request<{
    success: boolean;
    message: string;
    applicant: any;
    aiScore: number; 
  }>(`/api/jobs/${jobId}/apply`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`
    }
  });
}
  async createJob(data: {
    title: string;
    description: string;
    type: string;
    location: string;
    salaryRange?: string;
    requirements?: string;
    skillsRequired?: string[];
    experienceLevel?: string;
    educationLevel?: string;
    deadline?: string;
    generateWithAI?: boolean;
  }) {
    return this.request<{ success: boolean; data: Job }>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async closeJob(jobId: string) {
    return this.request<{ message: string; job?: any }>(`/api/jobs/${jobId}/close`, { method: "PUT" });
  }

  async updateApplicantStatus(
    jobId: string,
    userId: string,
    status: "pending" | "accepted" | "rejected"
  ) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/api/jobs/${jobId}/applicants/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async getTopCandidates(jobId: string, limit = 10) {
  return this.request<{
    success: boolean;
    data: Applicant[];
  }>(`/api/jobs/${jobId}/top-candidates?limit=${limit}`);
}

  async rescoreApplicants(jobId: string) {
    return this.request<{
      success: boolean;
      message: string;
      updated?: number;
      failed?: number;
    }>(`/api/jobs/${jobId}/rescore`, {
      method: "POST",
    });
  }

  async getJobStatistics(jobId: string) {
    return this.request<{
      totalApplications: number;
      scoredApplications: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      statusDistribution: {
        pending: number;
        accepted: number;
        rejected: number;
      };
    }>(`/api/jobs/${jobId}/statistics`);
  }
  async getConversations() {
    const response = await this.request<any>("/api/messages/conversations");
    if (response.success && response.data) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  }

  async getChatHistory(userId: string) {
    const response = await this.request<any>(`/api/messages/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  }

  async sendMessage(
  data:
    | { receiverId: string; receiverType: "User" | "Company"; content: string|"" }
    | FormData
    )  {
    const isFormData = data instanceof FormData;
    const body = isFormData ? data : JSON.stringify(data);
    const response = await this.request<any>("/api/messages", {
      method: "POST",
      body,
    });
    if (response.success && response.data) {
      return response.data;
    }
    if (response._id && response.content) {
      return response;
    }
    return response.data || response;
  }

  async deleteConversation(userId: string) {
    return this.request<{ success: boolean }>(`/api/messages/${userId}`, { method: "DELETE" });
  }

  async getNotifications() {
    const response = await this.request<any>("/api/notifications");
    if (response.success && response.data) {
      return { success: response.success, data: response.data };
    }
    if (Array.isArray(response)) {
      return { success: true, data: response };
    }
    return { success: true, data: response };
  }

  async getUnreadCount() {
    const response = await this.request<any>("/api/notifications/unread/count");
    console.log('Raw unread count response:', response);
    if (response.success && typeof response.count === 'number') {
      return { success: response.success, count: response.count };
    }
    if (typeof response === 'number') {
      return { success: true, count: response };
    }
    if (response.count !== undefined) {
      return { success: true, count: response.count };
    }
    if (response.data && typeof response.data.count === 'number') {
      return { success: true, count: response.data.count };
    }
    if (response.data && typeof response.data === 'number') {
      return { success: true, count: response.data };
    }
    console.warn('Could not parse unread count from response:', response);
    return { success: true, count: 0 };
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.request<any>(`/api/notifications/${notificationId}/read`, { method: "PUT" });
    return response.success !== undefined ? response : { success: true };
  }

  async markAllNotificationsAsRead() {
    const response = await this.request<any>("/api/notifications/read-all", { method: "PUT" });
    return response.success !== undefined ? response : { success: true };
  }

  async sendConnectionRequest(userId: string) {
    return this.request<{ success: boolean }>(`/connection/request/${userId}`, { method: "POST" });
  }

  async respondToConnectionRequest(connectionId: string, action: "ACCEPTED" | "REJECTED") {
    return this.request<{ success: boolean }>(`/connection/respond/${connectionId}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    });
  }

  async getPendingRequests() {
    return this.request<{ success: boolean; data: Connection[] }>("/connection/pending");
  }

  async getMyConnections() {
  return this.request<User[]>(`/connection`);
}

  async disconnect(userId: string) {
    return this.request<{ success: boolean }>(`/connection/disconnect/${userId}`, { method: "DELETE" });
  }

  async checkConnectionStatus(userId: string) {
    return this.request<{ 
      status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'; 
      isRequester: boolean; 
      connectionId: string | null; 
    }>(`/connection/status/${userId}`);
  }
  // the trends
  async getTrendingTopics(limit = 5) {
    return this.request<{ success: boolean; data: TrendingTopic[] }>(`/api/trends/topics?limit=${limit}`);
  }

  async getFeedTrends() {
    return this.request<{ success: boolean; data: { trendingTopics: TrendingTopic[] } }>("/api/trends/feed-trends");
  }
}

export const api = new ApiClient(API_BASE_URL);