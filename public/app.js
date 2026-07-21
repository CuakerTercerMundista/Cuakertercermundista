  const buscadorInput = document.getElementById('search-input');
  const reproductorAudio = document.getElementById('audio-player');
  const trackTitleUI = document.getElementById('track-title-ui');
  const offlineContainer = document.getElementById('offline-container');
  const recientesContainer = document.getElementById('recientes-container');
  const discUI = document.getElementById('disc-ui');
  const coverContainer = document.getElementById('cover-container');
  
  // Selectores de los nuevos botones de control
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  
  let listaActualResultados = []; // Memoria global para el carrusel de canciones
  let indiceCancionActual = -1;
  
  buscadorInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
          const busqueda = buscadorInput.value.trim();
          if (!busqueda) return;
  
          if (navigator.onLine) {
              trackTitleUI.innerText = "BUSCANDO SUGERENCIAS...";
              
              fetch(`/api/buscar?q=${encodeURIComponent(busqueda)}`)
                  .then(res => res.json())
                  .then(data => {
                      if (data.resultados && data.resultados.length > 0) {
                          trackTitleUI.innerText = "COINCIDENCIAS ENCONTRADAS";
                          listaActualResultados = data.resultados; // Almacenar en la memoria del script
                          
                          recientesContainer.innerHTML = ''; 
                          recientesContainer.previousElementSibling.innerText = `COINCIDENCIAS PARA: ${busqueda.toUpperCase()}`;
  
                          data.resultados.forEach((track, index) => {
                              const card = document.createElement('div');
                              card.className = 'card';
                              card.style.minWidth = '220px';
                              
                              // Inyectamos la imagen de la carátula real devuelta por el servidor
                              card.innerHTML = `
                                  <div class="card-image"><img src="${track.thumbnail}" alt="cover"></div>
                                  <p title="${track.title}">${track.title}</p>
                              `;
                              
                              card.addEventListener('click', () => {
                                  reproducirPistaDeLista(index);
                              });
                              
                              recientesContainer.appendChild(card);
                          });
                      }
                  });
          }
      }
  });
  
  function reproducirPistaDeLista(index) {
      if (index < 0 || index >= listaActualResultados.length) return;
      indiceCancionActual = index;
      const track = listaActualResultados[index];
      
      trackTitleUI.innerText = "CONECTANDO FLUJO...";
      // Cambiar la carátula de la barra lateral izquierda por la de la canción activa
      coverContainer.innerHTML = `<img src="${track.thumbnail}" alt="playing-cover">`;
  
      fetch(`/api/stream_url?url=${encodeURIComponent(track.url)}`)
          .then(r => r.json())
          .then(streamData => {
              if (streamData.streaming_url) {
                  reproductorAudio.src = streamData.streaming_url;
                  reproductorAudio.play();
                  trackTitleUI.innerText = track.title.toUpperCase();
                  actualizarIconoPlayPausa(true);
              }
          });
  }
  
  // --- LÓGICA DE BOTONERA MULTIMEDIA ---
  
  btnPlayPause.addEventListener('click', () => {
      if (reproductorAudio.src) {
          if (reproductorAudio.paused) {
              reproductorAudio.play();
              actualizarIconoPlayPausa(true);
          } else {
              reproductorAudio.pause();
              actualizarIconoPlayPausa(false);
          }
      }
  });
  
  btnNext.addEventListener('click', () => {
      if (indiceCancionActual + 1 < listaActualResultados.length) {
          reproducirPistaDeLista(indiceCancionActual + 1);
      }
  });
  
  btnPrev.addEventListener('click', () => {
      if (indiceCancionActual - 1 >= 0) {
          reproducirPistaDeLista(indiceCancionActual - 1);
      }
  });
  
  function actualizarIconoPlayPausa(isPlaying) {
      if (isPlaying) {
          btnPlayPause.innerHTML = `<i data-lucide="pause"></i>`;
      } else {
          btnPlayPause.innerHTML = `<i data-lucide="play"></i>`;
      }
      lucide.createIcons(); // Forzar recarga de los iconos de Lucide
  }
  
  reproductorAudio.addEventListener('ended', () => {
      // Al terminar una canción, salta a la siguiente de forma automática de la lista
      if (indiceCancionActual + 1 < listaActualResultados.length) {
          btnNext.click();
      }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
      // Escaneo básico local simulado al iniciar
      fetch('/api/offline').then(res => res.json()).then(data => {
          if (!data.canciones || data.canciones.length === 0) {
              offlineContainer.innerHTML = '<p style="color: #444; font-size: 11px; padding: 10px;">BIBLIOTECA EN CERO (.MP3)</p>';
          }
      });
  });
  
