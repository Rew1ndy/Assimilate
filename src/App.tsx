import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Main from './components/Main/Main'
import Header from './components/Navigation/Header'
import Footer from './components/Navigation/Footer'

function App() {
  return (
    <BrowserRouter>
      <div className="wrapper">
        <Header />
        <Routes>
          <Route index path='/' element={<Main />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
