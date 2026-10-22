/* =====================================================================
   CONFIGURACIÓN DEL ESTUDIO
   Para clonar el sitio a otro tatuador alcanza con editar este archivo
   y reemplazar las fotos de la carpeta img/ (ver README.md).
   Las rutas de imágenes son relativas a img/ (por ejemplo 'zonas/brazo/foto.jpg').
   En los títulos gigantes, "\n" corta la línea.
   ===================================================================== */

export default {
  estudio: {
    nombre: 'Tinta Negra',
    bajada: 'Estudio de tatuaje · blackwork & dark art',
    ciudad: 'Buenos Aires',
    // descripción para buscadores y redes
    descripcion: 'Tinta Negra, estudio de tatuaje en Buenos Aires especializado en blackwork y dark art. Turnos por WhatsApp.',
    pie: '© 2026 · Sitio de demostración',
  },

  inicio: {
    titulo: 'Tinta\nNegra',
    kicker: ['Blackwork', 'Dark art', 'Buenos Aires'],
    bajada: 'Diseños únicos, dibujados a mano para tu piel. Una pieza por día.',
    pista: 'Tocá la estatua',
    // cuántos trabajos se ven en Inicio (el resto está en el portafolio del artista)
    trabajosVisibles: 8,
    cita: { texto: 'Cada línea se dibuja una sola vez.', firma: 'Leo Ferrán' },
    taller: { titulo: 'Armá tu tatuaje', texto: 'Cinco preguntas cortas y te llega todo ordenado por WhatsApp: zona, tamaño, estilo, idea y cuándo podés.' },
  },

  artista: {
    nombre: 'Leo Ferrán',
    anos: 12,
    // retrato del artista (ruta dentro de img/). Reemplazalo por la foto del tatuador.
    retrato: 'artista/retrato.jpg',
    bio: [
      'Empecé copiando grabados de Durero en los márgenes del colegio. Hoy dibujo cada pieza a mano antes de llevarla a la piel.',
      'Blackwork, dark art y realismo en grises. Trabajo con turnos, una pieza por día, y cada diseño es único: no repito tatuajes.',
    ],
    datos: [
      { n: '12', t: 'años de oficio' },
      { n: '1.800', t: 'piezas' },
      { n: '1', t: 'por día' },
    ],
    cierre: { titulo: '¿Te gustó algo?', texto: 'Contame tu idea en cinco pasos y la dibujamos juntos.' },
  },

  contacto: {
    // número en formato internacional, solo dígitos (sin +, espacios ni guiones)
    whatsapp: '5491100000000',
    whatsappVisible: '+54 9 11 0000-0000',
    instagram: 'tintanegra.demo',
    direccion: ['Dirección de muestra 1234', 'Palermo, Buenos Aires'],
    // lo que se busca en Google Maps al tocar la dirección
    mapa: 'Palermo, Buenos Aires',
    horarios: ['Martes a viernes 12 a 20 h', 'Sábados 11 a 18 h'],
  },

  /* Tres páginas: / (Inicio), /artista y /info. `nombre` es el texto del menú y del título de la pestaña. */
  paginas: {
    inicio: { nombre: 'Inicio' },
    artista: { nombre: 'Artista' },
    info: { nombre: 'Info', titulo: 'Antes de\ntatuarte', etiqueta: 'Precios · proceso · cuidados' },
  },

  /* Zonas del cuerpo de la estatua. `zona3d` es el atributo _zone del modelo
     (1 cabeza, 2 brazos, 3 torso, 4 espalda, 5 piernas). Se muestran todas las fotos de `carpeta`. */
  zonas: [
    { zona3d: 1, id: 'cabeza', nombre: 'Cabeza', carpeta: 'zonas/cabeza' },
    { zona3d: 2, id: 'brazos', nombre: 'Brazos', carpeta: 'zonas/brazo' },
    { zona3d: 3, id: 'torso', nombre: 'Torso', carpeta: 'zonas/torso' },
    { zona3d: 4, id: 'espalda', nombre: 'Espalda', carpeta: 'zonas/espalda' },
    { zona3d: 5, id: 'piernas', nombre: 'Piernas', carpeta: 'zonas/pierna' },
  ],

  estilos: [
    { id: 'blackwork', nombre: 'Blackwork' },
    { id: 'darkart', nombre: 'Dark art' },
    { id: 'fineline', nombre: 'Fine line' },
    { id: 'realismo', nombre: 'Realismo' },
    { id: 'neotradicional', nombre: 'Neotradicional' },
  ],

  /* Cada trabajo (por nombre de archivo): su estilo (para el filtro del portafolio) y su tipo.
     tipo 'foto': foto real con piel → duotono tinta y violeta, así la piel nunca se ve como piel.
     tipo 'boceto': dibujo sobre papel → blanco y negro que pasa a stencil violeta.
     Si falta el tipo, se detecta solo al cargar la imagen (por la saturación). */
  obras: {
    '1dcf5c7397aeb08c8bc94d430c599109.jpg': { tipo: 'foto', estilos: ['fineline'] },
    '356f0d6eb0ae8d05390c80f9f73201d1.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    '3fca30975727e2ea480c255411790e03.jpg': { tipo: 'foto', estilos: ['darkart'] },
    '733a0c8cb04af0709eb37d72fdfe0c61.jpg': { tipo: 'foto', estilos: ['darkart'] },
    'c6fdd623361db55454cb9c17e2799ca1.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    'e928e28675add0fad9cd12d1cde8a0b4.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    '04895b0f4c7bdc00e712aa21793f7693.jpg': { tipo: 'foto', estilos: ['realismo', 'darkart'] },
    '25208ba2a93e2a1c7fe4250ca527eff1.jpg': { tipo: 'foto', estilos: ['darkart'] },
    '674e5c41f8d391976738918f6c38b28a.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    '67c7c563f2fe1ef4786f6e3a482403d3.jpg': { tipo: 'foto', estilos: ['realismo'] },
    '7d6a732619d9b8f4901d914dfd3019f7.jpg': { tipo: 'foto', estilos: ['realismo', 'darkart'] },
    'e191daff160096b1e3ccd79f3cde295b.jpg': { tipo: 'foto', estilos: ['darkart', 'blackwork'] },
    '2517edabe48601a8f9c95b7f30780c22.jpg': { tipo: 'foto', estilos: ['darkart'] },
    '2d1971b103bbb30f27d65819bd93def1.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    'a4d12add90df4ea8e6487a623c6276a0.jpg': { tipo: 'foto', estilos: ['blackwork', 'neotradicional'] },
    'bea4f89e02587bd74d2fbb266b5a7cdc.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    'c1063482a705c16187543bab59d64a34.jpg': { tipo: 'foto', estilos: ['neotradicional'] },
    'e0b42487d4f910ed6e67e87926b4acc7.jpg': { tipo: 'foto', estilos: ['darkart', 'realismo'] },
    'fa1d9d21c93b0fc677cd30058a450ffa.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    '19729f7581c3c82737a94382dd03f805.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    '5cb61b4bba906c6ddaf03005c7b106ee.jpg': { tipo: 'foto', estilos: ['blackwork', 'fineline'] },
    '81f105c1c54495607ddb181d8e656a58.jpg': { tipo: 'foto', estilos: ['blackwork', 'neotradicional'] },
    'c16e40e17e2af0c9473436397838fcc8.jpg': { tipo: 'foto', estilos: ['realismo', 'neotradicional'] },
    'c18df315471070ba72c3cbd7b6333938.jpg': { tipo: 'foto', estilos: ['darkart', 'realismo'] },
    'e79726276135c1403cf105ba884fe2f9.jpg': { tipo: 'foto', estilos: ['neotradicional', 'blackwork'] },
    'efdc2f6c941332e3a021645f6df571ba.jpg': { tipo: 'foto', estilos: ['realismo', 'darkart'] },
    '37acd7ae9d94aca5c6ca3ef5ef8acb5e.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    '7db4fe6b944012211cc2aeb2691b73f9.jpg': { tipo: 'foto', estilos: ['blackwork', 'fineline'] },
    'af90b55351cd0b221e9123dd00aa48d0.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    'cbcdc15121ae4b9d4e03a126fb159709.jpg': { tipo: 'foto', estilos: ['blackwork'] },
    'cc09a6743348d2feadcc629c80087fe8.jpg': { tipo: 'foto', estilos: ['blackwork'] },
  },

  /* Bocetos del lienzo infinito del fondo: todos los de la carpeta, menos los excluidos. */
  bocetos: {
    carpeta: 'fondo',
    excluir: ['download.png'],
  },

  /* Modo liviano del fondo (sin WebGL o teléfonos lentos): un video corto de la mesa en loop.
     Rutas dentro de public/ (por ejemplo 'mesa/mesa.webm'). Si no hay video, se usa la imagen fija. */
  mesaLiviana: {
    webm: '',
    mp4: '',
    imagen: 'mesa/mesa-fija.webp',
  },

  preguntas: [
    { p: '¿Cuánto sale un tatuaje?', r: 'Depende del tamaño, la zona y el detalle. Como referencia: piezas chicas desde $ 60.000, medianas (palma de la mano) desde $ 110.000 y sesiones largas a $ 220.000 la jornada.' },
    { p: '¿Hay que dejar seña?', r: 'Sí, una seña de $ 30.000 reserva el turno y se descuenta del total. Si avisás con 48 horas se puede mover la fecha sin perderla.' },
    { p: '¿Desde qué edad se tatúa?', r: 'Desde los 18 años con DNI. No tatúo menores, ni siquiera con autorización.' },
    { p: '¿Cuánto dura una sesión?', r: 'Las piezas chicas llevan entre una y dos horas. Las grandes se dividen en sesiones de hasta cinco horas, con descansos.' },
    { p: '¿Duele?', r: 'Algo duele, sí. Costillas, pies y cuello son las zonas más sensibles; antebrazo y muslo, las más tranquilas.' },
    { p: '¿Puedo traer mi propio diseño?', r: 'Claro. Lo tomo como referencia y lo redibujo para que funcione en la piel y en tu cuerpo.' },
  ],

  proceso: [
    { titulo: 'Idea', texto: 'Me contás qué querés. Anoto palabras sueltas y hago un garabato rápido para ver si vamos por el mismo lado.', imagen: 'fondo/0e76a297f56ca1eb1c0992b3b40bc10f.jpg' },
    { titulo: 'Boceto', texto: 'Dibujo a mano, ajusto proporciones y lo pruebo en la zona con una foto tuya.', imagen: 'fondo/70903033c8b372df00a8ff2760bd1f1a.jpg' },
    { titulo: 'Stencil', texto: 'Transfiero el diseño con papel de calco violeta. Si la ubicación no te cierra, se borra y se vuelve a poner.', imagen: 'fondo/08df8fd818e9b1252a7a1521ac6ca98e.jpg' },
    { titulo: 'Sesión', texto: 'Negro intenso, pausas cuando las necesites y film protector al terminar.', imagen: 'fondo/ddc571506b639640b560b631ea9464dd.jpg' },
    { titulo: 'Curado', texto: 'Al mes la tinta se asienta, la piel vuelve a su tono y el negro queda definitivo.', imagen: 'fondo/24ab02049a442b177fbc4703496f9cbe.jpg' },
  ],

  cuidados: [
    {
      dias: 'Días 1 a 3', titulo: 'Herida fresca',
      consejos: [
        'Dejá el film entre 2 y 4 horas. Después sacalo con las manos limpias.',
        'Lavá con agua tibia y jabón neutro, sin frotar, dos o tres veces por día.',
        'Capa finita de crema cicatrizante. Si brilla de más, es demasiada.',
      ],
    },
    {
      dias: 'Días 4 a 14', titulo: 'Costra y descamación',
      consejos: [
        'Pica: no rasques ni arranques nada. Unas palmaditas alivian.',
        'Seguí con la crema cuando la sientas tirante. Nada de vaselina.',
        'Sin pileta, mar, sauna ni sol directo. Ropa suelta y de algodón.',
      ],
    },
    {
      dias: 'Días 15 a 30', titulo: 'Curado',
      consejos: [
        'El negro puede verse opaco unos días: es normal y se va solo.',
        'Desde ahora y para siempre: protector solar factor 50 sobre el tatuaje.',
        'Si algo quedó desparejo, el retoque dentro de los 3 meses no tiene costo.',
      ],
    },
  ],

  /* Taller "Armá tu tatuaje": cinco pasos y el mensaje de WhatsApp */
  taller: {
    tamanoMin: 3,
    tamanoMax: 40,
    tamanoInicial: 10,
    estilos: ['Blackwork', 'Fine line', 'Realismo', 'Dark art', 'No sé, decidilo vos'],
    cuando: ['Esta semana', 'Este mes', 'Más adelante', 'Fines de semana'],
    saludo: '¡Hola! Quiero tatuarme:',
  },
};
