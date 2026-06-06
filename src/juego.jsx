
import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// Este componente maneja tus anuncios de Google AdSense
const GoogleAd = ({ slot, format, estiloSimulado }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Error al cargar AdSense:", e);
    }
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center bg-slate-800 border-2 border-dashed border-slate-600 rounded p-2 ${estiloSimulado}`}>
      <span className="text-[10px] text-slate-400 font-bold mb-1">ESPACIO DE PUBLICIDAD (ADSENSE)</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-376080444114245"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default function AjedrezJuego() {
  const [game, setGame] = useState(new Chess());
  const [gameHistory, setGameHistory] = useState([]);
  const [status, setStatus] = useState('Tu turno. Movés las Blancas.');

  function makeAMove(move) {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setGameHistory(game.history());

        // Verificar el estado de la partida para avisar al usuario
        if (game.isCheckmate()) {
          setStatus('¡JAQUE MATE! Partida finalizada.');
        } else if (game.isDraw()) {
          setStatus('Empate (Tablas).');
        } else if (game.inCheck()) {
          setStatus('¡JAQUE! Cuidado con tu Rey.');
        }
        
        return result;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function makeRandomMove() {
    const possibleMoves = game.moves();
    if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) {
      if (game.isCheckmate()) setStatus('¡JAQUE MATE! Perdiste la partida.');
      return;
    }
    const randomIdx = Math.floor(Math.random() * possibleMoves.length);
    makeAMove(possibleMoves[randomIdx]);
    
    // Si la IA no te hizo jaque mate, vuelve a ser tu turno
    if (!game.isCheckmate() && !game.inCheck()) {
      setStatus('Tu turno. Movés las Blancas.');
    }
  }

  function onDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) return false;

    setStatus('La IA está pensando...');
    setTimeout(makeRandomMove, 600);
    return true;
  }

  function reiniciarPartida() {
    const nuevoJuego = new Chess();
    setGame(nuevoJuego);
    setGameHistory([]);
    setStatus('Partida reiniciada. Movés las Blancas.');
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between p-4">
      {/* TÍTULO DEL JUEGO ARRIBA */}
      <header className="text-center my-2">
        <h1 className="text-3xl font-extrabold text-emerald-400 tracking-wider">CHESS MASTER AI</h1>
        <p className="text-xs text-slate-400 mt-1">Desafía a la computadora en tiempo real</p>
      </header>

      {/* ANUNCIO HORIZONTAL SUPERIOR - Con tu número 1960438176 */}
      <div className="w-full max-w-[900px] mx-auto my-2">
        <GoogleAd slot="1960438176" format="horizontal" estiloSimulado="w-full h-[90px]" />
      </div>

      <main className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8 my-4">
        {/* TABLERO DE AJEDREZ */}
        <div className="w-full max-w-[460px] aspect-square bg-slate-800 p-2 rounded-lg shadow-2xl border border-slate-700">
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop}
            boardWidth={444}
            customDarkSquareStyle={{ backgroundColor: '#779556' }}
            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
          />
        </div>

        {/* PANEL DE CONTROL LATERAL */}
        <div className="w-full max-w-[350px] bg-slate-800 p-6 rounded-lg shadow-xl flex flex-col gap-4 border border-slate-700">
          <h2 className="text-xl font-bold border-b border-slate-700 pb-2 text-emerald-400">PANEL DE CONTROL</h2>
          
          {/* El cartel que avisa los turnos y el Jaque Mate */}
          <div className="text-sm font-semibold text-center text-white bg-slate-950 p-4 rounded border border-emerald-600 shadow-inner">
            {status}
          </div>
          
          <button 
            onClick={reiniciarPartida}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded transition-colors shadow-md text-sm tracking-wide"
          >
            REINICIAR PARTIDA
          </button>

          <div className="mt-2">
            <h3 className="text-xs font-semibold text-slate-400 mb-1">Historial de jugadas:</h3>
            <div className="bg-slate-950 p-2 rounded h-20 overflow-y-auto text-xs font-mono text-slate-400 border border-slate-700">
              {gameHistory.length === 0 ? 'Sin movimientos aún' : gameHistory.join(', ')}
            </div>
          </div>

          {/* ANUNCIO CUADRADO LATERAL - Con tu número 1326013356 */}
          <div className="mt-2 pt-2 border-t border-slate-700">
            <GoogleAd slot="1326013356" format="rectangle" estiloSimulado="w-full h-[200px]" />
          </div>
        </div>
      </main>

      <footer className="text-center py-2 text-[11px] text-slate-500 border-t border-slate-800">
        CHESS ENGINE & ADS MONETIZATION
      </footer>
    </div>
  );
}