export const apiCall = async (path, method = 'GET', body = null) => {
  const res = await fetch(`/api/friends${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'API error');
  }
  return res.json();
};

export const sendFriendRequest = (userId, friendId) =>
  apiCall('/request', 'POST', { userId, friendId });

export const acceptFriendRequest = (userId, friendId) =>
  apiCall('/accept', 'POST', { userId, friendId });

export const getFriendsList = (userId) =>
  apiCall(`/get?userId=${encodeURIComponent(userId)}`);

export const getPendingRequests = (userId) =>
  apiCall(`/pending?userId=${encodeURIComponent(userId)}`);

export const searchUsers = (query) =>
  apiCall('/search?q=' + encodeURIComponent(query));