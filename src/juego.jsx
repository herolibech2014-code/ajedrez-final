
import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// Este componente maneja tus anuncios de Google AdSense
const GoogleAd = ({ slot, format }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Error al cargar AdSense:", e);
    }
  }, []);

  return (
    <div className="flex justify-center my-4">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
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
      setStatus('Partida terminada.');
      return;
    }
    const randomIdx = Math.floor(Math.random() * possibleMoves.length);
    makeAMove(possibleMoves[randomIdx]);
    setStatus('Tu turno. Movés las Blancas.');
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
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between">
      {/* Anuncio Horizontal Superior */}
      <GoogleAd slot="1960438176" format="horizontal" />

      <main className="flex-grow flex flex-col md:flex-row items-center justify-center p-4 gap-8">
        {/* Contenedor del Tablero */}
        <div className="w-full max-w-[500px] aspect-square bg-slate-800 p-2 rounded-lg shadow-2xl">
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop}
            boardWidth={484}
            customDarkSquareStyle={{ backgroundColor: '#779556' }}
            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
          />
        </div>

        {/* Panel de Control Lateral */}
        <div className="w-full max-w-[350px] bg-slate-800 p-6 rounded-lg shadow-xl flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-slate-700 pb-2 text-emerald-400">PANEL DE CONTROL</h2>
          <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded border border-slate-700">{status}</p>
          
          <button 
            onClick={reiniciarPartida}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors shadow"
          >
            REINICIAR PARTIDA
          </button>

          <div className="mt-2">
            <h3 className="text-sm font-semibold text-slate-400 mb-1">Historial de jugadas:</h3>
            <div className="bg-slate-950 p-2 rounded h-24 overflow-y-auto text-xs font-mono text-slate-400 border border-slate-700">
              {gameHistory.length === 0 ? 'Sin movimientos' : gameHistory.join(', ')}
            </div>
          </div>

          {/* Anuncio Lateral dentro del Panel */}
          <div className="mt-4 border-t border-slate-700 pt-4">
            <p className="text-[10px] text-center text-slate-500 mb-1">PUBLICIDAD</p>
            <GoogleAd slot="1326013356" format="rectangle" />
          </div>
        </div>
      </main>

      <footer className="bg-slate-950 text-center py-2 text-xs text-slate-500 border-t border-slate-800">
        CHESS ENGINE & ADS MONETIZATION
      </footer>
    </div>
  );
}