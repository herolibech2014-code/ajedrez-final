
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RotateCcw, Sparkles } from 'lucide-react';

/**
* CONFIGURACIÓN DE TU CUENTA DE ADSENSE
*/
const ADSENSE_PUB_ID = "pub-3760080444114245";

const GoogleAd = ({ slot, format = "auto", style = {} }) => {
  const adRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!adRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && !pushedRef.current) {
          setIsReady(true);
        }
      }
    });
    observer.observe(adRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isReady && !pushedRef.current) {
      const timer = setTimeout(() => {
        try {
          if (typeof window !== 'undefined' && window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushedRef.current = true;
          }
        } catch (e) {
          console.error("AdSense Error:", e);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  return (
    <div ref={adRef} className="my-4 w-full flex flex-col items-center bg-slate-900/40 rounded-xl border border-slate-800 p-2 min-h-[100px]">
      <span className="text-[9px] text-slate-600 uppercase mb-1 font-sans">Publicidad</span>
      {isReady && (
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', ...style }}
             data-ad-client={ADSENSE_PUB_ID}
             data-ad-slot={slot}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>
      )}
    </div>
  );
};

export default function App() {
  const [chess, setChess] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [fen, setFen] = useState("start");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameStatus, setGameStatus] = useState('Listo para jugar');

  useEffect(() => {
    const chessScript = document.createElement('script');
    chessScript.src = "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js";
    chessScript.async = true;
    chessScript.onload = () => {
      setChess(new window.Chess());
      setLoaded(true);
    };
    document.head.appendChild(chessScript);

    const adsenseScript = document.createElement('script');
    adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
    adsenseScript.async = true;
    adsenseScript.crossOrigin = "anonymous";
    document.head.appendChild(adsenseScript);
  }, []);

  const updateGameState = useCallback(() => {
    if (!chess) return;
    setFen(chess.fen());
   
    let status = "Jugando";
    if (chess.in_checkmate()) status = "¡Jaque Mate!";
    else if (chess.in_draw()) status = "Tablas";
    else if (chess.in_check()) status = "¡Jaque!";
    else status = chess.turn() === 'w' ? "Turno Blancas" : "Turno Negras";
   
    setGameStatus(status);

    if (chess.turn() === 'b' && !chess.game_over()) {
      setTimeout(() => {
        const moves = chess.moves();
        if (moves.length > 0) {
          const move = moves[Math.floor(Math.random() * moves.length)];
          chess.move(move);
          updateGameState();
        }
      }, 600);
    }
  }, [chess]);

  const onSquareClick = (square) => {
    if (!chess || chess.game_over()) return;

    if (selectedSquare) {
      const move = chess.move({
        from: selectedSquare,
        to: square,
        promotion: 'q'
      });

      if (move) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        updateGameState();
        return;
      }
    }

    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setPossibleMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const renderBoard = () => {
    if (!loaded || !chess) return null;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const board = [];
   
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const squareId = `${files[f]}${ranks[r]}`;
        const piece = chess.get(squareId);
        const isDark = (r + f) % 2 === 1;
       
        board.push(
          <div
            key={squareId}
            onClick={() => onSquareClick(squareId)}
            className={`flex items-center justify-center relative cursor-pointer ${isDark ? 'bg-slate-700' : 'bg-slate-300'} ${selectedSquare === squareId ? 'bg-yellow-400' : ''}`}
            style={{ width: '12.5%', height: '12.5%' }}
          >
            {possibleMoves.includes(squareId) && (
              <div className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-black/15 z-10" />
            )}
            {piece && (
              <span
                className={`text-3xl sm:text-4xl md:text-5xl select-none z-20 ${piece.color === 'w' ? 'text-white' : 'text-slate-950'}`}
                style={{
                  filter: piece.color === 'w' ? 'drop-shadow(0px 1.5px 1px rgba(0,0,0,0.9))' : 'none',
                  lineHeight: 1
                }}
              >
                {{p:'♟', n:'♞', b:'♝', r:'♜', q:'♛', k:'♚'}[piece.type]}
              </span>
            )}
          </div>
        );
      }
    }
    return board;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-2 sm:p-4 font-sans">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500 w-5 h-5" />
          <h1 className="font-bold uppercase tracking-tighter text-sm sm:text-base italic">Chess Master AI</h1>
        </div>
        <div className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-emerald-400 uppercase tracking-widest">
          {gameStatus}
        </div>
      </header>

      <div className="max-w-xl w-full mx-auto">
        <GoogleAd slot="1960438176" format="horizontal" />
      </div>

      <main className="max-w-6xl w-full mx-auto grid lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 flex justify-center w-full">
          <div className="w-full max-w-[95vw] sm:max-w-[480px] aspect-square bg-slate-800 border-[6px] border-slate-900 rounded shadow-2xl flex flex-wrap overflow-hidden relative">
            {renderBoard()}
          </div>
        </div>

        <div className="lg:col-span-5 w-full space-y-4">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-inner">
            <h2 className="text-purple-400 font-bold text-xs uppercase mb-4 flex items-center gap-2 tracking-widest">
              <Sparkles size={14}/> Panel de Control
            </h2>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Mueve tu Rey dos casillas para hacer el <span className="text-white font-bold italic">Enroque</span>.
            </p>
            <button
              onClick={() => { if(chess){chess.reset(); updateGameState();} }}
              className="w-full bg-slate-800 py-3 rounded-lg hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-all font-bold text-xs active:scale-95 text-white"
            >
              <RotateCcw size={14}/> REINICIAR PARTIDA
            </button>
          </div>
          <div className="w-full">
            <GoogleAd slot="1326013356" format="rectangle" />
          </div>
        </div>
      </main>

      <footer className="mt-auto py-4 text-center opacity-10 text-[7px] uppercase tracking-[0.6em]">
        Chess Engine & Ads Monetization
      </footer>
    </div>
  );
}



