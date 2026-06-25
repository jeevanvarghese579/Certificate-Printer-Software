import React from 'react';
import { useDrag } from 'react-dnd';

interface DraggableFieldProps {
  name: string;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ name }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FIELD',
    item: { name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700
        rounded-lg text-sm font-medium text-primary-700 dark:text-primary-300 cursor-grab
        hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors select-none
        ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {'{{'} {name} {'}}'}
    </div>
  );
};

export default DraggableField;
