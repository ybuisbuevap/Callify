import React, { useEffect, useRef, useState } from "react";
import { Canvas, PencilBrush, util } from "fabric";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";

const COLORS = ["#f0f0f4", "#4f8ef7", "#f75555", "#4fcf8e", "#f7c355", "#c084fc"];
const SIZES = [2, 5, 10, 18];

const Whiteboard = ({ socket, roomId, show, onClose, inline = false }) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const isReceiving = useRef(false);
    const historyRef = useRef([]);
    const redoRef = useRef([]);
    const isSavingHistory = useRef(false);

    const [color, setColor] = useState("#f0f0f4");
    const [size, setSize] = useState(5);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const saveSnapshot = () => {
        if (!fabricRef.current || isSavingHistory.current) return;
        const json = JSON.stringify(fabricRef.current.toJSON());
        historyRef.current.push(json);
        redoRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
    };

    const restoreSnapshot = (json) => {
        return new Promise((resolve) => {
            if (!fabricRef.current) return resolve();
            isSavingHistory.current = true;
            const canvas = fabricRef.current;
            const parsed = JSON.parse(json);
            canvas.clear();
            canvas.backgroundColor = parsed.background || "#1c1c21";
            if (!parsed.objects || parsed.objects.length === 0) {
                canvas.renderAll();
                isSavingHistory.current = false;
                return resolve();
            }
            util.enlivenObjects(parsed.objects).then((objects) => {
                objects.forEach(obj => canvas.add(obj));
                canvas.renderAll();
                isSavingHistory.current = false;
                resolve();
            }).catch((e) => {
                console.log("restore error:", e);
                isSavingHistory.current = false;
                resolve();
            });
        });
    };

    // ── Init canvas ONCE ─────────────────────────────────────────
    useEffect(() => {
        if (!canvasRef.current) return;
        if (fabricRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            isDrawingMode: true,
            backgroundColor: "#1c1c21",
            width: window.innerWidth,
            height: window.innerHeight - 80,
        });

        const brush = new PencilBrush(canvas);
        brush.color = "#f0f0f4";
        brush.width = 5;
        canvas.freeDrawingBrush = brush;
        fabricRef.current = canvas;

        canvas.on("mouse:down", () => {
            if (isReceiving.current || isSavingHistory.current) return;
            saveSnapshot();
        });

        canvas.on("path:created", (opt) => {
            if (isReceiving.current) return;
            const pathData = opt.path.toObject();
            socket.emit("whiteboard-draw", { roomId, path: pathData });
            // ← save full state to server
            const json = JSON.stringify(fabricRef.current.toJSON());
            socket.emit("whiteboard-save", { roomId, json });
        });

        const handleDraw = async (data) => {
            if (!fabricRef.current) return;
            isReceiving.current = true;
            try {
                const objects = await util.enlivenObjects([data.path]);
                objects.forEach(obj => fabricRef.current.add(obj));
                fabricRef.current.renderAll();
            } catch (e) { console.log("draw error:", e); }
            isReceiving.current = false;
        };

        const handleSync = async (data) => {
            if (!fabricRef.current) return;
            isReceiving.current = true;
            try {
                const parsed = JSON.parse(data.json);
                fabricRef.current.clear();
                fabricRef.current.backgroundColor = parsed.background || "#1c1c21";
                if (parsed.objects && parsed.objects.length > 0) {
                    const objects = await util.enlivenObjects(parsed.objects);
                    objects.forEach(obj => fabricRef.current.add(obj));
                }
                fabricRef.current.renderAll();
            } catch (e) { console.log("sync error:", e); }
            isReceiving.current = false;
        };

        const handleClear = () => {
            if (!fabricRef.current) return;
            isReceiving.current = true;
            fabricRef.current.clear();
            fabricRef.current.backgroundColor = "#1c1c21";
            fabricRef.current.renderAll();
            isReceiving.current = false;
            historyRef.current = [];
            redoRef.current = [];
            setCanUndo(false);
            setCanRedo(false);
        };

        socket.on("whiteboard-draw", handleDraw);
        socket.on("whiteboard-sync", handleSync);
        socket.on("whiteboard-clear", handleClear);

        return () => {
            socket.off("whiteboard-draw", handleDraw);
            socket.off("whiteboard-sync", handleSync);
            socket.off("whiteboard-clear", handleClear);
            canvas.dispose();
            fabricRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, roomId]);

    useEffect(() => {
        if (!fabricRef.current?.freeDrawingBrush) return;
        fabricRef.current.freeDrawingBrush.color = color;
    }, [color]);

    useEffect(() => {
        if (!fabricRef.current?.freeDrawingBrush) return;
        fabricRef.current.freeDrawingBrush.width = size;
    }, [size]);

    const emitSync = () => {
        if (!fabricRef.current || !socket) return;
        const json = JSON.stringify(fabricRef.current.toJSON());
        socket.emit("whiteboard-sync", { roomId, json });
    };

    const handleUndo = async () => {
        const canvas = fabricRef.current;
        if (!canvas || historyRef.current.length === 0) return;
        redoRef.current.push(JSON.stringify(canvas.toJSON()));
        const prev = historyRef.current.pop();
        await restoreSnapshot(prev);
        emitSync();
        setCanUndo(historyRef.current.length > 0);
        setCanRedo(true);
    };

    const handleRedo = async () => {
        const canvas = fabricRef.current;
        if (!canvas || redoRef.current.length === 0) return;
        historyRef.current.push(JSON.stringify(canvas.toJSON()));
        const next = redoRef.current.pop();
        await restoreSnapshot(next);
        emitSync();
        setCanUndo(true);
        setCanRedo(redoRef.current.length > 0);
    };

    const handleClear = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        historyRef.current.push(JSON.stringify(canvas.toJSON()));
        redoRef.current = [];
        canvas.clear();
        canvas.backgroundColor = "#1c1c21";
        canvas.renderAll();
        setCanUndo(true);
        setCanRedo(false);
        socket.emit("whiteboard-clear", { roomId });
    };

    // if (!show) return null;
    return (
        // inline=true → fits inside parent container (no fullscreen overlay)
        // inline=false → covers full screen (old behavior, not used anymore)
        <div style={{
            position: "relative",
            top: 0, left: 0,
            width: "100%",
            height: "100%",
            flex : 1,
            background: "#0e0e11",
            zIndex: 1,
            display: show ? "flex" : "none",
            flexDirection: "column",
            borderRadius: inline ? "10px" : 0,
            overflow: "hidden",
        }}>
            {/* Toolbar */}
            <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.55rem 1rem",
                background: "#0e0e11",
                borderBottom: "1px solid #2a2a30",
                flexWrap: "wrap", flexShrink: 0,
            }}>
                <span style={{
                    fontSize: "0.82rem", fontWeight: 600, color: "#f0f0f4",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", marginRight: "0.3rem",
                }}>
                    Whiteboard
                </span>

                {/* Colors */}
                <div style={{ display: "flex", gap: "0.3rem" }}>
                    {COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)} style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            background: c, border: "none", cursor: "pointer", flexShrink: 0,
                            outline: color === c ? "2px solid #fff" : "none", outlineOffset: "2px",
                        }} />
                    ))}
                </div>

                <div style={{ width: "1px", height: "24px", background: "#2a2a30" }} />

                {/* Sizes */}
                <div style={{ display: "flex", gap: "0.3rem" }}>
                    {SIZES.map(s => (
                        <button key={s} onClick={() => setSize(s)} style={{
                            width: "32px", height: "32px", borderRadius: "7px",
                            background: size === s ? "rgba(79,142,247,0.15)" : "#1c1c21",
                            border: size === s ? "1px solid rgba(79,142,247,0.4)" : "1px solid #2a2a30",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <div style={{
                                width: `${Math.min(s * 1.2, 14)}px`,
                                height: `${Math.min(s * 1.2, 14)}px`,
                                borderRadius: "50%", background: "#f0f0f4",
                            }} />
                        </button>
                    ))}
                </div>

                <div style={{ width: "1px", height: "24px", background: "#2a2a30" }} />

                {/* Undo */}
                <button onClick={handleUndo} disabled={!canUndo} style={{
                    width: "32px", height: "32px", borderRadius: "7px",
                    background: "#1c1c21", border: "1px solid #2a2a30",
                    color: canUndo ? "#f0f0f4" : "#55555f",
                    cursor: canUndo ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <UndoIcon style={{ fontSize: "1rem" }} />
                </button>

                {/* Redo */}
                <button onClick={handleRedo} disabled={!canRedo} style={{
                    width: "32px", height: "32px", borderRadius: "7px",
                    background: "#1c1c21", border: "1px solid #2a2a30",
                    color: canRedo ? "#f0f0f4" : "#55555f",
                    cursor: canRedo ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <RedoIcon style={{ fontSize: "1rem" }} />
                </button>

                <div style={{ width: "1px", height: "24px", background: "#2a2a30" }} />

                {/* Clear */}
                <button onClick={handleClear} style={{
                    padding: "0.35rem 0.8rem", borderRadius: "7px",
                    background: "rgba(247,85,85,0.1)",
                    border: "1px solid rgba(247,85,85,0.25)",
                    color: "#f75555", fontSize: "0.78rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                    Clear
                </button>

                {/* Close */}
                <button onClick={onClose} style={{
                    marginLeft: "auto",
                    padding: "0.35rem 0.8rem", borderRadius: "7px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #2a2a30",
                    color: "#9090a0", fontSize: "0.78rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                    Close
                </button>
            </div>

            {/* Canvas */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default Whiteboard;