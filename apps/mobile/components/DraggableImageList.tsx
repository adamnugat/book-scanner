import { useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  ScrollView,
  type GestureResponderHandlers,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface DraggableImageListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderRow: (
    item: T,
    index: number,
    dragHandleProps: GestureResponderHandlers,
    dragActive: boolean,
  ) => ReactNode;
  onReorder: (from: number, to: number) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

interface RowProps {
  index: number;
  isActive: boolean;
  /** Live drop slot while a drag is in progress (null = none). */
  targetIndex: number | null;
  activeIndex: number | null;
  translateY: Animated.Value;
  offset: Animated.Value;
  rowHeightRef: React.MutableRefObject<number>;
  onStart: (index: number) => void;
  onMove: (dy: number) => void;
  onEnd: (index: number, dy: number) => void;
  children: (handlers: GestureResponderHandlers) => ReactNode;
}

/**
 * One row owns a stable PanResponder (created once). Capturing the touch at start on the
 * drag handle stops the parent ScrollView from stealing the vertical gesture as a scroll.
 */
function DraggableRow({
  index,
  isActive,
  targetIndex,
  activeIndex,
  translateY,
  offset,
  rowHeightRef,
  onStart,
  onMove,
  onEnd,
  children,
}: RowProps) {
  const indexRef = useRef(index);
  indexRef.current = index;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => onStart(indexRef.current),
      onPanResponderMove: (_e, g) => onMove(g.dy),
      onPanResponderRelease: (_e, g) => onEnd(indexRef.current, g.dy),
      onPanResponderTerminate: () => onEnd(indexRef.current, 0),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // Show a drop slot marker on the row the dragged tile would land on.
  const showDropSlot = !isActive && activeIndex !== null && targetIndex === index;

  return (
    <Animated.View
      onLayout={(e) => {
        if (indexRef.current === 0) rowHeightRef.current = e.nativeEvent.layout.height || 120;
      }}
      style={[
        isActive
          ? { transform: [{ translateY }], zIndex: 20, elevation: 8, opacity: 0.96 }
          : { transform: [{ translateY: offset }] },
        showDropSlot && {
          borderRadius: 16,
          backgroundColor: 'rgba(240, 234, 214, 0.06)',
        },
      ]}
    >
      {children(responder.panHandlers)}
    </Animated.View>
  );
}

/**
 * Dependency-free drag-to-reorder list (RN core PanResponder + Animated). Avoids
 * react-native-reanimated, which fails to initialise in this Expo Go runtime.
 * While dragging, neighbouring rows slide to preview the new order.
 */
export function DraggableImageList<T>({
  data,
  keyExtractor,
  renderRow,
  onReorder,
  contentContainerStyle,
}: DraggableImageListProps<T>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const rowHeightRef = useRef(120);
  const startIndexRef = useRef(0);
  const lastTargetRef = useRef<number | null>(null);

  const dataLenRef = useRef(data.length);
  dataLenRef.current = data.length;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  // One persistent offset Animated.Value per row slot (siblings slide to make room).
  const offsetsRef = useRef<Animated.Value[]>([]);
  if (offsetsRef.current.length < data.length) {
    while (offsetsRef.current.length < data.length) {
      offsetsRef.current.push(new Animated.Value(0));
    }
  }
  const offsets = offsetsRef.current;

  const resetOffsets = () => {
    offsets.forEach((o) => o.setValue(0));
  };

  // Slide siblings to open a gap at the current drop target.
  const applyShift = (start: number, target: number) => {
    const h = rowHeightRef.current;
    for (let i = 0; i < dataLenRef.current; i++) {
      if (i === start) continue;
      let to = 0;
      if (start < target && i > start && i <= target)
        to = -h; // dragging down: rows slide up
      else if (start > target && i >= target && i < start) to = h; // dragging up: rows slide down
      Animated.spring(offsets[i], {
        toValue: to,
        useNativeDriver: false,
        bounciness: 0,
        speed: 20,
      }).start();
    }
  };

  const onStart = useRef((index: number) => {
    startIndexRef.current = index;
    lastTargetRef.current = index;
    translateY.setValue(0);
    resetOffsets();
    setActiveIndex(index);
    setTargetIndex(index);
  }).current;

  const onMove = useRef((dy: number) => {
    translateY.setValue(dy);
    const start = startIndexRef.current;
    const rows = dataLenRef.current;
    const target = Math.max(0, Math.min(rows - 1, start + Math.round(dy / rowHeightRef.current)));
    if (target !== lastTargetRef.current) {
      lastTargetRef.current = target;
      setTargetIndex(target);
      applyShift(start, target);
    }
  }).current;

  const onEnd = useRef((index: number, dy: number) => {
    const start = startIndexRef.current;
    const rows = dataLenRef.current;
    const target =
      dy === 0
        ? start
        : Math.max(0, Math.min(rows - 1, start + Math.round(dy / rowHeightRef.current)));
    setActiveIndex(null);
    setTargetIndex(null);
    lastTargetRef.current = null;
    translateY.setValue(0);
    resetOffsets();
    if (target !== index) onReorderRef.current(index, target);
  }).current;

  return (
    <ScrollView contentContainerStyle={contentContainerStyle} scrollEnabled={activeIndex === null}>
      {data.map((item, index) => (
        <DraggableRow
          key={keyExtractor(item)}
          index={index}
          isActive={index === activeIndex}
          targetIndex={targetIndex}
          activeIndex={activeIndex}
          translateY={translateY}
          offset={offsets[index]}
          rowHeightRef={rowHeightRef}
          onStart={onStart}
          onMove={onMove}
          onEnd={onEnd}
        >
          {(handlers) => renderRow(item, index, handlers, index === activeIndex)}
        </DraggableRow>
      ))}
    </ScrollView>
  );
}
