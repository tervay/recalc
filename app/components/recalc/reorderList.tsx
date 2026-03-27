import { Reorder, useDragControls, useMotionValue } from 'motion/react';
import { useState } from 'react';
import GripIcon from '~icons/lucide/grip';

import { useRaisedShadow } from '~/hooks/useRaisedShadow';
import { cn } from '~/lib/utils';

export interface ReorderListProps extends Partial<
  React.ComponentProps<typeof Reorder.Group>
> {
  children: React.ReactElement[];
  className?: string;
  itemClassName?: string;
  withDragHandle?: boolean;
  onReorderFinish?: (newOrder: React.ReactElement[]) => void;
}

const ReorderList: React.FC<ReorderListProps> = ({
  className,
  itemClassName,
  withDragHandle = false,
  onReorderFinish,
  values: _values,
  onReorder: _onReorder,
  ...props
}) => {
  const [items, setItems] = useState<React.ReactElement[]>(
    props.children.filter((child) => child !== null && child !== undefined),
  );

  const handleReorderFinish = (newOrder: React.ReactElement[]) => {
    setItems(newOrder);
    onReorderFinish?.(newOrder);
  };

  return (
    <Reorder.Group
      data-slot="reorder-list-group"
      axis="y"
      className={cn(
        '!m-0 flex list-none flex-col gap-1 !p-0 select-none',
        className,
      )}
      values={items}
      onReorder={handleReorderFinish}
      {...props}
    >
      {items.map((item, index) => (
        <ReorderListItem
          key={item?.key ?? index}
          item={item}
          index={index}
          withDragHandle={withDragHandle}
          className={itemClassName}
        />
      ))}
    </Reorder.Group>
  );
};

const ReorderListItem: React.FC<{
  item: React.ReactElement;
  index: number;
  className?: string;
  withDragHandle?: boolean;
}> = ({ item, index, className, withDragHandle = false }) => {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      data-slot="reorder-list-item"
      id={item?.key ?? `reorder-item-${index}`}
      value={item}
      className={cn(
        '!m-0 list-none bg-background !p-0',
        !withDragHandle ? 'cursor-grab' : '',
        className,
      )}
      style={{ boxShadow, y }}
      dragListener={!withDragHandle}
      dragControls={withDragHandle ? dragControls : undefined}
    >
      {withDragHandle ? (
        <div className="relative flex items-center gap-2">
          <div className="w-full pr-12">{item}</div>
          <GripIcon
            className="absolute top-1/2 right-4 size-5 -translate-y-1/2 cursor-grab text-muted-foreground"
            onPointerDown={(e) => dragControls.start(e)}
          />
        </div>
      ) : (
        item
      )}
    </Reorder.Item>
  );
};

export { ReorderList };
