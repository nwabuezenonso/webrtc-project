// Create a new WebSocket connection to the given server URL
const webSocket = new WebSocket("https://backend-webrtc-3265.onrender.com");

// When a message is received from the WebSocket server, handle it with the handleSignallingData function
webSocket.onmessage = (event) => {
  handleSignallingData(JSON.parse(event.data));
};

// Function to handle the signaling data received from the server
function handleSignallingData(data) {
  switch (data.type) {
    case "answer":
      // If the message is an answer to our offer, set it as the remote description
      peerConn.setRemoteDescription(data.answer);
      break;
    case "candidate":
      // If the message contains an ICE candidate, add it to the peer connection
      peerConn.addIceCandidate(data.candidate);
  }
}

let username; // Variable to store the username

// Function to send the username to the server
function sendUsername() {
  username = document.getElementById("username-input").value; // Get the username from the input field
  sendData({
    type: "store_user", // Send a message to store the user
  });
}

// Function to send data to the server via WebSocket
function sendData(data) {
  data.username = username; // Add the username to the data
  webSocket.send(JSON.stringify(data)); // Send the data as a JSON string
}

let localStream; // Variable to store the local video/audio stream
let peerConn; // Variable to store the RTCPeerConnection

// Function to start the video call
function startCall() {
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

      // Set up the RTCPeerConnection
      peerConn = new RTCPeerConnection(configuration);
      peerConn.addStream(localStream); // Add the local stream to the connection

      // When a remote stream is added, show it in the remote video element
      peerConn.onaddstream = (e) => {
        document.getElementById("remote-video").srcObject = e.stream;
      };

      // When an ICE candidate is found, send it to the server
      peerConn.onicecandidate = (e) => {
        if (e.candidate == null) return;
        sendData({
          type: "store_candidate",
          candidate: e.candidate,
        });
      };

      // Create and send an offer to start the call
      createAndSendOffer();
    },
    (error) => {
      console.log(error); // Log any errors
    }
  );
}

// Function to create and send an offer for the call
function createAndSendOffer() {
  peerConn.createOffer(
    (offer) => {
      sendData({
        type: "store_offer",
        offer: offer,
      });

      peerConn.setLocalDescription(offer); // Set the offer as the local description
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
