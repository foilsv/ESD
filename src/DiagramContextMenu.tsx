import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  BringToFront,
  Check,
  ChevronRight,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Focus,
  Grid2X2,
  Group,
  LockKeyhole,
  Scissors,
  SendToBack,
  SquareDashed,
  Trash2,
} from 'lucide-react';
import type { ContextAction, ContextMenuItem } from './contextMenuModel';
import type { Point } from './model';
import './contextMenu.css';

const icons = {
  cut: Scissors,
  copy: Copy,
  paste: ClipboardPaste,
  duplicate: CopyPlus,
  front: BringToFront,
  back: SendToBack,
  group: Group,
  lock: LockKeyhole,
  delete: Trash2,
  'select-all': SquareDashed,
  fit: Focus,
  grid: Grid2X2,
  align: AlignHorizontalJustifyCenter,
  'align-left': AlignHorizontalJustifyStart,
  'align-center': AlignHorizontalJustifyCenter,
  'align-right': AlignHorizontalJustifyEnd,
  'align-top': AlignVerticalJustifyStart,
  'align-middle': AlignVerticalJustifyCenter,
  'align-bottom': AlignVerticalJustifyEnd,
};

interface Props {
  point: Point;
  groups: ContextMenuItem[][];
  onAction: (id: ContextAction) => void;
  onClose: (restoreFocus?: boolean) => void;
}

export default function DiagramContextMenu({ point, groups, onAction, onClose }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const submenu = useRef<HTMLDivElement>(null);
  const focusSubmenu = useRef(false);
  const submenuId = useId();
  const [position, setPosition] = useState(point);
  const [subPosition, setSubPosition] = useState<Point | null>(null);
  const [active, setActive] = useState('');
  const [open, setOpen] = useState<ContextAction | null>(null);
  const expanded = groups.flat().find((item) => item.id === open);

  useLayoutEffect(() => {
    const root = menu.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    setPosition({
      x: Math.max(8, Math.min(point.x, window.innerWidth - rect.width - 8)),
      y: Math.max(8, Math.min(point.y, window.innerHeight - rect.height - 8)),
    });
    setActive('');
    setOpen(null);
    // Focus the menu itself so opening it never chooses a command or starts label typing.
    const frame = requestAnimationFrame(() => root.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [point]);

  useLayoutEffect(() => {
    if (!open || !menu.current || !submenu.current) return;
    const trigger = menu.current.querySelector<HTMLButtonElement>('[data-action="' + open + '"]');
    if (!trigger) return;
    const parentRect = menu.current.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const childRect = submenu.current.getBoundingClientRect();
    const right = parentRect.right - 1;
    const x =
      right + childRect.width <= window.innerWidth - 8
        ? right
        : parentRect.left - childRect.width + 1;
    setSubPosition({
      x: Math.max(8, Math.min(x, window.innerWidth - childRect.width - 8)),
      y: Math.max(8, Math.min(triggerRect.top - 6, window.innerHeight - childRect.height - 8)),
    });
    if (!focusSubmenu.current) return;
    focusSubmenu.current = false;
    const frame = requestAnimationFrame(() => submenu.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open, position]);

  useEffect(() => {
    const dismissOutside = (event: PointerEvent | WheelEvent) => {
      if (!surface.current?.contains(event.target as Node)) onClose(false);
    };
    const dismiss = () => onClose(false);
    document.addEventListener('pointerdown', dismissOutside, true);
    document.addEventListener('wheel', dismissOutside, { passive: true });
    window.addEventListener('resize', dismiss);
    window.addEventListener('blur', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside, true);
      document.removeEventListener('wheel', dismissOutside);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('blur', dismiss);
    };
  }, [onClose]);

  function expand(item: ContextMenuItem, keyboard = false) {
    if (open !== item.id) {
      setSubPosition(null);
      focusSubmenu.current = keyboard;
      setOpen(item.id);
    } else if (keyboard) submenu.current?.focus({ preventScroll: true });
  }
  function closeSubmenu() {
    menu.current
      ?.querySelector<HTMLButtonElement>('[data-action="' + open + '"]')
      ?.focus({ preventScroll: true });
    setOpen(null);
  }
  function navigate(event: KeyboardEvent<HTMLDivElement>, nested = false) {
    if (event.key === 'Escape' || event.key === 'Tab' || (event.key === 'ArrowLeft' && open)) {
      event.preventDefault();
      event.stopPropagation();
      if (open && event.key !== 'Tab') closeSubmenu();
      else onClose();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const currentItem = groups.flat().find((item) => item.id === items[current]?.dataset.action);
    if (!nested && event.key === 'ArrowRight' && currentItem?.children) {
      event.preventDefault();
      event.stopPropagation();
      expand(currentItem, true);
      return;
    }
    let next: HTMLButtonElement | undefined;
    if (event.key === 'ArrowDown') next = items[(current + 1) % items.length];
    else if (event.key === 'ArrowUp')
      next = current < 0 ? items.at(-1) : items[(current - 1 + items.length) % items.length];
    else if (event.key === 'Home') next = items[0];
    else if (event.key === 'End') next = items.at(-1);
    else if (event.key.length === 1 && event.key !== ' ') {
      next = [...items.slice(current + 1), ...items.slice(0, current + 1)].find((item) =>
        item.dataset.label?.toLowerCase().startsWith(event.key.toLowerCase()),
      );
    }
    if (next) {
      event.preventDefault();
      event.stopPropagation();
      if (!nested) setOpen(null);
      next.focus();
    }
  }
  function rows(items: ContextMenuItem[], nested = false) {
    return items.map((item) => {
      const Icon = item.checked ? Check : icons[item.id];
      return (
        <button
          key={item.id}
          type="button"
          role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
          aria-checked={item.checked}
          aria-label={item.label}
          aria-haspopup={item.children ? 'menu' : undefined}
          aria-expanded={item.children ? open === item.id : undefined}
          aria-controls={item.children && open === item.id ? submenuId : undefined}
          disabled={item.disabled}
          tabIndex={active === item.id ? 0 : -1}
          data-label={item.label}
          data-action={item.id}
          data-active={active === item.id || open === item.id}
          className={'context-menu-item ' + (item.id === 'delete' ? 'destructive' : '')}
          onFocus={() => setActive(item.id)}
          onPointerMove={(event) => {
            if (item.disabled) return;
            if (document.activeElement !== event.currentTarget)
              event.currentTarget.focus({ preventScroll: true });
            if (!nested) {
              if (item.children) expand(item);
              else setOpen(null);
            }
          }}
          onClick={(event) => {
            if (item.children) expand(item, event.detail === 0);
            else {
              onClose();
              onAction(item.id);
            }
          }}
        >
          <Icon size={16} strokeWidth={1.7} aria-hidden="true" />
          <span>{item.label}</span>
          {item.shortcut && (
            <span className="context-menu-shortcut" aria-hidden="true">
              {item.shortcut}
            </span>
          )}
          {item.children && (
            <ChevronRight className="context-menu-chevron" size={14} aria-hidden="true" />
          )}
        </button>
      );
    });
  }
  return (
    <div ref={surface} onContextMenu={(event) => event.preventDefault()}>
      <div
        ref={menu}
        className="diagram-context-menu"
        role="menu"
        aria-label="Diagram actions"
        tabIndex={-1}
        style={{ left: position.x, top: position.y }}
        onKeyDown={(event) => navigate(event)}
        onScroll={() => setOpen(null)}
      >
        {groups.map((group, index) => (
          <div key={index} role="group">
            {index > 0 && <div role="separator" className="context-menu-separator" />}
            {rows(group)}
          </div>
        ))}
      </div>
      {expanded?.children && (
        <div
          ref={submenu}
          id={submenuId}
          className="diagram-context-menu context-submenu"
          role="menu"
          aria-label="Align objects"
          tabIndex={-1}
          style={{
            left: subPosition?.x ?? 0,
            top: subPosition?.y ?? 0,
            visibility: subPosition ? undefined : 'hidden',
          }}
          onKeyDown={(event) => navigate(event, true)}
        >
          {rows(expanded.children, true)}
        </div>
      )}
    </div>
  );
}
