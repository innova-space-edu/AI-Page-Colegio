import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MathBuilder from './pages/MathBuilder';
import MathTest from './pages/MathTest';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/matematicas" element={<MathBuilder />} />
        <Route path="/matematicas/test/:id" element={<MathTest />} />
      </Routes>
    </BrowserRouter>
  );
}