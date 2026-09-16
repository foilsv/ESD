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
        'Stroke and text replace the row. Alignment can use one compact position popover or its direct sub-toolbar.',
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
        'Groups expand in the same row. Alignment can instead use one compact position popover.',
    },
    {
      id: 'panel',
      label: 'Panel',
      title: 'Side properties panel',
      description:
        'All settings for the selected object appear in a floating panel on the right — no toolbar.',
    },
    {
      id: 'semi-flat',
      label: 'Semi-Flat',
      title: 'Context-aware compact toolbar',
      description:
        'A compact toolbar adapts its controls to the selected object type — shape, line, or text. Switch between object and text modes with the T› button.',
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
  compactTextAlignment = true,
): Detail {
  if (!sticky || behavior === 'panel' || behavior === 'semi-flat') return null;
  const usesPopover =
    behavior === 'grouped' || (detail === 'alignment' && compactTextAlignment);
  if (usesPopover) return null;
  const context = toolbarContext(objects);
  if (detail === 'stroke' && context.stroke) return detail;
  if (detail === 'arrows' && context.direction) return detail;
  if (detail === 'text' && context.text && behavior !== 'flat') return detail;
  if (detail === 'alignment' && context.alignment) return detail;
  return null;
}

export function detailOnTextEntry(behavior: PanelBehavior): Detail {
  return behavior === 'flat' || behavior === 'panel' || behavior === 'semi-flat' ? null : 'text';
}
