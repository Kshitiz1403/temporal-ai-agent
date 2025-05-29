import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
