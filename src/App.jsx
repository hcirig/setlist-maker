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
    tabSearch: 'BUSCADOR',
    tabFavorites: 'MIS CANCIONES',
    searchPlaceholder: 'Artista, canción...',
    clearSearch: 'Limpiar buscador',
    searchSearching: 'Buscando canciones... 🎵',
    searchError: 'No se pudieron obtener resultados. Revisa tu conexión.',
    searchEmpty: 'Escribe para buscar canciones...',
    searchSimple: 'Búsqueda Simple',
    searchAdvanced: 'Búsqueda Avanzada',
    artistLabel: 'Artista:',
    artistPlaceholder: 'Ej: Ghost',
    songTitleSearchLabel: 'Canción:',
    songTitleSearchPlaceholder: 'Ej: Square Hammer',
    albumLabel: 'Álbum:',
    albumPlaceholder: 'Ej: Meliora',
    searchBtn: 'BUSCAR',
    singlesVarious: 'Sencillos / Varios',

    addFavoriteTitle: 'Agregar Tema Propio',
    songTitleLabel: 'Nombre de la canción:',
    songTitlePlaceholder: 'Ej: Mi Canción',
    durationMmSsLabel: 'Duración (mm:ss):',
    saveFavoriteBtn: '+ GUARDAR EN MI REPERTORIO',
    favoritesEmpty: 'Aún no tienes canciones guardadas en tu repertorio. Agrega temas propios o marca con la estrella ⭐ en el buscador o setlist.',

    setlistTitle: 'Tu Setlist',
    clearSetlistBtn: 'VACIAR',
    confirmClear: '⚠️ ¿Estás seguro de que quieres borrar todo el setlist local?',
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
    addSpecialRowBtn: '+ FILA',
    totalEstimatedTime: 'Tiempo Total Estimado',
    exportBtn: 'EXPORTAR',

    lineSpacing: 'Interlineado:',
    fontSize: 'Fuente:',
    downloadBtn: 'DESCARGAR',
    closeBtn: '✕ CERRAR',
    generatingPreview: 'Generando PDF... ⏳',

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
    bandNameRequired: 'El nombre de la banda es obligatorio.',

    savedSetlistsLabel: 'Setlist Guardado:',
    newSetlistOption: '+ Nuevo Setlist',
    saveSetlistBtn: 'GUARDAR SETLIST',
    saveSetlistAsBtn: 'GUARDAR COMO...',
    deleteSetlistBtn: 'ELIMINAR SETLIST',
    savingSetlist: 'Guardando setlist...',
    setlistSavedSuccess: '¡Setlist guardado en la nube!',
    confirmDeleteSetlist: '⚠️ ¿Estás seguro de que quieres eliminar este setlist guardado de Supabase?',
    promptSetlistName: 'Ingresa un nombre para identificar este Setlist (Ej: Luna Park 2026):',
    noBandSelectedWarn: 'Debes seleccionar una banda antes de guardar un setlist.'
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
    tabSearch: 'SEARCH',
    tabFavorites: 'MY SONGS',
    searchPlaceholder: 'Artist, song...',
    clearSearch: 'Clear search',
    searchSearching: 'Searching songs... 🎵',
    searchError: 'Could not fetch results. Check your connection.',
    searchEmpty: 'Type to search songs...',
    searchSimple: 'Simple Search',
    searchAdvanced: 'Advanced Search',
    artistLabel: 'Artist:',
    artistPlaceholder: 'e.g. Ghost',
    songTitleSearchLabel: 'Song:',
    songTitleSearchPlaceholder: 'e.g. Square Hammer',
    albumLabel: 'Album:',
    albumPlaceholder: 'e.g. Meliora',
    searchBtn: 'SEARCH',
    singlesVarious: 'Singles / Various',

    addFavoriteTitle: 'Add Custom Song',
    songTitleLabel: 'Song title:',
    songTitlePlaceholder: 'e.g. My Song',
    durationMmSsLabel: 'Duration (mm:ss):',
    saveFavoriteBtn: '+ SAVE TO REPERTOIRE',
    favoritesEmpty: 'No custom songs in your repertoire yet. Add your songs or click the star ⭐ in search or setlist.',

    setlistTitle: 'Your Setlist',
    clearSetlistBtn: 'CLEAR',
    confirmClear: '⚠️ Are you sure you want to clear the local setlist?',
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
    addSpecialRowBtn: '+ ROW',
    totalEstimatedTime: 'Estimated Total Time',
    exportBtn: 'EXPORT',

    lineSpacing: 'Line Spacing:',
    fontSize: 'Font Size:',
    downloadBtn: 'DOWNLOAD',
    closeBtn: '✕ CLOSE',
    generatingPreview: 'Generating PDF... ⏳',

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
    bandNameRequired: 'Band name is required.',

    savedSetlistsLabel: 'Saved Setlist:',
    newSetlistOption: '+ New Setlist',
    saveSetlistBtn: 'SAVE SETLIST',
    saveSetlistAsBtn: 'SAVE AS...',
    deleteSetlistBtn: 'DELETE SETLIST',
    savingSetlist: 'Saving setlist...',
    setlistSavedSuccess: 'Setlist saved to cloud!',
    confirmDeleteSetlist: '⚠️ Are you sure you want to delete this saved setlist from Supabase?',
    promptSetlistName: 'Enter a name to identify this Setlist (e.g. MSG 2026):',
    noBandSelectedWarn: 'You must select a band before saving a setlist.'
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

const coincideTexto = (textoFuente, textoBuscado) => {
  if (!textoFuente || !textoBuscado) return true;
  const palabras = textoBuscado.toLowerCase().split(/\s+/).filter(Boolean);
  const fuente = textoFuente.toLowerCase();
  return palabras.every(palabra => fuente.includes(palabra));
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

  // Estados de Gestión de Bandas
  const [misBandas, setMisBandas] = useState([]);
  const [bandaSeleccionadaId, setBandaSeleccionadaId] = useState('nueva');
  const [cargandoBanda, setCargandoBanda] = useState(false);
  const [archivoLogo, setArchivoLogo] = useState(null);

  // Estados de Gestión de Setlists
  const [misSetlists, setMisSetlists] = useState([]);
  const [setlistSeleccionadoId, setSetlistSeleccionadoId] = useState('nuevo');
  const [cargandoSetlist, setCargandoSetlist] = useState(false);

  // Estados de Canciones Favoritas / Propias
  const [pestañaCatalogo, setPestañaCatalogo] = useState('buscador'); 
  const [cancionesFavoritas, setCancionesFavoritas] = useState([]);
  const [nuevoNombreFav, setNuevoNombreFav] = useState('');
  const [nuevaDuracionFav, setNuevaDuracionFav] = useState('03:30');

  const bandasInicializadasRef = useRef(false);

  // Estados de Buscador
  const [modoBusqueda, setModoBusqueda] = useState('simple'); // 'simple' | 'avanzada'
  const [busqueda, setBusqueda] = useState('');
  const [busquedaArtista, setBusquedaArtista] = useState('');
  const [busquedaCancion, setBusquedaCancion] = useState('');
  const [busquedaAlbum, setBusquedaAlbum] = useState('');

  const [resultados, setResultados] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  const [setlist, setSetlist] = useState([]);
  const [gap, setGap] = useState(15);
  
  const [espaciadoPdf, setEspaciadoPdf] = useState(18);
  const [tamanoFuentePdf, setTamanoFuentePdf] = useState(28);
  const [mostrarPreview, setMostrarPreview] = useState(false);
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

  const [scaleFactor, setScaleFactor] = useState(1);
  const previewContainerRef = useRef(null);

  const dragItem = useRef();
  const dragOverItem = useRef();

  // Escalar proporcionalmente la hoja A4 según el ancho disponible de pantalla en móviles
  useEffect(() => {
    const handleResize = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth - 20;
        const a4WidthPx = 794;
        if (containerWidth < a4WidthPx) {
          setScaleFactor(containerWidth / a4WidthPx);
        } else {
          setScaleFactor(1);
        }
      }
    };

    if (mostrarPreview) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [mostrarPreview]);

  // Escuchar cambios de autenticación
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
        if (!bandasInicializadasRef.current) {
          comprobarBandasExistentes(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar setlists y favoritas al cambiar la banda seleccionada
  useEffect(() => {
    if (user && bandaSeleccionadaId && bandaSeleccionadaId !== 'nueva') {
      cargarSetlistsBanda(bandaSeleccionadaId);
      cargarCancionesFavoritas(bandaSeleccionadaId);
    } else {
      setMisSetlists([]);
      setCancionesFavoritas([]);
      setSetlistSeleccionadoId('nuevo');
    }
  }, [bandaSeleccionadaId, user]);

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
      setMisSetlists([]);
      setCancionesFavoritas([]);
      seleccionarSetlist('nuevo');
    } else {
      setBandaSeleccionadaId(banda.id);
      localStorage.setItem('setlist_selected_band_id', banda.id);
      setNombreBanda(banda.nombre || '');
      setContactoRedes(banda.contacto_redes || '');
      setLogoUrl(banda.logo_url || null);
      setArchivoLogo(null);
    }
  };

  const cargarSetlistsBanda = async (bandaId) => {
    if (!bandaId || bandaId === 'nueva' || !user) return;
    try {
      const { data, error } = await supabase
        .from('setlists')
        .select('*')
        .eq('banda_id', bandaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar setlists de Supabase:', error);
      } else if (data) {
        setMisSetlists(data);
      }
    } catch (err) {
      console.error('Error cargando setlists:', err);
    }
  };

  const cargarCancionesFavoritas = async (bandaId) => {
    if (!bandaId || bandaId === 'nueva' || !user) return;
    try {
      const { data, error } = await supabase
        .from('canciones_favoritas')
        .select('*')
        .eq('banda_id', bandaId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setCancionesFavoritas(data);
      }
    } catch (err) {
      console.error('Error cargando favoritas:', err);
    }
  };

  const agregarCancionFavorita = async (e) => {
    e?.preventDefault();
    if (!nuevoNombreFav.trim()) return;

    const partes = nuevaDuracionFav.split(':');
    let segs = 210;
    if (partes.length === 2) {
      segs = (parseInt(partes[0]) || 0) * 60 + (parseInt(partes[1]) || 0);
    } else {
      segs = parseInt(partes[0]) || 210;
    }

    if (user && bandaSeleccionadaId !== 'nueva') {
      try {
        const { data, error } = await supabase
          .from('canciones_favoritas')
          .insert({
            user_id: user.id,
            banda_id: bandaSeleccionadaId,
            nombre: nuevoNombreFav.trim(),
            duracion: segs,
            es_propia: true
          })
          .select()
          .single();

        if (!error && data) {
          setCancionesFavoritas([...cancionesFavoritas, data]);
          setNuevoNombreFav('');
        }
      } catch (err) {
        console.error('Error al guardar favorita:', err);
      }
    } else {
      const nuevaFav = {
        id: Date.now().toString(),
        nombre: nuevoNombreFav.trim(),
        duracion: segs,
        es_propia: true
      };
      setCancionesFavoritas([...cancionesFavoritas, nuevaFav]);
      setNuevoNombreFav('');
    }
  };

  // Alternar favorita indicando título y duración
  const toggleFavoritoDirecto = async (nombreCancion, duracionSegundos = 210) => {
    const tituloLimpio = limpiarTituloCancion(nombreCancion);
    if (!tituloLimpio) return;

    const existente = cancionesFavoritas.find(f => f.nombre.toLowerCase() === tituloLimpio.toLowerCase());

    if (existente) {
      await eliminarCancionFavorita(existente.id);
    } else {
      if (user && bandaSeleccionadaId !== 'nueva') {
        try {
          const { data, error } = await supabase
            .from('canciones_favoritas')
            .insert({
              user_id: user.id,
              banda_id: bandaSeleccionadaId,
              nombre: tituloLimpio,
              duracion: duracionSegundos,
              es_propia: false
            })
            .select()
            .single();

          if (!error && data) {
            setCancionesFavoritas([...cancionesFavoritas, data]);
          }
        } catch (err) {
          console.error('Error guardando favorita:', err);
        }
      } else {
        const nuevaFav = {
          id: Date.now().toString(),
          nombre: tituloLimpio,
          duracion: duracionSegundos,
          es_propia: false
        };
        setCancionesFavoritas([...cancionesFavoritas, nuevaFav]);
      }
    }
  };

  const eliminarCancionFavorita = async (idFav) => {
    if (user && bandaSeleccionadaId !== 'nueva') {
      try {
        await supabase
          .from('canciones_favoritas')
          .delete()
          .eq('id', idFav)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error eliminando favorita:', err);
      }
    }
    setCancionesFavoritas(cancionesFavoritas.filter(f => f.id !== idFav));
  };

  const seleccionarSetlist = (setlistObj) => {
    if (!setlistObj || setlistObj === 'nuevo') {
      setSetlistSeleccionadoId('nuevo');
      setSetlist([]);
      setFecha('');
      setVenue('');
      setCiudad('');
      setGap(15);
      setEspaciadoPdf(18);
      setTamanoFuentePdf(28);
    } else {
      setSetlistSeleccionadoId(setlistObj.id);
      setFecha(setlistObj.fecha || '');
      setVenue(setlistObj.venue || '');
      setCiudad(setlistObj.ciudad || '');
      setGap(setlistObj.gap || 15);
      
      const contenidoData = setlistObj.contenido;
      if (Array.isArray(contenidoData)) {
        setSetlist(contenidoData);
      } else if (contenidoData && typeof contenidoData === 'object') {
        setSetlist(Array.isArray(contenidoData.items) ? contenidoData.items : []);
        if (contenidoData.espaciadoPdf !== undefined) setEspaciadoPdf(contenidoData.espaciadoPdf);
        if (contenidoData.tamanoFuentePdf !== undefined) setTamanoFuentePdf(contenidoData.tamanoFuentePdf);
      } else {
        setSetlist([]);
      }
    }
  };

  const guardarSetlistDB = async (esGuardarComo = false) => {
    if (!user) {
      alert("Debes iniciar sesión para guardar setlists en la nube.");
      return;
    }
    if (bandaSeleccionadaId === 'nueva') {
      alert(t.noBandSelectedWarn);
      return;
    }

    let nombreShowFinal = venue ? `${venue}${fecha ? ' - ' + fecha : ''}` : 'Show ' + new Date().toLocaleDateString();

    if (esGuardarComo || setlistSeleccionadoId === 'nuevo') {
      const nombreIngresado = prompt(t.promptSetlistName, nombreShowFinal);
      if (nombreIngresado === null) return; 
      if (nombreIngresado.trim()) nombreShowFinal = nombreIngresado.trim();
    }

    const estructuraContenidoGuardar = {
      items: setlist,
      espaciadoPdf: espaciadoPdf,
      tamanoFuentePdf: tamanoFuentePdf
    };

    setCargandoSetlist(true);
    try {
      if (!esGuardarComo && setlistSeleccionadoId !== 'nuevo') {
        const { error } = await supabase
          .from('setlists')
          .update({
            nombre_show: nombreShowFinal,
            fecha: fecha,
            venue: venue.trim(),
            ciudad: ciudad.trim(),
            gap: Number(gap),
            contenido: estructuraContenidoGuardar
          })
          .eq('id', setlistSeleccionadoId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error al actualizar setlist:', error);
          alert(`Error al guardar setlist: ${error.message}`);
        } else {
          alert(t.setlistSavedSuccess);
          await cargarSetlistsBanda(bandaSeleccionadaId);
        }
      } else {
        const { data, error } = await supabase
          .from('setlists')
          .insert({
            user_id: user.id,
            banda_id: bandaSeleccionadaId,
            nombre_show: nombreShowFinal,
            fecha: fecha,
            venue: venue.trim(),
            ciudad: ciudad.trim(),
            gap: Number(gap),
            contenido: estructuraContenidoGuardar
          })
          .select()
          .single();

        if (error) {
          console.error('Error al insertar setlist:', error);
          alert(`Error al guardar setlist: ${error.message}`);
        } else if (data) {
          setSetlistSeleccionadoId(data.id);
          alert(t.setlistSavedSuccess);
          await cargarSetlistsBanda(bandaSeleccionadaId);
        }
      }
    } catch (err) {
      console.error('Error inesperado al guardar setlist:', err);
      alert('Error de conexión al intentar guardar.');
    } finally {
      setCargandoSetlist(false);
    }
  };

  const eliminarSetlistDB = async () => {
    if (setlistSeleccionadoId === 'nuevo' || !user) return;
    if (!window.confirm(t.confirmDeleteSetlist)) return;

    setCargandoSetlist(true);
    try {
      const { error } = await supabase
        .from('setlists')
        .delete()
        .eq('id', setlistSeleccionadoId)
        .eq('user_id', user.id);

      if (error) {
        alert(`Error al eliminar: ${error.message}`);
      } else {
        seleccionarSetlist('nuevo');
        await cargarSetlistsBanda(bandaSeleccionadaId);
      }
    } catch (err) {
      console.error('Error al eliminar setlist:', err);
    } finally {
      setCargandoSetlist(false);
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
    setMisSetlists([]);
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

  const toggleTheme = () => {
    setTema(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleIdioma = () => {
    setIdioma(prev => prev === 'es' ? 'en' : 'es');
  };

  const ejecutarBusqueda = async (e) => {
    if (e) e.preventDefault();

    setCargandoBusqueda(true);
    setErrorBusqueda(null);

    try {
      let url = '';
      let filtroCliente = null;

      if (modoBusqueda === 'avanzada') {
        const art = busquedaArtista.trim();
        const can = busquedaCancion.trim();
        const alb = busquedaAlbum.trim();

        if (!art && !can && !alb) {
          setCargandoBusqueda(false);
          return;
        }

        if (art) {
          // Búsqueda estricta por Artista en iTunes
          url = `https://itunes.apple.com/search?term=${encodeURIComponent(art)}&entity=song&attribute=artistTerm&limit=200`;
          
          filtroCliente = (item) => {
            let match = true;
            if (can) {
              match = match && coincideTexto(item.trackName, can);
            }
            if (alb) {
              match = match && coincideTexto(item.collectionName, alb);
            }
            return match;
          };
        } else if (can) {
          // Búsqueda por título de Canción
          url = `https://itunes.apple.com/search?term=${encodeURIComponent(can)}&entity=song&attribute=songTerm&limit=100`;
          if (alb) {
            filtroCliente = (item) => coincideTexto(item.collectionName, alb);
          }
        } else if (alb) {
          // Búsqueda por Álbum
          url = `https://itunes.apple.com/search?term=${encodeURIComponent(alb)}&entity=song&attribute=albumTerm&limit=100`;
        }
      } else {
        if (!busqueda.trim()) {
          setCargandoBusqueda(false);
          return;
        }
        url = `https://itunes.apple.com/search?term=${encodeURIComponent(busqueda.trim())}&entity=song&limit=100`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al conectar con el servidor de música.');
      const data = await res.json();
      let resFinal = data.results || [];

      if (filtroCliente) {
        resFinal = resFinal.filter(filtroCliente);
      }

      setResultados(resFinal);
    } catch (err) {
      setErrorBusqueda(t.searchError);
    } finally {
      setCargandoBusqueda(false);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setBusquedaArtista('');
    setBusquedaCancion('');
    setBusquedaAlbum('');
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
        setLogoUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const quitarLogo = () => {
    setLogoUrl(null);
    setArchivoLogo(null);
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
    const duracionSegundos = cancion.duracion ? cancion.duracion : Math.round((cancion.trackTimeMillis || 0) / 1000);
    const tituloLimpio = cancion.nombre || limpiarTituloCancion(cancion.trackName);

    const nuevaEjecucion = {
      idSetlist: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      id: cancion.id || cancion.trackId,
      nombre: tituloLimpio,
      disco: cancion.collectionName || 'Sin Álbum',
      artista: cancion.artistName || '',
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

  // Exportar capturando el nodo montado en el DOM raíz fuera del modal
  const procesarPDF = () => {
    const elemento = document.getElementById('setlist-pdf-export-root');
    if (!elemento) return;

    setCargandoPdf(true);

    const opciones = {
      margin:       0,
      filename:     `Setlist-${venue ? venue.trim().replace(/\s+/g, '_') + '-' : ''}${fecha || 'Show'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0, scrollX: 0, windowWidth: 794 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };

    html2pdf()
      .set(opciones)
      .from(elemento)
      .save()
      .then(() => {
        setCargandoPdf(false);
      })
      .catch((err) => {
        console.error("Error exportando PDF:", err);
        setCargandoPdf(false);
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

  // Componente interno reutilizable para renderizar la Hoja A4
  const RenderHojaA4 = () => (
    <div 
      style={{ 
        width: '794px',
        height: '1123px',
        backgroundColor: '#ffffff', 
        color: '#000000', 
        fontFamily: 'Arial, sans-serif', 
        padding: '40px 40px 30px 40px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Encabezado A4: Logo Izquierda | Info Derecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '25px', minHeight: '80px' }}>
          <div style={{ width: '55%', display: 'flex', alignItems: 'center' }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo Banda" 
                style={{ maxHeight: '75px', maxWidth: '100%', objectFit: 'contain' }} 
              />
            ) : nombreBanda.trim() ? (
              <h1 style={{ margin: 0, fontSize: '24px', fontStyle: 'italic', textTransform: 'uppercase' }}>{nombreBanda.trim()}</h1>
            ) : (
              <div />
            )}
          </div>

          <div style={{ width: '45%', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5' }}>
            <div>{idioma === 'en' ? 'Date' : 'Fecha'}: {fecha || '_____'}</div>
            <div>{idioma === 'en' ? 'Venue' : 'Lugar'}: {venue || '_____'}</div>
            <div>{idioma === 'en' ? 'City' : 'Ciudad'}: {ciudad || '_____'}</div>
          </div>
        </div>

        {/* Canciones */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {setlistRenderizado.map((item) => (
            <div 
              key={item.idSetlist} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                borderTop: item.esEspecial ? '1px solid #666' : 'none',
                borderBottom: item.esEspecial ? '1px solid #666' : 'none',
                paddingTop: item.esEspecial ? '6px' : '0',
                paddingBottom: item.esEspecial ? '6px' : '0',
                marginBottom: `${espaciadoPdf}px`
              }}
            >
              {item.esTextoLibre ? (
                <div style={{ textAlign: 'center', fontSize: `${tamanoFuentePdf + 2}px`, fontWeight: 'bold', borderBottom: '2px dashed #000', paddingBottom: '6px' }}>
                  {item.nombre}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <div style={{ width: `${Math.max(45, tamanoFuentePdf * 1.6)}px`, flexShrink: 0, fontSize: `${tamanoFuentePdf - 2}px`, fontWeight: 'bold', textAlign: 'left' }}>
                    {!item.esEspecial && (item.esTape ? '📼' : `${item.trackNumero}.`)}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '12px', minWidth: 0 }}>
                    <span style={{ 
                      fontSize: `${tamanoFuentePdf}px`, 
                      fontWeight: item.esEspecial ? 'normal' : 'bold', 
                      textTransform: item.esEspecial ? 'none' : 'uppercase', 
                      fontStyle: item.esEspecial ? 'italic' : 'normal',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}>
                      {item.nombre} {item.enganchada && '>'}
                    </span>

                    {item.notas && (
                      <span style={{ 
                        fontSize: `${Math.max(11, tamanoFuentePdf - 6)}px`, 
                        color: '#555', 
                        fontStyle: 'italic',
                        fontWeight: 'normal',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
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

      <div style={{ borderTop: '1px solid #000', paddingTop: '10px', textAlign: 'center', fontSize: '12px', minHeight: '20px' }}>
        {contactoRedes.trim()}
      </div>
    </div>
  );

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 className="section-title-right" style={{ margin: 0 }}>{t.upcomingShowTitle}</h2>
            
            {user && bandaSeleccionadaId !== 'nueva' && (
              <select 
                value={setlistSeleccionadoId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'nuevo') {
                    seleccionarSetlist('nuevo');
                  } else {
                    const setlistEncontrado = misSetlists.find(s => s.id === val);
                    seleccionarSetlist(setlistEncontrado);
                  }
                }}
                className="custom-input"
                style={{ fontSize: '0.85em', padding: '4px 8px', maxWidth: '180px' }}
              >
                <option value="nuevo">{t.newSetlistOption}</option>
                {misSetlists.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre_show || 'Show sin nombre'}</option>
                ))}
              </select>
            )}
          </div>
          
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
        
        {/* BUSCADOR DE CANCIONES Y MIS CANCIONES */}
        <section id="sec-buscador" className="columna-catalogo" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxSizing: 'border-box', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <button 
              onClick={() => setPestañaCatalogo('buscador')}
              className="btn-pill"
              style={{ flex: 1, justifyContent: 'center', backgroundColor: pestañaCatalogo === 'buscador' ? 'var(--btn-blue)' : 'transparent', color: pestañaCatalogo === 'buscador' ? '#fff' : 'var(--text-main)', border: '1px solid var(--input-border)', fontSize: '0.8em' }}
            >
              <i className="fa-solid fa-magnifying-glass btn-icon"></i>
              <span>{t.tabSearch}</span>
            </button>
            <button 
              onClick={() => setPestañaCatalogo('favoritos')}
              className="btn-pill"
              style={{ flex: 1, justifyContent: 'center', backgroundColor: pestañaCatalogo === 'favoritos' ? 'var(--btn-blue)' : 'transparent', color: pestañaCatalogo === 'favoritos' ? '#fff' : 'var(--text-main)', border: '1px solid var(--input-border)', fontSize: '0.8em' }}
            >
              <i className="fa-solid fa-star btn-icon"></i>
              <span>{t.tabFavorites}</span>
            </button>
          </div>

          {pestañaCatalogo === 'buscador' ? (
            <>
              {/* Conmutador de modo de búsqueda */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                  {modoBusqueda === 'simple' ? t.searchSimple : t.searchAdvanced}
                </span>
                <button
                  type="button"
                  onClick={() => setModoBusqueda(modoBusqueda === 'simple' ? 'avanzada' : 'simple')}
                  style={{ background: 'none', border: 'none', color: 'var(--btn-blue)', cursor: 'pointer', fontSize: '0.75em', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  {modoBusqueda === 'simple' ? `⚙️ ${t.searchAdvanced}` : `🔍 ${t.searchSimple}`}
                </button>
              </div>

              {modoBusqueda === 'simple' ? (
                /* Formulario Búsqueda Simple */
                <form onSubmit={ejecutarBusqueda} style={{ display: 'flex', gap: '8px', marginBottom: '12px', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
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
              ) : (
                /* Formulario Búsqueda Avanzada por Campos */
                <form onSubmit={ejecutarBusqueda} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', backgroundColor: 'var(--input-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--input-border)' }}>
                  <div className="field-group">
                    <label className="field-label">{t.artistLabel}</label>
                    <input 
                      type="text" 
                      className="custom-input"
                      placeholder={t.artistPlaceholder}
                      value={busquedaArtista}
                      onChange={(e) => setBusquedaArtista(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">{t.songTitleSearchLabel}</label>
                    <input 
                      type="text" 
                      className="custom-input"
                      placeholder={t.songTitleSearchPlaceholder}
                      value={busquedaCancion}
                      onChange={(e) => setBusquedaCancion(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">{t.albumLabel}</label>
                    <input 
                      type="text" 
                      className="custom-input"
                      placeholder={t.albumPlaceholder}
                      value={busquedaAlbum}
                      onChange={(e) => setBusquedaAlbum(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button 
                      type="submit" 
                      disabled={cargandoBusqueda || (!busquedaArtista.trim() && !busquedaCancion.trim() && !busquedaAlbum.trim())}
                      className="btn-pill"
                      style={{ flex: 1, justifyContent: 'center', height: '36px', fontSize: '0.8em' }}
                    >
                      <i className="fa-solid fa-magnifying-glass btn-icon"></i>
                      <span>{t.searchBtn}</span>
                    </button>

                    {(busquedaArtista || busquedaCancion || busquedaAlbum || resultados.length > 0) && (
                      <button 
                        type="button" 
                        onClick={limpiarBusqueda}
                        className="btn-danger-round"
                        style={{ width: '36px', height: '36px', fontSize: '0.85em' }}
                        title={t.clearSearch}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </form>
              )}

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
                          const esFavorito = cancionesFavoritas.some(f => f.nombre.toLowerCase() === tituloLimpio.toLowerCase());
                          const duracionSegs = Math.round((cancion.trackTimeMillis || 0) / 1000);

                          return (
                            <div key={cancion.trackId} className="cancion-item">
                              <div style={{ textAlign: 'left', flex: '1', minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                <strong style={{ fontSize: '0.8em', display: 'block', lineHeight: '1.2', color: 'var(--text-main)' }}>
                                  {cancion.trackNumber ? `${cancion.trackNumber}. ` : ''}{tituloLimpio}
                                </strong>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.7em', display: 'block', marginTop: '2px' }}>
                                  {formatearTiempo(duracionSegs)}
                                </small>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button 
                                  onClick={() => toggleFavoritoDirecto(tituloLimpio, duracionSegs)}
                                  title={esFavorito ? "Quitar de mis canciones" : "Guardar en mis canciones"}
                                  style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2em', padding: '2px 4px' }}
                                >
                                  {esFavorito ? '⭐' : '☆'}
                                </button>
                                
                                <button 
                                  onClick={() => agregarAlSetlist(cancion)}
                                  title="Agregar al setlist"
                                  style={{ backgroundColor: 'var(--btn-blue)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', flexShrink: 0 }}
                                >
                                  <i className="fa-solid fa-plus"></i>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Formulario Reestructurado para Mis Canciones */}
              <form onSubmit={agregarCancionFavorita} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', backgroundColor: 'var(--input-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--input-border)' }}>
                <span style={{ fontSize: '0.85em', fontWeight: 'bold', color: 'var(--text-main)' }}>{t.addFavoriteTitle}</span>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: '130px' }}>
                    <input 
                      type="text"
                      className="custom-input"
                      placeholder={t.songTitlePlaceholder}
                      value={nuevoNombreFav}
                      onChange={(e) => setNuevoNombreFav(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '70px' }}>
                    <input 
                      type="text"
                      className="custom-input"
                      placeholder="03:30"
                      value={nuevaDuracionFav}
                      onChange={(e) => setNuevaDuracionFav(e.target.value)}
                      style={{ width: '100%', textAlign: 'center' }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!nuevoNombreFav.trim()}
                  className="btn-pill" 
                  style={{ width: '100%', justifyContent: 'center', height: '36px', fontSize: '0.8em', opacity: nuevoNombreFav.trim() ? 1 : 0.6 }}
                >
                  <i className="fa-solid fa-plus btn-icon"></i>
                  <span>{t.saveFavoriteBtn}</span>
                </button>
              </form>

              {/* Lista de Canciones Guardadas */}
              <div className="scroll-area">
                {cancionesFavoritas.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 10px', fontSize: '0.85em', fontStyle: 'italic' }}>
                    {t.favoritesEmpty}
                  </p>
                ) : (
                  cancionesFavoritas.map((fav) => (
                    <div key={fav.id} className="cancion-item" style={{ marginBottom: '6px' }}>
                      <div style={{ textAlign: 'left', flex: '1', minWidth: 0, wordBreak: 'break-word' }}>
                        <strong style={{ fontSize: '0.85em', display: 'block', color: 'var(--text-main)' }}>
                          🎵 {fav.nombre}
                        </strong>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75em' }}>
                          {formatearTiempo(fav.duracion)}
                        </small>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => agregarAlSetlist(fav)}
                          title="Agregar al setlist"
                          style={{ backgroundColor: 'var(--btn-blue)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em' }}
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                        <button 
                          onClick={() => eliminarCancionFavorita(fav.id)}
                          className="btn-danger-round"
                          style={{ width: '28px', height: '28px', fontSize: '0.75em' }}
                          title={t.removeTooltip}
                        >
                          -
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

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
              {setlistRenderizado.map((item, index) => {
                const esFavorito = !item.esEspecial && !item.esTextoLibre && cancionesFavoritas.some(f => f.nombre.toLowerCase() === item.nombre.toLowerCase());

                return (
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!item.esEspecial && (
                              <button 
                                onClick={() => toggleFavoritoDirecto(item.nombre, item.duracionBase)}
                                title={esFavorito ? "Quitar de mis canciones" : "Guardar en mis canciones"}
                                style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2em', padding: '0 2px' }}
                              >
                                {esFavorito ? '⭐' : '☆'}
                              </button>
                            )}

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
                );
              })}
            </div>
          )}
        </section>

        {/* PANEL DE CONTROL */}
        <section id="sec-panel" className="columna-panel" style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.1em', marginTop: '0', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            {t.controlPanelTitle}
          </h2>
          
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

          <div className="clock-box">
            <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85em', textTransform: 'uppercase' }}>{t.totalEstimatedTime}</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--btn-blue)' }}>
              {formatearTiempoTotal(tiempoTotalShow)}
            </div>
          </div>

          {user && bandaSeleccionadaId !== 'nueva' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
              <button 
                onClick={() => guardarSetlistDB(false)}
                disabled={cargandoSetlist || setlist.length === 0}
                className="btn-pill"
                style={{ width: '100%', justifyContent: 'center', opacity: setlist.length > 0 ? 1 : 0.6 }}
              >
                <i className="fa-solid fa-cloud-arrow-up btn-icon"></i>
                <span>{cargandoSetlist ? t.savingSetlist : t.saveSetlistBtn}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => guardarSetlistDB(true)}
                  disabled={cargandoSetlist || setlist.length === 0}
                  className="btn-guest"
                  style={{ flex: 1, fontSize: '0.8em', height: '36px' }}
                >
                  {t.saveSetlistAsBtn}
                </button>

                {setlistSeleccionadoId !== 'nuevo' && (
                  <button 
                    onClick={eliminarSetlistDB}
                    disabled={cargandoSetlist}
                    className="btn-danger-pill"
                    style={{ height: '36px', padding: '0 10px', fontSize: '0.8em' }}
                    title={t.deleteSetlistBtn}
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                )}
              </div>
            </div>
          )}

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
          
          <div style={{ backgroundColor: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', width: '100%', maxWidth: '850px', height: '95vh', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid var(--input-border)', color: 'var(--text-main)' }}>
            
            {/* Barra de Controles Superior */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', flexWrap: 'wrap' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85em' }}>{t.lineSpacing}</span>
                  <button onClick={() => setEspaciadoPdf(Math.max(0, espaciadoPdf - 2))} className="btn-round" style={{ width: '28px', height: '28px' }}>-</button>
                  <span style={{ fontSize: '0.95em', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{espaciadoPdf}</span>
                  <button onClick={() => setEspaciadoPdf(espaciadoPdf + 2)} className="btn-round" style={{ width: '28px', height: '28px' }}>+</button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '10px', borderLeft: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85em' }}>{t.fontSize}</span>
                  <button onClick={() => setTamanoFuentePdf(Math.max(12, tamanoFuentePdf - 2))} className="btn-round" style={{ width: '28px', height: '28px' }}>-</button>
                  <span style={{ fontSize: '0.95em', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{tamanoFuentePdf}</span>
                  <button onClick={() => setTamanoFuentePdf(Math.min(60, tamanoFuentePdf + 2))} className="btn-round" style={{ width: '28px', height: '28px' }}>+</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={procesarPDF}
                  disabled={cargandoPdf}
                  className="btn-pill"
                  style={{ height: '34px', padding: '0 12px', fontSize: '0.85em' }}
                >
                  <i className="fa-solid fa-download"></i>
                  <span>{cargandoPdf ? t.generatingPreview : t.downloadBtn}</span>
                </button>
                
                <button 
                  onClick={() => setMostrarPreview(false)}
                  className="btn-danger-pill"
                  style={{ height: '34px', padding: '0 10px', fontSize: '0.85em' }}
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>

            {/* ÁREA DE VISUALIZACIÓN A4 */}
            <div ref={previewContainerRef} style={{ flex: 1, backgroundColor: '#525659', borderRadius: '6px', padding: '15px 10px', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              
              <div 
                style={{ 
                  width: `${794 * scaleFactor}px`, 
                  height: `${1123 * scaleFactor}px`, 
                  position: 'relative'
                }}
              >
                <div style={{ transform: `scale(${scaleFactor})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, boxShadow: '0 0 10px rgba(0,0,0,0.3)' }}>
                  <RenderHojaA4 />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* NODO OCULTO EN EL DOM RAÍZ PARA EXPORTACIÓN LIMPIA EN PDF */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1000, pointerEvents: 'none', opacity: 1 }}>
        <div id="setlist-pdf-export-root">
          <RenderHojaA4 />
        </div>
      </div>

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

      {/* MODAL DE ONBOARDING */}
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

    </div>
  )
}

export default App