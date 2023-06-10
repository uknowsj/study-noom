const socket = io();
// 유저 영상가져오기
// 음량 켜버튼
// 카메라 켜기
// 카메라 전환

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn =document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');
const peerFace = document.getElementById('peerFace');

const welcome = document.getElementById('welcome');
const call = document.getElementById('call');

// stream = vidoe + audio from the user
let myStream;
let isMuted = false;
let isCameraOffed = false;
let roomName;
let peerConnection;
let myDataChannel;

call.hidden = true;

const initCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedea();
  makeConnection();

}

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0].label; // 현재 사용하고 있는 비디오 device;

    cameras.forEach(camera => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;

      if (option.innerText === currentCamera) {
        option.selected = true;
      }
      camerasSelect.appendChild(option)
    })
  } catch (err) {

  }
}

// 첫번째 스텝 - 스트림에 카메라, 오디오 추가
const getMedea = async (deviceId) => {
  try {
    const initialConstraint = {
      audio: true,
      video: { facingMode: "user" } // 핸드폰 셀카모드
    };
    const cameraConstraint = {
      audio: true,
      video: {
        deviceId: {
          exact: deviceId,
        },
      },
    };
    
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraint : initialConstraint);
    myFace.srcObject = myStream;

    // 카메라 선택아닐 때만
    if (!deviceId) {
      getCameras();
    }
  } catch(err) {
    /* handle the error */
  }
}

// event functions
const onHandleMuteBtnClick = (e) => {
  // Audio mute
  myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  isMuted = !isMuted;
  muteBtn.innerText = isMuted ? 'UnMute' : 'mute';
}

const onHandleCameraBtnClick = () => {
  // Camera Off
  myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);

  isCameraOffed = !isCameraOffed;
  cameraBtn.innerText = isCameraOffed ? 'Turn Camera On' : 'Turn Camera Off';
}

const onHandleCamerasSelect = async () => {
  await getMedea(camerasSelect.value);
  if (peerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    // sender: 다른 브라우저로 보내진 비디오와 오디오 데이터를 컨트롤
    const videoSender = peerConnection.getSender().find((sender) => sender.track.kind === 'video');
    videoSender.replaceTrack(videoTrack); // 변경된 비디오트랙으로 대체
  }
}

// room 생성
const onHandleRoomSubmitSelect = async (e) => {
  e.preventDefault();
  const input = welcome.querySelector('input'); 
  roomName = input.value;
  input.value = "";

  await initCall();
  socket.emit("join_room", roomName);
}

/** event listeners */ 
muteBtn.addEventListener('click', onHandleMuteBtnClick)
cameraBtn.addEventListener('click', onHandleCameraBtnClick)
camerasSelect.addEventListener('input', onHandleCamerasSelect);
welcome.querySelector('form').addEventListener('submit', onHandleRoomSubmitSelect);


/** Socket Code */ 
// 호스트 브라우저
socket.on("welcome", async () => {
  myDataChannel = peerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", console.log);

  // 세번째 스텝
  const offer = await peerConnection.createOffer(); // 세션에서 일어날 일. 유저에대한 설명 담고있음
  // 네번째 스텝
  peerConnection.setLocalDescription(offer); 
  socket.emit("offer", offer, roomName);
  console.log("sent the offer");
});

// 게스트 브라우저(=내가 아닌 유저들)
socket.on("offer", async (offer) => {
  peerConnection.addEventListener("datachannel", (event) => {
    console.log("Data channel event ", event);
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => console.log("peer : ", event.data))
  });

  peerConnection.setRemoteDescription(offer); // offer가 주고받아지면 직접 대화 가능. 서버는 오퍼전달 기능위해 필요
  // 네번째 스텝
  console.log("received the offer");
  const answer = await peerConnection.createAnswer();
  peerConnection.setLocalDescription(answer); 
  socket.emit("answer", answer, roomName);

  console.log("sent the answer");

})

// 호스트 브라우저 (게스트브라우저로부터 answer 받았을 때)
socket.on("answer", (answer) => {
  console.log("Received the answer");
  peerConnection.setRemoteDescription(answer); // 양쪽 브라우저모두 로컬, 리모트 Description 설정 한번씩해야함.
});

socket.on("ice", (ice) => {
  console.log("receive candidate");
  peerConnection.addIceCandidate(ice);
})


/** RTC Code */ 
const makeConnection = () => {
  peerConnection = new RTCPeerConnection();
  peerConnection.addEventListener("icecandidate", handleIce);
  
  // peerConnection.addEventListener("addstream", handleAddStream); // deprecated. 사파리 지원 안함
  peerConnection.addEventListener("track", (data) => {
    peerFace.srcObject = data.streams[0];
  });

  // 두번째 스텝 peer-to-peer connection. (브라우저간 연결) 
  //stream의 데이터를 가져다가 연결을 만듦 (addStream은 deprecated?)
  myStream.getTracks().forEach(track => peerConnection.addTrack(track, myStream));
}

const handleIce = (data) => {
  console.log("sent candidate");

  socket.emit("ice", data.candidate, roomName);
  console.log("GO ICE CANDIDATE", data);
}

getMedea()
