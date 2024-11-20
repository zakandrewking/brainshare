// based on https://github.com/zakandrewking/organator/blob/main/frontend/src/components/VirtualList.tsx

import React from "react";

import useContainerDimensions from "@/hooks/use-container-dimensions";
import useScrollTop from "@/hooks/use-scroll-top";

interface VirtualListProps {
  itemCount: number;
  itemHeight: number;
  Item: (data?: any, itemConfig?: any) => React.ReactNode;
  // ItemLoader is a React component so that it can load data using all the
  // react tricks (hooks, etc.)
  ItemLoader: ({
    index,
    count,
    children,
    itemConfig,
  }: {
    index: number;
    count: number;
    children: (items: any) => React.ReactNode;
    itemConfig?: any;
  }) => React.ReactNode;
}

export default function VirtualList({
  itemCount,
  itemHeight,
  Item,
  ItemLoader,
}: VirtualListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { height } = useContainerDimensions(containerRef);
  const scrollTop = useScrollTop(containerRef);

  // display an extra component on each side to avoid flickering
  const renderCount = Math.ceil(height / itemHeight + 3);
  const indexDisplacement = Math.max(
    Math.floor((scrollTop ?? 0) / itemHeight) - 1,
    0
  );
  const firstItemDisplacement = indexDisplacement * itemHeight;

  return (
    <div
      className="w-full overflow-auto always-scrollbar"
      ref={containerRef}
      //   onScroll={() => debouncedOnUserScroll.call()}
    >
      <ItemLoader index={indexDisplacement} count={renderCount}>
        {(items) => {
          return (
            <div style={{ height: `${itemCount * itemHeight}px` }}>
              {Array.from({ length: renderCount }).map((_, i) => (
                <tr
                  className="absolute"
                  style={{
                    top: `translate(${
                      i * itemHeight + firstItemDisplacement
                    }, 20)`,
                  }}
                  key={i}
                >
                  {Item({ data: items[i] })}
                </tr>
              ))}
            </div>
          );
        }}
      </ItemLoader>
    </div>
  );
}
