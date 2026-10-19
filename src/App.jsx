import { useState, useRef, useEffect } from 'react'
import html2pdf from 'html2pdf.js'
import { supabase } from './supabaseClient'
import './App.css'

// Helper para subir imágenes al bucket público de Supabase Storage
const subirLogoASupabase = async (file, userId, bandaId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${bandaId || Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error al subir el logo a Supabase:', error);
    return null;
  }
};

const translations = {
  es: {
    themeDark: 'Oscuro',
    themeLight: 'Claro',
    langLabel: 'ES',
    myBandTitle: 'Mi Banda',
    bandNameLabel: 'Nombre:',
    bandNamePlaceholder: 'Ej: Nombre de tu Banda',
    uploadLogo: 'SUBIR LOGO',
    logoLabel: 'Logo de la Banda:',
    socialContactLabel: 'Redes / Contacto:',
    socialContactPlaceholder: 'Ej: IG: @mi_banda | www.mibanda.com',

    upcomingShowTitle: 'Próximo Show',
    dateLabel: 'Fecha:',
    venueLabel: 'Venue (Lugar):',
    venuePlaceholder: 'Ej: Movistar Arena',
    cityLabel: 'Ciudad / País:',
    cityPlaceholder: 'Ej: Buenos Aires, Argentina',

    searchTitle: 'Buscador',
    searchPlaceholder: 'Artista, canción...',
    clearSearch: 'Limpiar buscador',
    searchSearching: 'Buscando canciones... 🎵',
    searchError: 'No se pudieron obtener resultados. Revisa tu conexión.',
    searchEmpty: 'Escribe el nombre de un artista o canción arriba para buscar...',
    singlesVarious: 'Sencillos / Varios',

    setlistTitle: 'Tu Setlist',
    clearSetlistBtn: 'VACIAR',
    confirmClear: '⚠️ ¿Estás seguro de que quieres borrar todo el setlist?',
    setlistEmpty: 'Busca y agrega canciones desde el catálogo para armar tu lista...',
    tapeTooltip: 'Pista / Tape',
    segueTooltip: 'Enganchada al siguiente track',
    durationLabel: 'Duración:',
    addLabel: 'Sumar:',
    secLabel: 'seg',
    minLabel: 'min',
    notesPlaceholder: 'Notas...',
    removeTooltip: 'Quitar',
    editNameTooltip: 'Haz clic para editar el nombre',

    controlPanelTitle: 'Panel de Control',
    gapLabel: 'Pausa entre temas:',
    specialRowTitle: 'Fila Especial',
    typeLabel: 'Tipo:',
    speechOption: 'Speech',
    intermissionOption: 'Intervalo',
    encoreOption: 'Encore',
    freeTextOption: 'Texto Libre (Separador)',
    customSongOption: 'Canción (Fuera de catálogo)',
    textToShowLabel: 'Texto a mostrar:',
    textToShowPlaceholder: 'Ej: SET 1',
    songTitleLabel: 'Nombre de la canción:',
    songTitlePlaceholder: 'Ej: Song Title',
    durationMmSsLabel: 'Duración (mm:ss):',
    addSpecialRowBtn: '+ FILA',
    totalEstimatedTime: 'Tiempo Total Estimado',
    exportBtn: 'EXPORTAR',

    lineSpacing: 'Interlineado:',
    fontSize: 'Fuente:',
    downloadBtn: 'DESCARGAR',
    closeBtn: '✕ CERRAR',
    generatingPreview: 'Generando vista previa... ⏳',
    pdfMobileNotice: '* Si la hoja no se muestra correctamente en tu celular, ',
    pdfMobileNoticeLink: 'tocá acá para verla en otra pestaña',

    navMyBand: 'Mi Banda',
    navUpcomingShow: 'Próximo Show',
    navSearch: 'Buscador',
    navSetlist: 'Setlist',
    navPanel: 'Panel de Control',

    defaultSetText: 'SET 1',
    untitledSong: 'Canción sin título',

    loginGoogle: 'Iniciar sesión con Google',
    logout: 'Cerrar sesión',
    welcomeTitle: '¡Bienvenido a Setlist Creator!',
    welcomeSub: 'Crea setlists profesionales para tu banda, calcula la duración exacta de tu show y exporta PDFs en segundos.',
    enterGuest: 'Continuar como invitado',
    onboardingTitle: '¡Empecemos!',
    onboardingSub: 'Para comenzar, ingresa el nombre de tu primera banda:',
    onboardingBtn: 'Guardar y empezar',
    guestMode: 'Modo Invitado',
    saveBand: 'Guardar Banda',
    updateBand: 'Actualizar Banda',
    newBandOption: '+ Nueva Banda',
    savingBand: 'Guardando...',
    bandSavedSuccess: '¡Banda guardada con éxito!',
    bandUpdatedSuccess: '¡Banda actualizada!',
    bandNameRequired: 'El nombre de la banda es obligatorio.'
  },
  en: {
    themeDark: 'Dark',
    themeLight: 'Light',
    langLabel: 'EN',
    myBandTitle: 'My Band',
    bandNameLabel: 'Name:',
    bandNamePlaceholder: 'e.g. Your Band Name',
    uploadLogo: 'UPLOAD LOGO',
    logoLabel: 'Band Logo:',
    socialContactLabel: 'Socials / Contact:',
    socialContactPlaceholder: 'e.g. IG: @my_band | www.myband.com',

    upcomingShowTitle: 'Upcoming Show',
    dateLabel: 'Date:',
    venueLabel: 'Venue:',
    venuePlaceholder: 'e.g. Madison Square Garden',
    cityLabel: 'City / Country:',
    cityPlaceholder: 'e.g. London, UK',

    searchTitle: 'Search',
    searchPlaceholder: 'Artist, song...',
    clearSearch: 'Clear search',
    searchSearching: 'Searching songs... 🎵',
    searchError: 'Could not fetch results. Check your connection.',
    searchEmpty: 'Type an artist or song name above to search...',
    singlesVarious: 'Singles / Various',

    setlistTitle: 'Your Setlist',
    clearSetlistBtn: 'CLEAR',
    confirmClear: '⚠️ Are you sure you want to clear the entire setlist?',
    setlistEmpty: 'Search and add songs from the catalog to build your list...',
    tapeTooltip: 'Backing Track / Tape',
    segueTooltip: 'Segue to next track',
    durationLabel: 'Duration:',
    addLabel: 'Add:',
    secLabel: 'sec',
    minLabel: 'min',
    notesPlaceholder: 'Notes...',
    removeTooltip: 'Remove',
    editNameTooltip: 'Click to edit name',

    controlPanelTitle: 'Control Panel',
    gapLabel: 'Pause between songs:',
    specialRowTitle: 'Special Row',
    typeLabel: 'Type:',
    speechOption: 'Speech',
    intermissionOption: 'Intermission',
    encoreOption: 'Encore',
    freeTextOption: 'Free Text (Divider)',
    customSongOption: 'Song (Custom)',
    textToShowLabel: 'Text to show:',
    textToShowPlaceholder: 'e.g. SET 1',
    songTitleLabel: 'Song title:',
    songTitlePlaceholder: 'e.g. Song Title',
    durationMmSsLabel: 'Duration (mm:ss):',
    addSpecialRowBtn: '+ ROW',
    totalEstimatedTime: 'Estimated Total Time',
    exportBtn: 'EXPORT',

    lineSpacing: 'Line Spacing:',
    fontSize: 'Font Size:',
    downloadBtn: 'DOWNLOAD',
    closeBtn: '✕ CLOSE',
    generatingPreview: 'Generating preview... ⏳',
    pdfMobileNotice: "* If the document doesn't display properly on mobile, ",
    pdfMobileNoticeLink: 'click here to open in another tab',

    navMyBand: 'My Band',
    navUpcomingShow: 'Upcoming Show',
    navSearch: 'Search',
    navSetlist: 'Setlist',
    navPanel: 'Control Panel',

    defaultSetText: 'SET 1',
    untitledSong: 'Untitled Song',

    loginGoogle: 'Sign in with Google',
    logout: 'Sign out',
    welcomeTitle: 'Welcome to Setlist Creator!',
    welcomeSub: 'Build professional setlists for your band, calculate exact show durations, and export PDFs in seconds.',
    enterGuest: 'Continue as guest',
    onboardingTitle: "Let's get started!",
    onboardingSub: "Enter your first band's name to begin:",
    onboardingBtn: 'Save & start',
    guestMode: 'Guest Mode',
    saveBand: 'Save Band',
    updateBand: 'Update Band',
    newBandOption: '+ New Band',
    savingBand: 'Saving...',
    bandSavedSuccess: 'Band saved successfully!',
    bandUpdatedSuccess: 'Band updated!',
    bandNameRequired: 'Band name is required.'
  }
};

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

const limpiarTituloCancion = (nombreOriginal) => {
  if (!nombreOriginal) return '';
  const patronInnecesario = /[\(\[\{]\s*.*?\b(remaster|remastered|version|edit|mix|live|deluxe|bonus|track|anniversary|single|mono|stereo|digital|take|demo|edition)\b.*?[\)\]\}]/gi;
  let tituloLimpio = nombreOriginal.replace(patronInnecesario, '');
  return tituloLimpio.replace(/\s+/g, ' ').trim();
};

function App() {
  const [tema, setTema] = useState('dark');
  const [idioma, setIdioma] = useState('es');
  const t = translations[idioma];

  // Estados de Autenticación y Modal
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [nombrePrimeraBanda, setNombrePrimeraBanda] = useState('');
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  // Estados de Gestión de Bandas (Fase 3)
  const [misBandas, setMisBandas] = useState([]);
  const [bandaSeleccionadaId, setBandaSeleccionadaId] = useState('nueva');
  const [cargandoBanda, setCargandoBanda] = useState(false);
  const [archivoLogo, setArchivoLogo] = useState(null);

  const bandasInicializadasRef = useRef(false);

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

  const [nombreBanda, setNombreBanda] = useState("");
  const [fecha, setFecha] = useState("");
  const [venue, setVenue] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [contactoRedes, setContactoRedes] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoDimensions, setLogoDimensions] = useState({ width: 0, height: 0 });

  const dragItem = useRef();
  const dragOverItem = useRef();

  // Escuchar cambios de autenticación sin sobreescribir borrador al cambiar de pestaña
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        const invitadoPrevio = localStorage.getItem('setlist_guest_session');
        if (!invitadoPrevio) {
          setMostrarBienvenida(true);
        }
      } else {
        comprobarBandasExistentes(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        setMostrarBienvenida(false);
        // Solo recargar si aún no habíamos cargado las bandas en memoria
        if (!bandasInicializadasRef.current) {
          comprobarBandasExistentes(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const comprobarBandasExistentes = async (userId, forzarCarga = false) => {
    try {
      const { data, error } = await supabase
        .from('bandas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMisBandas(data);
        if (data.length === 0) {
          setMostrarOnboarding(true);
        } else if (!bandasInicializadasRef.current || forzarCarga) {
          bandasInicializadasRef.current = true;
          const idGuardado = localStorage.getItem('setlist_selected_band_id');
          const bandaAMostrar = data.find(b => b.id === idGuardado) || data[0];
          seleccionarBanda(bandaAMostrar);
        }
      }
    } catch (err) {
      console.error("Error al verificar bandas:", err);
    }
  };

  const seleccionarBanda = (banda) => {
    if (!banda || banda === 'nueva') {
      setBandaSeleccionadaId('nueva');
      localStorage.setItem('setlist_selected_band_id', 'nueva');
      setNombreBanda('');
      setContactoRedes('');
      setLogoUrl(null);
      setArchivoLogo(null);
    } else {
      setBandaSeleccionadaId(banda.id);
      localStorage.setItem('setlist_selected_band_id', banda.id);
      setNombreBanda(banda.nombre || '');
      setContactoRedes(banda.contacto_redes || '');
      setLogoUrl(banda.logo_url || null);
      setArchivoLogo(null);
    }
  };

  const guardarBandaDB = async () => {
    if (!nombreBanda.trim()) {
      alert(t.bandNameRequired);
      return;
    }
    if (!user) return;

    setCargandoBanda(true);
    try {
      let urlFinalLogo = logoUrl;

      if (archivoLogo) {
        const urlSubida = await subirLogoASupabase(
          archivoLogo,
          user.id,
          bandaSeleccionadaId !== 'nueva' ? bandaSeleccionadaId : null
        );
        if (urlSubida) urlFinalLogo = urlSubida;
      }

      if (bandaSeleccionadaId === 'nueva') {
        const { data, error } = await supabase
          .from('bandas')
          .insert({
            user_id: user.id,
            nombre: nombreBanda.trim(),
            contacto_redes: contactoRedes.trim(),
            logo_url: urlFinalLogo
          })
          .select()
          .single();

        if (!error && data) {
          const nuevasBandas = [...misBandas, data];
          setMisBandas(nuevasBandas);
          seleccionarBanda(data);
          alert(t.bandSavedSuccess);
        }
      } else {
        const { error } = await supabase
          .from('bandas')
          .update({
            nombre: nombreBanda.trim(),
            contacto_redes: contactoRedes.trim(),
            logo_url: urlFinalLogo
          })
          .eq('id', bandaSeleccionadaId)
          .eq('user_id', user.id);

        if (!error) {
          const bandasActualizadas = misBandas.map(b => 
            b.id === bandaSeleccionadaId 
              ? { ...b, nombre: nombreBanda.trim(), contacto_redes: contactoRedes.trim(), logo_url: urlFinalLogo } 
              : b
          );
          setMisBandas(bandasActualizadas);
          alert(t.bandUpdatedSuccess);
        }
      }
    } catch (err) {
      console.error('Error al guardar la banda:', err);
    } finally {
      setCargandoBanda(false);
    }
  };

  const handleLoginGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuUsuarioAbierto(false);
    localStorage.removeItem('setlist_guest_session');
    localStorage.removeItem('setlist_selected_band_id');
    bandasInicializadasRef.current = false;
    setMisBandas([]);
    setBandaSeleccionadaId('nueva');
    setMostrarBienvenida(true);
  };

  const continuarComoInvitado = () => {
    localStorage.setItem('setlist_guest_session', 'true');
    setMostrarBienvenida(false);
  };

  const guardarOnboardingBanda = async () => {
    if (!nombrePrimeraBanda.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('bandas')
        .insert({
          user_id: user.id,
          nombre: nombrePrimeraBanda.trim()
        })
        .select()
        .single();

      if (!error && data) {
        bandasInicializadasRef.current = true;
        setMisBandas([data]);
        seleccionarBanda(data);
        setMostrarOnboarding(false);
      }
    } catch (err) {
      console.error("Error al crear primera banda:", err);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  useEffect(() => {
    let timeoutId;
    if (mostrarPreview) {
      setCargandoPdf(true);
      timeoutId = setTimeout(() => {
        procesarPDF('preview');
      }, 600);
    }
    return () => clearTimeout(timeoutId);
  }, [mostrarPreview, espaciadoPdf, tamanoFuentePdf, idioma]);

  const toggleTheme = () => {
    setTema(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleIdioma = () => {
    setIdioma(prev => prev === 'es' ? 'en' : 'es');
  };

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
      setErrorBusqueda(t.searchError);
    } finally {
      setCargandoBusqueda(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    ejecutarBusqueda();
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setResultados([]);
    setErrorBusqueda(null);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoLogo(file);
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
    setArchivoLogo(null);
    setLogoDimensions({ width: 0, height: 0 });
  };

  const agruparPorDisco = () => {
    const agrupado = {};
    resultados.forEach((track) => {
      const discoNombre = track.collectionName || t.singlesVarious;
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
        nombre: textoLibre || t.defaultSetText,
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
        nombre: nombreCancionExtra || t.untitledSong,
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
      let nombreMostrar = tipoEspecial;
      if (tipoEspecial === "Speech") nombreMostrar = t.speechOption;
      if (tipoEspecial === "Intervalo") nombreMostrar = t.intermissionOption;
      if (tipoEspecial === "Encore") nombreMostrar = t.encoreOption;

      nuevoBloque = {
        idSetlist: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        nombre: nombreMostrar,
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
    if (window.confirm(t.confirmClear)) {
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
      
      if (!esUltimo && !item.enganchada && !item.esEspecial) {
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
    } else if (nombreBanda.trim()) {
      const textoBanda = nombreBanda.trim().toUpperCase();
      const anchoEstimado = Math.min(80, Math.max(35, textoBanda.length * 4.2));
      textStartX = 10 + anchoEstimado + 5;
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

        const labelFecha = idioma === 'en' ? 'Date' : 'Fecha';
        const labelLugar = idioma === 'en' ? 'Venue' : 'Lugar';
        const labelCiudad = idioma === 'en' ? 'City' : 'Ciudad';

        let fechaStr = `${labelFecha}: _____`;
        if (fecha) {
          const partes = fecha.split('-'); 
          if (partes.length === 3) {
            fechaStr = `${labelFecha}: ${partes[2]}/${partes[1]}/${partes[0]}`; 
          }
        }

        const venueStr = `${labelLugar}: ${venue ? venue : '_____'}`;
        const ciudadStr = `${labelCiudad}: ${ciudad ? ciudad : '_____'}`;

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
            pdf.setFont("helvetica", "bolditalic");
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
    if (item.esTextoLibre) return 'var(--free-text-bg)';
    if (item.esEspecial) return 'var(--special-bg)';
    if (item.esCancionExtra) return 'var(--extra-song-bg)'; 
    return 'var(--card-bg)';
  };

  const obtenerColorBorde = (item) => {
    if (item.esTextoLibre) return '4px solid #8a8a9e';
    if (item.esEspecial) return '4px solid #008dfe';
    if (item.esCancionExtra) return '4px solid #9030fd'; 
    return 'none';
  };

  return (
    <div className="app-container">
      
      {/* HEADER CON BOTONES SUPERIORES Y LOGO */}
      <header className="app-header">
        <div className="header-top-bar">
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={toggleTheme} 
              className="btn-header-action" 
              title={tema === 'dark' ? 'Cambiar a Tema Claro' : 'Switch to Dark Theme'}
            >
              <i className={tema === 'dark' ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
              <span>{tema === 'dark' ? t.themeLight : t.themeDark}</span>
            </button>

            <button 
              onClick={toggleIdioma} 
              className="btn-header-action" 
              title={idioma === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <i className="fa-solid fa-globe"></i>
              <span>{idioma === 'es' ? 'EN' : 'ES'}</span>
            </button>
          </div>

          {/* Menú de Autenticación / Usuario */}
          {session ? (
            <div className="user-menu-container">
              <button 
                className="user-avatar-btn"
                onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
              >
                <img 
                  src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/28'} 
                  alt={user?.user_metadata?.full_name || 'Usuario'} 
                />
                <span>{user?.user_metadata?.full_name?.split(' ')[0] || 'Mi Cuenta'}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.8em' }}></i>
              </button>

              {menuUsuarioAbierto && (
                <div className="user-dropdown-menu">
                  <div style={{ padding: '8px 16px', fontSize: '0.8em', color: 'var(--text-muted)' }}>
                    {user?.email}
                  </div>
                  <div className="user-dropdown-divider"></div>
                  <button className="user-dropdown-item" onClick={handleLogout} style={{ color: 'var(--btn-danger)' }}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLoginGoogle} className="btn-google" style={{ height: '36px', padding: '0 16px', width: 'auto', fontSize: '0.85em' }}>
              <i className="fa-brands fa-google"></i>
              <span>{t.loginGoogle}</span>
            </button>
          )}

        </div>

        <img 
          key={tema}
          src={tema === 'light' ? '/header-logo-light.png' : '/header-logo.png'} 
          alt="Setlist Creator" 
          className="header-banner"
          onError={(e) => {
            if (e.target.src.includes('header-logo-light.png')) {
              e.target.src = '/header-logo.png';
              return;
            }
            e.target.style.display = 'none';
            if (!document.getElementById('fallback-title')) {
              const h1 = document.createElement('h1');
              h1.id = 'fallback-title';
              h1.innerText = 'SETLIST CREATOR';
              h1.style.margin = '0';
              h1.style.fontSize = '2em';
              h1.style.letterSpacing = '2px';
              e.target.parentNode.appendChild(h1);
            }
          }}
        />
      </header>

      {/* NAVBAR MOBILE */}
      <div className="mobile-nav-container">
        <nav className="mobile-nav">
          <a href="#sec-mi-banda" className="mobile-nav-link" title={t.navMyBand}>
            <i className="fa-solid fa-people-group"></i>
          </a>
          <a href="#sec-proximo-show" className="mobile-nav-link" title={t.navUpcomingShow}>
            <i className="fa-solid fa-calendar-days"></i>
          </a>
          <a href="#sec-buscador" className="mobile-nav-link" title={t.navSearch}>
            <i className="fa-solid fa-magnifying-glass"></i>
          </a>
          <a href="#sec-setlist" className="mobile-nav-link" title={t.navSetlist}>
            <i className="fa-solid fa-file-lines"></i>
          </a>
          <a href="#sec-panel" className="mobile-nav-link" title={t.navPanel}>
            <i className="fa-solid fa-gear"></i>
          </a>
        </nav>
      </div>

      {/* MI BANDA Y PRÓXIMO SHOW */}
      <section className="band-show-container">
        
        {/* MI BANDA */}
        <div id="sec-mi-banda" className="section-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 className="section-title-right" style={{ margin: 0 }}>{t.myBandTitle}</h2>
            
            {/* Selector de Bandas */}
            {user && (
              <select 
                value={bandaSeleccionadaId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'nueva') {
                    seleccionarBanda('nueva');
                  } else {
                    const bandaEncontrada = misBandas.find(b => b.id === val);
                    seleccionarBanda(bandaEncontrada);
                  }
                }}
                className="custom-input"
                style={{ fontSize: '0.85em', padding: '4px 8px', maxWidth: '180px' }}
              >
                <option value="nueva">{t.newBandOption}</option>
                {misBandas.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            )}
          </div>
          
          {/* Campo Nombre ocupando el 100% */}
          <div className="field-group">
            <label className="field-label">{t.bandNameLabel}</label>
            <input 
              type="text" 
              className="custom-input"
              placeholder={t.bandNamePlaceholder} 
              value={nombreBanda} 
              onChange={(e) => setNombreBanda(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Fila separada para el Logo */}
          <div className="field-group">
            <label className="field-label">{t.logoLabel}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="file" 
                accept="image/*"
                id="logo-upload"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              
              <label htmlFor="logo-upload" className="btn-pill" style={{ flexShrink: 0 }}>
                <i className="fa-regular fa-image btn-icon"></i>
                <span>{t.uploadLogo}</span>
              </label>

              {logoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <img 
                    src={logoUrl} 
                    alt="Preview Logo" 
                    style={{ height: '38px', maxWidth: '90px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#fff', padding: '2px' }} 
                  />
                  <button 
                    onClick={quitarLogo}
                    title={t.removeTooltip}
                    style={{ backgroundColor: 'var(--btn-danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em' }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Redes / Contacto */}
          <div className="field-group">
            <label className="field-label">{t.socialContactLabel}</label>
            <input 
              type="text" 
              className="custom-input"
              placeholder={t.socialContactPlaceholder} 
              value={contactoRedes} 
              onChange={(e) => setContactoRedes(e.target.value)}
            />
          </div>

          {/* Botón Guardar / Actualizar Banda */}
          {user && (
            <button 
              onClick={guardarBandaDB}
              disabled={cargandoBanda || !nombreBanda.trim()}
              className="btn-pill"
              style={{ width: '100%', marginTop: '12px', justifyContent: 'center', opacity: nombreBanda.trim() ? 1 : 0.6 }}
            >
              <i className="fa-solid fa-floppy-disk btn-icon"></i>
              <span>{cargandoBanda ? t.savingBand : (bandaSeleccionadaId === 'nueva' ? t.saveBand : t.updateBand)}</span>
            </button>
          )}
        </div>

        {/* PRÓXIMO SHOW */}
        <div id="sec-proximo-show" className="section-block">
          <h2 className="section-title-right">{t.upcomingShowTitle}</h2>
          
          <div className="field-group">
            <label className="field-label">{t.dateLabel}</label>
            <input 
              type="date" 
              className="custom-input"
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">{t.venueLabel}</label>
            <input 
              type="text" 
              className="custom-input"
              placeholder={t.venuePlaceholder} 
              value={venue} 
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">{t.cityLabel}</label>
            <input 
              type="text" 
              className="custom-input"
              placeholder={t.cityPlaceholder} 
              value={ciudad} 
              onChange={(e) => setCiudad(e.target.value)}
            />
          </div>
        </div>

      </section>

      {/* ÁREA PRINCIPAL */}
      <main className="main-container">
        
        {/* BUSCADOR DE CANCIONES */}
        <section id="sec-buscador" className="columna-catalogo" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxSizing: 'border-box', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1.1em', marginTop: '0', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            {t.searchTitle}
          </h2>
          
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
            <input 
              type="text" 
              className="custom-input"
              placeholder={t.searchPlaceholder} 
              value={busqueda} 
              onChange={(e) => {
                setBusqueda(e.target.value);
                if (!e.target.value.trim()) {
                  setResultados([]);
                }
              }}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button 
              type="submit" 
              disabled={cargandoBusqueda}
              className="btn-round"
              title={t.searchTitle}
            >
              <i className="fa-solid fa-magnifying-glass btn-icon"></i>
            </button>

            {(busqueda || resultados.length > 0) && (
              <button 
                type="button" 
                onClick={limpiarBusqueda}
                className="btn-danger-round"
                style={{ width: '40px', height: '40px', fontSize: '0.9em' }}
                title={t.clearSearch}
              >
                ✕
              </button>
            )}
          </form>

          <div className="scroll-area">
            {cargandoBusqueda ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>{t.searchSearching}</p>
            ) : errorBusqueda ? (
              <p style={{ color: 'var(--btn-danger)', textAlign: 'center', padding: '10px 0', fontSize: '0.85em' }}>{errorBusqueda}</p>
            ) : resultados.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 10px', fontSize: '0.85em', fontStyle: 'italic' }}>
                {t.searchEmpty}
              </p>
            ) : (
              discosAgrupados.map((disco) => (
                <details key={disco.nombreDisco} open className="disco-details">
                  <summary className="disco-summary">
                    <img 
                      src={disco.artwork} 
                      alt={disco.nombreDisco} 
                      style={{ width: '32px', height: '32px', marginRight: '10px', borderRadius: '4px', objectFit: 'cover', backgroundColor: '#111', flexShrink: 0 }} 
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: '1', minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{disco.nombreDisco}</div>
                      <small className="disco-artist-sub">
                        {disco.artista} {disco.anio ? `• ${disco.anio}` : ''}
                      </small>
                    </div>
                  </summary>
                  <div style={{ padding: '0 8px 8px 8px' }}>
                    {disco.canciones.map((cancion) => {
                      const tituloLimpio = limpiarTituloCancion(cancion.trackName);
                      return (
                        <div key={cancion.trackId} className="cancion-item">
                          <div style={{ textAlign: 'left', flex: '1', minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <strong style={{ fontSize: '0.8em', display: 'block', lineHeight: '1.2', color: 'var(--text-main)' }}>
                              {cancion.trackNumber ? `${cancion.trackNumber}. ` : ''}{tituloLimpio}
                            </strong>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.7em', display: 'block', marginTop: '2px' }}>
                              {formatearTiempo(Math.round((cancion.trackTimeMillis || 0) / 1000))}
                            </small>
                          </div>
                          <button 
                            onClick={() => agregarAlSetlist(cancion)}
                            title="Agregar al setlist"
                            style={{ backgroundColor: 'var(--btn-blue)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', flexShrink: 0 }}
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
        <section id="sec-setlist" className="columna-setlist" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            <h2 style={{ margin: '0', fontSize: '1.1em', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)' }}>
              {t.setlistTitle}
            </h2>
            {setlistRenderizado.length > 0 && (
              <button 
                onClick={vaciarSetlist}
                className="btn-danger-pill"
                style={{ height: '32px', padding: '0 12px', fontSize: '0.75em' }}
              >
                <i className="fa-regular fa-trash-can"></i>
                <span>{t.clearSetlistBtn}</span>
              </button>
            )}
          </div>
          
          {setlistRenderizado.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9em' }}>{t.setlistEmpty}</p>
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
                      <i className="fa-solid fa-grip-lines" style={{ color: 'var(--text-muted)', cursor: 'grab', paddingRight: '10px' }}></i>
                      <input 
                        type="text" 
                        value={item.nombre} 
                        onChange={(e) => actualizarItemSetlist(item.idSetlist, 'nombre', e.target.value)}
                        style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', borderBottom: '1px dashed var(--text-muted)' }}
                      />
                      <button 
                        onClick={() => eliminarDelSetlist(item.idSetlist)}
                        className="btn-danger-round"
                        title={t.removeTooltip}
                        style={{ marginLeft: '10px' }}
                      >
                        -
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px' }}>
                          <i className="fa-solid fa-grip-lines" style={{ color: 'var(--text-muted)', cursor: 'grab' }}></i>
                          <span style={{ fontWeight: 'bold', fontSize: '1em', color: 'var(--text-main)' }}>
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
                              color: 'var(--text-main)', 
                              borderBottom: '1px solid transparent',
                              padding: '2px 4px',
                              borderRadius: '3px'
                            }}
                            onFocus={(e) => e.target.style.borderBottom = '1px dashed var(--btn-blue)'}
                            onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
                            title={t.editNameTooltip}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{formatearTiempo(item.duracionBase + Number(item.tiempoExtra))}</span>
                          <button 
                            onClick={() => eliminarDelSetlist(item.idSetlist)}
                            className="btn-danger-round"
                            title={t.removeTooltip}
                          >
                            -
                          </button>
                        </div>
                      </div>

                      <div className="controles-cancion">
                        {!item.esEspecial && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-main)' }} title={t.tapeTooltip}>
                            <input 
                              type="checkbox" 
                              checked={item.esTape} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'esTape', e.target.checked)} 
                            />
                            <span>📼</span>
                          </label>
                        )}
                        
                        {!item.esEspecial && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-main)' }} title={t.segueTooltip}>
                            <input 
                              type="checkbox" 
                              checked={item.enganchada} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'enganchada', e.target.checked)} 
                            />
                            <strong style={{ fontSize: '1.2em', color: item.enganchada ? 'var(--btn-blue)' : 'var(--text-muted)' }}>{'>'}</strong>
                          </label>
                        )}

                        {item.esEspecial ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                            {t.durationLabel}
                            <input 
                              type="number" 
                              value={item.duracionBase / 60} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'duracionBase', Number(e.target.value) * 60)}
                              style={{ width: '45px', padding: '3px 6px', borderRadius: '3px', border: '1px solid var(--input-border)', fontSize: '1em', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                            />
                            <span>{t.minLabel}</span>
                          </label>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                            {t.addLabel}
                            <input 
                              type="number" 
                              value={item.tiempoExtra} 
                              onChange={(e) => actualizarItemSetlist(item.idSetlist, 'tiempoExtra', e.target.value)}
                              style={{ width: '45px', padding: '3px 6px', borderRadius: '3px', border: '1px solid var(--input-border)', fontSize: '1em', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                            />
                            <span>{t.secLabel}</span>
                          </label>
                        )}

                        <input 
                          type="text" 
                          placeholder={t.notesPlaceholder} 
                          value={item.notas} 
                          onChange={(e) => actualizarItemSetlist(item.idSetlist, 'notas', e.target.value)}
                          style={{ flex: '1', minWidth: '100px', padding: '4px 8px', borderRadius: '3px', border: '1px solid var(--input-border)', fontSize: '1em', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
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
        <section id="sec-panel" className="columna-panel" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.1em', marginTop: '0', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            {t.controlPanelTitle}
          </h2>
          
          {/* 1. PAUSA ENTRE TEMAS */}
          <div className="panel-subcard">
            <label className="field-label">{t.gapLabel}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                value={gap} 
                onChange={(e) => setGap(e.target.value)}
                className="custom-input"
                style={{ flex: 1, minWidth: 0 }}
              />
              <span style={{ fontSize: '0.9em', color: 'var(--text-muted)', fontWeight: 'bold' }}>{t.secLabel}</span>
            </div>
          </div>

          {/* 2. FILA ESPECIAL */}
          <div className="panel-subcard">
            <h2 className="section-title-right" style={{ fontSize: '0.95em', margin: '0 0 10px 0' }}>
              {t.specialRowTitle}
            </h2>
            
            <div className="field-group" style={{ marginBottom: '10px' }}>
              <label className="field-label">{t.typeLabel}</label>
              <select 
                value={tipoEspecial} 
                onChange={(e) => setTipoEspecial(e.target.value)}
                className="custom-input"
                style={{ width: '100%' }}
              >
                <option value="Speech">{t.speechOption}</option>
                <option value="Intervalo">{t.intermissionOption}</option>
                <option value="Encore">{t.encoreOption}</option>
                <option value="Texto Libre">{t.freeTextOption}</option>
                <option value="Canción">{t.customSongOption}</option>
              </select>
            </div>

            {tipoEspecial === "Texto Libre" ? (
              <div className="field-group" style={{ marginBottom: '12px' }}>
                <label className="field-label">{t.textToShowLabel}</label>
                <input 
                  type="text" 
                  value={textoLibre} 
                  onChange={(e) => setTextoLibre(e.target.value)}
                  placeholder={t.textToShowPlaceholder}
                  className="custom-input"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                />
              </div>
            ) : tipoEspecial === "Canción" ? (
              <>
                <div className="field-group" style={{ marginBottom: '8px' }}>
                  <label className="field-label">{t.songTitleLabel}</label>
                  <input 
                    type="text" 
                    value={nombreCancionExtra} 
                    onChange={(e) => setNombreCancionExtra(e.target.value)}
                    placeholder={t.songTitlePlaceholder}
                    className="custom-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="field-group" style={{ marginBottom: '12px' }}>
                  <label className="field-label">{t.durationMmSsLabel}</label>
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
                <label className="field-label">{t.durationLabel}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    value={minutosEspecial} 
                    onChange={(e) => setMinutosEspecial(e.target.value)}
                    className="custom-input"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <span style={{ fontSize: '0.9em', color: 'var(--text-muted)', fontWeight: 'bold' }}>{t.minLabel}</span>
                </div>
              </div>
            )}

            <button 
              onClick={agregarBloqueEspecial}
              className="btn-pill"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-plus btn-icon"></i>
              <span>{t.addSpecialRowBtn}</span>
            </button>
          </div>

          {/* 3. RELOJ / TIEMPO TOTAL ESTIMADO */}
          <div className="clock-box">
            <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85em', textTransform: 'uppercase' }}>{t.totalEstimatedTime}</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--btn-blue)' }}>
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
            <span>{t.exportBtn}</span>
          </button>

        </section>

      </main>

      {/* POPUP / MODAL DE VISTA PREVIA */}
      {mostrarPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box' }}>
          
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '900px', height: '95vh', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid var(--input-border)', color: 'var(--text-main)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px', flexWrap: 'wrap' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>{t.lineSpacing}</span>
                  <button onClick={() => setEspaciadoPdf(Math.max(0, espaciadoPdf - 2))} className="btn-round">-</button>
                  <span style={{ fontSize: '1.1em', fontWeight: 'bold', width: '25px', textAlign: 'center' }}>{espaciadoPdf}</span>
                  <button onClick={() => setEspaciadoPdf(espaciadoPdf + 2)} className="btn-round">+</button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '15px', borderLeft: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>{t.fontSize}</span>
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
                  <span>{t.downloadBtn}</span>
                </button>
                
                <button 
                  onClick={() => setMostrarPreview(false)}
                  className="btn-danger-pill"
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#525659', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
              {cargandoPdf && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '1.2em', fontWeight: 'bold', zIndex: 10 }}>
                  {t.generatingPreview}
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

            <div style={{ textAlign: 'center', fontSize: '0.8em', color: 'var(--text-muted)' }}>
              {t.pdfMobileNotice}<a href={pdfUrl} target="_blank" rel="noreferrer" style={{color: 'var(--btn-blue)', textDecoration: 'underline'}}>{t.pdfMobileNoticeLink}</a>.
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE BIENVENIDA */}
      {mostrarBienvenida && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 className="modal-title">{t.welcomeTitle}</h2>
            <p className="modal-subtitle">{t.welcomeSub}</p>
            
            <button onClick={handleLoginGoogle} className="btn-google">
              <i className="fa-brands fa-google"></i>
              <span>{t.loginGoogle}</span>
            </button>

            <button onClick={continuarComoInvitado} className="btn-guest">
              {t.enterGuest}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ONBOARDING (PRIMERA BANDA) */}
      {mostrarOnboarding && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 className="modal-title">{t.onboardingTitle}</h2>
            <p className="modal-subtitle">{t.onboardingSub}</p>

            <input 
              type="text" 
              className="custom-input"
              placeholder={t.bandNamePlaceholder} 
              value={nombrePrimeraBanda}
              onChange={(e) => setNombrePrimeraBanda(e.target.value)}
              style={{ width: '100%' }}
            />

            <button 
              onClick={guardarOnboardingBanda} 
              disabled={!nombrePrimeraBanda.trim()} 
              className="btn-pill"
              style={{ width: '100%', justifyContent: 'center', opacity: nombrePrimeraBanda.trim() ? 1 : 0.6 }}
            >
              {t.onboardingBtn}
            </button>
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