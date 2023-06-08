const {Server} = require('socket.io')
const callMgr = require('./call-logic/call-manager');
const groupCallMgr = require('./call-logic/group-call-manager');
const {CALL_STATUS} = require('./call-logic/constants');

const users = {}

function createSocketServer(httpServer) {
  const io = new Server(httpServer)

  io.use((socket, next) => {
    const {uid, name} = socket.handshake.query;
    console.log('new socket connected ', uid, name);
    if (uid) {
      socket.uid = uid;
      users[uid] = {
        socketId: socket.id
      }
      console.log('accept socket')
      next()
    } else {
      console.log('reject socket')
      next(new Error('Authentication error'));
    }
  })

  const hasUser = (uid) => users[uid] && users[uid].socketId
  const toUser = (userId) => {
    const socketUser = users[userId];
    if (socketUser && socketUser.socketId) {
      return io.to(socketUser.socketId);
    } else {
      return {
        emit: (...args) => console.log(`socket of user "${userId}" is not found`)
      }
    }
  }

  io.on('connect', socket => {
    console.log(`User ${socket.uid} connected!`)
    const sender = socket.uid;
    socket.on('disconnect', (reason) => console.log(`Socket: ${sender} disconnect with reason ${reason}`))
    socket.join('discord')

    // 1-1
    socket.on('makeCall', (receiver, cb) => {
      console.log(`make-call from ${sender} to ${receiver}`)
      if (!hasUser(receiver)) {
        cb && cb('user not found')
        return
      }
      if (CALL_STATUS.Idle === callMgr.getStatus(receiver)) {
        console.log('Receiver is idle, can make a call')
        callMgr.makeCall(sender, receiver)
        toUser(receiver).emit('makeCall', {sender})
        cb && cb(null)
      } else {
        console.log("Receiver is busy, can't make a call")
        cb && cb('Receiver busy')
      }
    })
    socket.on('makeCallAck', (receiver, callAccepted, cb) => {
      console.log(`make-call-ack from ${sender} to ${receiver}`)
      callMgr.makeCallAck(sender, receiver, callAccepted)
      toUser(receiver).emit('makeCallAck', {sender, callAccepted})
      cb && cb()
    })
    socket.on('cancelCall', (receiver, cb) => {
      console.log(`cancel-call from ${sender} to ${receiver}`)
      callMgr.cancelCall(sender, receiver)
      toUser(receiver).emit('cancelCall', {sender})
      cb && cb()
    })
    socket.on('endCall', (receiver, cb) => {
      console.log(`end-call from ${sender} to ${receiver}`)
      callMgr.endCall(sender, receiver)
      toUser(receiver).emit('endCall', {sender})
      cb && cb()
    })

    // 1-n
    socket.on('group:makeCall', (cb) => {
      const sessionId = groupCallMgr.makeCall(sender)
      cb(sessionId)
      socket.join(sessionId)
      io.to('discord').emit('group:makeCall', {sender, sessionId})
    })
    socket.on('group:joinCall', (sessionId, cb) => {
      const shouldJoinVoip = groupCallMgr.joinCall(sender, sessionId)
      cb(shouldJoinVoip)
      io.to(sessionId).emit('group:joinCall', {sender, sessionId})
      socket.join(sessionId)
    })
    socket.on('group:leaveCall', (sessionId, cb) => {
      const remainMembers = groupCallMgr.leaveCall(sender, sessionId)
      cb()
      socket.leave(sessionId)
      io.to(sessionId).emit('group:leaveCall', {sender, sessionId, remainMembers})
    })

    // test
    socket.emit("__TEST__", `${sender}: OK`)
  })

  return io;
}

module.exports = createSocketServer;
