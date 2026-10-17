import { useState, useRef, useEffect } from 'react'
import html2pdf from 'html2pdf.js'
import './App.css'

const formatearTiempo = (segundosTotales) => {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
};

const formatearTiempoTotal = (segundosTotales) => {
  const horas = Math.floor(segundosTotales / 3600);
  const minutos = Math.floor((segundosTotales % 3600) / 60);
  const segundos = segundosTotales % 60;
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
};

// Limpieza de títulos (remaster, live, etc.)
const limpiarTituloCancion = (nombreOriginal) => {
  if (!nombreOriginal) return '';
  const patronInnecesario = /[\(\[\{]\s*.*?\b(remaster|remastered|version|edit|mix|live|deluxe|bonus|track|anniversary|single|mono|stereo|digital|take|demo|edition)\b.*?[\)\]\}]/gi;
  let tituloLimpio = nombreOriginal.replace(patronInnecesario, '');
  return tituloLimpio.replace(/\s+/g, ' ').trim();
};

function App() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  const [setlist, setSetlist] = useState([]);
  const [gap, setGap] = useState(15);
  
  const [espaciadoPdf, setEspaciadoPdf] = useState(18);
  const [tamanoFuentePdf, setTamanoFuentePdf] = useState(28);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  const [tipoEspecial, setTipoEspecial] = useState("Speech");
  const [minutosEspecial, setMinutosEspecial] = useState(2);
  const [textoLibre, setTextoLibre] = useState("SET 1");
  const [nombreCancionExtra, setNombreCancionExtra] = useState("");
  const [duracionCancionExtra, setDuracionCancionExtra] = useState("03:30");

  // Datos del Show y Banda
  const [nombreBanda, setNombreBanda] = useState("");
  const [fecha, setFecha] = useState("");
  const [venue, setVenue] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [contactoRedes, setContactoRedes] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoDimensions, setLogoDimensions] = useState({ width: 0, height: 0 });

  const dragItem = useRef();
  const dragOverItem = useRef();

  useEffect(() => {
    let timeoutId;
    if (mostrarPreview) {
      setCargandoPdf(true);
      timeoutId = setTimeout(() => {
        procesarPDF('preview');
      }, 600);
    }
    return () => clearTimeout(timeoutId);
  }, [mostrarPreview, espaciadoPdf, tamanoFuentePdf]);

  const ejecutarBusqueda = async (termino) => {
    const query = termino || busqueda;
    if (!query.trim()) return;

    setCargandoBusqueda(true);
    setErrorBusqueda(null);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=50`);
      if (!res.ok) throw new Error('Error al conectar con el servidor de música.');
      const data = await res.json();
      setResultados(data.results || []);
    } catch (err) {
      setErrorBusqueda('No se pudieron obtener resultados. Revisa tu conexión.');
    } finally {
      setCargandoBusqueda(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    ejecutarBusqueda();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        const img = new Image();
        img.onload = () => {
          setLogoDimensions({ width: img.width, height: img.height });
          setLogoUrl(dataUrl);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const quitarLogo = () => {
    setLogoUrl(null);
    setLogoDimensions({ width: 0, height: 0 });
  };

  const agruparPorDisco = () => {
    const agrupado = {};
    resultados.forEach((track) => {
      const discoNombre = track.collectionName || 'Sencillos / Varios';
      if (!agrupado[discoNombre]) {
        const releaseYear = track.releaseDate ? new Date(track.releaseDate).getFullYear() : null;
        agrupado[discoNombre] = {
          nombreDisco: discoNombre,
          artista: track.artistName,
          anio: releaseYear,
          artwork: track.artworkUrl100 || track.artworkUrl60,
          canciones: []
        };
      }
      agrupado[discoNombre].canciones.push(track);
    });

    return Object.values(agrupado).sort((a, b) => {
      if (a.anio === null) return 1;
      if (b.anio === null) return -1;
      return a.anio - b.anio;
    });
  };

  const discosAgrupados = agruparPorDisco();

  const agregarAlSetlist = (cancion) => {
    const duracionSegundos = Math.round((cancion.trackTimeMillis || 0) / 1000);
    const tituloLimpio = limpiarTituloCancion(cancion.trackName);

    const nuevaEjecucion = {
      idSetlist: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      id: cancion.trackId,
      nombre: tituloLimpio,
      disco: cancion.collectionName || 'Sin Álbum',
      artista: cancion.artistName,
      track: cancion.trackNumber,
      duracionBase: duracionSegundos,
      duracion: duracionSegundos,
      esTape: false,
      enganchada: false,
      notas: "",
      tiempoExtra: 0,
      esEspecial: false,
      esTextoLibre: false,
      esCancionExtra: false
    };
    setSetlist([...setlist, nuevaEjecucion]);
  };

  const agregarBloqueEspecial = () => {
    let nuevoBloque;

    if (tipoEspecial === "Texto Libre") {
      nuevoBloque = {
        idSetlist: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        nombre: textoLibre,
        duracionBase: 0,
        esTape: false,
        enganchada: false,
        notas: "",
        tiempoExtra: 0,
        esEspecial: false,
        esTextoLibre: true,
        esCancionExtra: false
      };
    } else if (tipoEspecial === "Canción") {
      const partes = duracionCancionExtra.split(':');
      let segs = 0;
      if (partes.length === 2) {
        segs = (parseInt(partes[0]) || 0) * 60 + (parseInt(partes[1]) || 0);
      } else {
        segs = parseInt(partes[0]) || 0;
      }
      
      nuevoBloque = {
        idSetlist: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        nombre: nombreCancionExtra || "Canción sin título",
        duracionBase: segs,
        esTape: false,
        enganchada: false,
        notas: "",
        tiempoExtra: 0,
        esEspecial: false,
        esTextoLibre: false,
        esCancionExtra: true 
      };
      
      setNombreCancionExtra("");
    } else {
      const duracionSegundos = Number(minutosEspecial) * 60;
      nuevoBloque = {
        idSetlist: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        nombre: tipoEspecial,
        duracionBase: duracionSegundos,
        esTape: false,
        enganchada: false,
        notas: "",
        tiempoExtra: 0,
        esEspecial: true,
        esTextoLibre: false,
        esCancionExtra: false
      };
    }
    
    setSetlist([...setlist, nuevoBloque]);
  };

  const eliminarDelSetlist = (idSetlist) => {
    setSetlist(setlist.filter(item => item.idSetlist !== idSetlist));
  };

  const actualizarItemSetlist = (idSetlist, campo, valor) => {
    setSetlist(setlist.map(item => 
      item.idSetlist === idSetlist ? { ...item, [campo]: valor } : item
    ));
  };

  const vaciarSetlist = () => {
    if (window.confirm("⚠️ ¿Estás seguro de que quieres borrar todo el setlist?")) {
      setSetlist([]);
    }
  };

  const handleSort = () => {
    let listaReordenada = [...setlist];
    const itemArrastrado = listaReordenada.splice(dragItem.current, 1)[0];
    listaReordenada.splice(dragOverItem.current, 0, itemArrastrado);
    
    dragItem.current = null;
    dragOverItem.current = null;
    setSetlist(listaReordenada);
  };

  const calcularTiempoTotal = () => {
    let totalSegundos = 0;
    setlist.forEach((item, index) => {
      if (item.esTextoLibre) return; 
      totalSegundos += (item.duracionBase + Number(item.tiempoExtra));
      const esUltimo = index === setlist.length - 1;
      if (!esUltimo && !item.enganchada) {
        totalSegundos += Number(gap);
      }
    });
    return totalSegundos;
  };

  const obtenerSetlistConNumeros = () => {
    let contador = 1;
    return setlist.map(item => {
      if (item.esEspecial || item.esTextoLibre) return { ...item, trackNumero: null };
      if (item.esTape) return { ...item, trackNumero: null };
      return { ...item, trackNumero: contador++ };
    });
  };

  const setlistRenderizado = obtenerSetlistConNumeros();
  const tiempoTotalShow = calcularTiempoTotal();

  const procesarPDF = (accion) => {
    const elemento = document.getElementById('setlist-pdf-contenedor');
    
    let logoWidth = 0;
    const logoHeight = 20; 
    let textStartX = 10;

    if (logoUrl) {
      if (logoDimensions.height > 0) {
        const ratio = logoDimensions.width / logoDimensions.height;
        logoWidth = logoHeight * ratio;
        if (logoWidth > 55) logoWidth = 55;
      } else {
        logoWidth = 30;
      }
      textStartX = 10 + logoWidth + 5;
    }

    const opciones = {
      margin:       [35, 10, 15, 10], 
      filename:     `Setlist-${venue ? venue.trim().replace(/\s+/g, '_') + '-' : ''}${fecha || 'Show'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' } 
    };

    html2pdf()
      .set(opciones)
      .from(elemento)
      .toPdf()
      .get('pdf')
      .then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let fechaStr = 'Fecha: _____';
        if (fecha) {
          const partes = fecha.split('-'); 
          if (partes.length === 3) {
            fechaStr = `Fecha: ${partes[2]}/${partes[1]}/${partes[0]}`; 
          }
        }

        const venueStr = venue ? `Lugar: ${venue}` : 'Lugar: _____';
        const ciudadStr = ciudad ? `Ciudad: ${ciudad}` : 'Ciudad: _____';

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          if (logoUrl) {
            try {
              let imgFormat = 'PNG';
              if (logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg')) {
                imgFormat = 'JPEG';
              } else if (logoUrl.startsWith('data:image/webp')) {
                imgFormat = 'WEBP';
              }
              pdf.addImage(logoUrl, imgFormat, 10, 10, logoWidth, logoHeight);
            } catch (e) {
              console.warn("No se pudo insertar el logo en el PDF", e);
            }
          } else if (nombreBanda.trim()) {
            pdf.setFontSize(18);
            pdf.setFont("helvetica", "bold");
            pdf.text(nombreBanda.trim().toUpperCase(), 10, 20);
          }

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(fechaStr, textStartX, 15);
          pdf.text(venueStr, textStartX, 21);
          pdf.text(ciudadStr, textStartX, 27);

          pdf.setLineWidth(0.8);
          pdf.line(10, 32, pageWidth - 10, 32);

          pdf.setLineWidth(0.5);
          pdf.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

          if (contactoRedes.trim()) {
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
            pdf.text(contactoRedes.trim(), pageWidth / 2, pageHeight - 7, { align: 'center' });
          }
        }

        if (accion === 'preview') {
          const blobUrl = pdf.output('bloburl');
          setPdfUrl(oldUrl => {
            if (oldUrl) URL.revokeObjectURL(oldUrl); 
            return blobUrl;
          });
          setCargandoPdf(false);
        } else {
          pdf.save(opciones.filename);
        }
      });
  };

  const obtenerColorFondo = (item) => {
    if (item.esTextoLibre) return '#2e2e38';
    if (item.esEspecial) return '#1e2b3d';
    if (item.esCancionExtra) return '#331e3d'; 
    return '#262630';
  };

  const obtenerColorBorde = (item) => {
    if (item.esTextoLibre) return '4px solid #8a8a9e';
    if (item.esEspecial) return '4px solid #008dfe';
    if (item.esCancionExtra) return '4px solid #9030fd'; 
    return 'none';
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* HEADER CON IMAGEN CENTRAL */}
      <header className="app-header">
        <img 
          src="/header-logo.png" 
          alt="Setlist Maker" 
          className="header-banner"
          onError={(e) => {
            e.target.style.display = 'none';
            if (!document.getElementById('fallback-title')) {
              const h1 = document.createElement('h1');
              h1.id = 'fallback-title';
              h1.innerText = 'SETLIST MAKER';
              h1.style.margin = '0';
              h1.style.fontSize = '2em';
              h1.style.letterSpacing = '2px';
              e.target.parentNode.appendChild(h1);
            }
          }}
        />
      </header>

      {/* CONTENEDOR SECCIONES "MI BANDA" Y "PRÓXIMO SHOW" */}
      <section className="band-show-container">
        
        {/* MI BANDA */}
        <div className="section-block">
          <h2 className="section-title-right">Mi Banda</h2>
          
          <div className="field-group">
            <label className="field-label">Nombre:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="text" 
                className="custom-input"
                placeholder="Ej: Nombre de tu Banda" 
                value={nombreBanda} 
                onChange={(e) => setNombreBanda(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />

              <input 
                type="file" 
                accept="image/*"
                id="logo-upload"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              
              <label htmlFor="logo-upload" className="btn-pill" style={{ flexShrink: 0 }}>
                <i className="fa-regular fa-image btn-icon"></i>
                <span>SUBIR LOGO</span>
              </label>

              {logoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <img 
                    src={logoUrl} 
                    alt="Preview Logo" 
                    style={{ height: '38px', maxWidth: '60px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#fff', padding: '2px' }} 
                  />
                  <button 
                    onClick={quitarLogo}
                    title="Quitar Logo"
                    style={{ backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em' }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Redes / Contacto:</label>
            <input 
              type="text" 
              className="custom-input"
              placeholder="Ej: IG: @mi_banda | www.mibanda.com" 
              value={contactoRedes} 
              onChange={(e) => setContactoRedes(e.target.value)}
            />
          </div>
        </div>

        {/* PRÓXIMO SHOW */}
        <div className="section-block">
          <h2 className="section-title-right">Próximo Show</h2>
          
          <div className="field-group">
            <label className="field-label">Fecha:</label>
            <input 
              type="date" 
              className="custom-input"
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Venue (Lugar):</label>
            <input 
              type="text" 
              className="custom-input"
              placeholder="Ej: Movistar Arena" 
              value={venue} 
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Ciudad / País:</label>
            <input 
              type="text" 
              className="custom-input"
              placeholder="Ej: Buenos Aires, Argentina" 
              value={ciudad} 
              onChange={(e) => setCiudad(e.target.value)}
            />
          </div>
        </div>

      </section>

      {/* ÁREA PRINCIPAL */}
      <main className="main-container">
        
        {/* BUSCADOR DE CANCIONES */}
        <section className="columna-catalogo" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', minWidth: 0, boxSizing: 'border-box', border: '1px solid #2d2d38' }}>
          <h2 style={{ fontSize: '1.1em', marginTop: '0', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', borderBottom: '1px solid #333340', paddingBottom: '6px' }}>
            Buscador
          </h2>
          
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
            <input 
              type="text" 
              className="custom-input"
              placeholder="Artista, canción..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button 
              type="submit" 
              disabled={cargandoBusqueda}
              className="btn-round"
              title="Buscar"
            >
              <i className="fa-solid fa-magnifying-glass btn-icon"></i>
            </button>
          </form>

          <div className="scroll-area">
            {cargandoBusqueda ? (
              <p style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Buscando canciones... 🎵</p>
            ) : errorBusqueda ? (
              <p style={{ color: '#f44336', textAlign: 'center', padding: '10px 0', fontSize: '0.85em' }}>{errorBusqueda}</p>
            ) : resultados.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px 10px', fontSize: '0.85em', fontStyle: 'italic' }}>
                Escribe el nombre de un artista o canción arriba para buscar...
              </p>
            ) : (
              discosAgrupados.map((disco) => (
                <details key={disco.nombreDisco} open style={{ marginBottom: '8px', backgroundColor: '#262630', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333342' }}>
                  <summary style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 'bold', outline: 'none', fontSize: '0.85em', textAlign: 'left', minWidth: 0 }}>
                    <img 
                      src={disco.artwork} 
                      alt={disco.nombreDisco} 
                      style={{ width: '32px', height: '32px', marginRight: '10px', borderRadius: '4px', objectFit: 'cover', backgroundColor: '#111', flexShrink: 0 }} 
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: '1', minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{disco.nombreDisco}</div>
                      <small style={{ color: '#aaa', fontWeight: 'normal', fontSize: '0.8em', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {disco.artista} {disco.anio ? `• ${disco.anio}` : ''}
                      </small>
                    </div>
                  </summary>
                  <div style={{ padding: '0 8px 8px 8px' }}>
                    {disco.canciones.map((cancion) => {
                      const tituloLimpio = limpiarTituloCancion(cancion.trackName);
                      return (
                        <div key={cancion.trackId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e26', marginBottom: '4px', padding: '6px 10px', borderRadius: '4px', gap: '6px', minWidth: 0 }}>
                          <div style={{ textAlign: 'left', flex: '1', minWidth: 0, wordBreak: 'break-word' }}>
                            <strong style={{ fontSize: '0.8em', display: 'block', lineHeight: '1.2' }}>
                              {cancion.trackNumber ? `${cancion.trackNumber}. ` : ''}{tituloLimpio}
                            </strong>
                            <small style={{ color: '#888', fontSize: '0.7em', display: 'block', marginTop: '2px' }}>
                              {formatearTiempo(Math.round((cancion.trackTimeMillis || 0) / 1000))}
                            </small>
                          </div>
                          <button 
                            onClick={() => agregarAlSetlist(cancion)}
                            title="Agregar al setlist"
                            style={{ backgroundColor: '#008dfe', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', flexShrink: 0 }}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))
            )}
          </div>
        </section>

        {/* SETLIST PRINCIPAL */}
        <section className="columna-setlist" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', minWidth: 0, border: '1px solid #2d2d38' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #333340', paddingBottom: '6px' }}>
            <h2 style={{ margin: '0', fontSize: '1.1em', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)' }}>
              Tu Setlist
            </h2>
            {setlistRenderizado.length > 0 && (
              <button 
                onClick={vaciarSetlist}
                style={{ backgroundColor: 'transparent', color: '#f44336', border: '1px solid #f44336', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-regular fa-trash-can"></i> Vaciar
              </button>
            )}
          </div>
          
          {setlistRenderizado.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9em' }}>Busca y agrega canciones desde el catálogo para armar tu lista...</p>
          ) : (
            <div className="scroll-area">
              {setlistRenderizado.map((item, index) => (
                <div 
                  key={item.idSetlist}
                  draggable
                  onDragStart={(e) => (dragItem.current = index)}
                  onDragEnter={(e) => (dragOverItem.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                  style={{ 
                    backgroundColor: obtenerColorFondo(item), 
                    marginBottom: '8px', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'grab',
                    borderLeft: obtenerColorBorde(item),
                    textAlign: item.esTextoLibre ? 'center' : 'left'
                  }}
                >
                  
                  {item.esTextoLibre ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <i className="fa-solid fa-grip-lines" style={{ color: '#777', cursor: 'grab', paddingRight: '10px' }}></i>
                      <input 
                        type="text" 
                        value={item.nombre} 
                        onChange={(e) => actualizarItemSetlist(item.idSetlist, 'nombre', e.target.value)}
                        style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', backgroundColor: 'transparent', border: 'none', color: '#fff', borderBottom: '1px dashed #666' }}
                      />
                      <button 
                        onClick={() => eliminarDelSetlist(item.idSetlist)}
                        style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', marginLeft: '10px' }}
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px' }}>
                          <i className="fa-solid fa-grip-lines" style={{ color: '#777', cursor: 'grab' }}></i>
                          <span style={{ fontWeight: 'bold', fontSize: '1em' }}>
                            {!item.esEspecial && (item.esTape ? '📼 ' : `${item.trackNumero}. `)}
                            {item.esEspecial && '🎭 '}
                          </span>
                          <input 
                            type="text" 
                            value={item.nombre} 
                            onChange={(e) => actualizarItemSetlist(item.idSetlist, 'nombre', e.target.value)}
                            style={{ 
                              flex: 1, 
                              fontWeight: 'bold', 
                              fontSize: '1em', 
                              backgroundColor: 'transparent', 
                              border: 'none', 
                              color: '#fff', 
                              borderBottom: '1px solid transparent',
                              padding: '2px 4px',
                              borderRadius: '3px'
                            }}
                            onFocus={(e) => e.target.style.borderBottom = '1px dashed #008dfe'}
                            onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
                            title="Haz clic para editar el nombre"
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.85em', color: '#aaa' }}>{formatearTiempo(item.duracionBase + Number(item.tiempoExtra))}</span>
                          <button 
                            onClick={() => eliminarDelSetlist(item.idSetlist)}
                            style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>

                      <div className="controles-cancion">
                        {!item.esEspecial && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Pista / Tape">
                            <input 
                              type="checkbox" 
                              checked={item.esTape} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'esTape', e.target.checked)} 
                            />
                            <span>📼</span>
                          </label>
                        )}
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Enganchada al siguiente track">
                          <input 
                            type="checkbox" 
                            checked={item.enganchada} 
                            onChange={(e) => actualizarItemSetlist(item.idSetlist, 'enganchada', e.target.checked)} 
                          />
                          <strong style={{ fontSize: '1.2em', color: item.enganchada ? '#008dfe' : '#777' }}>{'>'}</strong>
                        </label>

                        {item.esEspecial ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Duración (min):
                            <input 
                              type="number" 
                              value={item.duracionBase / 60} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'duracionBase', Number(e.target.value) * 60)}
                              style={{ width: '45px', padding: '3px 6px', borderRadius: '3px', border: 'none', fontSize: '1em' }}
                            />
                          </label>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Extra (seg):
                            <input 
                              type="number" 
                              value={item.tiempoExtra} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'tiempoExtra', e.target.value)}
                              style={{ width: '45px', padding: '3px 6px', borderRadius: '3px', border: 'none', fontSize: '1em' }}
                            />
                          </label>
                        )}

                        <input 
                          type="text" 
                          placeholder="Notas..." 
                          value={item.notas} 
                          onChange={(e) => actualizarItemSetlist(item.idSetlist, 'notas', e.target.value)}
                          style={{ flex: '1', minWidth: '100px', padding: '4px 8px', borderRadius: '3px', border: 'none', fontSize: '1em', backgroundColor: '#1c1c24', color: '#fff' }}
                        />
                      </div>
                    </>
                  )}

                </div>
              ))}
            </div>
          )}
        </section>

        {/* PANEL DE CONTROL */}
        <section className="columna-panel" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', minWidth: 0, border: '1px solid #2d2d38' }}>
          <h2 style={{ fontSize: '1.1em', marginTop: '0', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', borderBottom: '1px solid #333340', paddingBottom: '6px' }}>
            Panel de Control
          </h2>
          
          {/* 1. PAUSA ENTRE TEMAS */}
          <div className="field-group" style={{ backgroundColor: '#262630', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #333342' }}>
            <label className="field-label">Pausa entre temas:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                value={gap} 
                onChange={(e) => setGap(e.target.value)}
                className="custom-input"
                style={{ flex: 1, minWidth: 0 }}
              />
              <span style={{ fontSize: '0.9em', color: '#aaa', fontWeight: 'bold' }}>seg</span>
            </div>
          </div>

          {/* 2. FILA ESPECIAL */}
          <div style={{ backgroundColor: '#262630', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #333342' }}>
            <h2 className="section-title-right" style={{ fontSize: '0.95em', margin: '0 0 10px 0' }}>
              Fila Especial
            </h2>
            
            <div className="field-group" style={{ marginBottom: '10px' }}>
              <label className="field-label">Tipo:</label>
              <select 
                value={tipoEspecial} 
                onChange={(e) => setTipoEspecial(e.target.value)}
                className="custom-input"
                style={{ width: '100%' }}
              >
                <option value="Speech">Speech</option>
                <option value="Intervalo">Intervalo</option>
                <option value="Encore">Encore</option>
                <option value="Texto Libre">Texto Libre (Separador)</option>
                <option value="Canción">Canción (Fuera de catálogo)</option>
              </select>
            </div>

            {tipoEspecial === "Texto Libre" ? (
              <div className="field-group" style={{ marginBottom: '12px' }}>
                <label className="field-label">Texto a mostrar:</label>
                <input 
                  type="text" 
                  value={textoLibre} 
                  onChange={(e) => setTextoLibre(e.target.value)}
                  placeholder="Ej: SET 1"
                  className="custom-input"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                />
              </div>
            ) : tipoEspecial === "Canción" ? (
              <>
                <div className="field-group" style={{ marginBottom: '8px' }}>
                  <label className="field-label">Nombre de la canción:</label>
                  <input 
                    type="text" 
                    value={nombreCancionExtra} 
                    onChange={(e) => setNombreCancionExtra(e.target.value)}
                    placeholder="Ej: Song Title"
                    className="custom-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="field-group" style={{ marginBottom: '12px' }}>
                  <label className="field-label">Duración (mm:ss):</label>
                  <input 
                    type="text" 
                    value={duracionCancionExtra} 
                    onChange={(e) => setDuracionCancionExtra(e.target.value)}
                    placeholder="03:30"
                    className="custom-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            ) : (
              <div className="field-group" style={{ marginBottom: '12px' }}>
                <label className="field-label">Duración:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    value={minutosEspecial} 
                    onChange={(e) => setMinutosEspecial(e.target.value)}
                    className="custom-input"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <span style={{ fontSize: '0.9em', color: '#aaa', fontWeight: 'bold' }}>min</span>
                </div>
              </div>
            )}

            <button 
              onClick={agregarBloqueEspecial}
              className="btn-pill"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-plus btn-icon"></i>
              <span>+ FILA</span>
            </button>
          </div>

          {/* 3. RELOJ / TIEMPO TOTAL ESTIMADO */}
          <div style={{ backgroundColor: '#141418', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '15px', border: '1px solid #282832' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#888', fontSize: '0.85em', textTransform: 'uppercase' }}>Tiempo Total Estimado</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#008dfe' }}>
              {formatearTiempoTotal(tiempoTotalShow)}
            </div>
          </div>

          {/* 4. BOTÓN EXPORTAR */}
          <button 
            onClick={() => setMostrarPreview(true)}
            disabled={setlistRenderizado.length === 0}
            className="btn-pill"
            style={{ width: '100%', cursor: setlistRenderizado.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.95em', justifyContent: 'center' }}
          >
            <i className="fa-regular fa-file-pdf btn-icon"></i>
            <span>EXPORTAR</span>
          </button>

        </section>

      </main>

      {/* POPUP / MODAL DE VISTA PREVIA */}
      {mostrarPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box' }}>
          
          <div style={{ backgroundColor: '#1e1e24', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '900px', height: '95vh', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid #3f3f4e' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', borderBottom: '1px solid #333340', paddingBottom: '15px', flexWrap: 'wrap' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Interlineado:</span>
                  <button onClick={() => setEspaciadoPdf(Math.max(0, espaciadoPdf - 2))} className="btn-round">-</button>
                  <span style={{ fontSize: '1.1em', fontWeight: 'bold', width: '25px', textAlign: 'center' }}>{espaciadoPdf}</span>
                  <button onClick={() => setEspaciadoPdf(espaciadoPdf + 2)} className="btn-round">+</button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '15px', borderLeft: '1px solid #333340' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Fuente:</span>
                  <button onClick={() => setTamanoFuentePdf(Math.max(12, tamanoFuentePdf - 2))} className="btn-round">-</button>
                  <span style={{ fontSize: '1.1em', fontWeight: 'bold', width: '25px', textAlign: 'center' }}>{tamanoFuentePdf}</span>
                  <button onClick={() => setTamanoFuentePdf(Math.min(60, tamanoFuentePdf + 2))} className="btn-round">+</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => procesarPDF('descargar')}
                  className="btn-pill"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>DESCARGAR</span>
                </button>
                
                <button 
                  onClick={() => setMostrarPreview(false)}
                  className="btn-danger-pill"
                >
                  ✕ CERRAR
                </button>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#525659', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
              {cargandoPdf && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '1.2em', fontWeight: 'bold', zIndex: 10 }}>
                  Generando vista previa... ⏳
                </div>
              )}
              
              {pdfUrl && (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Preview"
                />
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.8em', color: '#aaa' }}>
              * Si la hoja no se muestra correctamente en tu celular, <a href={pdfUrl} target="_blank" rel="noreferrer" style={{color: '#008dfe', textDecoration: 'underline'}}>tocá acá para verla en otra pestaña</a>.
            </div>

          </div>
        </div>
      )}

      {/* MOLDE OCULTO DEL PDF */}
      <div style={{ position: 'absolute', top: '-20000px', left: '-20000px' }}>
        <div 
          id="setlist-pdf-contenedor" 
          style={{ 
            width: '190mm', 
            backgroundColor: '#ffffff', 
            color: '#000000', 
            fontFamily: 'Arial, sans-serif', 
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {setlistRenderizado.map((item) => (
              <div 
                key={item.idSetlist} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  pageBreakInside: 'avoid',
                  borderTop: item.esEspecial ? '1px solid #666' : 'none',
                  borderBottom: item.esEspecial ? '1px solid #666' : 'none',
                  paddingTop: item.esEspecial ? '8px' : '0',
                  paddingBottom: item.esEspecial ? '8px' : '0',
                  marginBottom: `${espaciadoPdf}px`
                }}
              >
                {item.esTextoLibre ? (
                  <div style={{ textAlign: 'center', fontSize: `${tamanoFuentePdf + 2}px`, fontWeight: 'bold', borderBottom: '2px dashed #000', paddingBottom: '8px' }}>
                    {item.nombre}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    
                    <div style={{ width: `${Math.max(55, tamanoFuentePdf * 2)}px`, flexShrink: 0, fontSize: `${tamanoFuentePdf - 2}px`, fontWeight: 'bold', textAlign: 'left' }}>
                      {!item.esEspecial && (item.esTape ? '📼' : `${item.trackNumero}.`)}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '15px' }}>
                      <span style={{ 
                        fontSize: `${tamanoFuentePdf}px`, 
                        fontWeight: item.esEspecial ? 'normal' : 'bold', 
                        textTransform: item.esEspecial ? 'none' : 'uppercase', 
                        fontStyle: item.esEspecial ? 'italic' : 'normal' 
                      }}>
                        {item.nombre} {item.enganchada && '>'}
                      </span>

                      {item.notas && (
                        <span style={{ 
                          fontSize: `${Math.max(12, tamanoFuentePdf - 6)}px`, 
                          color: '#555', 
                          fontStyle: 'italic',
                          fontWeight: 'normal'
                        }}>
                          ({item.notas})
                        </span>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

export default App