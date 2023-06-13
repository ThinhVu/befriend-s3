const {v4} = require('uuid')

const callGroups = {}
const callSessions = {}

function rand() {
  return 'SESSION_' + (100 + Math.floor(Math.random() * 1000))
}

module.exports = {
  groupCallSession(groupId) {
    return callGroups[groupId]
  },
  makeCall(groupId, userId) {
    const sessionId = rand()
    callGroups[groupId] = sessionId;
    callSessions[sessionId] = {
      ofGroup: groupId,
      createdAt: new Date(),
      members: {
        [userId]: new Date()
      }
    }
    return sessionId
  },
  /**
   * join session
   * @param userId
   * @param sessionId
   * @return {boolean} indicate whether the user should join voip session or not
   */
  joinCall(userId, sessionId) {
    const callSession = callSessions[sessionId]
    if (!callSession) return false
    callSession.members[userId] = new Date()
    return true
  },
  /**
   * Leave call
   * @param userId
   * @param sessionId
   * @return {number} the number in current session
   */
  leaveCall(userId, sessionId) {
    const callSession = callSessions[sessionId]
    if (!callSession) return 0
    if (!callSession.members[userId]) return 0
    delete callSession.members[userId]
    const remainMembers = Object.keys(callSession.members).length
    if (remainMembers === 0) {
      const groupId = callSession.ofGroup
      delete callSessions[sessionId]
      delete callGroups[groupId]
    }
    return remainMembers
  }
}
