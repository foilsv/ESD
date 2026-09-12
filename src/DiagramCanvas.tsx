import { Cpu } from 'lucide-react';
import {
  bounds,
  connectionArrows,
  fonts,
  isLine,
  labelBounds,
  pathFor,
  patternDash,
  type DiagramObject,
  type Point,
} from './model';
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface View {
  x: number;
  y: number;
  zoom: number;
}
interface Props {
  objects: DiagramObject[];
  selected: string[];
  editing: string | null;
  draft: string;
  setDraft: (value: string) => void;
  view: View;
  grid: boolean;
  hand: boolean;
  select: (id: string, shift: boolean) => void;
  edit: (id: string) => void;
  finishEdit: (cancel?: boolean) => void;
  startObject: (e: ReactPointerEvent, object: DiagramObject, resize?: boolean) => void;
  startCanvas: (e: ReactPointerEvent<SVGSVGElement>) => void;
  move: (point: Point) => void;
  end: () => void;
}

export function arrowMarkerSize(width: number) {
  return Math.max(9, Math.min(24, width * 3));
}

export default function DiagramCanvas(props: Props) {
  const { objects, selected, editing, view } = props;
  const render = (object: DiagramObject) => {
    const { id, kind, style, x, y, w, h } = object;
    const active = selected.includes(id);
    const label = labelBounds(object, objects);
    const rect = bounds(object, objects);
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
        {isLine(object) ? (
          <>
            <defs>
              <marker
                id={`arrow-start-${id}`}
                markerWidth={arrowMarkerSize(style.width)}
                markerHeight={arrowMarkerSize(style.width)}
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
                markerWidth={arrowMarkerSize(style.width)}
                markerHeight={arrowMarkerSize(style.width)}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M1 1 L7 4 L1 7 Z" fill={style.stroke} />
              </marker>
            </defs>
            {active && (
              <path
                d={pathFor(object, objects)}
                fill="none"
                stroke="#93baff"
                strokeWidth="10"
                opacity=".3"
              />
            )}
            <path
              d={pathFor(object, objects)}
              fill="none"
              stroke="transparent"
              strokeWidth="18"
              className="line-hit"
            />
            <path
              d={pathFor(object, objects)}
              fill="none"
              stroke={style.stroke}
              strokeWidth={style.width}
              strokeDasharray={patternDash(style.pattern)}
              strokeLinecap="round"
              markerStart={
                ['left', 'both'].includes(connectionArrows(object)) && style.width > 0
                  ? `url(#arrow-start-${id})`
                  : undefined
              }
              markerEnd={
                ['right', 'both'].includes(connectionArrows(object)) && style.width > 0
                  ? `url(#arrow-end-${id})`
                  : undefined
              }
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
            rx={kind === 'rectangle' ? 2 : kind === 'port' ? 4 : 8}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.width}
            strokeDasharray={patternDash(style.pattern)}
          />
        )}
        {active && !isLine(object) && (
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
          >
            {object.subtitle}
          </text>
        )}
        {active && !isLine(object) && (
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
      className={`diagram-canvas ${props.hand ? 'hand-mode' : ''}`}
      aria-label="Electronics system diagram"
      onPointerDown={props.startCanvas}
      onPointerMove={(e) => props.move({ x: e.clientX, y: e.clientY })}
      onPointerUp={props.end}
      onPointerCancel={props.end}
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
