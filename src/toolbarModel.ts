import {
  canEditLabel,
  commonCapabilities,
  type Detail,
  type DiagramObject,
  type PanelBehavior,
} from './model';

export const behaviors: { id: PanelBehavior; label: string; title: string; description: string }[] =
  [
    {
      id: 'flat',
      label: 'Flat',
      title: 'Flat toolbar + popovers',
      description:
        'Stroke, arrows, text, and alignment replace the row with their own tools. Back returns to the object; colors use compact dropdowns.',
    },
    {
      id: 'grouped',
      label: 'Grouped',
      title: 'Compact toolbar + grouped popovers',
      description:
        'The object row stays compact and stable. Groups use popovers; editing and text objects can use one-line text tools.',
    },
    {
      id: 'inline',
      label: 'Inline',
      title: 'Inline expansion',
      description:
        'A group expands into a highlighted section of the same row. Color and font retain compact dropdowns.',
    },
  ];

export function toolbarContext(objects: DiagramObject[]) {
  const caps = commonCapabilities(objects);
  const hasText = objects.length > 0 && objects.every(canEditLabel);
  return {
    fill: caps.includes('fill'),
    stroke: caps.includes('stroke'),
    lineColor: caps.includes('lineColor'),
    symbolColor: caps.includes('symbolColor'),
    direction: caps.includes('direction'),
    text: hasText,
    alignment: hasText && objects.every((o) => !['port', 'connection'].includes(o.kind)),
    textOnly: objects.length > 0 && objects.every((o) => o.kind === 'text'),
  };
}

export function compatibleDetail(
  detail: Detail,
  objects: DiagramObject[],
  behavior: PanelBehavior,
  sticky: boolean,
): Detail {
  if (!sticky) return null;
  const context = toolbarContext(objects);
  if (detail === 'stroke' && context.stroke) return detail;
  if (detail === 'arrows' && context.direction) return detail;
  if (detail === 'text' && context.text && behavior !== 'flat') return detail;
  if (detail === 'alignment' && context.alignment) return detail;
  return null;
}

export function detailOnTextEntry(behavior: PanelBehavior): Detail {
  return behavior === 'flat' ? null : 'text';
}
