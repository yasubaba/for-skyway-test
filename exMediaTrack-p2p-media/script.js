const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const localId = document.getElementById('js-local-id');
  const callTrigger = document.getElementById('js-call-trigger');
  const closeTrigger = document.getElementById('js-close-trigger');
  const gDMONTrigger = document.getElementById('js-gDMON-trigger');
  const gDMOFFTrigger = document.getElementById('js-gDMOFF-trigger');
  const gUMVideoTrigger = document.getElementById('js-gUMVideo-trigger');
  const remoteVideo = document.getElementById('js-remote-stream');
  const remoteId = document.getElementById('js-remote-id');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
    })
    .catch(console.error);

  // Render local stream
  //localVideo.muted = true;
  //localVideo.srcObject = localStream;
  //localVideo.playsInline = true;
  //await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  let mediaConnection;

  // Register callee handler
  peer.on('call', rcvMediaConnection => {
    mediaConnection = rcvMediaConnection;
    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  // Register caller handler
  callTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    mediaConnection = peer.call(remoteId.value, localStream,{
      videoReceiveEnabled: false,
    });

    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));

  });

  //Screan Share ON
  gDMONTrigger.addEventListener('click', async () => {
    if (!peer.open || !mediaConnection.open) {
      return;
    }

    //あとで実装 既に画面共有済みの場合はReturn

    const remotePeerId = mediaConnection.remoteId;
    mediaConnection.close(true);

    //localStreamのVideoTrackの差替え
    const gDMlocalStream = await navigator.mediaDevices.getDisplayMedia({ video: true});
    if(localStream.getVideoTracks().length > 0){
      localStream.removeTrack(localStream.getVideoTrack()[0]);
    }
    localStream.addTrack(gDMlocalStream.getVideoTracks()[0]);

    // Render local stream
    localVideo.muted = true;
    localVideo.srcObject = localStream;
    localVideo.playsInline = true;
    await localVideo.play().catch(console.error);

    // Set Peer Options
    // あとで実装

    mediaConnection = peer.call(remotePeerId, localStream,{
      videoReceiveEnabled: true,
    });
    
    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    gDMONTrigger.style.display = "none";
    gDMOFFTrigger.style.display = "inline-block";

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));

  });

  //Screan Share OFF
  gDMOFFTrigger.addEventListener('click', async () => {
    if (!peer.open || !mediaConnection.open) {
      return;
    }

    const remotePeerId = mediaConnection.remoteId;
    mediaConnection.close(true);

    //localStreamのVideoTrackの差替え
    if(localStream.getVideoTracks().length > 0){
      localStream.removeTrack(localStream.getVideoTracks()[0]);
    }

    // Render local stream
    //localVideo.muted = true;
    localVideo.srcObject = localStream;
    //localVideo.playsInline = true;
    //await localVideo.play().catch(console.error);

    // Set Peer Options
    // あとで実装

    mediaConnection = peer.call(remotePeerId, localStream,{
      videoReceiveEnabled: false,
    });
    
    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    gDMOFFTrigger.style.display = "none";
    gDMONTrigger.style.display = "inline-block";

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));

  });


  peer.once('open', id => (localId.textContent = id));

  peer.on('error', console.error);
})();
