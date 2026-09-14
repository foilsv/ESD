import { isLine, type DiagramObject } from './model';

export type ContextAction =
  | 'cut'
  | 'copy'
  | 'paste'
  | 'duplicate'
  | 'front'
  | 'back'
  | 'align'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-top'
  | 'align-middle'
  | 'align-bottom'
  | 'group'
  | 'lock'
  | 'delete'
  | 'select-all'
  | 'fit'
  | 'grid';

export interface ContextMenuItem {
  id: ContextAction;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  children?: ContextMenuItem[];
}

export function canAlignObjects(selection: DiagramObject[]) {
  return (
    selection.length > 1 &&
    selection.every((object) => !isLine(object) || (!object.source && !object.target))
  );
}

/** Only a completed, stationary secondary-button gesture opens a menu. */
export function releasedContextTarget(
  gesture: { moved: boolean; contextTarget?: string | null } | null,
  eventType?: string,
): string | null | undefined {
  return eventType === 'pointerup' && gesture && !gesture.moved ? gesture.contextTarget : undefined;
}

export function contextMenuGroups(context: {
  selectionCount: number;
  objectCount: number;
  canAlign: boolean;
  grid: boolean;
  isMac: boolean;
}): ContextMenuItem[][] {
  const mod = context.isMac ? 'Cmd' : 'Ctrl';
  const paste: ContextMenuItem = { id: 'paste', label: 'Paste', shortcut: `${mod}+V` };
  if (!context.selectionCount) {
    return [
      [paste],
      [
        {
          id: 'select-all',
          label: 'Select all',
          shortcut: `${mod}+A`,
          disabled: !context.objectCount,
        },
      ],
      [
        {
          id: 'fit',
          label: 'Fit diagram',
          shortcut: `${context.isMac ? 'Option' : 'Alt'}+1`,
          disabled: !context.objectCount,
        },
        { id: 'grid', label: 'Show grid', checked: context.grid },
      ],
    ];
  }
  return [
    [
      { id: 'cut', label: 'Cut', shortcut: `${mod}+X` },
      { id: 'copy', label: 'Copy', shortcut: `${mod}+C` },
      paste,
      { id: 'duplicate', label: 'Duplicate', shortcut: `${mod}+D` },
    ],
    [
      { id: 'front', label: 'Bring to front' },
      { id: 'back', label: 'Send to back' },
    ],
    [
      {
        id: 'align',
        label: 'Align',
        disabled: !context.canAlign,
        children: [
          { id: 'align-left', label: 'Left' },
          { id: 'align-center', label: 'Center horizontally' },
          { id: 'align-right', label: 'Right' },
          { id: 'align-top', label: 'Top' },
          { id: 'align-middle', label: 'Center vertically' },
          { id: 'align-bottom', label: 'Bottom' },
        ],
      },
      { id: 'group', label: 'Group', shortcut: `${mod}+G`, disabled: context.selectionCount < 2 },
    ],
    [{ id: 'lock', label: 'Lock' }],
    [{ id: 'delete', label: 'Delete', shortcut: context.isMac ? 'Backspace' : 'Del' }],
  ];
}
