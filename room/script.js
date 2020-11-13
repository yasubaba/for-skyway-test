const Peer = window.Peer;

(async function main() {
//window.onload = async function(){
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');
  const muteTrigger = document.getElementById('js-mute-trigger');
  const unMuteTrigger = document.getElementById('js-unmute-trigger');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
      audio:{
        channelCount:{"ideal":2,"min":1},
        "sampleRate":{"ideal":48000},
        "echoCancellation":true,
        "autoGainControl":true,
        "noiseSuppression":true,
        "googAudioMirroring":false,
      }
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

console.log(window.__SKYWAY_KEY__);
  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
    config: {
      turn: false,
    },
  }));
  console.log('peer.open(1):'+peer.open);

  peer.on('open', id => {
    console.log('peerId: '+id+'/peer.on: '+peer.open);
  });

  // Register join handler
  joinTrigger.addEventListener('click', () => {
  //peer.on('open', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    console.log('peer.open(2):'+peer.open);
    if (!peer.open) {
      return;
    }
    console.log('peer.open(3):'+peer.open);

    const room = peer.joinRoom(roomId.value, {
    //const room = peer.joinRoom('testroom', {
      mode: getRoomModeByHash(),
      //mode: 'mesh',
      stream: localStream,
      //videoCodec: 'H264',
    });

    room.on('log', log => {
      console.log('getLog:'+log);
    })

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
      room.getLog();
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
      console.log('room.on stream');
      room.getLog();
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
      console.log('room.on data');
      room.getLog();
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id=${peerId}]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
      console.log('room.on peerLeave');
      room.getLog();
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
      console.log('room.once close');
      room.getLog();
    });

    sendTrigger.addEventListener('click', onClickSend);
    muteTrigger.addEventListener('click', onClickMute);
    unMuteTrigger.addEventListener('click', onClickunMute);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }
    function onClickMute() {
      localStream.getAudioTracks().forEach(track => track.enabled = false);
      console.log(localStream.getAudioTracks());
      //room.replaceStream(null);
      //console.log(localStream.getAudioTracks());
    }
    function onClickunMute() {
      localStream.getAudioTracks().forEach(track => track.enabled = true);
      console.log(localStream.getAudioTracks());
      //room.replaceStream(localStream);
      //console.log(localStream.getAudioTracks());
    }


  });

  function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  peer.on('error', console.error);
})();
//}();


