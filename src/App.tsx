import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Main from './components/Main/Main'
import Header from './components/Navigation/Header'
import Footer from './components/Navigation/Footer'
import { Home } from './components/Home/Home'
import { useCallback, useEffect, useRef, useState } from 'react'

function App() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({
    current: false,
    lastPose: 0,
    currentPose: 0,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const separator = wrapperRef.current;
    if (!separator) return;

    const onMouseDown = () => handleSeparatorDown();
    const onMouseMove = (e: MouseEvent) => handleSeparatorMove(e.clientX, e.clientY);
    const onMouseUp = () => handleSeparatorUp();

    const onTouchStart = (e: TouchEvent) => {
      handleSeparatorDown();
      mouseRef.current.lastPose = e.touches[0].clientX; // или clientY, если свайп вертикальный
    };
    const onTouchMove = (e: TouchEvent) => {
      handleSeparatorMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleSeparatorUp();

    separator.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    separator.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      separator.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      separator.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  
  const handleSeparatorMove = (x: number, y: number) => {
    if (!mouseRef.current.current) return;

    // если свайп слева направо — работаем по X
    if (x - mouseRef.current.lastPose > 40) {
      setIsMenuOpen(true);
    }

    if (x - mouseRef.current.lastPose < 10) {
      setIsMenuOpen(false);
    }

    mouseRef.current.lastPose = x;
  };


  const handleSeparatorDown = () => {
      mouseRef.current.current = true;
  };

  const handleSeparatorUp = () => {
      mouseRef.current.current = false;
  };

  return (
    <BrowserRouter>
      <div className="wrapper" ref={wrapperRef}>
        <Header isMenuOpen={isMenuOpen} />
        <Routes>
          {/* <Route index path='/' element={<Main />} /> */}
          <Route index path='/' element={<Home />} />
        </Routes>
        {/* <Footer /> */}
      </div>
    </BrowserRouter>
  )
}

export default App
