import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// Componente de anuncios de Google AdSense
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
        data-ad-client="ca-pub-3760080444114245"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default function AjedrezJuego() {
  const [pantalla, setPantalla] = useState('inicio'); // 'inicio', 'reglas', 'estrategias', 'contacto', o 'juego'
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

  function obtenerValorPieza(pieza) {
    if (!pieza) return 0;
    const valores = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    return valores[pieza.type] || 0;
  }

  function evaluarTableroCompleto(chessInstance) {
    let puntajeTotal = 0;
    const tablero = chessInstance.board();
    const bonificacionCentro = {
      d4: 4, e4: 4, d5: 4, e5: 4,
      c4: 2, f4: 2, c5: 2, f5: 2, c3: 2, d3: 2, e3: 2, f3: 2,
      c6: 2, d6: 2, e6: 2, f6: 2
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const casilla = tablero[r][c];
        if (casilla) {
          let valor = obtenerValorPieza(casilla);
          const nombreCasilla = String.fromCharCode(97 + c) + (8 - r);
          if ((casilla.type === 'p' || casilla.type === 'n') && bonificacionCentro[nombreCasilla]) {
            valor += bonificacionCentro[nombreCasilla];
          }
          puntajeTotal += casilla.color === 'b' ? valor : -valor;
        }
      }
    }
    return puntajeTotal;
  }

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

    let mejorMovimientoAvanzado = movimientosPosibles[0].san;
    let mejorResultadoParaIA = -10000;

    for (let mov of movimientosPosibles) {
      game.move(mov.san);
      if (game.isCheckmate()) {
        game.undo();
        return mov.san;
      }
      const respuestasUsuario = game.moves({ verbose: true });
      let elMejorContraataqueTuyo = 10000; 

      if (respuestasUsuario.length === 0) {
        elMejorContraataqueTuyo = evaluarTableroCompleto(game);
      } else {
        for (let rMov of respuestasUsuario) {
          game.move(rMov.san);
          const puntajeTablero = evaluarTableroCompleto(game);
          game.undo();
          if (puntajeTablero < elMejorContraataqueTuyo) {
            elMejorContraataqueTuyo = puntajeTablero;
          }
        }
      }
      game.undo();
      if (elMejorContraataqueTuyo > mejorResultadoParaIA) {
        mejorResultadoParaIA = elMejorContraataqueTuyo;
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

  // --- COMPONENTE DE NAVEGACIÓN COMÚN ---
  const MenuNavegacion = () => (
    <nav className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-wrap justify-center gap-4 my-4 max-w-[850px] mx-auto w-full">
      <button 
        onClick={() => setPantalla('inicio')} 
        className={`px-4 py-2 rounded font-bold text-xs sm:text-sm transition-colors ${pantalla === 'inicio' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
      >
        INICIO
      </button>
      <button 
        onClick={() => setPantalla('reglas')} 
        className={`px-4 py-2 rounded font-bold text-xs sm:text-sm transition-colors ${pantalla === 'reglas' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
      >
        ¿CÓMO JUGAR?
      </button>
      <button 
        onClick={() => setPantalla('estrategias')} 
        className={`px-4 py-2 rounded font-bold text-xs sm:text-sm transition-colors ${pantalla === 'estrategias' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
      >
        ESTRATEGIAS
      </button>
      <button 
        onClick={() => setPantalla('contacto')} 
        className={`px-4 py-2 rounded font-bold text-xs sm:text-sm transition-colors ${pantalla === 'contacto' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
      >
        CONTACTO
      </button>
    </nav>
  );

  // --- RENDERS DE PANTALLAS ---

  // PANTALLAS DEL PORTAL (Inicio, Reglas, Estrategias, Contacto)
  if (pantalla !== 'juego') {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between p-4 sm:p-6">
        <header className="text-center my-4">
          <h1 className="text-4xl font-black text-emerald-400 tracking-wider">CHESS MASTER AI</h1>
          <p className="text-sm text-slate-400 mt-2">Tu portal de ajedrez virtual libre, gratuito y en español</p>
        </header>

        {/* MENÚ DE NAVEGACIÓN PARA GOOGLE Y EL USUARIO */}
        <MenuNavegacion />

        {/* ANUNCIO 1: HORIZONTAL ARRIBA */}
        <div className="w-full max-w-[728px] mx-auto my-2">
          <GoogleAd slot="1960438176" format="horizontal" estiloSimulado="w-full h-[90px]" />
        </div>

        {/* SECCIÓN DINÁMICA SEGÚN LA PÁGINA SELECCIONADA */}
        <main className="flex-grow w-full max-w-[850px] mx-auto my-4">
          
          {pantalla === 'inicio' && (
            <div className="flex flex-col gap-6">
              <div className="text-center my-4 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl w-full">
                <h2 className="text-2xl font-bold text-white mb-4">¿Estás listo para el desafío de ajedrez?</h2>
                <p className="text-sm text-slate-300 mb-6">Enfrentá a nuestra inteligencia artificial adaptativa sin demoras y sin registros molestos.</p>
                <button
                  onClick={() => setPantalla('juego')}
                  className="w-full max-w-[320px] mx-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg py-4 px-6 rounded-lg transition-all transform active:scale-95 shadow-lg tracking-wide block"
                >
                  INICIAR JUEGO ♟️
                </button>
              </div>

              <article className="bg-slate-800/40 p-6 rounded-lg border border-slate-700/50 text-sm leading-relaxed text-slate-300">
                <h2 className="text-xl font-bold text-emerald-400 mb-3">El Portal de Ajedrez Definitivo en Buenos Aires</h2>
                <p className="mb-4">
                  En <strong>Chess Master AI</strong> nos apasiona difundir el juego ciencia. Nuestra plataforma web está diseñada para todos los vecinos y vecinas de Buenos Aires, CABA y el resto de Argentina que desean disfrutar de una partida de ajedrez sin la necesidad de instalar aplicaciones pesadas ni crear cuentas de usuario.
                </p>
                <p>
                  Ofrecemos un motor de inteligencia artificial desarrollado con tecnología moderna para que puedas entrenar tu mente en cualquier momento del día, ya sea desde tu computadora de escritorio o desde tu teléfono celular mientras viajás en colectivo.
                </p>
              </article>
            </div>
          )}

          {pantalla === 'reglas' && (
            <article className="bg-slate-800/60 p-6 sm:p-8 rounded-xl border border-slate-700 shadow-xl text-sm leading-relaxed text-slate-300">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4">Reglas de Ajedrez: Aprende a Jugar desde Cero</h2>
              <p className="mb-4">
                El ajedrez es un juego milenario de estrategia pura donde no interviene el azar. Se juega sobre un tablero de 64 casillas de colores alternos con un total de 32 piezas (16 blancas y 16 negras).
              </p>
              
              <h3 className="text-lg font-semibold text-white mt-4 mb-2">El Movimiento de las Piezas</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>El Rey:</strong> Se desplaza una sola casilla en cualquier dirección. Es la pieza más importante; si lo atrapan, perdés el juego.</li>
                <li><strong>La Dama o Reina:</strong> Es la pieza más poderosa. Puede moverse cualquier cantidad de casillas en dirección vertical, horizontal o diagonal.</li>
                <li><strong>La Torre:</strong> Se mueve en línea recta (horizontal o vertical) tantas casillas como estén libres.</li>
                <li><strong>El Alfil:</strong> Se desplaza únicamente en diagonal, respetando siempre el color de su casilla inicial.</li>
                <li><strong>El Caballo:</strong> Se mueve en forma de "L" (dos casillas en una dirección y una en perpendicular). Es la única pieza que puede saltar sobre otras.</li>
                <li><strong>El Peón:</strong> Avanza una casilla hacia adelante (dos en su primer movimiento). Captura en diagonal y si llega al final del tablero, puede transformarse en cualquier otra pieza.</li>
              </ul>
            </article>
          )}

          {pantalla === 'estrategias' && (
            <article className="bg-slate-800/60 p-6 sm:p-8 rounded-xl border border-slate-700 shadow-xl text-sm leading-relaxed text-slate-300">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4">Consejos y Estrategias para Vencer a la IA</h2>
              <p className="mb-4">
                Enfrentar a una computadora requiere paciencia y táctica. Aquí te dejamos tres principios fundamentales que utilizan los grandes maestros de la Federación Argentina de Ajedrez para dominar las partidas:
              </p>
              
              <h3 className="text-lg font-semibold text-white mt-4 mb-2">1. Domina el Centro del Tablero</h3>
              <p className="mb-4">
                Las casillas centrales (d4, e4, d5, e5) son las más importantes del juego. Controlar el centro con tus peones y piezas menores (caballos y alfiles) te da mayor espacio de maniobra y limita las opciones de ataque de la inteligencia artificial.
              </p>

              <h3 className="text-lg font-semibold text-white mt-4 mb-2">2. Desarrolla tus Piezas Temprano</h3>
              <p className="mb-4">
                No intentes atacar solo con la Reina al principio del juego. Saca tus caballos y alfiles rápidamente para ubicarlos en posiciones activas. Una ofensiva sin el apoyo de tus otras piezas está destinada al fracaso.
              </p>

              <h3 className="text-lg font-semibold text-white mt-4 mb-2">3. Protege a tu Rey (Enroque)</h3>
              <p>
                La seguridad del rey es la máxima prioridad. Trata de realizar el enroque dentro de las primeras diez jugadas para refugiar a tu monarca en una esquina segura detrás de una sólida fila de peones protectores.
              </p>
            </article>
          )}

          {pantalla === 'contacto' && (
            <article className="bg-slate-800/60 p-6 sm:p-8 rounded-xl border border-slate-700 shadow-xl text-sm leading-relaxed text-slate-300 max-w-[550px] mx-auto">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">Contacto</h2>
              <p className="mb-6 text-center text-slate-400">
                ¿Tenés alguna sugerencia para mejorar nuestro motor de ajedrez? Escribinos y compartinos tus comentarios.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert('¡Mensaje enviado con éxito! Gracias por escribirnos.'); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nombre:</label>
                  <input type="text" required className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico:</label>
                  <input type="email" required className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Mensaje:</label>
                  <textarea required rows="4" className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-emerald-500"></textarea>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                  Enviar Comentario
                </button>
              </form>
            </article>
          )}

        </main>

        {/* ANUNCIO 2: CUADRADO EN EL MEDIO */}
        <div className="w-full max-w-[336px] mx-auto my-4">
          <GoogleAd slot="1326013356" format="rectangle" estiloSimulado="w-full h-[280px]" />
        </div>

        <footer className="text-center py-4 text-[11px] text-slate-500 border-t border-slate-800">
          CHESS ENGINE & ADS MONETIZATION - © 2026 Chess Master AI
        </footer>
      </div>
    );
  }

  // --- PANTALLA DEL TABLERO DE JUEGO (Se activa al darle "Iniciar Juego") ---
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between p-4">
      <header className="flex justify-between items-center max-w-[1000px] w-full mx-auto my-2 border-b border-slate-800 pb-2">
        <h1 className="text-xl font-bold text-emerald-400 tracking-wide">CHESS MASTER AI</h1>
        <button 
          onClick={() => setPantalla('inicio')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold py-1.5 px-3 rounded text-slate-300 transition-colors"
        >
          ◀ VOLVER AL MENÚ
        </button>
      </header>

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
            {mostrarAyuda ? 'OCULTAR GUÍA ▲' : '¿CÓMO SE JUEGA? ▼'}
          </button>
        </div>
      </main>

      {/* GUÍA DE AYUDA RÁPIDA DENTRO DEL JUEGO */}
      {mostrarAyuda && (
        <section className="w-full max-w-[850px] mx-auto my-4 bg-slate-950 p-6 rounded-lg border border-slate-700 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-xl">
          <h2 className="text-lg font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">Guía Rápida: Cómo Jugar</h2>
          <div className="mb-4">
            <h3 className="font-bold text-white mb-1">🎯 El Fin del Juego: El Jaque Mate</h3>
            <p>El objetivo es acorralar al Rey contrario para que no tenga ningún escape posible.</p>
          </div>
        </section>
      )}

      <footer className="text-center py-2 text-[11px] text-slate-500 border-t border-slate-800">
        CHESS ENGINE & ADS MONETIZATION - © 2026 Chess Master AI
      </footer>
    </div>
  );
}
