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
    version: '3',
    title: 'More expressive diagrams',
    summary:
      'The next release broadens the visual experiments, makes connections and label editing easier to read, and adds this visible, curated release history.',
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
