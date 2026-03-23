import { axiosInstance } from "./axios";

// ===== AUTHENTICATION =====
export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

// ===== USERS =====
export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

// NEW: Get user profile by ID
export async function getUserProfile(userId) {
  const response = await axiosInstance.get(`/users/profile/${userId}`);
  return response.data;
}

// NEW: Block a user
export async function blockUser(userId) {
  const response = await axiosInstance.post(`/users/block/${userId}`);
  return response.data;
}

// NEW: Unblock a user
export async function unblockUser(userId) {
  const response = await axiosInstance.post(`/users/unblock/${userId}`);
  return response.data;
}

// NEW: Get blocked users
export async function getBlockedUsers() {
  const response = await axiosInstance.get("/users/blocked");
  return response.data;
}

// ===== SESSIONS =====

// NEW: Request a session
export async function requestSession(sessionData) {
  const response = await axiosInstance.post("/sessions/request", sessionData);
  return response.data;
}

// NEW: Get all my sessions
export async function getMySessions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/sessions${queryString ? `?${queryString}` : ""}`);
  return response.data;
}

// NEW: Get upcoming sessions
export async function getUpcomingSessions() {
  const response = await axiosInstance.get("/sessions/upcoming");
  return response.data;
}

// NEW: Get session by ID
export async function getSessionById(sessionId) {
  const response = await axiosInstance.get(`/sessions/${sessionId}`);
  return response.data;
}

// NEW: Confirm a session (teacher)
export async function confirmSession(sessionId) {
  const response = await axiosInstance.put(`/sessions/${sessionId}/confirm`);
  return response.data;
}

// NEW: Start a session
export async function startSession(sessionId) {
  const response = await axiosInstance.put(`/sessions/${sessionId}/start`);
  return response.data;
}

// NEW: Complete a session
export async function completeSession(sessionId, notes) {
  const response = await axiosInstance.put(`/sessions/${sessionId}/complete`, notes);
  return response.data;
}

// NEW: Cancel a session
export async function cancelSession(sessionId, reason) {
  const response = await axiosInstance.put(`/sessions/${sessionId}/cancel`, {
    cancellationReason: reason,
  });
  return response.data;
}

// NEW: Rate a session
export async function rateSession(sessionId, ratingData) {
  const response = await axiosInstance.post(`/sessions/${sessionId}/rate`, ratingData);
  return response.data;
}

// ===== CHAT =====
export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}