import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Children, createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FormattingToolbar from '../src/FormattingToolbar';
import { createScene } from '../src/fixtures';
import { labelBounds, type Detail, type PanelBehavior, type Style } from '../src/model';
import { AlignmentGrid } from '../src/FormattingControls';
import { compatibleDetail, detailOnTextEntry } from '../src/toolbarModel';
import { parseSnapshot } from '../src/storage';

const objects = createScene('system');
const mcu = objects.find((o) => o.id === 'mcu')!;
const textObject = objects.find((o) => o.kind === 'text')!;
function render(
  behavior: PanelBehavior,
  editing: boolean,
  detail: Detail = detailOnTextEntry(behavior),
  selection = [mcu],
  mergeStrokeControls = true,
  groupedTextToolbar = true,
  compactTextAlignment = true,
) {
  return renderToStaticMarkup(
    createElement(FormattingToolbar, {
      onEscape() {},
      objects: selection,
      behavior,
      mergeStrokeControls,
      groupedTextToolbar,
      compactTextAlignment,
      editing,
      detail,
      setDetail() {},
      patch() {},
      patchObjects() {},
      cycleArrows() {},
      finishEditing() {},
      setDefaultStyle() {},
      copyStyle() {},
      pasteStyle() {},
      canPasteStyle: false,
      selection: { x: 300, y: 300, w: 180, h: 100 },
      viewport: { x: 0, y: 0, w: 1200, h: 800 },
    }),
  );
}
test('rare style actions are opt-in and the menu trigger stays at the end of every toolbar row', () => {
  for (const behavior of ['flat', 'grouped', 'inline'] as const) {
    const hidden = render(behavior, false);
    assert.doesNotMatch(hidden, /aria-label="More formatting actions"/);

    const shown = renderToStaticMarkup(
      createElement(FormattingToolbar, {
        onEscape() {},
        objects: [mcu],
        behavior,
        showMoreActions: true,
        editing: false,
        detail: behavior === 'flat' ? 'stroke' : behavior === 'inline' ? 'text' : null,
        setDetail() {},
        patch() {},
        patchObjects() {},
        cycleArrows() {},
        finishEditing() {},
        setDefaultStyle() {},
        copyStyle() {},
        pasteStyle() {},
        canPasteStyle: false,
        selection: { x: 300, y: 300, w: 180, h: 100 },
        viewport: { x: 0, y: 0, w: 1200, h: 800 },
      }),
    );
    assert.match(shown, /aria-label="More formatting actions"/);
    assert.match(shown, /aria-haspopup="menu"/);
    assert.ok(shown.lastIndexOf('More formatting actions') > shown.lastIndexOf('Stroke color'));
  }
});
test('Flat keeps typography direct and groups text alignment into a popover by default', () => {
  const markup = render('flat', true);
  assert.match(markup, /aria-label="Back to object formatting"/);
  assert.match(markup, /aria-label="Font family"/);
  assert.match(markup, /aria-label="Underline"/);
  assert.match(markup, /data-popover-trigger="font-size"/);
  assert.match(markup, /aria-label="Alignment settings"/);
  assert.doesNotMatch(markup, /aria-label="Horizontal alignment"/);
  assert.doesNotMatch(markup, /aria-label="Fill color"/);
  assert.doesNotMatch(markup, /data-testid="formatting-popover"/);

  const expanded = render('flat', true, 'alignment');
  assert.match(expanded, /aria-label="Alignment settings"/);
  assert.match(expanded, /data-testid="formatting-popover"/);
  assert.match(expanded, /aria-label="Text position"/);
  assert.doesNotMatch(expanded, /aria-label="Horizontal alignment"/);
});
test('Flat restores the six direct alignment buttons when the compact modifier is off', () => {
  const markup = render('flat', true, null, [mcu], true, true, false);
  assert.match(markup, /aria-label="Font family"/);
  assert.match(markup, /aria-label="Underline"/);
  assert.match(markup, /aria-label="Horizontal alignment"/);
  assert.match(markup, /aria-label="Vertical alignment"/);
  assert.doesNotMatch(markup, /aria-label="Alignment settings"/);
  assert.doesNotMatch(markup, /data-testid="formatting-popover"/);
});
test('the single-action alignment grid reports completion after applying one position', () => {
  const patches: Partial<Style>[] = [];
  let choices = 0;
  const grid = AlignmentGrid({
    value: (key) => mcu.style[key],
    patch: (next) => patches.push(next),
    onChoose: () => choices++,
  });
  const buttons = Children.toArray(
    (grid.props as { children: ReactNode }).children,
  ) as ReactElement<{ onClick: () => void }>[];

  buttons[0].props.onClick();

  assert.deepEqual(patches, [{ align: 'left', verticalAlign: 'top' }]);
  assert.equal(choices, 1);
});
test('Grouped one-line text mode also uses compact alignment by default', () => {
  const markup = render('grouped', true);
  assert.match(markup, /aria-label="Back to object formatting"/);
  assert.match(markup, /aria-label="Font family"/);
  assert.match(markup, /aria-label="Underline"/);
  assert.match(markup, /aria-label="Alignment settings"/);
  assert.doesNotMatch(markup, /aria-label="Horizontal alignment"/);
  assert.doesNotMatch(markup, /aria-label="Fill color"/);
  assert.doesNotMatch(markup, /data-testid="formatting-popover"/);

  const expanded = render('grouped', true, 'alignment');
  assert.match(expanded, /data-testid="formatting-popover"/);
  assert.match(expanded, /aria-label="Text position"/);
});
test('Grouped one-line text mode restores direct alignment when compact mode is off', () => {
  const markup = render('grouped', true, 'text', [mcu], true, true, false);
  assert.match(markup, /aria-label="Horizontal alignment"/);
  assert.match(markup, /aria-label="Vertical alignment"/);
  assert.doesNotMatch(markup, /aria-label="Alignment settings"/);
  assert.doesNotMatch(markup, /data-testid="formatting-popover"/);
});
test('Grouped keeps the text popover for manual formatting and when the modifier is off', () => {
  for (const markup of [
    render('grouped', false, 'text'),
    render('grouped', true, 'text', [mcu], true, false),
  ]) {
    assert.match(markup, /aria-label="Fill color"/);
    assert.match(markup, /aria-label="Stroke settings"/);
    assert.match(markup, /data-testid="formatting-popover"/);
    assert.match(markup, /aria-label="Font family"/);
    assert.doesNotMatch(markup, /aria-label="Back to object formatting"/);
  }
});
test('Grouped opens selected text objects in the one-line row with a path back to the object', () => {
  const markup = render('grouped', false, 'text', [textObject]);
  assert.match(markup, /role="toolbar" aria-label="Text formatting"/);
  assert.match(markup, /aria-label="Back to object formatting"/);
  assert.match(markup, /aria-label="Font family"/);
  assert.match(markup, /aria-label="Alignment settings"/);
  assert.doesNotMatch(markup, /data-testid="formatting-popover"/);

  const disabled = render('grouped', false, 'text', [textObject], true, false);
  assert.match(disabled, /role="toolbar" aria-label="Object formatting"/);
  assert.match(disabled, /data-testid="formatting-popover"/);
  assert.doesNotMatch(disabled, /aria-label="Back to object formatting"/);
});
test('Flat stroke replaces the object row with dedicated tools and Back', () => {
  const markup = render('flat', false, 'stroke');
  assert.match(markup, /aria-label="Back to object formatting"/);
  assert.match(markup, /data-testid="flat-detail-controls"/);
  assert.doesNotMatch(markup, /data-testid="formatting-popover"/);
  assert.doesNotMatch(markup, /aria-label="Fill color"/);
  assert.doesNotMatch(markup, /aria-label="Text formatting"/);
  assert.match(markup, /aria-label="dashed stroke"/);
  assert.match(markup, /aria-label="Large stroke width"/);
  assert.match(markup, /aria-label="Stroke color"/);
});
test('Flat object alignment uses a popover by default and its sub-toolbar when disabled', () => {
  const compact = render('flat', false, 'alignment');
  assert.match(compact, /aria-label="Fill color"/);
  assert.match(compact, /data-testid="formatting-popover"/);
  assert.match(compact, /aria-label="Text position"/);
  assert.doesNotMatch(compact, /aria-label="Back to object formatting"/);

  const direct = render('flat', false, 'alignment', [mcu], true, true, false);
  assert.match(direct, /aria-label="Back to object formatting"/);
  assert.match(direct, /data-testid="flat-detail-controls"/);
  assert.match(direct, /aria-label="Horizontal alignment"/);
  assert.match(direct, /aria-label="Vertical alignment"/);
  assert.doesNotMatch(direct, /data-testid="formatting-popover"/);
});
test('Grouped stroke and alignment keep the object row and use a popover', () => {
  for (const detail of ['stroke', 'alignment'] as const) {
    const markup = render('grouped', false, detail);
    assert.match(markup, /aria-label="Fill color"/);
    assert.match(markup, /data-testid="formatting-popover"/);
    assert.doesNotMatch(markup, /aria-label="Back to object formatting"/);
    assert.doesNotMatch(markup, /data-testid="flat-detail-controls"/);
  }
});
test('stroke color merging is optional for Flat and Inline while Grouped stays separate', () => {
  const connection = objects.find((object) => object.kind === 'connection')!;
  for (const behavior of ['flat', 'inline'] as const) {
    assert.doesNotMatch(render(behavior, false), /aria-label="Stroke color"/);
    assert.equal(
      (render(behavior, false, null, [mcu], false).match(/aria-label="Stroke color"/g) ?? [])
        .length,
      1,
    );
    assert.doesNotMatch(render(behavior, false, null, [connection]), /aria-label="Line color"/);
    assert.equal(
      (render(behavior, false, null, [connection], false).match(/aria-label="Line color"/g) ?? [])
        .length,
      1,
    );
  }

  for (const mergeStrokeControls of [true, false]) {
    assert.equal(
      (
        render('grouped', false, 'stroke', [mcu], mergeStrokeControls).match(
          /aria-label="Stroke color"/g,
        ) ?? []
      ).length,
      1,
    );
  }

  assert.equal(
    (render('flat', false, 'stroke').match(/aria-label="Stroke color"/g) ?? []).length,
    1,
  );
  assert.doesNotMatch(render('flat', false, 'stroke', [mcu], false), /aria-label="Stroke color"/);
});
test('Stroke summary uses line weight instead of pixels and compacts the no-border state', () => {
  const visible = render('grouped', false);
  const lineSummary = visible.match(
    /<span class="stroke-summary" data-testid="stroke-summary-line">([\s\S]*?)<\/span>/,
  );
  assert.ok(lineSummary);
  assert.match(lineSummary[1], /stroke-width="1\.5"/);
  assert.doesNotMatch(visible, />1\.5 px</);

  const noBorder = render('grouped', false, null, [
    { ...mcu, style: { ...mcu.style, stroke: 'transparent' } },
  ]);
  assert.match(noBorder, /title="Stroke: No border"/);
  assert.match(noBorder, /data-testid="stroke-summary-none"/);
  assert.match(noBorder, /class="no-border-sample"/);
  assert.doesNotMatch(noBorder, /data-testid="stroke-summary-line"/);
});
test('Inline keeps Text and Stroke in-row while alignment uses a popover by default', () => {
  for (const detail of ['text', 'stroke'] as const) {
    const markup = render('inline', false, detail);
    assert.match(markup, /data-testid="inline-controls"/);
    assert.doesNotMatch(markup, /data-testid="formatting-popover"/);
  }

  const compactAlignment = render('inline', false, 'alignment');
  assert.match(compactAlignment, /data-testid="formatting-popover"/);
  assert.match(compactAlignment, /aria-label="Text position"/);
  assert.doesNotMatch(compactAlignment, /data-testid="inline-controls"/);

  const directAlignment = render('inline', false, 'alignment', [mcu], true, true, false);
  assert.match(directAlignment, /data-testid="inline-controls"/);
  assert.match(directAlignment, /aria-label="Horizontal alignment"/);
  assert.match(directAlignment, /aria-label="Vertical alignment"/);
  assert.doesNotMatch(directAlignment, /data-testid="formatting-popover"/);
});
test('sticky groups transfer only to compatible selections, and switching off closes them', () => {
  const port = objects.find((o) => o.kind === 'port')!;
  const line = objects.find((o) => o.kind === 'connection')!;
  assert.equal(compatibleDetail('stroke', [mcu, line], 'inline', true), 'stroke');
  assert.equal(compatibleDetail('stroke', [port], 'inline', true), null);
  assert.equal(compatibleDetail('text', [mcu, port], 'grouped', true), 'text');
  assert.equal(compatibleDetail('alignment', [mcu, port], 'grouped', true), null);
  assert.equal(compatibleDetail('text', [mcu], 'grouped', false), null);
  assert.equal(compatibleDetail('arrows', [line], 'inline', true), 'arrows');
  assert.equal(compatibleDetail('arrows', [mcu, line], 'inline', true), null);
  assert.equal(compatibleDetail('arrows', [line], 'grouped', false), null);
});
test('Arrow choices follow each behavior while retaining the separate cycle button', () => {
  const connection = objects.find((o) => o.id === 'pwm')!;
  for (const behavior of ['flat', 'grouped', 'inline'] as const) {
    const collapsed = render(behavior, false, null, [connection]);
    assert.match(collapsed, /aria-label="Arrows settings"/);
    assert.doesNotMatch(collapsed, /aria-label="Arrows: none"/);
    const expanded = render(behavior, false, 'arrows', [connection]);
    for (const state of ['none', 'left', 'right', 'both']) {
      assert.match(expanded, new RegExp(`aria-label="Arrows: ${state}"`));
    }
    assert.equal((expanded.match(/aria-label="Cycle connection arrows"/g) ?? []).length, 1);
    assert.match(expanded, /data-icon="arrow-both"/);
    assert.match(expanded, /data-icon="iterate-arrow-states"/);
    assert.match(expanded, /aria-label="Arrows: right" aria-pressed="true"/);
    if (behavior === 'flat') {
      assert.match(expanded, /aria-label="Back to object formatting"/);
      assert.doesNotMatch(expanded, /aria-label="Stroke settings"/);
      assert.doesNotMatch(expanded, /data-testid="formatting-popover"/);
    } else if (behavior === 'grouped') {
      assert.match(expanded, /aria-label="Stroke settings"/);
      assert.match(expanded, /data-testid="formatting-popover"/);
      assert.doesNotMatch(expanded, /data-testid="inline-controls"/);
    } else {
      assert.match(expanded, /data-testid="inline-controls"/);
      assert.doesNotMatch(expanded, /data-testid="formatting-popover"/);
    }
  }
});
test('version-one experiments migrate all three choices without losing diagram styles', () => {
  for (const [oldName, newName] of [
    ['replace', 'flat'],
    ['stack', 'grouped'],
    ['inline', 'inline'],
  ]) {
    const legacyObjects = objects.map((o) => {
      const { underline: _u, strikethrough: _s, verticalAlign: _v, ...style } = o.style;
      return { ...o, style };
    });
    const migrated = parseSnapshot({
      version: 1,
      objects: legacyObjects,
      scene: 'system',
      behavior: oldName,
      sticky: true,
    });
    assert.ok(migrated);
    assert.equal(migrated.behavior, newName);
    assert.equal(migrated.objects[0].style.fill, objects[0].style.fill);
    assert.equal(migrated.objects[0].style.verticalAlign, 'middle');
    assert.equal(migrated.objects[0].style.underline, false);
  }
  assert.equal(
    parseSnapshot({ version: 9, objects, scene: 'system', behavior: 'flat', sticky: true }),
    null,
  );
});
test('vertical alignment moves the label and keeps its subtitle group inside a block', () => {
  const top = labelBounds({ ...mcu, style: { ...mcu.style, verticalAlign: 'top' } }, objects);
  const bottom = labelBounds({ ...mcu, style: { ...mcu.style, verticalAlign: 'bottom' } }, objects);
  assert.ok(top.y < labelBounds(mcu, objects).y);
  assert.ok(bottom.y > labelBounds(mcu, objects).y);
  assert.ok(bottom.y + bottom.h + 18 <= mcu.y + mcu.h);
});
