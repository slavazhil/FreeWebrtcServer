document.getElementById("publisherButton").addEventListener("click", () => {webrtc.publish()});
document.getElementById("subscriberButton").addEventListener("click", () => {webrtc.subscribe()});

const webrtc = {
    server: "https://freewebrtcserver.com",
    config: {iceServers: [{urls: "stun:stun.l.google.com:19302"}]},
};

webrtc.send = async function(request) {
    console.log("request: ", request)
    const responseJSON = await fetch(webrtc.server, {method: "POST", body: JSON.stringify(request)});
    const response = await responseJSON.json();
    console.log("response: ", response);
    return response;
}

webrtc.publish = async function() {
    let publisherID = document.getElementById("publisherID").value

    if (publisherID === "") {
        document.getElementById("publisherID").value = Date.now();
        publisherID = document.getElementById("publisherID").value
    }

    webrtc.pc1 = new RTCPeerConnection(webrtc.config);
    webrtc.addPeerconnectionListeners(webrtc.pc1, "publisher");
    webrtc.dc1 = webrtc.pc1.createDataChannel("publisherDatachannel");
    webrtc.addDatachannelListeners(webrtc.dc1, "publisher");
    const media = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    document.getElementById("publisherVideo").srcObject = media;
    webrtc.pc1.addTrack(media.getVideoTracks()[0]);
    webrtc.pc1.addTrack(media.getAudioTracks()[0]);
    webrtc.pc1.setLocalDescription(await webrtc.pc1.createOffer());
    webrtc.pc1.onicecandidate = async (ice) => {
        if (ice.candidate === null) {
            const response = await webrtc.send({action: "publish", publisherID: publisherID, "sdp": webrtc.pc1.localDescription})
            webrtc.pc1.setRemoteDescription(response.sdp);
        }
    };
}

webrtc.subscribe = async function() {
    let publisherID = document.getElementById("publisherID").value

    if (publisherID === "") {
        document.getElementById("publisherID").className = "redPlaceholder";
        return
    }

    webrtc.pc2 = new RTCPeerConnection(webrtc.config);
    webrtc.addPeerconnectionListeners(webrtc.pc2, "subscriber");
    webrtc.dc2 = webrtc.pc2.createDataChannel("subscriberDatachannel");
    webrtc.addDatachannelListeners(webrtc.dc2, "subscriber");
    webrtc.pc2.ontrack = (track) => {document.getElementById("subscriberVideo").srcObject = track.streams[0];};
    webrtc.pc2.addTransceiver("video");
    webrtc.pc2.addTransceiver("audio");
    webrtc.pc2.setLocalDescription(await webrtc.pc2.createOffer());
    webrtc.pc2.onicecandidate = async (ice) => {
        if (ice.candidate === null) {
            const response = await webrtc.send({action: "subscribe", publisherID: publisherID, "sdp": webrtc.pc2.localDescription})
            webrtc.pc2.setRemoteDescription(response.sdp);
        }
    };
}


webrtc.addPeerconnectionListeners = function (pc, publisherID) {
    pc.oniceconnectionstatechange = () => {
        console.log(publisherID, "oniceconnectionstatechange:", pc.iceConnectionState);
    }

    pc.onicegatheringstatechange = () => {
        console.log(publisherID, "onicegatheringstatechange:", pc.iceGatheringState);
    }

    pc.onnegotiationneeded = (event) => {
        console.log(publisherID, "onnegotiationneeded");
    }
}

webrtc.addDatachannelListeners = function(datachannel, publisherID) {
    datachannel.onopen = function(event) {
        console.log(publisherID, "datachannel state: open");
    }

    datachannel.onmessage = function(event) {
        console.log(publisherID, "datachannel message: ", event.data);
    }

    datachannel.onclose = function(event) {
        console.log(publisherID, "datachannel state: closed");
    }

    datachannel.onerror = function(error) {
        console.log(publisherID, "datachannel error");
    }
}