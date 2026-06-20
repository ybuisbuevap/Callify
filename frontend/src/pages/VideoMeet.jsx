import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, Tooltip } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import GridViewIcon from '@mui/icons-material/GridView';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import server from '../environment';
import Whiteboard from "../components/Whiteboard";
import BrushIcon from '@mui/icons-material/Brush';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import PanToolIcon from '@mui/icons-material/PanTool';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

const server_url = server;
var connections = {};
const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
            urls: "turn:turn.cloudflare.com:3478?transport=udp",
            username: "free",
            credential: "free"
        },
        {
            urls: "turn:turn.cloudflare.com:3478?transport=tcp",
            username: "free",
            credential: "free"
        },
        {
            urls: "turns:turn.cloudflare.com:5349",
            username: "free",
            credential: "free"
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();
    let soloVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(false);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);
    const [activeSpeaker, setActiveSpeaker] = useState(null);
    const [layoutMode, setLayoutMode] = useState("manual");
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [screenSharer, setScreenSharer] = useState(null);
    const realVideos = videos;
    const alone = realVideos.length === 0;
    const cols = Math.ceil(Math.sqrt(realVideos.length || 1));
    const [globalView, setGlobalView] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const expectingScreenRef = useRef(null); // stores socketId of who is about to share screen
    
    const mainVideo =
        globalView === "screen"
            ? `screen-${screenSharer}`
            : activeSpeaker || (videos.length > 0 ? videos[0].socketId : null);
    const isMeSharing = globalView === "screen" && screenSharer === socketIdRef.current;        
    const [usernamesMap, setUsernamesMap] = useState({}); // socketId to username map
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [showReactions, setShowReactions] = useState(false);
    const [raisedHands, setRaisedHands] = useState({}); // socketId -> true/false
    const [myHandRaised, setMyHandRaised] = useState(false);
    const [socketReady, setSocketReady] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [copied, setCopied] = useState('');
    // read guest name synchronously
    const [username, setUsername] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('guest') || '';
    });

    useEffect(() => { getPermissions(); }, [])
    useEffect(() => {
        console.log("VIDEOS:", videos);
    }, [videos]);

    useEffect(() => {
        if (askForUsername) return;
        const interval = setInterval(() => {
            if (window.localStream) {
                if (localVideoref.current && !localVideoref.current.srcObject) {
                    localVideoref.current.srcObject = window.localStream;
                }
                if (soloVideoRef.current && !soloVideoRef.current.srcObject) {
                    soloVideoRef.current.srcObject = window.localStream;
                }
            }
        }, 500);
        return () => clearInterval(interval);
    }, [askForUsername]);

    // FIX: sync stream to soloVideoRef once lobby is dismissed
    useEffect(() => {
        if (!askForUsername && window.localStream) {
            if (soloVideoRef.current) {
                soloVideoRef.current.srcObject = window.localStream;
            }
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }
        }
    }, [askForUsername]);

    useEffect(() => {
        if (showWhiteboard) {
            setLayoutMode("speaker");
        }
    }, [showWhiteboard]);

    useEffect(() => {
        if (globalView === "screen" || globalView === "whiteboard") {
            setLayoutMode("speaker");
        }
    }, [globalView]);

    useEffect(() => {
        if (username) return; // already set from URL (guest)
        fetch(`${server}/api/v1/users/me`, {
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => { if (data.name) setUsername(data.name); })
        .catch(() => {});
    }, []);

    useEffect(() => {
        return () => {
            // cleanup on unmount
            Object.values(connections).forEach(peer => {
                if (peer) peer.close();
            });
            connections = {};
            if (socketRef.current) socketRef.current.disconnect();
            if (window.localStream) {
                window.localStream.getTracks().forEach(t => t.stop());
                window.localStream = null;
            }
        };
    }, []);

    useEffect(() => {
        videos.forEach(v => {
            if (v.stream) {
                const videoEl = document.querySelector(`[data-socketid="${v.socketId}"]`);
                if (videoEl && videoEl.srcObject !== v.stream) {
                    videoEl.srcObject = v.stream;
                }
            }
        });
    }, [videos]);

    useEffect(() => {
        console.log("syncing videos:", videos.length);
        videos.forEach(v => {
            if (v.stream) {
                const videoEl = document.querySelector(`[data-socketid="${v.socketId}"]`);
                console.log("found el:", videoEl, "stream:", v.stream);
                if (videoEl && videoEl.srcObject !== v.stream) {
                    videoEl.srcObject = v.stream;
                    console.log("SET srcObject for", v.socketId);
                }
            }
        });
    }, [videos]);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoAvailable(!!videoPermission);
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioAvailable(!!audioPermission);
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    if (!window.localStream) window.localStream = userMediaStream;
                    if (localVideoref.current) localVideoref.current.srcObject = userMediaStream;
                    if (soloVideoRef.current) soloVideoRef.current.srcObject = userMediaStream;
                }
            }
        } catch (error) { console.log(error); }
    };

    // useEffect(() => {
    //     if (video !== undefined && audio !== undefined) getUserMedia();
    // }, [video, audio]);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
        setTimeout(() => {
            if (window.localStream) {
                if (localVideoref.current) localVideoref.current.srcObject = window.localStream;
                if (soloVideoRef.current) soloVideoRef.current.srcObject = window.localStream;
            }
        }, 1000);
    }

    let getUserMediaSuccess = (stream) => {
        createAudioAnalyser(stream, socketIdRef.current);
    
        window.localStream = stream;
        if (localVideoref.current) localVideoref.current.srcObject = stream;
        if (soloVideoRef.current) soloVideoRef.current.srcObject = stream;

        stream.getTracks().forEach(track => track.onended = () => {
            setScreenStream(null);
            setVideo(false);
            setAudio(false);
            try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) { }
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence();
            if (localVideoref.current) localVideoref.current.srcObject = window.localStream;
            if (soloVideoRef.current) soloVideoRef.current.srcObject = window.localStream;
            
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess).catch(e => console.log(e))
        } else {
            try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) { }
        }
    }

    let getDisplayMediaSuccess = (stream) => {
        console.log("getDisplayMediaSuccess called, tracks:", stream.getTracks().map(t => t.label));
        console.log("connections:", Object.keys(connections));
        Object.values(connections).forEach((peer, i) => {
            console.log(`peer ${i} senders:`, peer.getSenders().map(s => s.track?.label + " " + s.track?.kind));
        });
        setScreenStream(stream);
        setScreen(true);
        setGlobalView("screen");
        setLayoutMode("auto");

        if (socketRef.current) {
            socketRef.current.emit("toggle-screen", {
                active: true,
                socketId: socketIdRef.current
            });
        }

        // Add screen tracks to all peers and renegotiate
        for (let id in connections) {
            const peer = connections[id];
            if (!peer) continue;

            // ✅ remove any existing screen senders first so addTrack works cleanly
            const cameraTrack = window.localStream.getVideoTracks()[0];

            const screenTrack = stream.getVideoTracks()[0];

            const sender = peer.getSenders().find(s => s.track?.kind === "video");

            if (sender && screenTrack) {
                sender.replaceTrack(screenTrack);
            }

            peer.createOffer().then(desc => {
                peer.setLocalDescription(desc).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ sdp: peer.localDescription }));
                }).catch(e => console.log(e));
            }).catch(e => console.log(e));
        }
        console.log("SCREEN STREAM SET, ID:", socketIdRef.current);

        stream.getVideoTracks().forEach(track => {
            track.onended = () => {
                setScreen(false);
                setGlobalView(null);
                setLayoutMode("manual");
                setScreenStream(null);

                if (socketRef.current) {
                    socketRef.current.emit("toggle-screen", {
                        active: false,
                        socketId: socketIdRef.current
                    });
                }

                // Restore camera
                if (!window.localStream) return;

                    const camStream = window.localStream;

                    // restore UI
                    if (localVideoref.current) localVideoref.current.srcObject = camStream;
                    if (soloVideoRef.current) soloVideoRef.current.srcObject = camStream;

                    for (let id in connections) {
                        const peer = connections[id];
                        if (!peer) continue;

                        // ❌ remove screen tracks
                        // peer.getSenders()
                        //     .filter(s => 
                        //         s.track?.label.toLowerCase().includes("screen") ||
                        //         s.track?.label.toLowerCase().includes("window") ||
                        //         s.track?.label.toLowerCase().includes("display")
                        //     )
                        //     .forEach(s => peer.removeTrack(s));

                        // ✅ replace video track instead of addTrack
                        const videoTrack = camStream.getVideoTracks()[0];

                        const sender = peer.getSenders().find(s => s.track?.kind === "video");

                        if (sender && videoTrack) {
                            sender.replaceTrack(videoTrack);
                        }

                        // renegotiate
                        peer.createOffer().then(desc => {
                            peer.setLocalDescription(desc).then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ sdp: peer.localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
            };
        });
    };

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (!connections[fromId]) return;
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then(desc => {
                            connections[fromId].setLocalDescription(desc).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { 
            secure: true,
            transports: ['websocket', 'polling']
        });
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit('join-call', window.location.pathname, username);
            setSocketReady(true);

            // ✅ moved inside connect so socket is guaranteed ready
            socketRef.current.on("toggle-screen", ({ active, socketId }) => {
                console.log("RECEIVED SCREEN TOGGLE:", active, "FROM:", socketId);
                if (active) {
                    expectingScreenRef.current = socketId; // set expecting screen share from this socketId
                    setGlobalView("screen");
                    setLayoutMode("auto");
                    setScreenSharer(socketId);
                } else {
                    expectingScreenRef.current = null; // clear expecting screen share
                    setGlobalView(null);
                    setScreenSharer(null);
                    setLayoutMode("manual");
                    setVideos(prev => prev.filter(v => v.socketId !== `screen-${socketId}`));
                }
            });

            socketRef.current.on("toggle-whiteboard", ({ active }) => {
                setShowWhiteboard(active);
                setGlobalView(active ? "whiteboard" : null);
                if (active) setLayoutMode("auto");
                else setLayoutMode("manual");
            });

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', id => {
                setVideos(v => v.filter(v => v.socketId !== id));
                if (connections[id]) connections[id].close();
                delete connections[id];
            });

            socketRef.current.on('user-joined', (id, clients, usernamesFromServer) => {
                if (usernamesFromServer) setUsernamesMap(usernamesFromServer); // update usernames map when a new user joins
                clients.forEach(socketListId => {
                    if (socketListId === socketIdRef.current) return;
                    if (connections[socketListId]) return;

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = event => {
                        if (event.candidate != null)
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }));
                    };

                    // ✅ ontrack uses socketListId correctly here inside forEach
                    connections[socketListId].ontrack = (event) => {
                        const stream = event.streams[0];
                        if (!stream) return;

                        const isScreen = expectingScreenRef.current === socketListId;
                        if (isScreen) expectingScreenRef.current = null;

                        const socketKey = isScreen ? `screen-${socketListId}` : socketListId;

                        setVideos(prev => {
                            // ✅ if this is a camera track but a screen entry already exists for this peer,
                            // and the camera entry already exists too — skip the update entirely
                            if (!isScreen) {
                                const screenExists = prev.find(v => v.socketId === `screen-${socketListId}`);
                                const cameraExists = prev.find(v => v.socketId === socketListId);
                                if (screenExists && cameraExists) return prev; // ignore spurious re-fire
                            }

                            const existing = prev.find(v => v.socketId === socketKey);
                            if (existing) {
                                return prev.map(v => v.socketId === socketKey ? { ...v, stream } : v);
                            }
                            return [...prev, { socketId: socketKey, stream, username: usernamesFromServer?.[socketListId] || usernamesMap?.[socketListId] }];
                        });
                    };

                    if (window.localStream) {
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        const conn = connections[id2];
                        try { conn.addStream(window.localStream); } catch (e) { }
                        conn.createOffer().then(desc => {
                            conn.setLocalDescription(desc).then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ sdp: conn.localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }
            });
            socketRef.current.on("reaction", ({ emoji, socketId, username: senderName }) => {
                const id = Date.now() + Math.random();
                const x = Math.random() * (window.innerWidth - 100) + 50;
                const y = window.innerHeight - 150;
                setFloatingReactions(prev => [...prev, { id, emoji, x, y, senderName }]);
                setTimeout(() => {
                    setFloatingReactions(prev => prev.filter(r => r.id !== id));
                }, 2500);
            });

            socketRef.current.on("raise-hand", ({ socketId, raised }) => {
                setRaisedHands(prev => ({ ...prev, [socketId]: raised }));
            });
        });
    };

    const createAudioAnalyser = (stream, socketId) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 512;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const detect = () => {
                analyser.getByteFrequencyData(dataArray);
                const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                if (volume > 25) setActiveSpeaker(socketId);
                requestAnimationFrame(detect);
            };
            detect();
        } catch (e) { console.log(e); }
    };

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start(); ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        return Object.assign(canvas.captureStream().getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = async () => {
        if (!window.localStream) return;

        const videoTrack = window.localStream.getVideoTracks()[0];

        // TURN OFF
        if (videoTrack && videoTrack.enabled) {
            videoTrack.enabled = false;
            setVideo(false);
            return;
        }
        
        if(videoTrack && !videoTrack.enabled){
            videoTrack.enabled = true;
            setVideo(true);
            return;
        }

        // TURN ON
        else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newTrack = stream.getVideoTracks()[0];

                // 🔥 replace track instead of removing
                const oldTrack = window.localStream.getVideoTracks()[0];

                if (oldTrack) {
                    window.localStream.removeTrack(oldTrack);
                }

                window.localStream.addTrack(newTrack);

                // update UI
                if (localVideoref.current) localVideoref.current.srcObject = window.localStream;
                if (soloVideoRef.current) soloVideoRef.current.srcObject = window.localStream;

                // 🔥 update peers
                Object.values(connections).forEach(peer => {
                    if (!peer || peer.connectionState !== "connected") return;

                    const sender = peer.getSenders().find(s => s.track?.kind === "video");

                    if (sender) {
                        sender.replaceTrack(newTrack);
                    }
                });

                setVideo(true);

            } catch (err) {
                console.log(err);
            }
        }

    };

    let handleAudio = () => {
        if (!window.localStream) return;
        const track = window.localStream.getAudioTracks()[0];
        if (track) { track.enabled = !track.enabled; setAudio(track.enabled); }
    }

    let handleScreen = () => {
    // STOP
        if (screenStream) {
            screenStream.getTracks().forEach(t => t.stop());
            return;
        }

        // START
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            .then(getDisplayMediaSuccess)
            .catch(e => console.log(e));
    };


    let handleEndCall = () => {
        try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) { }
        window.location.href = "/home";
    }



    const addMessage = (data, sender, socketIdSender) => {
        setMessages(prev => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages(prev => prev + 1);
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    }

    let connect = () => {
        if (!username.trim()) return;
        setAskForUsername(false);
        getMedia();
        // re-sync stream after short delay to ensure refs are mounted
        setTimeout(() => {
            if (window.localStream) {
                if (localVideoref.current) localVideoref.current.srcObject = window.localStream;
                if (soloVideoRef.current) soloVideoRef.current.srcObject = window.localStream;
            }
        }, 1000);
    }

    const ctrlBtn = (active, danger) => ({
        width: danger ? '52px' : '44px',
        height: danger ? '52px' : '44px',
        borderRadius: '10px',
        background: danger ? 'rgba(247,85,85,0.12)' : active ? 'rgba(255,140,0,0.12)' : '#141417',
        border: `1px solid ${danger ? 'rgba(247,85,85,0.25)' : active ? 'rgba(255,140,0,0.25)' : '#2a2a30'}`,
        color: danger ? '#f75555' : active ? '#ff8c00' : '#9090a0',
    });

    const iconSz = { fontSize: '1.3rem' };

    const barBtn = (active) => ({
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '4px',
        padding: '8px 16px',
        background: 'transparent',
        border: 'none',
        borderRadius: '10px',
        color: active ? '#ff8c00' : '#f0f0f4',
        cursor: 'pointer',
        transition: 'background 0.15s',
        minWidth: '64px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    });

    const barLabel = {
        fontSize: '0.7rem',
        fontWeight: 500,
        color: 'inherit',
        letterSpacing: '0.01em',
    };

    const barLeft = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.2rem',
        flex: 1,
        justifyContent: 'center',
    };

    const endBtn = {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '4px',
        padding: '8px 20px',
        background: '#f63a3a',
        border: 'none',
        borderRadius: '10px',
        color: 'white',
        cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        minWidth: '64px',
    };

    const pipStyle = {
        position: 'relative',
        // bottom: '88px',
        // right: showModal || showInfo ? '316px' : '16px',
        width: '180px',
        height: '110px',
        borderRadius: '10px',
        // objectFit: 'cover',
        // transform: 'scaleX(-1)',
        border: '1px solid #2a2a30',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 10,
        background: '#141417',
        transition: 'right 0.25s ease',
        overflow: 'hidden',
    };

    const videoAreaStyle = {
        position: 'absolute',
        top: 0, left: 0,
        right: showModal || showInfo ? '300px' : 0,
        bottom: '72px',
        padding: '10px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.25s ease',
    };

    const toggleWhiteboard = () => {
        const newState = !showWhiteboard;
        setShowWhiteboard(newState);

        setGlobalView(newState ? "whiteboard" : null);

        if(socketRef.current){
            socketRef.current.emit("toggle-whiteboard", {
                active: newState
            });
        }
    };

    const sendReaction = (emoji) => {
        if (!socketRef.current) return;
        socketRef.current.emit("reaction", { emoji, username });
        setShowReactions(false);
        // ← show reaction locally immediately
        const id = Date.now() + Math.random();
        const x = Math.random() * (window.innerWidth - 100) + 50;
        const y = window.innerHeight - 150;
        setFloatingReactions(prev => [...prev, { id, emoji, x, y, senderName: username }]);
        setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== id));
        }, 2500);
    };

    const toggleHandRaise = () => {
        const newState = !myHandRaised;
        setMyHandRaised(newState);
        if (socketRef.current) {
            socketRef.current.emit("raise-hand", {
                raised: newState,
                username,
                socketId: socketIdRef.current
            });
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(''), 2000);
    };

    return (
        <div>
            {askForUsername ? (

                /* ── LOBBY ── */
                <div style={{
                    width: '100vw', height: '100vh',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#0e0e11', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                    <div style={{
                        width: '100%', maxWidth: '400px',
                        background: '#141417', border: '1px solid #2a2a30',
                        borderRadius: '16px', padding: '2rem',
                        display: 'flex', flexDirection: 'column', gap: '1.2rem',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#f0f0f4', marginBottom: '0.3rem' }}>
                                Join meeting
                            </h2>
                            <p style={{ fontSize: '0.82rem', color: '#9090a0', margin: 0 }}>
                                Preview your camera before joining
                            </p>
                        </div>
                        <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#1c1c21', border: '1px solid #2a2a30', aspectRatio: '16/9' }}>
                            <video ref={localVideoref} autoPlay muted playsInline style={{
                                width: '100%', height: '100%', objectFit: 'contain',
                                transform: 'scaleX(-1)', WebkitTransform: 'scaleX(-1)', display: 'block',
                            }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {username ? (
                                <div style={{
                                    flex: 1, padding: '0.65rem 0.9rem',
                                    background: '#1c1c21', border: '1px solid #2a2a30',
                                    borderRadius: '8px', color: '#f0f0f4',
                                    fontSize: '0.88rem',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}>
                                    {username}
                                </div>
                            ) : (
                                <input
                                    style={{
                                        flex: 1, padding: '0.65rem 0.9rem',
                                        background: '#1c1c21', border: '1px solid #2a2a30',
                                        borderRadius: '8px', color: '#f0f0f4',
                                        fontSize: '0.88rem', outline: 'none',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    }}
                                    placeholder="Your name"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && connect()}
                                    autoFocus
                                />
                            )}
                            <button
                                style={{
                                    padding: '0.65rem 1.2rem', background: '#ff8c00',
                                    border: 'none', borderRadius: '8px', color: '#fff',
                                    fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap',
                                }}
                                onClick={connect}
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </div>

            ) : (

                /* ── MEETING ROOM ── */
                <div className={styles.meetVideoContainer}>
                    
                    {/* Chat panel */}
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>
                                <div className={styles.chattingDisplay}>
                                    {messages.length === 0
                                        ? <p>No messages yet</p>
                                        : messages.map((item, i) => (
                                            <div key={i}>
                                                <p style={{ fontWeight: 'bold' }}>{item.sender}</p>
                                                <p>{item.data}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className={styles.chattingArea}>
                                    <input
                                        className={styles.chatInput}
                                        placeholder="Message…"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button className={styles.chatSendBtn} onClick={sendMessage}>Send</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info panel */}
                    {showInfo && (
                        <div style={{
                            position: 'absolute', top: 0, right: 0,
                            bottom: '72px', width: '300px',
                            background: '#0e0e11', borderLeft: '1px solid #2a2a30',
                            zIndex: 15, display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{
                                padding: '1rem 1.2rem',
                                borderBottom: '1px solid #2a2a30',
                                fontSize: '0.85rem', fontWeight: '600', color: '#f0f0f4',
                            }}>
                                Meeting Info
                            </div>
                            <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Meeting code */}
                                <div style={{
                                    background: '#141417', border: '1px solid #2a2a30',
                                    borderRadius: '10px', padding: '1rem',
                                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                                }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: '600', color: '#9090a0', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Meeting Code
                                    </p>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f0f0f4', fontFamily: 'monospace', margin: 0, letterSpacing: '0.05em' }}>
                                        {window.location.pathname.replace('/', '')}
                                    </p>
                                    <button
                                        onClick={() => copyToClipboard(window.location.pathname.replace('/', ''), 'code')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.5rem 0.8rem', background: 'transparent',
                                            border: '1px solid #2a2a30', borderRadius: '7px',
                                            color: copied === 'code' ? '#4f8ef7' : '#9090a0',
                                            fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            alignSelf: 'flex-start',
                                        }}
                                    >
                                        {copied === 'code' ? <CheckIcon style={{ fontSize: '0.9rem' }} /> : <ContentCopyIcon style={{ fontSize: '0.9rem' }} />}
                                        {copied === 'code' ? 'Copied!' : 'Copy code'}
                                    </button>
                                </div>

                                {/* Invite link */}
                                <div style={{
                                    background: '#141417', border: '1px solid #2a2a30',
                                    borderRadius: '10px', padding: '1rem',
                                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                                }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: '600', color: '#9090a0', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Invite Link
                                    </p>
                                    <p style={{ fontSize: '0.78rem', color: '#55555f', margin: 0, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                        {window.location.href}
                                    </p>
                                    <button
                                        onClick={() => copyToClipboard(window.location.href, 'link')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.5rem 0.8rem', background: 'transparent',
                                            border: '1px solid #2a2a30', borderRadius: '7px',
                                            color: copied === 'link' ? '#4f8ef7' : '#9090a0',
                                            fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            alignSelf: 'flex-start',
                                        }}
                                    >
                                        {copied === 'link' ? <CheckIcon style={{ fontSize: '0.9rem' }} /> : <ContentCopyIcon style={{ fontSize: '0.9rem' }} />}
                                        {copied === 'link' ? 'Copied!' : 'Copy link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                    <div style={{ minWidth: '10px' }} />   
                    <div style={{...barLeft, flex: 'none' }}>
                            {!alone && (
                                <Tooltip title={layoutMode === "manual" ? "Switch to Auto" : "Switch to Manual"}>
                                    <button
                                        onClick={() => setLayoutMode(prev => prev === "manual" ? "auto" : "manual")}
                                        style={barBtn(layoutMode === "auto")}
                                    >
                                        {layoutMode === "manual" ? <RecordVoiceOverIcon style={iconSz} /> : <GridViewIcon style={iconSz} />}
                                        <span style={barLabel}>View</span>
                                    </button>
                                </Tooltip>
                            )}
                            <button onClick={handleAudio} style={barBtn(audio)}>
                                {audio ? <MicIcon style={iconSz} /> : <MicOffIcon style={{ ...iconSz, color: '#f75555' }} />}
                                <span style={barLabel}>Audio</span>
                            </button>
                            <button onClick={handleVideo} style={barBtn(video)}>
                                {video ? <VideocamIcon style={iconSz} /> : <VideocamOffIcon style={{ ...iconSz, color: '#f75555' }} />}
                                <span style={barLabel}>Video</span>
                            </button>
                            
                            <button onClick={handleScreen} style={barBtn(!!screenStream)}>
                                {screen ? <ScreenShareIcon style={iconSz} /> : <StopScreenShareIcon style={iconSz} />}
                                <span style={barLabel}>Share</span>
                            </button>
                            
                            <button onClick={toggleWhiteboard} 
                                style={barBtn(showWhiteboard)}>
                                <BrushIcon style={iconSz} />
                                <span style={barLabel}>Board</span>
                            </button>
                            {/* Hand raise */}
                            <button onClick={toggleHandRaise} style={barBtn(myHandRaised)}>
                                <PanToolIcon style={iconSz} />
                                <span style={barLabel}>{myHandRaised ? 'Lower' : 'Raise'}</span>
                            </button>

                            {/* Reactions */}
                            <div style={{ position: 'relative' }}>
                                <button onClick={() => setShowReactions(p => !p)} style={barBtn(showReactions)}>
                                    <AddReactionIcon style={iconSz} />
                                    <span style={barLabel}>React</span>
                                </button>
                                {showReactions && (
                                    <div style={{
                                        position: 'absolute', bottom: '60px', left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#1c1c21', border: '1px solid #2a2a30',
                                        borderRadius: '12px', padding: '8px 10px',
                                        display: 'flex', gap: '6px', zIndex: 50,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                    }}>
                                        {['👍','💛','🧡','❤️','😂','😮','👏','🎉','🔥'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => sendReaction(emoji)}
                                                style={{
                                                    background: 'transparent', border: 'none',
                                                    fontSize: '1.5rem', cursor: 'pointer',
                                                    borderRadius: '8px', padding: '4px 6px',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.target.style.background = '#2a2a30'}
                                                onMouseLeave={e => e.target.style.background = 'transparent'}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Badge badgeContent={newMessages} max={99} color="primary">
                                <button onClick={() => { setModal(!showModal); setNewMessages(0); }} style={barBtn(showModal)}>
                                    <ChatIcon style={iconSz} />
                                    <span style={barLabel}>Chat</span>
                                </button>
                            </Badge>
                        </div>

                        {/* End call — far right */}
                        <button onClick={handleEndCall} style={endBtn}>
                            <CallEndIcon style={{ fontSize: '1.4rem' }} />
                            <span style={barLabel}>End</span>
                        </button>

                        <button onClick={() => setShowInfo(p => !p)} style={{
                            ...barBtn(showInfo),
                            border: '1px solid #2a2a30',
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            right: '16px',
                            marginLeft: '16px',

                        }}>
                            <InfoIcon style={iconSz} />
                            <span style={barLabel}>Info</span>
                        </button>
                    </div>

                    {/* ── ALONE: your video fullscreen ── */}
                    {alone ? (
                        <>
                            {/* PiP when alone — always show your video */}
                            <video
                                ref={soloVideoRef}
                                autoPlay muted playsInline
                                style={{
                                    position: 'absolute',
                                    bottom: '88px',
                                    right: '16px',
                                    width: showWhiteboard ? '180px' : '100%',
                                    height: showWhiteboard ? '110px' : 'calc(100% - 72px)',
                                    top: showWhiteboard ? 'auto' : 0,
                                    left: showWhiteboard ? 'auto' : 0,
                                    objectFit: 'contain',
                                    transform: 'scaleX(-1)',
                                    background: '#141417',
                                    borderRadius: showWhiteboard ? '10px' : 0,
                                    border: showWhiteboard ? '1px solid #2a2a30' : 'none',
                                    boxShadow: showWhiteboard ? '0 4px 20px rgba(0,0,0,0.5)' : 'none',
                                    zIndex: 10,
                                    transition: 'all 0.25s ease',
                                }}
                            />
                            

                                <div style={{
                                    ...videoAreaStyle,
                                    display: showWhiteboard ? 'flex' : 'none',
                                }}>
                                    <Whiteboard
                                        socket={socketRef.current}
                                        roomId={window.location.pathname}
                                        show={showWhiteboard}
                                        inline={true}
                                        onClose={() => setShowWhiteboard(false)}
                                    />
                                </div>

                            
                        </>
                    ) : (
                        <>
                            {/* PiP — your video bottom right */}
                            <div style={{ ...pipStyle ,position: 'absolute' , padding: 0, bottom: '88px', right: showModal || showInfo ? '316px' : '16px', }}>
                                <video ref={localVideoref} autoPlay muted playsInline style={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    transform: 'scaleX(-1)',
                                }} />
                                {/* Your hand raise on PiP */}
                                {myHandRaised && (
                                    <div style={{
                                        position: 'absolute', top: '4px', right: '6px',
                                        fontSize: '1rem', background: 'rgba(0,0,0,0.55)',
                                        borderRadius: '4px', padding: '1px 5px',
                                    }}>
                                        ✋
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute', bottom: '4px', left: '6px',
                                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                                    borderRadius: '4px', padding: '1px 6px',
                                    fontSize: '0.68rem', fontWeight: '500', color: '#f0f0f4',
                                    // transform: 'scaleX(1)', 
                                }}>
                                    {username} (You)
                                </div>
                            </div>
                    
                            {/* Remote video area */}
                            <div style={videoAreaStyle}>
                                {layoutMode === "manual" ? (
                                    // ── MANUAL: equal grid ──
                                    <div style={{
                                        flex: 1, display: 'grid',
                                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                        gap: '8px', minHeight: 0,
                                    }}>
                                        {realVideos.map(v => (
                                            <div key={v.socketId} style={{
                                                borderRadius: '10px', overflow: 'hidden',
                                                background: '#141417', minHeight: 0,
                                                border: activeSpeaker === v.socketId ? '2px solid #ff8c00' : '1px solid #2a2a30',
                                                position: 'relative',
                                            }}>
                                                <video
                                                    data-socketid={v.socketId}
                                                    ref={ref => { if (ref && v.stream) ref.srcObject = v.stream; }}
                                                    autoPlay playsInline
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                                />
                                                {/* Name tag */}
                                                <div style={{
                                                    position: 'absolute', bottom: '8px', left: '8px',
                                                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                                                    borderRadius: '6px', padding: '2px 8px',
                                                    fontSize: '0.75rem', fontWeight: '500', color: '#f0f0f4',
                                                }}>
                                                    {v.username || v.socketId.slice(0, 6)}
                                                </div>
                                                {/* Hand raise indicator */}
                                                {raisedHands[v.socketId] && (
                                                    <div style={{
                                                        position: 'absolute', top: '6px', right: '6px',
                                                        fontSize: '1.2rem', background: 'rgba(0,0,0,0.55)',
                                                        borderRadius: '6px', padding: '2px 6px',
                                                    }}>
                                                        ✋
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // ── AUTO: speaker focus ──
                                    <>
                                        {/* Main area — whiteboard OR active speaker */}
                                        <div style={{
                                            flex: 1, minHeight: 0,
                                            borderRadius: '10px', overflow: 'hidden',
                                            background: '#141417', border: '1px solid #2a2a30',
                                            position: 'relative',
                                        }}>
                                            {/* Whiteboard — always mounted, hidden via display */}
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                display: globalView === "whiteboard" ? 'flex' : 'none',
                                            }}>
                                                <Whiteboard
                                                    socket={socketRef.current}
                                                    roomId={window.location.pathname}
                                                    show={globalView === "whiteboard"}
                                                    inline={true}
                                                    onClose={() => {
                                                        setShowWhiteboard(false);
                                                        setGlobalView(null);
                                                        if (socketRef.current) {
                                                            socketRef.current.emit("toggle-whiteboard", { active: false });
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* Screen share — you are sharing */}
                                            {isMeSharing && (
                                                <video
                                                    data-socketid={`screen-${socketIdRef.current}`}
                                                    ref={ref => {
                                                        if (ref && screenStream) {
                                                            ref.srcObject = screenStream;
                                                        }
                                                    }}
                                                    autoPlay
                                                    playsInline
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "contain",

                                                    }}
                                                />
                                            )}

                                            {/* Normal video / other user screen */}
                                            {!isMeSharing && globalView !== "whiteboard" && (
                                                videos
                                                    .filter(v => v.socketId === mainVideo)
                                                    .map(v => (
                                                        <video
                                                            key={v.socketId}
                                                            data-socketid={v.socketId}
                                                            ref={ref => {
                                                                if (ref && v.stream) ref.srcObject = v.stream;
                                                            }}
                                                            autoPlay
                                                            playsInline
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "contain",
                                                            }}
                                                        />
                                                    ))
                                            )}
                                        </div>
                    
                                        {/* Strip of other participants */}
                                        {videos.filter(v => v.socketId !== mainVideo && v.stream).length > 0 && (
                                            <div style={{
                                                display: 'flex', gap: '8px',
                                                paddingTop: '8px', flexShrink: 0, overflowX: 'auto',
                                            }}>
                                                {videos.filter(v => !v.socketId.startsWith("screen-") && (isMeSharing || v.socketId !== mainVideo)).map(v => (                                <div
                                                        
                                                    key={v.socketId}
                                                    onClick={() => setActiveSpeaker(v.socketId)}
                                                    style={{
                                                        width: '130px', height: '80px', flexShrink: 0,
                                                        borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                                                        background: '#141417', position: 'relative',
                                                        border: activeSpeaker === v.socketId ? '2px solid #ff8c00' : '1px solid #2a2a30',
                                                    }}
                                                >
                                                    <video
                                                        ref={ref => { if (ref && v.stream) ref.srcObject = v.stream; }}
                                                        autoPlay playsInline
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                                    />
                                                    {/* Name tag */}
                                                    <div style={{
                                                        position: 'absolute', bottom: '4px', left: '6px',
                                                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                                                        borderRadius: '4px', padding: '1px 6px',
                                                        fontSize: '0.68rem', fontWeight: '500', color: '#f0f0f4',
                                                    }}>
                                                        {v.username || v.socketId.slice(0, 6)}
                                                    </div>
                                                    {/* Hand raise indicator */}
                                                    {raisedHands[v.socketId] && (
                                                        <div style={{
                                                            position: 'absolute', top: '6px', right: '6px',
                                                            fontSize: '1.2rem', background: 'rgba(0,0,0,0.55)',
                                                            borderRadius: '6px', padding: '2px 6px',
                                                        }}>
                                                            ✋
                                                        </div>
                                                    )}
                                                </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Floating reactions */}
                                        
                                    </>
                                )}
                            </div>
                        </> 
                    )}
                    {floatingReactions.map(r => (
                        <div
                            key={r.id}
                            className="floating-reaction"
                            style={{ left: r.x, top: r.y }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <span>{r.emoji}</span>
                                <span style={{
                                    fontSize: '0.65rem', color: '#f0f0f4',
                                    background: 'rgba(0,0,0,0.5)', borderRadius: '4px',
                                    padding: '1px 5px', whiteSpace: 'nowrap',
                                }}>
                                    {r.senderName || 'Guest'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
