const express = require('express')
const http = require('http')
const path = require('path')
const createSocketServer = require('./socket')

const app = express()
const httpServer = http.createServer(app);
app.use(express.static(path.resolve(__dirname, './public')));
createSocketServer(httpServer);
httpServer.listen(3000, () => console.log('Listen at http://localhost:3000'));
