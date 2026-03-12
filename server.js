const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const fs = require("fs")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static("public"))

const tempFolder = path.join(__dirname,"temp")

let rooms = {}

// create temp folder
if(!fs.existsSync(tempFolder)){
fs.mkdirSync(tempFolder,{recursive:true})
}

io.on("connection",(socket)=>{

console.log("User connected")

// CREATE ROOM
socket.on("create-room",({roomId,password,profile})=>{

if(rooms[roomId]){
socket.emit("room-exists")
return
}

rooms[roomId]={password:password,host:socket.id}

let roomPath = path.join(tempFolder,roomId)

if(!fs.existsSync(roomPath)){
fs.mkdirSync(roomPath,{recursive:true})
}

fs.writeFileSync(
path.join(roomPath,"room.txt"),
"Room ID: "+roomId+"\nPassword: "+password
)

fs.writeFileSync(
path.join(roomPath,"comments.txt"),
""
)

socket.join(roomId)

socket.roomId=roomId
socket.profile=profile

socket.emit("room-created")

})


// JOIN ROOM
socket.on("join-room",({roomId,password,profile})=>{

if(!rooms[roomId]){
socket.emit("room-not-found")
return
}

if(rooms[roomId].password!==password){
socket.emit("wrong-password")
return
}

socket.join(roomId)

socket.roomId=roomId
socket.profile=profile

socket.emit("joined-room")

// send previous comments
let roomPath = path.join(tempFolder,roomId)
let commentsFile = path.join(roomPath,"comments.txt")

if(fs.existsSync(commentsFile)){

let data = fs.readFileSync(commentsFile,"utf8")

let lines = data.split("\n")

lines.forEach(line=>{

if(line.trim()!==""){

let parts=line.split("   ")

socket.emit("comment",{
profile:parts[0],
time:parts[1],
text:parts[2]
})

}

})

}

})


// VIDEO SYNC
socket.on("video-action",(data)=>{

socket.to(socket.roomId).emit("video-action",data)

})


// CHAT
socket.on("comment",(data)=>{

let roomPath = path.join(tempFolder,socket.roomId)

let commentLine =
data.profile+"   "+
data.time+"   "+
data.text+"\n"

fs.appendFileSync(
path.join(roomPath,"comments.txt"),
commentLine
)

io.to(socket.roomId).emit("comment",data)

})


// CLOSE ROOM
socket.on("close-room",()=>{

let roomId = socket.roomId

if(!roomId) return

let roomPath = path.join(tempFolder,roomId)

delete rooms[roomId]

fs.rmSync(roomPath,{recursive:true,force:true})

io.to(roomId).emit("room-closed")

})

})

server.listen(3000,()=>{
console.log("Server running on http://localhost:3000")
})