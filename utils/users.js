const users = []; //keep everything in memory

export function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

export function userLeave(id) {
  const index = users.find((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

export function getUser(id) {
  return users.find((user) => user.id === id);
}

export function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

export function checkUserNameExists(username) {
  return users.some((user) => user.username === username);
}
