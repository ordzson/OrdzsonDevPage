import { marks } from './marks.js?v=4';

const directions = [
  ['Marea', 'Una Z líquida y continua: volumen azul, curvas amplias y un borde verde que recoge el paisaje.', 'Líquida'],
  ['Vitral', 'Una pieza de cristal azul. Los biseles y las caras interiores cambian la luz sin perder la letra.', 'Cristal tallado'],
  ['Pulso', 'Un gesto de pincel en cobalto. La presión, el arrastre y el remate hacen visible la mano.', 'Pincel'],
  ['Fotón', 'Una lámina óptica se dobla en tres planos. El brazo ancho y el pie corto cambian la silueta con reflejos prismáticos.', 'Luz plegada'],
  ['Perihelio', 'Terminales crecientes y una diagonal tensa. Un pequeño satélite acompaña una Z de aire astronómico.', 'Orbital'],
  ['Troquel', 'Masa compacta, hombros cuadrados y cortes de taller: una Z pensada como sello industrial.', 'Industrial'],
  ['Ensamble', 'Dos módulos de bordes suaves encajan en la diagonal. Lima e hielo dan una lectura compacta y técnica.', 'Modular'],
  ['Trazo', 'Una Z de pluma ancha: contraste de grosor, terminales afilados y un ritmo más personal.', 'Caligrafía']
];

export const imageMarks = marks.map((mark, index) => ({
  ...mark,
  id: `${mark.id}-imagegen`,
  proposalId: mark.id,
  concept: directions[index][0],
  description: directions[index][1],
  language: directions[index][2],
  raster: true,
  src: `assets/imagegen/${mark.id}-imagegen.png`
}));
