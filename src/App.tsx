import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Main from './components/Main/Main'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index path='/' element={<Main />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
