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

function App() {
  // Buscador e integración API iTunes
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  // Estado del Setlist
  const [setlist, setSetlist] = useState([]);
  const [gap, setGap] = useState(15);
  
  // Configuración e impresión de PDF
  const [espaciadoPdf, setEspaciadoPdf] = useState(18);
  const [tamanoFuentePdf, setTamanoFuentePdf] = useState(28);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  // Bloques especiales y extras
  const [tipoEspecial, setTipoEspecial] = useState("Speech");
  const [minutosEspecial, setMinutosEspecial] = useState(2);
  const [textoLibre, setTextoLibre] = useState("SET 1");
  const [nombreCancionExtra, setNombreCancionExtra] = useState("");
  const [duracionCancionExtra, setDuracionCancionExtra] = useState("03:30");

  // Datos del Show y Banda (Universales)
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

  // Búsqueda en API iTunes
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

  // Carga e inspección de dimensiones del Logo de la banda
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
    const nuevaEjecucion = {
      idSetlist: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      id: cancion.trackId,
      nombre: cancion.trackName,
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
    const logoHeight = 20; // 20mm
    let textStartX = 10;

    if (logoUrl) {
      if (logoDimensions.height > 0) {
        const ratio = logoDimensions.width / logoDimensions.height;
        logoWidth = logoHeight * ratio;
        if (logoWidth > 55) logoWidth = 55; // Límite máximo de ancho
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
    if (item.esTextoLibre) return '#444';
    if (item.esEspecial) return '#1e3a5f';
    if (item.esCancionExtra) return '#3e1e4a'; 
    return '#333';
  };

  const obtenerColorBorde = (item) => {
    if (item.esTextoLibre) return '4px solid #aaa';
    if (item.esEspecial) return '4px solid #4da6ff';
    if (item.esCancionExtra) return '4px solid #b388ff'; 
    return 'none';
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '15px', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh', fontSize: '0.9em' }}>
      
      <header style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '2.5em', letterSpacing: '-1px' }}>Setlist Maker</h1>
          <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '0.9em' }}>Crea y personaliza el setlist de tu banda listo para imprimir</p>
        </div>

        <div className="header-inputs">
          <div className="header-row">
            <label style={{ display: 'flex', flexDirection: 'column', flex: '1', fontWeight: 'bold', fontSize: '0.9em' }}>
              Fecha:
              <input 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)}
                style={{ marginTop: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff', fontSize: '1em' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', flex: '2', fontWeight: 'bold', fontSize: '0.9em' }}>
              Venue (Lugar):
              <input 
                type="text" 
                placeholder="Ej: Movistar Arena" 
                value={venue} 
                onChange={(e) => setVenue(e.target.value)}
                style={{ marginTop: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff', fontSize: '1em' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', flex: '2', fontWeight: 'bold', fontSize: '0.9em' }}>
              Ciudad / País:
              <input 
                type="text" 
                placeholder="Ej: Buenos Aires, Argentina" 
                value={ciudad} 
                onChange={(e) => setCiudad(e.target.value)}
                style={{ marginTop: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff', fontSize: '1em' }}
              />
            </label>
          </div>

          <div className="header-row">
            <label style={{ display: 'flex', flexDirection: 'column', flex: '2', fontWeight: 'bold', fontSize: '0.9em' }}>
              Redes / Contacto (Pie del PDF):
              <input 
                type="text" 
                placeholder="Ej: IG: @mi_banda | Spotify: Mi Banda | www.mibanda.com" 
                value={contactoRedes} 
                onChange={(e) => setContactoRedes(e.target.value)}
                style={{ marginTop: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff', fontSize: '1em' }}
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', flex: '1.5', fontWeight: 'bold', fontSize: '0.9em' }}>
              <span>Logo de la Banda (para PDF):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  id="logo-upload"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="logo-upload"
                  style={{ 
                    backgroundColor: '#333', 
                    color: '#fff', 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    border: '1px solid #555', 
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    textAlign: 'center',
                    flex: '1'
                  }}
                >
                  {logoUrl ? '📷 Cambiar Logo' : '📁 Cargar Logo'}
                </label>
                {logoUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={logoUrl} 
                      alt="Preview Logo" 
                      style={{ height: '35px', maxWidth: '70px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#fff', padding: '2px' }} 
                    />
                    <button 
                      onClick={quitarLogo}
                      title="Quitar Logo"
                      style={{ backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.85em' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="main-container">
        
        {/* BUSCADOR DE CANCIONES */}
        <section className="columna-catalogo" style={{ backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.2em', marginTop: '5px' }}>Buscador de Canciones</h2>
          
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input 
              type="text" 
              placeholder="Artista, canción o disco..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff', fontSize: '0.95em' }}
            />
            <button 
              type="submit" 
              disabled={cargandoBusqueda}
              style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: cargandoBusqueda ? 'wait' : 'pointer', fontWeight: 'bold' }}
            >
              {cargandoBusqueda ? '...' : '🔍 Buscar'}
            </button>
          </form>

          <div className="scroll-area">
            {cargandoBusqueda ? (
              <p style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Buscando en catálogo global... 🎵</p>
            ) : errorBusqueda ? (
              <p style={{ color: '#f44336', textAlign: 'center', padding: '10px 0' }}>{errorBusqueda}</p>
            ) : resultados.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '20px 10px', fontSize: '0.85em' }}>
                <p style={{ marginBottom: '10px' }}>Escribe el nombre de tu banda, artista o canción para buscar canciones publicadas.</p>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.8em', color: '#aaa' }}>Sugerencias:</span>
                  {['Queen', 'Soda Stereo', 'Metallica', 'Ghost', 'Coldplay'].map((term) => (
                    <button
                      key={term}
                      onClick={() => { setBusqueda(term); ejecutarBusqueda(term); }}
                      style={{ backgroundColor: '#333', color: '#4da6ff', border: '1px solid #555', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75em', cursor: 'pointer' }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              discosAgrupados.map((disco) => (
                <details key={disco.nombreDisco} open style={{ marginBottom: '6px', backgroundColor: '#333', borderRadius: '5px' }}>
                  <summary style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', fontWeight: 'bold', outline: 'none', fontSize: '0.85em', textAlign: 'left' }}>
                    <img 
                      src={disco.artwork} 
                      alt={disco.nombreDisco} 
                      style={{ width: '32px', height: '32px', marginRight: '10px', borderRadius: '3px', objectFit: 'cover', backgroundColor: '#111' }} 
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: '1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div>{disco.nombreDisco}</div>
                      <small style={{ color: '#aaa', fontWeight: 'normal', fontSize: '0.85em' }}>
                        {disco.artista} {disco.anio ? `• ${disco.anio}` : ''}
                      </small>
                    </div>
                  </summary>
                  <div style={{ padding: '0 8px 8px 8px' }}>
                    {disco.canciones.map((cancion) => (
                      <div key={cancion.trackId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#444', marginBottom: '4px', padding: '5px 8px', borderRadius: '4px', gap: '8px' }}>
                        <div style={{ textAlign: 'left', flex: '1', minWidth: 0 }}>
                          <strong style={{ fontSize: '0.8em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cancion.trackNumber ? `${cancion.trackNumber}. ` : ''}{cancion.trackName}
                          </strong>
                          <small style={{ color: '#aaa', fontSize: '0.7em' }}>
                            {cancion.artistName} • {formatearTiempo(Math.round((cancion.trackTimeMillis || 0) / 1000))}
                          </small>
                        </div>
                        <button 
                          onClick={() => agregarAlSetlist(cancion)}
                          title="Agregar al setlist"
                          style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontSize: '1.1em', flexShrink: 0 }}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              ))
            )}
          </div>
        </section>

        {/* SETLIST PRINCIPAL */}
        <section className="columna-setlist" style={{ backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: '5px 0', fontSize: '1.2em' }}>Tu Setlist</h2>
            {setlistRenderizado.length > 0 && (
              <button 
                onClick={vaciarSetlist}
                style={{ backgroundColor: 'transparent', color: '#f44336', border: '1px solid #f44336', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}
              >
                🗑️ Vaciar Setlist
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
                    borderRadius: '5px', 
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
                      <span style={{ color: '#888', cursor: 'grab', fontSize: '1em', paddingRight: '10px' }}>☰</span>
                      <input 
                        type="text" 
                        value={item.nombre} 
                        onChange={(e) => actualizarItemSetlist(item.idSetlist, 'nombre', e.target.value)}
                        style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.2em', backgroundColor: 'transparent', border: 'none', color: '#fff', borderBottom: '1px dashed #666' }}
                      />
                      <button 
                        onClick={() => eliminarDelSetlist(item.idSetlist)}
                        style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8em', marginLeft: '10px' }}
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '150px' }}>
                          <span style={{ color: '#888', cursor: 'grab', fontSize: '1em', paddingRight: '5px' }}>☰</span>
                          <strong style={{ fontSize: '1em' }}>
                            {!item.esEspecial && (item.esTape ? '📼 ' : `${item.trackNumero}. `)} 
                            {item.esEspecial ? `🎭 ${item.nombre}` : item.nombre}
                          </strong>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.85em' }}>{formatearTiempo(item.duracionBase + Number(item.tiempoExtra))}</span>
                          <button 
                            onClick={() => eliminarDelSetlist(item.idSetlist)}
                            style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8em' }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>

                      <div className="controles-cancion">
                        {!item.esEspecial && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }} title="Pista / Tape">
                            <input 
                              type="checkbox" 
                              checked={item.esTape} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'esTape', e.target.checked)} 
                              style={{ transform: 'scale(1.2)' }}
                            />
                            <span style={{ fontSize: '1.2em' }}>📼</span>
                          </label>
                        )}
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }} title="Enganchada al siguiente track">
                          <input 
                            type="checkbox" 
                            checked={item.enganchada} 
                            onChange={(e) => actualizarItemSetlist(item.idSetlist, 'enganchada', e.target.checked)} 
                            style={{ transform: 'scale(1.2)' }}
                          />
                          <strong style={{ fontSize: '1.2em', color: item.enganchada ? '#4CAF50' : '#888' }}>{'>'}</strong>
                        </label>

                        {item.esEspecial ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Duración (min):
                            <input 
                              type="number" 
                              value={item.duracionBase / 60} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'duracionBase', Number(e.target.value) * 60)}
                              style={{ width: '45px', padding: '4px', borderRadius: '3px', border: 'none', fontSize: '1em' }}
                            />
                          </label>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Extra (seg):
                            <input 
                              type="number" 
                              value={item.tiempoExtra} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'tiempoExtra', e.target.value)}
                              style={{ width: '45px', padding: '4px', borderRadius: '3px', border: 'none', fontSize: '1em' }}
                            />
                          </label>
                        )}

                        <input 
                          type="text" 
                          placeholder="Notas..." 
                          value={item.notas} 
                          onChange={(e) => actualizarItemSetlist(item.idSetlist, 'notas', e.target.value)}
                          style={{ flex: '1', minWidth: '100px', padding: '5px 8px', borderRadius: '3px', border: 'none', fontSize: '1em' }}
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
        <section className="columna-panel" style={{ backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.2em', marginTop: '5px' }}>Panel de Control</h2>
          
          <button 
            onClick={() => setMostrarPreview(true)}
            disabled={setlistRenderizado.length === 0}
            style={{ width: '100%', backgroundColor: setlistRenderizado.length > 0 ? '#ff9800' : '#555', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: setlistRenderizado.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '1.1em', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            🔍 VISTA PREVIA DEL PDF
          </button>

          <div style={{ backgroundColor: '#111', padding: '15px', borderRadius: '6px', textAlign: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#aaa', fontSize: '0.9em' }}>Tiempo Total Estimado</h3>
            <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#4CAF50' }}>
              {formatearTiempoTotal(tiempoTotalShow)}
            </div>
          </div>

          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9em' }}>
              Tiempo muerto (Gap) en seg:
            </label>
            <input 
              type="number" 
              value={gap} 
              onChange={(e) => setGap(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box', fontSize: '1em' }}
            />
          </div>

          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em' }}>Insertar Bloque</h3>
            
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85em', color: '#ccc' }}>Tipo:</label>
            <select 
              value={tipoEspecial} 
              onChange={(e) => setTipoEspecial(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: 'none', boxSizing: 'border-box', fontSize: '1em' }}
            >
              <option value="Speech">Speech</option>
              <option value="Intervalo">Intervalo</option>
              <option value="Encore">Encore</option>
              <option value="Texto Libre">Texto Libre (Separador)</option>
              <option value="Canción">Canción (Fuera de catálogo)</option>
            </select>

            {tipoEspecial === "Texto Libre" ? (
              <>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85em', color: '#ccc' }}>Texto a mostrar:</label>
                <input 
                  type="text" 
                  value={textoLibre} 
                  onChange={(e) => setTextoLibre(e.target.value)}
                  placeholder="Ej: SET 1"
                  style={{ width: '100%', padding: '8px', marginBottom: '15px', borderRadius: '4px', border: 'none', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box', fontSize: '1em', textTransform: 'uppercase' }}
                />
              </>
            ) : tipoEspecial === "Canción" ? (
              <>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85em', color: '#ccc' }}>Nombre de la canción:</label>
                <input 
                  type="text" 
                  value={nombreCancionExtra} 
                  onChange={(e) => setNombreCancionExtra(e.target.value)}
                  placeholder="Ej: Song Title"
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box', fontSize: '1em' }}
                />
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85em', color: '#ccc' }}>Duración (mm:ss):</label>
                <input 
                  type="text" 
                  value={duracionCancionExtra} 
                  onChange={(e) => setDuracionCancionExtra(e.target.value)}
                  placeholder="03:30"
                  style={{ width: '100%', padding: '8px', marginBottom: '15px', borderRadius: '4px', border: 'none', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box', fontSize: '1em' }}
                />
              </>
            ) : (
              <>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85em', color: '#ccc' }}>Minutos estimados:</label>
                <input 
                  type="number" 
                  value={minutosEspecial} 
                  onChange={(e) => setMinutosEspecial(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '15px', borderRadius: '4px', border: 'none', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box', fontSize: '1em' }}
                />
              </>
            )}

            <button 
              onClick={agregarBloqueEspecial}
              style={{ width: '100%', backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em' }}
            >
              + Agregar Bloque
            </button>
          </div>

        </section>

      </main>

      {/* POPUP / MODAL DE VISTA PREVIA */}
      {mostrarPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box' }}>
          
          <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', width: '100%', maxWidth: '900px', height: '95vh', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', borderBottom: '1px solid #444', paddingBottom: '15px', flexWrap: 'wrap' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {/* Control Interlineado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Interlineado:</span>
                  <button onClick={() => setEspaciadoPdf(Math.max(0, espaciadoPdf - 2))} style={{ padding: '5px 12px', fontSize: '1.2em', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#444', color: '#fff' }}>-</button>
                  <span style={{ fontSize: '1.2em', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{espaciadoPdf}</span>
                  <button onClick={() => setEspaciadoPdf(espaciadoPdf + 2)} style={{ padding: '5px 12px', fontSize: '1.2em', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#444', color: '#fff' }}>+</button>
                </div>
                
                {/* Control Tamaño de Fuente */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '15px', borderLeft: '1px solid #555' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Fuente:</span>
                  <button onClick={() => setTamanoFuentePdf(Math.max(12, tamanoFuentePdf - 2))} style={{ padding: '5px 12px', fontSize: '1.2em', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#444', color: '#fff' }}>-</button>
                  <span style={{ fontSize: '1.2em', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{tamanoFuentePdf}</span>
                  <button onClick={() => setTamanoFuentePdf(Math.min(60, tamanoFuentePdf + 2))} style={{ padding: '5px 12px', fontSize: '1.2em', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#444', color: '#fff' }}>+</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => procesarPDF('descargar')}
                  style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em' }}
                >
                  📥 DESCARGAR PDF
                </button>
                <button 
                  onClick={() => setMostrarPreview(false)}
                  style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em' }}
                >
                  ✕ CERRAR
                </button>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#525659', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
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
              * Si la hoja no se muestra correctamente en tu celular, <a href={pdfUrl} target="_blank" rel="noreferrer" style={{color: '#4da6ff', textDecoration: 'underline'}}>tocá acá para verla en otra pestaña</a>.
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
                    
                    {/* Número de track o ícono */}
                    <div style={{ width: `${Math.max(55, tamanoFuentePdf * 2)}px`, flexShrink: 0, fontSize: `${tamanoFuentePdf - 2}px`, fontWeight: 'bold', textAlign: 'left' }}>
                      {!item.esEspecial && (item.esTape ? '📼' : `${item.trackNumero}.`)}
                    </div>
                    
                    {/* Contenedor del nombre y notas */}
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