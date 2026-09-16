import { Cpu } from 'lucide-react';
import {
  bounds,
  canEditLabel,
  fonts,
  isLine,
  labelBounds,
  patternDash,
  type DiagramObject,
  type Point,
} from './model';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { connectionGeometry } from './connectionGeometry';
import type { View } from './viewport';
import LabelEditor from './LabelEditor';
interface Props {
  objects: DiagramObject[];
  selected: string[];
  editing: string | null;
  setDraft: (value: string) => void;
  textEntryEnabled: boolean;
  startTyping: (id: string, value: string) => void;
  emphasize: (property: 'bold' | 'italic' | 'underline') => void;
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
  end: (event: ReactPointerEvent<SVGSVGElement>) => void;
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
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter') {
            e.preventDefault();
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
        {canEditLabel(object) && (
          <foreignObject
            x={label.x}
            y={label.y}
            width={label.w}
            height={label.h}
            style={{ overflow: 'visible' }}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              {active && selected.length === 1 && (
                <LabelEditor
                  object={object}
                  editing={editing === id}
                  enabled={props.textEntryEnabled}
                  onStart={(value) => props.startTyping(id, value)}
                  onDraft={props.setDraft}
                  onFinish={props.finishEdit}
                  onFormat={props.emphasize}
                />
              )}
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
                  visibility: editing === id ? 'hidden' : undefined,
                }}
              >
                <span>{object.label}</span>
              </div>
            </div>
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
        {!isLine(object) &&
          (() => {
            const hw = object.hardwareComponents ?? [];
            const sw = object.softwareComponents ?? [];
            const badges = [
              ...hw.map((name) => ({ name, fill: '#fef3c7', stroke: '#d97706', color: '#92400e' })),
              ...sw.map((name) => ({ name, fill: '#dcfce7', stroke: '#15803d', color: '#166534' })),
            ];
            if (!badges.length) return null;
            const subtitleOffset = object.subtitle ? 20 : 0;
            const startY = label.y + label.h + subtitleOffset + 8;
            return (
              <>
                {badges.map((badge, i) => {
                  const bh = 16;
                  const displayName =
                    badge.name.length > 16 ? badge.name.slice(0, 15) + '…' : badge.name;
                  const bw = Math.max(48, Math.min(displayName.length * 5.8 + 18, w - 12));
                  const bx = x + 6;
                  const by = startY + i * (bh + 3);
                  return (
                    <g key={i} pointerEvents="none">
                      <rect
                        x={bx}
                        y={by}
                        width={bw}
                        height={bh}
                        rx={4}
                        fill={badge.fill}
                        stroke={badge.stroke}
                        strokeWidth={0.8}
                      />
                      <text
                        x={bx + 8}
                        y={by + 11}
                        fontSize={9}
                        fontWeight={600}
                        fill={badge.color}
                        fontFamily="Inter, sans-serif"
                      >
                        {displayName}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
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
      tabIndex={0}
      onPointerDown={props.startCanvas}
      onPointerMove={(e) => props.move({ x: e.clientX, y: e.clientY })}
      onPointerUp={props.end}
      onPointerCancel={props.end}
      onWheel={props.zoomWheel}
      onContextMenu={(event) => {
        // Native text editing keeps its own clipboard and spelling menu.
        if (!(event.target as Element).closest('input, textarea, [contenteditable]'))
          event.preventDefault();
      }}
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
