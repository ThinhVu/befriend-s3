const {CALL_STATUS} = require('./constants')
const _calls = {}

module.exports = {
  makeCall: (sender, receiver) => {
    _calls[sender] = CALL_STATUS.Busy
    _calls[receiver] = CALL_STATUS.Busy
  },
  makeCallAck: (sender, receiver, callAccepted) => {
    const status = callAccepted ? CALL_STATUS.Busy: CALL_STATUS.Idle
    _calls[sender] = status
    _calls[receiver] = status
  },
  cancelCall: (sender, receiver) => {
    _calls[sender] = CALL_STATUS.Idle
    _calls[receiver] = CALL_STATUS.Idle
  },
  endCall: (sender, receiver) => {
    _calls[sender] = CALL_STATUS.Idle
    _calls[receiver] = CALL_STATUS.Idle
  },
  getStatus(id) {
    return _calls[id] || CALL_STATUS.Idle
  }
}
