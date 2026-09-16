export type ReleaseNote = {
  version: string;
  title: string;
  summary: string;
  publishedOn?: string;
  changes: { title: string; description: string }[];
};

// Keep one consolidated entry per Sites deployment. See AGENTS.md for the
// maintenance rules that keep this intentionally different from a commit log.
export const releaseNotes: ReleaseNote[] = [
  {
    version: '7',
    title: 'Toolbar and context menu boundaries',
    summary:
      'This iteration tests quieter formatting controls, on-demand semi-flat popovers, and a compact right-click menu for object and canvas operations.',
    publishedOn: '2026-09-16',
    changes: [
      {
        title: 'A compact context menu',
        description:
          'Right-click opens a neutral menu with direct actions and one Align submenu. Align and Group remain visible and become available for suitable multi-selections; formatting and history stay in their existing controls. Delete, selection, fit, and grid actions work, while the other rows remain visual placeholders. Right-drag continues to pan.',
      },
      {
        title: 'Semi-flat stroke controls as individual popovers',
        description:
          'Stroke pattern and stroke width each have their own toolbar button that opens a small popover on click, matching the color-picker interaction. The width button shows the current value in px. Both popovers anchor next to the button that triggered them rather than centring on the toolbar, and the text-mode button is reordered before the font-size stepper so its relationship is clear.',
      },
      {
        title: 'Two-level font picker in semi-flat text style',
        description:
          "The text-style popover now has a 'Custom' entry that opens a font-library sub-view in place. Code, Classic, and Compact apply directly from the main list. Choosing Custom reveals all four font families rendered in their own typeface so the difference is visible at a glance.",
      },
      {
        title: 'Optional simple-popover indicators',
        description:
          "Color, font, size, compact Alignment, and Grouped arrow-style controls omit down arrows by default. A saved Lab switch restores them without changing each control's popover or accessible state; Grouped compound controls retain down chevrons and Inline expansions use left chevrons.",
      },
    ],
  },
  {
    version: '6',
    title: 'Label editing and keyboard controls',
    summary:
      'This iteration compares compact and direct text controls and adds a shared keyboard scheme that separates typing labels from choosing canvas tools.',
    publishedOn: '2026-09-13',
    changes: [
      {
        title: 'Compare compact and direct text controls',
        description:
          "Flat, Inline, and Grouped's one-line text row use the 3×3 Alignment popover by default, while saved Lab switches can restore six direct axis controls or replace the size dropdown with large − / value / + controls. Popovers close on selection changes; only persistent Flat sub-toolbars and Inline expansions can stay open across compatible selections.",
      },
      {
        title: 'Type on the selection',
        description:
          'Typing on one selected object replaces its label and reveals text tools; Enter or F2 edits the existing text. Tool letters require an empty selection, so labels can include the same letters without changing tools.',
      },
      {
        title: 'Shared keyboard commands',
        description:
          'All solutions share selection, history, nudge, pan, zoom, emphasis, and style-copy commands. Tooltips, optional toolbar key hints, a shortcut reference, and a searchable command palette expose the same actions and their scope.',
      },
      {
        title: 'Scenes visible at a glance',
        description:
          'Four icon buttons expose the complete test-scene set at once and keep the current scene visibly selected; the Motor controller scene adds a selectable closed-loop control annotation for text-tool comparisons.',
      },
      {
        title: 'Make color changes visible',
        description:
          "Choosing a stroke pattern or width after No stroke derives a visible border from each object's fill. Fill choices also derive readable, fill-related label color by default, with a saved Lab switch for keeping text color independent.",
      },
    ],
  },
  {
    version: '5',
    title: 'More expressive diagrams',
    summary:
      'This release broadens the visual experiments, makes connections and label editing easier to read, and adds this visible, curated release history.',
    publishedOn: '2026-09-12',
    changes: [
      {
        title: 'Manufacturer-inspired styles',
        description:
          'Try STM, Infineon, Renesas, NXP, and TI color directions across the full diagram, then keep editing individual colors.',
      },
      {
        title: 'Clearer connection direction',
        description:
          'Choose or cycle through None, Left, Right, and Both arrow states while connected endpoints stay attached.',
      },
      {
        title: 'Sharper canvas details',
        description:
          'Square-cornered shapes, cleaner arrow joins, and refined inline label editing make the fixture easier to evaluate.',
      },
      {
        title: 'Faster canvas navigation',
        description:
          'Right-drag anywhere on the diagram to pan without changing tools, and zoom around the cursor with the mouse wheel.',
      },
      {
        title: 'Flexible styling controls',
        description:
          'Compare merged or separate stroke controls, use no-color strokes, and optionally keep rare default, copy, and paste operations in a compact overflow menu.',
      },
    ],
  },
  {
    version: '2',
    title: 'A steadier formatting toolbar',
    summary:
      'This release focused on keeping the toolbar predictable while adding depth to the most-used formatting controls.',
    publishedOn: '2026-09-12',
    changes: [
      {
        title: 'Stable edge placement',
        description:
          'The toolbar stays put as popovers open, switch, or close, including when a popover must flip near a viewport edge.',
      },
      {
        title: 'Faster color and type choices',
        description:
          'Compact custom colors, direct font choices, visible size controls, and 1 / 2 / 4 / 8 px strokes reduce extra steps.',
      },
      {
        title: 'Adjustable popover chrome',
        description:
          'Popover headings can be shown or hidden, and that preference is saved with the experiment.',
      },
    ],
  },
  {
    version: '1',
    title: 'The first formatting lab',
    summary:
      'The initial release established a shared canvas for comparing compact formatting approaches on the same synthetic diagram.',
    publishedOn: '2026-09-12',
    changes: [
      {
        title: 'Three comparable solutions',
        description:
          'Flat, Grouped, and Inline arrangements share the same capabilities, fixture, and underlying formatting state.',
      },
      {
        title: 'Context-aware formatting',
        description:
          'Controls follow the selected object capabilities, reveal text tools during label editing, and surface mixed values explicitly.',
      },
      {
        title: 'Reusable experiments',
        description:
          'Test scenes, undo and redo, browser persistence, and JSON import and export make explorations repeatable.',
      },
    ],
  },
];

export const currentRelease = releaseNotes[0];
