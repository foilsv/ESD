import { defaultStyle, type DiagramObject, type ObjectKind, type Style } from './model';

function item(
  id: string,
  kind: ObjectKind,
  label: string,
  x: number,
  y: number,
  w = 180,
  h = 92,
  style: Partial<Style> = {},
  subtitle?: string,
  colorRole?: DiagramObject['colorRole'],
): DiagramObject {
  return { id, kind, label, x, y, w, h, subtitle, colorRole, style: { ...defaultStyle, ...style } };
}
function connection(
  id: string,
  label: string,
  source: string,
  target: string,
  color: string,
): DiagramObject {
  return {
    ...item(id, 'connection', label, 0, 0),
    source,
    target,
    directional: true,
    reversed: false,
    style: { ...defaultStyle, stroke: color, width: 2, fontSize: 13 },
  };
}
export type Scene = 'system' | 'dense' | 'edge' | 'objects';
export const scenes: Record<Scene, string> = {
  system: 'Motor controller',
  dense: 'Dense diagram',
  edge: 'Canvas edges',
  objects: 'Object families',
};
export function createScene(scene: Scene): DiagramObject[] {
  if (scene === 'objects')
    return [
      item('block', 'block', 'Functional block', 150, 155),
      item(
        'hardware',
        'hardware',
        'Hardware component',
        420,
        155,
        200,
        92,
        { fill: '#dbeafe' },
        'Part reference',
      ),
      item('software', 'software', 'Software block', 700, 155, 190, 92, { fill: '#e9d5ff' }),
      item('port', 'port', 'Port', 150, 365, 90, 42, { fill: '#dcfce7', fontSize: 14 }),
      item('rectangle', 'rectangle', 'Rectangle', 320, 350, 180, 80, { fill: '#fef3c7' }),
      item('ellipse', 'ellipse', 'Ellipse', 600, 345, 180, 90, { fill: '#fce7f3' }),
      item('text', 'text', 'System annotation', 150, 540, 270, 60, { fontSize: 24, align: 'left' }),
      item('symbol', 'symbol', 'CPU symbol', 740, 535, 64, 64, { stroke: '#2563eb' }),
      item('simple-line', 'line', '', 470, 566, 185, 0, { stroke: '#64748b', width: 2 }),
      connection('connection', 'SPI', 'block', 'hardware', '#2563eb'),
    ];
  const nodes = [
    item(
      'supply',
      'block',
      'Power supply',
      130,
      145,
      180,
      90,
      { fill: '#fef3c7', stroke: '#ba8b3b' },
      '24 V DC input',
    ),
    item(
      'regulator',
      'hardware',
      'Buck regulator',
      430,
      145,
      195,
      90,
      { fill: '#fef3c7', stroke: '#ba8b3b' },
      '24 V → 3.3 V',
    ),
    item(
      'sensor',
      'hardware',
      'Position sensor',
      130,
      380,
      180,
      100,
      { fill: '#dcfce7', stroke: '#67a583' },
      'Magnetic encoder',
      'sensor',
    ),
    item(
      'mcu',
      'block',
      'Motor controller',
      430,
      365,
      195,
      130,
      { fill: '#dbeafe', stroke: '#7296c7', bold: true, fontSize: 18 },
      'MCU · control & monitoring',
      'control',
    ),
    item(
      'driver',
      'hardware',
      'Gate driver',
      765,
      380,
      180,
      100,
      { fill: '#fce7f3', stroke: '#bd7d9d' },
      'Three-phase inverter',
    ),
    item(
      'firmware',
      'software',
      'Control firmware',
      430,
      645,
      195,
      80,
      { fill: '#e9d5ff', stroke: '#9c81bd' },
      'Field-oriented control',
    ),
    item('port', 'port', 'CAN', 602, 550, 74, 34, { fill: '#ffffff', fontSize: 13 }),
    item('note', 'text', 'Motor control system', 130, 35, 500, 50, {
      fontSize: 27,
      bold: true,
      align: 'left',
    }),
    connection('power', '24 V', 'supply', 'regulator', '#d97706'),
    connection('spi', 'SPI', 'sensor', 'mcu', '#15803d'),
    connection('pwm', 'PWM × 3', 'mcu', 'driver', '#2563eb'),
  ];
  if (scene === 'dense') {
    nodes.push(
      item(
        'comm',
        'hardware',
        'CAN transceiver',
        765,
        160,
        180,
        90,
        { fill: '#dbeafe' },
        'External bus',
      ),
    );
    nodes.push(item('debug', 'port', 'SWD', 650, 292, 80, 36, { fontSize: 13 }));
    nodes.push(
      item(
        'temp',
        'hardware',
        'Temperature',
        130,
        610,
        180,
        90,
        { fill: '#dcfce7' },
        'Thermistor input',
        'sensor',
      ),
    );
    nodes.push(connection('can', 'CAN', 'regulator', 'comm', '#7c3aed'));
    nodes.push(connection('temp-line', 'ADC', 'temp', 'firmware', '#15803d'));
  }
  if (scene === 'edge') {
    const mcu = nodes.find((n) => n.id === 'mcu')!;
    mcu.x = 20;
    mcu.y = 18;
    const title = nodes.find((n) => n.id === 'note')!;
    title.label = 'Move blocks toward an edge';
    title.y = 610;
  }
  return nodes;
}
