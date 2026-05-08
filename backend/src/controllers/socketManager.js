import { Server } from "socket.io"

let connections = {}
let messages = {}
let timeOnline = {}
let usernames = {} // ← store username per socket id
let whiteboardState = {} // ← store whiteboard state per room

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (path, username) => { // ← accept username
            if (connections[path] === undefined) connections[path] = []
            connections[path].push(socket.id)
            timeOnline[socket.id] = new Date();
            usernames[socket.id] = username || "Guest"; // ← store it

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path], usernames)
                // ↑ send usernames map to everyone
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    )
                }
            }
            // replay whiteboard state to new joiner
            if (whiteboardState[path]) {
                io.to(socket.id).emit("whiteboard-sync", { json: whiteboardState[path] });
            }
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) messages[matchingRoom] = []
                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)
                connections[matchingRoom].forEach(elem => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })

        socket.on("whiteboard-draw", (data) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found) {
                connections[matchingRoom].forEach(elem => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("whiteboard-draw", data);
                    }
                });
            }
        });

        socket.on("toggle-whiteboard", (data) => {
            const [room, found] = Object.entries(connections)
                .reduce(([r, f], [key, val]) => {
                    if (!f && val.includes(socket.id)) return [key, true];
                    return [r, f];
                }, ['', false]);

            if (found) {
                connections[room].forEach(id => {
                    io.to(id).emit("toggle-whiteboard", data);
                });
            }
        });

        socket.on("toggle-screen", (data) => {
            const [room, found] = Object.entries(connections)
                .reduce(([r, f], [key, val]) => {
                    if (!f && val.includes(socket.id)) return [key, true];
                    return [r, f];
                }, ['', false]);

            if (found) {
                connections[room].forEach(id => {
                    io.to(id).emit("toggle-screen", data);
                });
            }
        });

        socket.on("whiteboard-sync", (data) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found) {
                connections[matchingRoom].forEach(elem => {
                    if (elem !== socket.id) io.to(elem).emit("whiteboard-sync", data);
                });
            }
        });

        // socket.on("whiteboard-clear", (data) => {
        //     const [matchingRoom, found] = Object.entries(connections)
        //         .reduce(([room, isFound], [roomKey, roomValue]) => {
        //             if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
        //             return [room, isFound];
        //         }, ['', false]);

        //     if (found) {
        //         connections[matchingRoom].forEach(elem => {
        //             if (elem !== socket.id) {
        //                 io.to(elem).emit("whiteboard-clear");
        //             }
        //         });
        //     }
        // });

        socket.on("reaction", (data) => {
            const [room, found] = Object.entries(connections)
                .reduce(([r, f], [key, val]) => {
                    if (!f && val.includes(socket.id)) return [key, true];
                    return [r, f];
                }, ['', false]);

            if (found) {
                connections[room].forEach(id => {
                    io.to(id).emit("reaction", { ...data, socketId: socket.id });
                });
            }
        });

        socket.on("raise-hand", (data) => {
            const [room, found] = Object.entries(connections)
                .reduce(([r, f], [key, val]) => {
                    if (!f && val.includes(socket.id)) return [key, true];
                    return [r, f];
                }, ['', false]);

            if (found) {
                connections[room].forEach(id => {
                    io.to(id).emit("raise-hand", { ...data, socketId: socket.id });
                });
            }
        });

        socket.on("whiteboard-save", (data) => {
            const [room, found] = Object.entries(connections)
                .reduce(([r, f], [key, val]) => {
                    if (!f && val.includes(socket.id)) return [key, true];
                    return [r, f];
                }, ['', false]);

            if (found) whiteboardState[room] = data.json;
        });

        // also clear saved state when whiteboard is cleared
        socket.on("whiteboard-clear", (data) => {
            const [room, found] = Object.entries(connections)
                .reduce(([r, f], [key, val]) => {
                    if (!f && val.includes(socket.id)) return [key, true];
                    return [r, f];
                }, ['', false]);

            if (found) {
                whiteboardState[room] = null;
                connections[room].forEach(id => {
                    io.to(id).emit("whiteboard-clear", data);
                });
            }
        });

        socket.on("disconnect", () => {
            delete usernames[socket.id]; // ← clean up on disconnect
            var key
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }
                        var index = connections[key].indexOf(socket.id)
                        connections[key].splice(index, 1)
                        if (connections[key].length === 0) delete connections[key]
                    }
                }
            }
        })
    })

    return io;
}