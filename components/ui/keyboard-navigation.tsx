"use client"

import * as React from "react"
import { keyboardUtils, focusUtils } from "@/lib/accessibility-utils"

interface KeyboardNavigationProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical' | 'grid'
  gridColumns?: number
  wrap?: boolean
  onNavigate?: (index: number) => void
  className?: string
}

/**
 * KeyboardNavigation provides arrow key navigation for lists and grids
 */
export function KeyboardNavigation({
  children,
  orientation = 'vertical',
  gridColumns,
  // wrap = true,
  onNavigate,
  className
}: KeyboardNavigationProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // const [currentIndex, setCurrentIndex] = React.useState<number>(-1);

  // Get all focusable children
  const getFocusableChildren = React.useCallback(() => {
    if (!containerRef.current) return [];
    return focusUtils.getFocusableElements(containerRef.current);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    const focusableElements = getFocusableChildren();
    if (focusableElements.length === 0) return;

    // Find current focused element index
    const activeElement = document.activeElement as HTMLElement;
    const currentIdx = focusableElements.indexOf(activeElement);
    
    if (currentIdx === -1) return;

    // Handle arrow key navigation
    const newIndex = keyboardUtils.handleArrowNavigation(
      event,
      currentIdx,
      focusableElements.length,
      orientation,
      gridColumns
    );

    if (newIndex !== null) {
      focusableElements[newIndex]?.focus();
      // setCurrentIndex(newIndex);
      onNavigate?.(newIndex);
    }

    // Handle Home/End navigation
    const homeEndIndex = keyboardUtils.handleHomeEndNavigation(event, focusableElements.length);
    if (homeEndIndex !== null) {
      focusableElements[homeEndIndex]?.focus();
      // setCurrentIndex(homeEndIndex);
      onNavigate?.(homeEndIndex);
    }
  }, [getFocusableChildren, orientation, gridColumns, onNavigate]);

  return (
    <div
      ref={containerRef}
      className={className}
      onKeyDown={handleKeyDown}
      role={orientation === 'grid' ? 'grid' : 'list'}
      aria-orientation={orientation === 'grid' ? undefined : orientation}
    >
      {children}
    </div>
  );
}

/**
 * KeyboardNavigationItem wraps individual navigable items
 */
export function KeyboardNavigationItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      role="listitem"
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  React.useEffect(() => {
    const handleKeyDown = keyboardUtils.createShortcutHandler(shortcuts);
    
    const keyDownHandler = (event: KeyboardEvent) => {
      handleKeyDown(event as unknown as React.KeyboardEvent);
    };

    document.addEventListener('keydown', keyDownHandler);
    
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, [shortcuts]);
}

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const cleanup = focusUtils.createFocusTrap(containerRef.current);
    
    return cleanup;
  }, [isActive, containerRef]);
}

/**
 * Hook for managing roving tabindex in lists
 */
export function useRovingTabindex(
  items: React.RefObject<HTMLElement>[],
  defaultIndex = 0
) {
  const [activeIndex, setActiveIndex] = React.useState(defaultIndex);

  // Update tabindex values
  React.useEffect(() => {
    items.forEach((itemRef, index) => {
      if (itemRef.current) {
        itemRef.current.tabIndex = index === activeIndex ? 0 : -1;
      }
    });
  }, [items, activeIndex]);

  const setActiveItem = React.useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setActiveIndex(index);
      items[index].current?.focus();
    }
  }, [items]);

  const moveToNext = React.useCallback(() => {
    const nextIndex = activeIndex + 1 >= items.length ? 0 : activeIndex + 1;
    setActiveItem(nextIndex);
  }, [activeIndex, items.length, setActiveItem]);

  const moveToPrevious = React.useCallback(() => {
    const prevIndex = activeIndex - 1 < 0 ? items.length - 1 : activeIndex - 1;
    setActiveItem(prevIndex);
  }, [activeIndex, items.length, setActiveItem]);

  const moveToFirst = React.useCallback(() => {
    setActiveItem(0);
  }, [setActiveItem]);

  const moveToLast = React.useCallback(() => {
    setActiveItem(items.length - 1);
  }, [items.length, setActiveItem]);

  return {
    activeIndex,
    setActiveItem,
    moveToNext,
    moveToPrevious,
    moveToFirst,
    moveToLast
  };
}