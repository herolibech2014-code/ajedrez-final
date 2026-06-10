
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
  
  // Estado para guardar las casillas que se deben iluminar con la sugerencia
  const [casillasSugeridas, setCasillasSugeridas] = useState({});

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

  // Sistema de puntuación de piezas
  function evaluarPieza(tipo) {
    if (tipo === 'p') return 10;
    if (tipo === 'n' || tipo === 'b') return 30;
    if (tipo === 'r') return 50;
    if (tipo === 'q') return 90;
    if (tipo === 'k') return 900;
    return 0;
  }

  // Inteligencia de la IA para elegir su jugada
  function calcularMejorMovimiento() {
    const movimientosPosibles = game.moves({ verbose: true });
    if (movimientosPosibles.length === 0) return null;

    if (dificultad === 'principiante') {
      const randomIdx = Math.floor(Math.random() * movimientosPosibles.length);
      return movimientosPosibles[randomIdx].san;
    }

    if (dificultad === 'intermedio') {
      let mejorCaptura = null;
      let maxValor = -1;
      for (let mov of movimientosPosibles) {
        if (mov.captured) {
          let valor = evaluarPieza(mov.captured);
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

    // Avanzado
    let mejorMovimientoAvanzado = movimientosPosibles[0].san;
    let mejorPuntaje = -10000;
    for (let mov of movimientosPosibles) {
      game.move(mov.san);
      let puntajeTablero = 0;
      if (game.isCheckmate()) puntajeTablero += 5000;
      if (game.inCheck()) puntajeTablero += 15;
      if (mov.captured) puntajeTablero += evaluarPieza(mov.captured) * 2;
      game.undo();
      if (puntajeTablero > mejorPuntaje) {
        mejorPuntaje = puntajeTablero;
        mejorMovimientoAvanzado = mov.san;
      }
    }
    return mejorMovimientoAvanzado;
  }

  // Función para que el jugador pida una pista para las Blancas
  function pedirSugerencia() {
    if (game.isGameOver() || game.isDraw() || game.turn() !== 'w') return;

    const movimientosBlancas = game.moves({ verbose: true });
    if (movimientosBlancas.length === 0) return;

    // Busca el mejor movimiento para las blancas usando lógica avanzada
    let mejorMov = movimientosBlancas[0];
    let mejorPuntaje = -10000;

    for (let mov of movimientosBlancas) {
      game.move(mov.san);
      let puntaje = 0;
      if (game.isCheckmate()) puntaje += 5000;
      if (game.inCheck()) puntaje += 15;
      if (mov.captured) puntaje += evaluarPieza(mov.captured) * 2;
      game.undo();

      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorMov = mov;
      }
    }

    // Ilumina la casilla de origen y destino en amarillo semitransparente
    setCasillasSugeridas({
      [mejorMov.from]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
      [mejorMov.to]: { backgroundColor: 'rgba(255, 255, 0, 0.6)' }
    });

    setStatus(`Sugerencia: Podés mover de ${mejorMov.from.toUpperCase()} hacia ${mejorMov.to.toUpperCase()}.`);
  }

  function makeAMove(move) {
    try {
      const result = game.move(move);
      if (result) {
        const newGame = new Chess(game.fen());
        setGame(newGame);
        setGameHistory(newGame.history());
        setCasillasSugeridas({}); // Borra la sugerencia vieja cuando movés
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
    setCasillasSugeridas({});
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
        {/* TABLERO DE AJEDREZ */}
        <div className="w-full max-w-[460px] px-2">
          <div className="w-full aspect-square bg-slate-800 p-2 rounded-lg shadow-2xl border border-slate-700">
            <Chessboard 
              position={game.fen()} 
              onPieceDrop={onDrop}
              customDarkSquareStyle={{ backgroundColor: '#779556' }}
              customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
              customSquareStyles={casillasSugeridas} // Aplica los colores de la pista
            />
          </div>
        </div>

        {/* PANEL DE CONTROL LATERAL */}
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

          {/* El cartel que avisa los turnos y los resultados */}
          <div className="text-sm font-semibold text-center text-white bg-slate-950 p-4 rounded border border-emerald-600 shadow-inner">
            {status}
          </div>

          {/* BOTÓN DE SUGERENCIA DE JUGADA */}
          <button
            onClick={pedirSugerencia}
            disabled={game.isGameOver() || game.isDraw() || game.turn() !== 'w'}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold py-2 px-4 rounded text-xs transition-colors shadow-md tracking-wide"
          >
            💡 PEDIR SUGERENCIA
          </button>
          
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

          {/* BOTÓN PARA ABRIR LA GUÍA DE AYUDA */}
          <button
            onClick={() => setMostrarAyuda(!mostrarAyuda)}
            className="w-full border border-slate-600 hover:border-slate-500 bg-slate-900 text-slate-300 hover:text-white font-semibold py-2 px-4 rounded text-xs transition-colors"
          >
            {mostrarAyuda ? 'OCULTAR CÓMO SE JUEGA ▲' : '¿CÓMO SE MUEVEN LAS FICHAS? ▼'}
          </button>

          {/* ANUNCIO CUADRADO LATERAL - Tu número 1326013356 */}
          <div className="mt-1 pt-2 border-t border-slate-700">
            <GoogleAd slot="1326013356" format="rectangle" estiloSimulado="w-full h-[200px]" />
          </div>
        </div>
      </main>

      {/* SECCIÓN DESPLEGABLE: GUÍA DE MOVIMIENTOS */}
      {mostrarAyuda && (
        <section className="w-full max-w-[850px] mx-auto my-4 bg-slate-950 p-6 rounded-lg border border-slate-700 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-xl">
          <h2 className="text-lg font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">Guía Rápida: Cómo Jugar al Ajedrez</h2>
          
          <div className="mb-4">
            <h3 className="font-bold text-white mb-1">🎯 El Fin del Juego: El Jaque Mate</h3>
            <p>
              El objetivo principal del ajedrez es atrapar al Rey del oponente. Cuando un jugador realiza un movimiento que amenaza directamente al Rey enemigo y este **no tiene forma de escapar, bloquear el ataque ni capturar la pieza agresora**, se produce el <strong>Jaque Mate</strong>. En ese instante la partida termina y quien logró acorralar al Rey se consagra ganador.
            </p>
          </div>

          <h3 className="font-bold text-white mb-2">♟️ ¿Cómo se mueve cada ficha?</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-disc pl-4 text-slate-400">
            <li><strong className="text-slate-200">Peón:</strong> Avanza una casilla hacia adelante (o dos en su primer movimiento). Come en diagonal. Si llega al final del tablero, se transforma en otra pieza.</li>
            <li><strong className="text-slate-200">Torre:</strong> Se mueve en línea recta todas las casillas que quiera, tanto de forma horizontal (filas) como vertical (columnas).</li>
            <li><strong className="text-slate-200">Caballo:</strong> Se mueve haciendo una forma de "L" (dos casillas en una dirección y luego una hacia el costado). Es la única pieza que puede saltar sobre otras.</li>
            <li><strong className="text-slate-200">Alfil:</strong> Se mueve de forma diagonal todas las casillas que quiera, respetando siempre el color de su casilla de origen.</li>
            <li><strong className="text-slate-200">Dama (Reina):</strong> Es la pieza más poderosa. Puede moverse todas las casillas que quiera en cualquier dirección: recto, de costado o en diagonal.</li>
            <li><strong className="text-slate-200">Rey:</strong> Es la pieza más importante pero débil. Puede moverse solo una casilla por turno en cualquier dirección (arriba, abajo, costados o diagonal).</li>
          </ul>
        </section>
      )}

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