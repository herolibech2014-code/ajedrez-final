
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
  const [dificultad, setDificultad] = useState('principiante');
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

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

  // Valores estándar del ajedrez para que la IA sepa qué pieza vale más
  function obtenerValorPieza(pieza) {
    if (!pieza) return 0;
    const valores = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    return valores[pieza.type] || 0;
  }

  // Evalúa el valor total de las piezas de la IA (negras) menos las del usuario (blancas)
  function evaluarTableroCompleto(tablero) {
    let puntajeTotal = 0;
    tablero.forEach((fila) => {
      fila.forEach((casilla) => {
        if (casilla) {
          const valor = obtenerValorPieza(casilla);
          // Si es negra (IA) suma, si es blanca (usuario) resta
          puntajeTotal += casilla.color === 'b' ? valor : -valor;
        }
      });
    });
    return puntajeTotal;
  }

  // El cerebro de la IA para elegir su jugada
  function calcularMejorMovimiento() {
    const movimientosPosibles = game.moves({ verbose: true });
    if (movimientosPosibles.length === 0) return null;

    // 1. FÁCIL: Al azar
    if (dificultad === 'principiante') {
      const randomIdx = Math.floor(Math.random() * movimientosPosibles.length);
      return movimientosPosibles[randomIdx].san;
    }

    // 2. MEDIO: Captura si puede, si no, al azar
    if (dificultad === 'intermedio') {
      let mejorCaptura = null;
      let maxValor = -1;
      for (let mov of movimientosPosibles) {
        if (mov.captured) {
          const valor = obtenerValorPieza({ type: mov.captured });
          if (valor > maxValor) {
            maxValor = valor;
            mejorCaptura = mov.san;
          }
        }
      }
      if (mejorCaptura) return mejorCaptura;
      const randomIdx = Math.floor(Math.random() * movimientosPosibles.length);
      return movimientosPosibles[randomIdx].san;
    }

    // 3. DIFÍCIL (CORREGIDO): Busca la jugada que la deje en mejor posición general tras tu respuesta
    let mejorMovimientoAvanzado = movimientosPosibles[0].san;
    let peorPuntajeParaVos = -10000;

    for (let mov of movimientosPosibles) {
      game.move(mov.san); // La IA simula su jugada
      
      // Si con este movimiento la IA te hace jaque mate, lo elige de cabeza
      if (game.isCheckmate()) {
        game.undo();
        return mov.san;
      }

      // Ahora simula qué opciones tenés vos para responder
      const respuestasUsuario = game.moves({ verbose: true });
      let elMejorContraataqueTuyo = 10000; 

      if (respuestasUsuario.length === 0) {
        // Si no tenés movimientos, evalúa el tablero directo
        elMejorContraataqueTuyo = evaluarTableroCompleto(game.board());
      } else {
        // Busca cuál sería tu jugada más dañina para ella
        for (let rMov of respuestasUsuario) {
          game.move(rMov.san);
          const puntajeDespuesDeTuTurno = evaluarTableroCompleto(game.board());
          game.undo();
          if (puntajeDespuesDeTuTurno < elMejorContraataqueTuyo) {
            elMejorContraataqueTuyo = puntajeDespuesDeTuTurno;
          }
        }
      }

      game.undo(); // Deshace la simulación inicial

      // La IA va a elegir la jugada donde tu mejor contraataque le haga el menor daño posible
      if (elMejorContraataqueTuyo > peorPuntajeParaVos) {
        peorPuntajeParaVos = elMejorContraataqueTuyo;
        mejorMovimientoAvanzado = mov.san;
      }
    }
    return mejorMovimientoAvanzado;
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

  function makeIAMove() {
    if (game.isGameOver() || game.isDraw()) return;

    const mejorMov = calcularMejorMovimiento();
    if (!mejorMov) return;

    game.move(mejorMov);
    
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
      setTimeout(makeIAMove, 600);
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
      {/* TÍTULO DEL JUEGO */}
      <header className="text-center my-2">
        <h1 className="text-3xl font-extrabold text-emerald-400 tracking-wider">CHESS MASTER AI</h1>
        <p className="text-xs text-slate-400 mt-1">Desafía a la computadora en tiempo real</p>
      </header>

      {/* ANUNCIO HORIZONTAL */}
      <div className="w-full max-w-[900px] mx-auto my-2">
        <GoogleAd slot="1960438176" format="horizontal" estiloSimulado="w-full h-[90px]" />
      </div>

      <main className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8 my-4 w-full max-w-[1000px] mx-auto">
        {/* TABLERO */}
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

        {/* PANEL DE CONTROL */}
        <div className="w-full max-w-[350px] bg-slate-800 p-6 rounded-lg shadow-xl flex flex-col gap-4 border border-slate-700">
          <h2 className="text-xl font-bold border-b border-slate-700 pb-2 text-emerald-400">PANEL DE CONTROL</h2>
          
          {/* SELECCIÓN DE DIFICULTAD */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Dificultad de la IA:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded border border-slate-700">
              <button
                onClick={() => setDificultad('principiante')}
                className={`text-xs font-bold py-1.5 px-2 rounded transition-colors ${dificultad === 'principiante' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Fácil
              </button>
              <button
                onClick={() => setDificultad('intermedio')}
                className={`text-xs font-bold py-1.5 px-2 rounded transition-colors ${dificultad === 'intermedio' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Medio
              </button>
              <button
                onClick={() => setDificultad('avanzado')}
                className={`text-xs font-bold py-1.5 px-2 rounded transition-colors ${dificultad === 'avanzado' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Difícil
              </button>
            </div>
          </div>

          <div className="text-sm font-semibold text-center text-white bg-slate-950 p-4 rounded border border-emerald-600 shadow-inner">
            {status}
          </div>
          
          <button 
            onClick={reiniciarPartida}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded transition-colors shadow-md text-sm tracking-wide"
          >
            REINICIAR PARTIDA
          </button>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-1">Historial de jugadas:</h3>
            <div className="bg-slate-950 p-2 rounded h-16 overflow-y-auto text-xs font-mono text-slate-400 border border-slate-700">
              {gameHistory.length === 0 ? 'Sin movimientos aún' : gameHistory.join(', ')}
            </div>
          </div>

          <button
            onClick={() => setMostrarAyuda(!mostrarAyuda)}
            className="w-full border border-slate-600 hover:border-slate-500 bg-slate-900 text-slate-300 hover:text-white font-semibold py-2 px-4 rounded text-xs transition-colors"
          >
            {mostrarAyuda ? 'OCULTAR CÓMO SE JUEGA ▲' : '¿CÓMO SE MUEVEN LAS FICHAS? ▼'}
          </button>

          {/* ANUNCIO CUADRADO */}
          <div className="mt-1 pt-2 border-t border-slate-700">
            <GoogleAd slot="1326013356" format="rectangle" estiloSimulado="w-full h-[200px]" />
          </div>
        </div>
      </main>

      {/* GUÍA DE AYUDA */}
      {mostrarAyuda && (
        <section className="w-full max-w-[850px] mx-auto my-4 bg-slate-950 p-6 rounded-lg border border-slate-700 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-xl">
          <h2 className="text-lg font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">Guía Rápida: Cómo Jugar al Ajedrez</h2>
          <div className="mb-4">
            <h3 className="font-bold text-white mb-1">🎯 El Fin del Juego: El Jaque Mate</h3>
            <p>El objetivo principal del ajedrez es atrapar al Rey del oponente...</p>
          </div>
          <h3 className="font-bold text-white mb-2">♟️ ¿Cómo se mueve cada ficha?</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-disc pl-4 text-slate-400">
            <li><strong className="text-slate-200">Peón:</strong> Avanza una casilla...</li>
            <li><strong className="text-slate-200">Torre:</strong> Se mueve en línea recta...</li>
            <li><strong className="text-slate-200">Caballo:</strong> Se mueve en "L"...</li>
            <li><strong className="text-slate-200">Alfil:</strong> Se mueve en diagonal...</li>
            <li><strong className="text-slate-200">Dama:</strong> Se mueve en cualquier dirección...</li>
            <li><strong className="text-slate-200">Rey:</strong> Se mueve una casilla...</li>
          </ul>
        </section>
      )}

      {/* TEXTO SEO */}
      <section className="w-full max-w-[850px] mx-auto my-6 bg-slate-800/50 p-6 rounded-lg border border-slate-700/60 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-emerald-400 mb-3">¿Cómo jugar Ajedrez Online en Chess Master AI?</h2>
        <p className="mb-4">Bienvenido a Chess Master AI...</p>
      </section>

      <footer className="text-center py-2 text-[11px] text-slate-500 border-t border-slate-800">
        CHESS ENGINE & ADS MONETIZATION
      </footer>
    </div>
  );
}