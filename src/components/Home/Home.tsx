import './home.css'

export function Home() {
    

    return (
        <div className="home-wrapper">
            <div className="home-background">
                <video autoPlay muted loop playsInline className="background-video">
                    <source src="/imgs/background.webm" type="video/webm" />
                    {/* <source src="your-video.mp4" type="video/mp4" /> */}
                    {/* 
                    Текст НЕ внутри <video>, а комментарий.
                    Fallback-текст в <video> в React НЕ поддерживается напрямую.
                    */}
                </video>
            </div>
        </div>
    )
}