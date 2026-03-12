const socket = io()

const video=document.getElementById("video")

const room=localStorage.getItem("room")
const password=localStorage.getItem("password")
const profile=localStorage.getItem("profile")

const urlParams=new URLSearchParams(window.location.search)
let mode=urlParams.get("mode")

// if page reloads
if(!mode){
mode="join"
}

// CREATE ROOM
if(mode==="create"){
socket.emit("create-room",{roomId:room,password:password,profile:profile})
}

// JOIN ROOM
if(mode==="join"){
socket.emit("join-room",{roomId:room,password:password,profile:profile})
}


// SERVER RESPONSES

socket.on("room-created",()=>{
console.log("Room created")
})

socket.on("joined-room",()=>{
console.log("Joined room")
})

socket.on("room-exists",()=>{
alert("Room already exists")
window.location="index.html"
})

socket.on("room-not-found",()=>{
alert("Room not found")
window.location="index.html"
})

socket.on("wrong-password",()=>{
alert("Wrong password")
window.location="index.html"
})


// VIDEO SYNC
video.addEventListener("play",()=>{

socket.emit("video-action",{
action:"play",
time:video.currentTime
})

})

video.addEventListener("pause",()=>{

socket.emit("video-action",{
action:"pause",
time:video.currentTime
})

})

socket.on("video-action",(data)=>{

video.currentTime=data.time

if(data.action==="play") video.play()
if(data.action==="pause") video.pause()

})


// SEND COMMENT
function sendComment(){

let input=document.getElementById("commentInput")

if(input.value==="") return

let time=formatTime(video.currentTime)

let message={
profile:profile,
time:time,
text:input.value
}

socket.emit("comment",message)

input.value=""

}


// DISPLAY COMMENT
socket.on("comment",(msg)=>{

let div=document.getElementById("comments")

let p=document.createElement("p")

p.innerText=msg.profile+"   "+msg.time+"   "+msg.text

div.appendChild(p)

})


// CLOSE ROOM
function closeRoom(){

socket.emit("close-room")

}

socket.on("room-closed",()=>{

alert("Room closed by host")

window.location="index.html"

})


function formatTime(seconds){

let m=Math.floor(seconds/60)
let s=Math.floor(seconds%60)

if(s<10)s="0"+s

return m+":"+s

}