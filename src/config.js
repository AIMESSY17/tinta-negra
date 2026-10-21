/* =====================================================================
   CONFIGURACIÓN DEL ESTUDIO
   Para clonar el sitio a otro tatuador alcanza con editar este archivo
   y reemplazar las fotos de la carpeta img/ (ver README.md).
   Las rutas de imágenes son relativas a img/ (por ejemplo 'zonas/brazo/foto.jpg').
   ===================================================================== */

export default {
  estudio: {
    nombre: 'Tinta Negra',
    bajada: 'Estudio de tatuaje · blackwork & dark art',
    ciudad: 'Buenos Aires',
    // descripción para buscadores y redes
    descripcion: 'Tinta Negra, estudio de tatuaje en Buenos Aires especializado en blackwork y dark art. Turnos por WhatsApp.',
  },

  artista: {
    nombre: 'Leo Ferrán',
    // texto que se traza como firma manuscrita (si queda vacío se usa el nombre)
    firma: 'Leo Ferrán',
    oficio: 'Tatuador · 12 años de oficio',
    // foto del artista; si la dejás en null se muestra un retrato dibujado de muestra
    retrato: 'artista/retrato.jpg',
    // el cuaderno: cada capítulo es una doble página (ilustración + texto)
    cuaderno: [
      {
        titulo: 'Los inicios',
        texto: 'Empecé copiando ==grabados de Durero== en los márgenes de los cuadernos del colegio. A los diecinueve armé mi primera máquina con un motor de walkman y tatué a todos los amigos que se dejaron.',
        nota: 'el primer trazo nunca sale derecho',
        imagen: 'fondo/0e76a297f56ca1eb1c0992b3b40bc10f.jpg',
      },
      {
        titulo: 'El estilo',
        texto: '==Blackwork denso==, contrastes duros y figuras que vienen del arte sacro, los bestiarios y el grabado antiguo. Me interesa que un tatuaje se lea a diez metros y siga sorprendiendo a diez centímetros.',
        nota: 'negro sólido, nada de grises tímidos',
        imagen: 'fondo/08df8fd818e9b1252a7a1521ac6ca98e.jpg',
      },
      {
        titulo: 'Años de oficio',
        texto: 'Doce años, miles de horas de aguja y una regla que no cambió: cada diseño se ==dibuja a mano== para esa persona y esa parte del cuerpo. No repito piezas personalizadas.',
        nota: 'la piel no es papel: respira, se mueve',
        imagen: 'fondo/24ab02049a442b177fbc4703496f9cbe.jpg',
      },
      {
        titulo: 'Filosofía',
        texto: 'Un tatuaje es una ==conversación larga==. Escucho la idea, la llevo al papel, la discutimos y recién ahí entra la tinta. Si algo no te convence, se vuelve a dibujar.',
        nota: 'primero escuchar, después dibujar',
        imagen: 'fondo/ddc571506b639640b560b631ea9464dd.jpg',
      },
    ],
  },

  contacto: {
    // número en formato internacional, solo dígitos (sin +, espacios ni guiones)
    whatsapp: '5491100000000',
    whatsappVisible: '+54 9 11 0000-0000',
    instagram: 'tintanegra.demo',
    direccion: 'Dirección de muestra 1234, Palermo',
    // lo que se busca en Google Maps al tocar el mapa
    mapaBusqueda: 'Palermo, Buenos Aires',
    horarios: [
      { dias: 'Martes a viernes', horas: '12 a 20 h' },
      { dias: 'Sábados', horas: '11 a 18 h' },
      { dias: 'Domingo y lunes', horas: 'cerrado' },
    ],
    nota: 'Atención solo con turno.',
  },

  // panel "Efectos del fondo" (pensado para la demo de venta)
  efectos: {
    mostrarPanel: true,
    // estado inicial de cada efecto
    rastro: true, gotas: true, redibujo: true, profundidad: true,
    corrida: true, violeta: true, fantasma: true, deriva: true,
  },

  /* El sitio tiene tres páginas, cada una con su URL: / (Inicio), /artista y /info.
     `pestana` es el nombre del capítulo en la banda de arriba (con su número romano); `resumen` se lee en el menú.
     `portada` es la portada de capítulo de Artista e Info: título que se tatúa y una bajada de una línea. */
  paginas: {
    inicio: { nombre: 'Inicio', pestana: 'Inicio', resumen: 'Armá tu tatuaje · Contacto' },
    artista: {
      nombre: 'El artista', pestana: 'El artista', resumen: 'Su cuaderno · Portafolio',
      portada: { titulo: 'El artista', bajada: 'Leo Ferrán: doce años dibujando a mano cada pieza.' },
    },
    info: {
      nombre: 'Info', pestana: 'Info', resumen: 'Preguntas · Proceso · Cuidados',
      portada: { titulo: 'Antes de tatuarte', bajada: 'Precios, seña, el proceso y cómo cuidarlo después.' },
    },
  },

  // títulos de cada sección
  secciones: {
    hero: 'Inicio',
    artista: 'El artista',
    estilos: 'Portafolio',
    proceso: 'El proceso',
    cuidados: 'Cuidados',
    preguntas: 'Preguntas',
    resenas: 'Reseñas',
    pedido: 'Armá tu tatuaje',
    cierre: 'Contacto',
  },

  /* Zonas del cuerpo de la estatua. `zona3d` es el número del atributo _ZONE
     del modelo (1 cabeza, 2 brazos, 3 torso, 4 espalda, 5 piernas).
     `carpeta`: se muestran todas las fotos que haya ahí.
     Si una zona no tiene fotos todavía, poné muestra: true y se usan bocetos del fondo. */
  zonas: [
    { zona3d: 1, id: 'cabeza', nombre: 'Cabeza', carpeta: 'zonas/cabeza' },
    { zona3d: 2, id: 'brazos', nombre: 'Brazos', carpeta: 'zonas/brazo' },
    { zona3d: 3, id: 'torso', nombre: 'Torso', carpeta: 'zonas/torso' },
    { zona3d: 4, id: 'espalda', nombre: 'Espalda', carpeta: 'zonas/espalda' },
    { zona3d: 5, id: 'piernas', nombre: 'Piernas', carpeta: 'zonas/pierna' },
  ],

  estilos: [
    { id: 'blackwork', nombre: 'Blackwork', descripcion: 'Negro sólido, contraste máximo, ornamento y geometría.' },
    { id: 'darkart', nombre: 'Dark art', descripcion: 'Calaveras, demonios, vírgenes veladas: lo sagrado y lo macabro.' },
    { id: 'fineline', nombre: 'Fine line', descripcion: 'Línea fina y aire: bocetos delicados que respiran.' },
    { id: 'realismo', nombre: 'Realismo', descripcion: 'Sombras suaves y volumen en negro y gris.' },
    { id: 'neotradicional', nombre: 'Neotradicional', descripcion: 'Contorno marcado, figuras simbólicas y acentos de color.' },
  ],

  /* En los textos se pueden marcar palabras clave ==así== (máximo 2 o 3 por bloque):
     al entrar en pantalla se les pasa un resaltador violeta. */

  /* Bocetos del lienzo infinito del fondo: todos los de la carpeta, menos los excluidos.
     En `estilos` se asigna cada archivo a uno o más estilos (los ids de arriba). */
  bocetos: {
    carpeta: 'fondo',
    excluir: ['download.png'],
    estilos: {
      '009c107caa8d28abc0bfbd034289874d.jpg': ['fineline', 'darkart'],
      '08df8fd818e9b1252a7a1521ac6ca98e.jpg': ['blackwork', 'darkart'],
      '0d48d0b0afb2da4d7450c5d3e61c9021.jpg': ['fineline', 'darkart'],
      '0e76a297f56ca1eb1c0992b3b40bc10f.jpg': ['fineline', 'darkart'],
      '1224d8448ef766f30d9ed86f9685a963.jpg': ['neotradicional'],
      '24ab02049a442b177fbc4703496f9cbe.jpg': ['realismo', 'darkart'],
      '5562135c55a4a490ce6aab212e5e8046.jpg': ['neotradicional', 'blackwork'],
      '5ab33d0ea8181644072499e418df4c49.jpg': ['realismo'],
      '6358dc935a9a98a6566ecb928a6f961e.jpg': ['blackwork'],
      '70903033c8b372df00a8ff2760bd1f1a.jpg': ['blackwork', 'fineline'],
      '762bb2fbe4464310c38ca19d24a13625.jpg': ['neotradicional', 'blackwork'],
      '7a6d91f368e4f8ba47b9f0ac5d6617ed.jpg': ['realismo', 'darkart'],
      '7b0ee09e3d035759d207124133ecdbcc.jpg': ['neotradicional'],
      '8bf9eb171a4dabc8a68dbcce5a74f454.jpg': ['blackwork'],
      '91f147f75509b8c173b722f7b71c1e2b.jpg': ['fineline'],
      '9ff125cfaa56c4c9543a551564b8da1b.jpg': ['realismo', 'darkart'],
      'a1f2160a8b26db4c8f0f659a6489c0ad.jpg': ['fineline', 'darkart'],
      'a2341b1c4fdb02500f2ffd18a8c4268a.jpg': ['fineline', 'neotradicional'],
      'b055e3d9dd1160142e0883a5bccca98c.jpg': ['neotradicional'],
      'c3ee953bef97e6f238112b68f3503fc8.jpg': ['blackwork'],
      'ddc571506b639640b560b631ea9464dd.jpg': ['blackwork', 'darkart'],
      'e2fbd7fa601c638c8de97b528d5940e0.jpg': ['darkart', 'blackwork'],
      'e39c7a4fbde4873b12e005930fc8eca8.jpg': ['realismo', 'darkart'],
      'f20138a1093a4680b9374ab08a598c5a.jpg': ['blackwork', 'neotradicional'],
      'f8ac05f44b69cd7d0c64e471c39052b9.jpg': ['blackwork', 'darkart'],
      'fe8e6d52a62b338090d07969a0a91832.jpg': ['blackwork', 'darkart'],
    },
  },

  /* El proceso: un solo boceto que evoluciona en seis etapas. */
  proceso: {
    boceto: 'fondo/70903033c8b372df00a8ff2760bd1f1a.jpg',
    etapas: [
      { titulo: 'Idea', nota: 'Me contás qué querés. Anoto palabras sueltas y hago un garabato rápido para ver si vamos por el mismo lado.' },
      { titulo: 'Boceto en lápiz', nota: 'Dibujo a grafito sobre papel, ajusto proporciones y lo pruebo en la zona con una foto tuya.' },
      { titulo: 'Línea final', nota: 'Paso el diseño a tinta limpia: cada línea que ves acá es una línea que va a ir en la piel.' },
      { titulo: 'Stencil', nota: 'Transfiero el diseño con ==papel de calco violeta==. Si la ubicación no te cierra, se borra y se vuelve a poner.' },
      { titulo: 'Recién tatuado', nota: 'Negro intenso, piel un poco enrojecida y film protector. Es normal que brille y esté sensible.' },
      { titulo: 'Curado', nota: '==Al mes== la tinta se asienta, la piel vuelve a su tono y el negro queda definitivo.' },
    ],
  },

  /* Cuidados: el dial va del día 1 al 30. Cada etapa cubre un rango de días. */
  cuidados: [
    {
      desde: 1, hasta: 3, titulo: 'Herida fresca',
      consejos: [
        { tema: 'Film', texto: 'Dejá el film entre ==2 y 4 horas==. Después sacalo con las manos limpias.' },
        { tema: 'Lavado', texto: 'Lavá con agua tibia y jabón neutro, sin frotar, dos o tres veces por día.' },
        { tema: 'Crema', texto: 'Capa finita de crema cicatrizante. Si brilla de más, es demasiada.' },
      ],
    },
    {
      desde: 4, hasta: 9, titulo: 'Se forma la costra',
      consejos: [
        { tema: 'Crema', texto: 'Seguí con la crema cuando la sientas tirante. Nada de vaselina.' },
        { tema: 'Rascar', texto: 'Pica: ==no rasques== ni arranques nada. Unas palmaditas alivian.' },
        { tema: 'Ropa', texto: 'Ropa suelta y de algodón sobre la zona.' },
      ],
    },
    {
      desde: 10, hasta: 20, titulo: 'Descamación y velo lechoso',
      consejos: [
        { tema: 'Paciencia', texto: 'La piel se pela como después de tomar sol y el negro se ve opaco. Es normal.' },
        { tema: 'Pileta', texto: 'Nada de pileta, mar ni sauna hasta que deje de pelarse.' },
        { tema: 'Sol', texto: 'Sin sol directo. Si no queda otra, tapalo con ropa.' },
      ],
    },
    {
      desde: 21, hasta: 30, titulo: 'Curado',
      consejos: [
        { tema: 'Sol', texto: 'Desde ahora y para siempre: ==protector solar factor 50== sobre el tatuaje.' },
        { tema: 'Hidratación', texto: 'Crema común todos los días: la piel hidratada mantiene el negro.' },
        { tema: 'Retoque', texto: 'Si algo quedó desparejo, el retoque dentro de los 3 meses no tiene costo.' },
      ],
    },
  ],

  /* Fichero de preguntas: `tema` es la palabra escrita a mano en el separador de cada ficha (y arriba a la derecha de la ficha). */
  preguntas: [
    { tema: 'Precio', p: '¿Cuánto sale un tatuaje?', r: 'Depende del tamaño, la zona y el detalle. Como referencia: piezas chicas desde ==$ 60.000==, medianas (palma de la mano) desde $ 110.000 y sesiones largas a $ 220.000 la jornada.' },
    { tema: 'Seña', p: '¿Hay que dejar seña?', r: 'Sí, una ==seña de $ 30.000== reserva el turno y se descuenta del total. Si avisás con 48 horas se puede mover la fecha sin perderla.' },
    { tema: 'Edad', p: '¿Desde qué edad se tatúa?', r: 'Desde los ==18 años con DNI==. No tatúo menores, ni siquiera con autorización.' },
    { tema: 'Duración', p: '¿Cuánto dura una sesión?', r: 'Las piezas chicas llevan entre una y dos horas. Las grandes se dividen en sesiones de hasta cinco horas, con descansos.' },
    { tema: 'Dolor', p: '¿Duele?', r: 'Algo duele, sí. Costillas, pies y cuello son las zonas más sensibles; antebrazo y muslo, las más tranquilas.' },
    { tema: 'Diseño', p: '¿Puedo traer mi propio diseño?', r: 'Claro. Lo tomo como referencia y lo redibujo para que funcione en la piel y en tu cuerpo.' },
  ],

  /* Reseñas: dejá la lista vacía hasta tener reseñas reales (la sección no se muestra). */
  resenas: [
    // { nombre: 'Nombre real', texto: 'Lo que escribió la persona', fuente: 'Google' },
  ],

  /* Pedido por WhatsApp */
  pedido: {
    tamanoMin: 3,
    tamanoMax: 40,
    tamanoInicial: 12,
    dias: ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    franjas: ['Mañana', 'Tarde', 'Noche'],
    saludo: '¡Hola! Quiero pedir un turno en Tinta Negra.',
  },
};
