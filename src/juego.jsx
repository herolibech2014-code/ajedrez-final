
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

  function checkGameStatus(currentGame) {
    if (currentGame.isCheckmate()) {
      if (currentGame.turn() === 'b') {
        setStatus('¡JAQUE MATE! ¡Ganaste la partida! 🏆');
      } else {
        setStatus('¡JAQUE MATE! La IA ha ganado esta vez.');
      }
    } else if (currentGame.isDraw()) {
      setStatus('Empate (Tablas). Partida finalizada.');
    } else if (currentGame.inCheck()) {
      setStatus('¡JAQUE! Cuidado con tu Rey.');
    }
  }

  function makeAMove(move) {
    try {
      const result = game.move(move);
      if (result) {
        const newGame = new Chess(game.fen());
        setGame(newGame);
        setGameHistory(newGame.history());
        checkGameStatus(newGame);
        return result;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function makeRandomMove() {
    if (game.isGameOver() || game.isDraw()) return;

    const possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;

    const randomIdx = Math.floor(Math.random() * possibleMoves.length);
    game.move(possibleMoves[randomIdx]);
    
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setGameHistory(newGame.history());

    if (newGame.isGameOver() || newGame.isDraw()) {
      checkGameStatus(newGame);
    } else {
      setStatus('Tu turno. Movés las Blancas.');
    }
  }

  function onDrop(sourceSquare, targetSquare) {
    if (game.isGameOver() || game.isDraw()) return false;

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) return false;

    if (!game.isGameOver() && !game.isDraw()) {
      setStatus('La IA está pensando...');
      setTimeout(makeRandomMove, 600);
    }
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

      {/* ANUNCIO HORIZONTAL SUPERIOR - Tu número 1960438176 */}
      <div className="w-full max-w-[900px] mx-auto my-2">
        <GoogleAd slot="1960438176" format="horizontal" estiloSimulado="w-full h-[90px]" />
      </div>

      <main className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8 my-4 w-full max-w-[1000px] mx-auto">
        {/* TABLERO DE AJEDREZ - ¡Ahora 100% elástico para celular! */}
        <div className="w-full max-w-[460px] px-2">
          <div className="w-full aspect-square bg-slate-800 p-2 rounded-lg shadow-2xl border border-slate-700">
            <Chessboard 
              position={game.fen()} 
              onPieceDrop={onDrop}
              customDarkSquareStyle={{ backgroundColor: '#779556' }}
              customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
            />
          </div>
        </div>

        {/* PANEL DE CONTROL LATERAL */}
        <div className="w-full max-w-[350px] bg-slate-800 p-6 rounded-lg shadow-xl flex flex-col gap-4 border border-slate-700">
          <h2 className="text-xl font-bold border-b border-slate-700 pb-2 text-emerald-400">PANEL DE CONTROL</h2>
          
          {/* El cartel que avisa los turnos y los resultados */}
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

          {/* ANUNCIO CUADRADO LATERAL - Tu número 1326013356 */}
          <div className="mt-2 pt-2 border-t border-slate-700">
            <GoogleAd slot="1326013356" format="rectangle" estiloSimulado="w-full h-[200px]" />
          </div>
        </div>
      </main>

      {/* SECCIÓN DE TEXTO PARA SEO */}
      <section className="w-full max-w-[850px] mx-auto my-6 bg-slate-800/50 p-6 rounded-lg border border-slate-700/60 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-emerald-400 mb-3">¿Cómo jugar Ajedrez Online en Chess Master AI?</h2>
        <p className="mb-4">
          Bienvenido a <strong>Chess Master AI</strong>, el sitio ideal para <strong>jugar ajedrez online gratis</strong>. Nuestra inteligencia artificial está diseñada para adaptarse y responder en tiempo real, permitiéndote practicar tus mejores <strong>aperturas, estrategias y tácticas de ajedrez</strong> desde cualquier dispositivo (PC, tablet o celular) y de forma 100% directa, <strong>sin descargar aplicaciones</strong> ni registrarte.
        </p>
        <h3 className="font-semibold text-white mb-1">Consejos para ganarle a la Computadora:</h3>
        <p>
          Para vencer a nuestro motor de ajedrez, asegurate de controlar el centro del tablero desde los primeros movimientos, desarrollar tus caballos y alfiles rápidamente, y proteger a tu Rey mediante el enroque. Cada partida es una oportunidad excelente para entrenar tu mente, analizar tus errores en el historial de jugadas y perfeccionar tu nivel de juego. ¡Mové tus blancas y lográ el <strong>jaque mate</strong> definitivo!
        </p>
      </section>

      <footer className="text-center py-2 text-[11px] text-slate-500 border-t border-slate-800">
        CHESS ENGINE & ADS MONETIZATION
      </footer>
    </div>
  );
}