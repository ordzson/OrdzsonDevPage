// The same geometry powers the gallery, standalone files and comparison sheet.
export const marks = [
  {
    id: 'aero-panorama', name: 'Frutiger Aero · Panorama', concept: 'Horizonte',
    description: 'Una Z abierta al paisaje: cielo azul, una base verde y encuentros suaves entre sus trazos.',
    ground: '#ecfaff', ink: '#144a67', color: '#087ac3', secondary: '#21750c',
    shape: '<path fill="var(--mark-primary)" d="M53 48h109c12 0 18 13 9 22l-80 76h73v28H43c-12 0-17-14-8-23l80-75H53c-8 0-14-6-14-14s6-14 14-14Z"/><path fill="var(--mark-secondary)" d="M43 146c37-17 77 17 121 0v28H43c-18 0-19-21 0-28Z"/>'
  },
  {
    id: 'aero-cristal', name: 'Frutiger Aero · Cristal', concept: 'Refracción',
    description: 'Una pieza de cristal tallado. Los biseles recorren una Z compacta de ángulos limpios.',
    ground: '#e4f5f6', ink: '#103e62', color: '#087ac3', secondary: '#2c9cad',
    shape: '<path fill="var(--mark-primary)" d="M54 44h112l12 12v18l-87 73h75v29H44v-30l87-73H44V54Z"/><path fill="var(--mark-secondary)" d="m54 44-10 10v19h87l35-29Zm77 29 47-17v18l-87 73H54Zm-87 73 10 14h112v16H44Z"/>'
  },
  {
    id: 'current', name: 'Corriente', concept: 'Cauce',
    description: 'Un solo trazo, sin interrupciones. Sus curvas llevan el ritmo de las ondas a la inicial.',
    ground: '#e9f3ed', ink: '#183931', color: '#174fdd', secondary: '#174fdd',
    shape: '<path fill="none" stroke="var(--mark-primary)" stroke-width="25" stroke-linecap="round" stroke-linejoin="round" d="M48 58c37-18 78 17 122-3L51 162c38-19 79 17 120-4"/>'
  },
  {
    id: 'shards', name: 'Cristales de luz', concept: 'Prisma',
    description: 'Tres fragmentos suspendidos construyen una Z por continuidad. El espacio entre piezas también dibuja.',
    ground: '#060808', ink: '#f4f4eb', color: '#49d7e8', secondary: '#c5a7ff', tertiary: '#e6f2a3',
    shape: '<path fill="var(--mark-primary)" d="M44 44h132l-31 30H44Z"/><path fill="var(--mark-secondary)" d="M137 83h39l-94 55H44Z"/><path fill="var(--mark-tertiary)" d="M75 147h101v29H44Z"/>'
  },
  {
    id: 'orbit', name: 'Órbita', concept: 'Gravedad',
    description: 'Una Z estable y una trayectoria elíptica. El gesto orbital conecta la letra con su universo de partículas.',
    ground: '#111719', ink: '#f1eee5', color: '#f1eee5', secondary: '#e9c692',
    shape: '<ellipse cx="110" cy="110" rx="102" ry="42" transform="rotate(-36 110 110)" fill="none" stroke="var(--mark-secondary)" stroke-width="5"/><path fill="var(--mark-primary)" d="M57 55h108v24l-70 63h70v25H55v-24l71-63H57Z"/><circle cx="181" cy="56" r="8" fill="var(--mark-secondary)"/>'
  },
  {
    id: 'vector', name: 'Vector', concept: 'Impulso',
    description: 'Una Z de masa sólida y extremos oblicuos. El corte de sus terminales prolonga la dirección de los trazos.',
    ground: '#e25b38', ink: '#261d1b', color: '#261d1b', secondary: '#f8edce',
    shape: '<path fill="var(--mark-primary)" d="M51 46h137l-20 30-68 68h66l-21 32H24l20-31 70-68H31Z"/><path fill="var(--mark-secondary)" d="M51 46h56L87 77H31Z"/>'
  },
  {
    id: 'vector-cobalto', name: 'Vector · Cobalto', concept: 'Salto',
    description: 'Dos módulos desplazados y un corte central. Lima e hielo convierten la Z en un pulso eléctrico.',
    ground: '#1738a6', ink: '#f3f7ff', color: '#d6f36a', secondary: '#ccefff',
    shape: '<path fill="var(--mark-primary)" d="M40 44h140v28l-40 34H92l38-30H40Z"/><path fill="var(--mark-secondary)" d="M80 116h48l-38 30h90v32H40v-28Z"/>'
  },
  {
    id: 'seda', name: 'Seda', concept: 'Pliegue',
    description: 'Una cinta flexible se pliega en diagonal. El contraste de curvas y puntas conserva la suavidad de Seda.',
    ground: '#f1f4e9', ink: '#183f31', color: '#1b573b', secondary: '#1b573b',
    shape: '<path fill="var(--mark-primary)" d="M46 47c36 15 79-17 129 0l-4 23-89 79c36-14 61 10 95-4l-10 28c-41 17-73-14-124 3l4-25 92-80c-37 12-65-7-98 7Z"/>'
  }
];

// A separate collection: the original eight geometries and exports stay intact.
const boldDirections = [
  {
    concept: 'Zenit',
    description: 'La Z aparece como un vacío en un sol compacto. Un horizonte curvo corta el disco y abre la silueta.',
    shape: '<path fill="var(--mark-primary)" fill-rule="evenodd" d="M110 23a87 87 0 1 1 0 174 87 87 0 0 1 0-174Zm-49 39v29h53l-53 42v25h99v-29h-53l53-42V62Z"/><path fill="var(--mark-secondary)" d="M32 160c34 21 72 31 126 16-32 35-96 27-126-16Z"/>'
  },
  {
    concept: 'Cizalla',
    description: 'Una Z tallada a contraveta: hombros asimétricos, una diagonal afilada y dos caras que tensan la pieza.',
    shape: '<path fill="var(--mark-primary)" d="m28 49 150-21 16 40-86 72 72-8-17 46-137 13 5-41 80-69-68 10Z"/><path fill="var(--mark-secondary)" d="m28 49 150-21-37 39-98 24Zm3 101 77-10 72-8-17 46-13-22-124 35Z"/>'
  },
  {
    concept: 'Contracorriente',
    description: 'Tres corrientes dibujan la misma Z. Los canales abiertos hacen del ritmo y del vacío el propio símbolo.',
    shape: '<g fill="none" stroke="var(--mark-primary)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"><path d="M38 40c44-25 88 25 144 0L38 144c48-25 92 25 144 0"/><path d="M38 58c44-25 88 25 144 0L38 162c48-25 92 25 144 0"/><path d="M38 76c44-25 88 25 144 0L38 180c48-25 92 25 144 0"/></g>'
  },
  {
    concept: 'Falla',
    description: 'Una fractura desplaza el centro de la Z. Dos grandes astillas y una esquirla aislada mantienen la tensión.',
    shape: '<path fill="var(--mark-primary)" d="M24 35h172l-36 41h-38l-73 87 29-51 42-36H24Z"/><path fill="var(--mark-secondary)" d="m49 163 83-46-28 31h90l-38 42H24Z"/><path fill="var(--mark-tertiary)" d="m156 82 21 15-36 28-21-16Z"/>'
  },
  {
    concept: 'Singularidad',
    description: 'La órbita se vuelve letra: dos masas curvas giran alrededor de una diagonal, con un satélite fuera de eje.',
    shape: '<path fill="var(--mark-primary)" d="M35 70C52 18 162 14 191 49l-12 26-98 72c39 8 76-4 99-22l11 29c-35 39-126 54-163 16l12-27 97-71C101 60 61 75 40 94Z"/><circle cx="185" cy="27" r="11" fill="var(--mark-secondary)"/>'
  },
  {
    concept: 'Arpón',
    description: 'Terminales de flecha y una cintura estrecha convierten la inicial en dirección pura. Un gesto seco, casi mecánico.',
    shape: '<path fill="var(--mark-primary)" d="M46 34h154l-28 49-84 54h88l-32 49H18l22-44h12l71-59H18Z"/><path fill="var(--mark-secondary)" d="M46 34h64L78 60H32Z"/>'
  },
  {
    concept: 'Interruptor',
    description: 'La Z se recorta dentro de un bloque lima. Una esquina de hielo se desprende y rompe la simetría del emblema.',
    shape: '<path fill="var(--mark-primary)" fill-rule="evenodd" d="M27 26h163v116l-48 48H27Zm29 30v26h68l-68 53v27h99v-26H94l69-53V56Z"/><path fill="var(--mark-secondary)" d="m199 154-43 43h43Z"/>'
  },
  {
    concept: 'Nudo',
    description: 'Una Z de cinta ancha se retuerce sobre sí misma. Dos ojos interiores revelan el pliegue sin añadir contornos.',
    shape: '<path fill="var(--mark-primary)" fill-rule="evenodd" d="M34 62C12 25 98 13 162 38c26 10 31 34 10 55l-87 57c58-18 99-14 106 11 9 32-60 49-121 23-38-15-42-35-20-56l82-59c-44 15-85 23-98-7Zm23-11c17-11 43-6 59-1-25 7-47 11-59 1Zm54 118c27 7 54-2 57-9-17-8-41 1-57 9Z"/>'
  }
];

export const boldMarks = marks.map((mark, index) => ({
  ...mark, ...boldDirections[index], id: `${mark.id}-bold`, proposalId: mark.id
}));
export const allMarks = [...boldMarks, ...marks];

export function svgFor(mark, variant = 'color', { label = true } = {}) {
  const mono = variant === 'white' ? '#ffffff' : '#111111';
  const primary = variant === 'color' ? mark.color : mono;
  const secondary = variant === 'color' ? mark.secondary : mono;
  const tertiary = variant === 'color' ? mark.tertiary || mark.secondary : mono;
  // Resolve colors directly: exported SVGs work in design tools without CSS variables.
  const geometry = mark.shape.replaceAll('var(--mark-primary)', primary)
    .replaceAll('var(--mark-secondary)', secondary).replaceAll('var(--mark-tertiary)', tertiary);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220"${label ? ` role="img" aria-label="Brandmark Z · ${mark.name}"` : ' aria-hidden="true"'}>${label ? `<title>Z · ${mark.name} · ${mark.concept}</title>` : ''}${geometry}</svg>`;
}
