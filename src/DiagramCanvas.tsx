import { Cpu } from 'lucide-react';
import {
  bounds,
  fonts,
  isLine,
  labelBounds,
  patternDash,
  type DiagramObject,
  type Point,
} from './model';
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { connectionGeometry } from './connectionGeometry';
import type { View } from './viewport';
interface Props {
  objects: DiagramObject[];
  selected: string[];
  editing: string | null;
  draft: string;
  setDraft: (value: string) => void;
  view: View;
  grid: boolean;
  panning: boolean;
  select: (id: string, shift: boolean) => void;
  edit: (id: string) => void;
  finishEdit: (cancel?: boolean) => void;
  startObject: (e: ReactPointerEvent, object: DiagramObject, resize?: boolean) => void;
  startCanvas: (e: ReactPointerEvent<SVGSVGElement>) => void;
  zoomWheel: (e: ReactWheelEvent<SVGSVGElement>) => void;
  move: (point: Point) => void;
  end: () => void;
}

export default function DiagramCanvas(props: Props) {
  const { objects, selected, editing, view } = props;
  const render = (object: DiagramObject) => {
    const { id, kind, style, x, y, w, h } = object;
    const active = selected.includes(id);
    const label = labelBounds(object, objects);
    const rect = bounds(object, objects);
    const geometry = isLine(object) ? connectionGeometry(object, objects) : null;
    return (
      <g
        key={id}
        data-object-id={id}
        data-kind={kind}
        role="button"
        tabIndex={0}
        aria-label={`${object.label || 'Line'}, ${kind}`}
        aria-pressed={active}
        className={`diagram-object ${active ? 'selected-object' : ''}`}
        onPointerDown={(e) => props.startObject(e, object)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          props.edit(id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            props.select(id, false);
            props.edit(id);
          }
          if (e.key === ' ') {
            e.preventDefault();
            props.select(id, e.shiftKey);
          }
        }}
      >
        {geometry ? (
          <>
            <defs>
              <marker
                id={`arrow-start-${id}`}
                markerWidth={geometry.startSize || 1}
                markerHeight={geometry.startSize || 1}
                viewBox="0 0 8 8"
                refX="1"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M7 1 L1 4 L7 7 Z" fill={style.stroke} />
              </marker>
              <marker
                id={`arrow-end-${id}`}
                markerWidth={geometry.endSize || 1}
                markerHeight={geometry.endSize || 1}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M1 1 L7 4 L1 7 Z" fill={style.stroke} />
              </marker>
            </defs>
            {active && geometry.shaftPath && (
              <path
                d={geometry.shaftPath}
                fill="none"
                stroke="#93baff"
                strokeWidth="10"
                opacity=".3"
              />
            )}
            <path
              d={geometry.fullPath}
              fill="none"
              stroke="transparent"
              strokeWidth="18"
              className="line-hit"
            />
            {geometry.shaftPath && (
              <path
                className="connection-shaft"
                d={geometry.shaftPath}
                fill="none"
                stroke={style.stroke}
                strokeWidth={style.width}
                strokeDasharray={patternDash(style.pattern)}
                strokeLinecap={
                  !(geometry.startSize || geometry.endSize) ||
                  (style.pattern !== 'solid' && geometry.roundCapsFit)
                    ? 'round'
                    : 'butt'
                }
              />
            )}
            {geometry.shaftPath &&
              style.pattern === 'solid' &&
              (geometry.startSize > 0 || geometry.endSize > 0) &&
              [
                !geometry.startSize ? geometry.points[0] : null,
                !geometry.endSize ? geometry.points.at(-1) : null,
              ].map(
                (point, i) =>
                  point && (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r={style.width / 2}
                      fill={style.stroke}
                    />
                  ),
              )}
            <path
              className="connection-arrowheads"
              d={geometry.fullPath}
              fill="none"
              stroke="none"
              pointerEvents="none"
              markerStart={geometry.startSize > 0 ? `url(#arrow-start-${id})` : undefined}
              markerEnd={geometry.endSize > 0 ? `url(#arrow-end-${id})` : undefined}
            />
          </>
        ) : kind === 'symbol' ? (
          <Cpu x={x} y={y} width={w} height={h} stroke={style.stroke} strokeWidth={1.5} />
        ) : kind === 'text' ? (
          <rect x={x} y={y} width={w} height={h} fill="transparent" />
        ) : kind === 'ellipse' ? (
          <ellipse
            cx={x + w / 2}
            cy={y + h / 2}
            rx={w / 2}
            ry={h / 2}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.width}
            strokeDasharray={patternDash(style.pattern)}
          />
        ) : (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={0}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.width}
            strokeDasharray={patternDash(style.pattern)}
          />
        )}
        {active && editing !== id && !isLine(object) && (
          <g className="selection-outline" pointerEvents="none">
            <rect
              x={rect.x - 4}
              y={rect.y - 4}
              width={rect.w + 8}
              height={rect.h + 8}
              rx="2"
              fill="none"
              stroke="#2563eb"
              strokeWidth={1.2 / view.zoom}
            />
            {[
              [x - 4, y - 4],
              [x + w + 4, y - 4],
              [x - 4, y + h + 4],
              [x + w + 4, y + h + 4],
            ].map(([hx, hy], i) => (
              <rect
                key={i}
                x={hx - 3}
                y={hy - 3}
                width="6"
                height="6"
                fill="white"
                stroke="#2563eb"
                strokeWidth={1 / view.zoom}
              />
            ))}
          </g>
        )}
        {object.label && kind !== 'symbol' && (
          <foreignObject
            x={label.x}
            y={label.y}
            width={label.w}
            height={label.h}
            style={{ overflow: 'visible' }}
          >
            {editing === id ? (
              <input
                className="canvas-label-input"
                aria-label="Edit object label"
                autoFocus
                value={props.draft}
                maxLength={500}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => props.setDraft(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') props.finishEdit();
                  if (e.key === 'Escape') props.finishEdit(true);
                }}
                style={{
                  fontFamily: fonts[style.fontFamily].css,
                  fontSize: style.fontSize,
                  fontWeight: style.bold ? 700 : 400,
                  fontStyle: style.italic ? 'italic' : 'normal',
                  textDecoration: [
                    style.underline && 'underline',
                    style.strikethrough && 'line-through',
                  ]
                    .filter(Boolean)
                    .join(' '),
                  color: style.textColor,
                  backgroundColor: !isLine(object) && kind !== 'text' ? style.fill : '#ffffff',
                  textAlign: style.align,
                }}
              />
            ) : (
              <div
                className={`object-label ${isLine(object) ? 'connection-label' : ''}`}
                style={{
                  fontFamily: fonts[style.fontFamily].css,
                  fontSize: style.fontSize,
                  fontWeight: style.bold ? 700 : 400,
                  fontStyle: style.italic ? 'italic' : 'normal',
                  textDecoration: [
                    style.underline && 'underline',
                    style.strikethrough && 'line-through',
                  ]
                    .filter(Boolean)
                    .join(' '),
                  color: style.textColor,
                  textAlign: style.align,
                }}
              >
                <span>{object.label}</span>
              </div>
            )}
          </foreignObject>
        )}
        {object.subtitle && !isLine(object) && (
          <text
            x={x + w / 2}
            y={label.y + label.h + 12}
            textAnchor="middle"
            className="object-subtitle"
            style={object.originalColors ? { fill: style.textColor } : undefined}
          >
            {object.subtitle}
          </text>
        )}
        {active && editing !== id && !isLine(object) && (
          <rect
            className="resize-handle"
            aria-label="Resize object"
            x={x + w - 5}
            y={y + h - 5}
            width="18"
            height="18"
            fill="transparent"
            onPointerDown={(e) => {
              e.stopPropagation();
              props.startObject(e, object, true);
            }}
          />
        )}
      </g>
    );
  };
  return (
    <svg
      className={`diagram-canvas ${props.panning ? 'panning' : ''}`}
      aria-label="Electronics system diagram"
      onPointerDown={props.startCanvas}
      onPointerMove={(e) => props.move({ x: e.clientX, y: e.clientY })}
      onPointerUp={props.end}
      onPointerCancel={props.end}
      onWheel={props.zoomWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {props.grid && (
        <>
          <defs>
            <pattern
              id="grid"
              width={24 * view.zoom}
              height={24 * view.zoom}
              patternUnits="userSpaceOnUse"
              x={view.x}
              y={view.y}
            >
              <circle cx="1" cy="1" r=".8" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />
        </>
      )}
      <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
        {objects.filter(isLine).map(render)}
        {objects.filter((o) => !isLine(o)).map(render)}
      </g>
    </svg>
  );
}
