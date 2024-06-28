// Create a new WebSocket connection to the given server URL
const webSocket = new WebSocket("https://backend-webrtc-3265.onrender.com");

// When a message is received from the WebSocket server, handle it with the handleSignallingData function
webSocket.onmessage = (event) => {
  handleSignallingData(JSON.parse(event.data));
};

// Function to handle the signaling data received from the server
function handleSignallingData(data) {
  switch (data.type) {
    case "offer":
      // If the message is an offer from the other user, set it as the remote description and send an answer back
      peerConn.setRemoteDescription(data.offer);
      createAndSendAnswer();
      break;
    case "candidate":
      // If the message contains an ICE candidate, add it to the peer connection
      peerConn.addIceCandidate(data.candidate);
  }
}

// Function to create and send an answer to an offer
function createAndSendAnswer() {
  peerConn.createAnswer(
    (answer) => {
      peerConn.setLocalDescription(answer); // Set the answer as the local description
      sendData({
        type: "send_answer",
        answer: answer, // Send the answer to the server
      });
    },
    (error) => {
      console.log(error); // Log any errors
    }
  );
}

// Function to send data to the server via WebSocket
function sendData(data) {
  data.username = username; // Add the username to the data

  console.log(data.username); // Log the username
  webSocket.send(JSON.stringify(data)); // Send the data as a JSON string
}

let localStream; // Variable to store the local video/audio stream
let peerConn; // Variable to store the RTCPeerConnection
let username; // Variable to store the username

// Function to join the call
function joinCall() {
  username = document.getElementById("username-input").value; // Get the username from the input field

  document.getElementById("video-call-div").style.display = "inline"; // Show the video call div

  // Request access to the user's camera and microphone
  navigator.getUserMedia(
    {
      video: {
        frameRate: 24,
        width: {
          min: 480,
          ideal: 720,
          max: 1280,
        },
        aspectRatio: 1.33333,
      },
      audio: true,
    },
    (stream) => {
      localStream = stream; // Store the local stream
      document.getElementById("local-video").srcObject = localStream; // Show the local video

      // Configuration for the ICE servers
      let configuration = {
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ],
          },
        ],
      };

      console.log(stream); // Log the stream for debugging

      // Set up the RTCPeerConnection
      peerConn = new RTCPeerConnection(configuration);
      peerConn.addStream(localStream); // Add the local stream to the connection

      // When a remote stream is added, show it in the remote video element
      peerConn.onaddstream = (e) => {
        console.log(e); // Log the event for debugging
        document.getElementById("remote-video").srcObject = e.stream;
      };

      // When an ICE candidate is found, send it to the server
      peerConn.onicecandidate = (e) => {
        if (e.candidate == null) return; // If there is no candidate, do nothing

        sendData({
          type: "send_candidate",
          candidate: e.candidate, // Send the candidate to the server
        });
      };

      // Send a message to the server to join the call
      sendData({
        type: "join_call",
      });
    },
    (error) => {
      console.log(error); // Log any errors
    }
  );
}

let isAudio = true; // Variable to track if audio is enabled
// Function to mute or unmute the audio
function muteAudio() {
  isAudio = !isAudio;
  localStream.getAudioTracks()[0].enabled = isAudio; // Enable or disable the audio track
}

let isVideo = true; // Variable to track if video is enabled
// Function to mute or unmute the video
function muteVideo() {
  isVideo = !isVideo;
  localStream.getVideoTracks()[0].enabled = isVideo; // Enable or disable the video track
}
