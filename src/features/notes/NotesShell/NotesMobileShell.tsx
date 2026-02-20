import { type ReactNode, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { NotesList } from '../NotesList/NotesList';
import { NoteDetailPage } from '../NoteDetailPage/NoteDetailPage';
import styles from './NotesMobileShell.module.css';

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

const variants = {
  enter: (forward: boolean) => ({
    x: forward ? '100%' : '-30%',
  }),
  center: { x: '0%' },
  exit: (forward: boolean) => ({
    x: forward ? '-30%' : '100%',
  }),
};

export function NotesMobileShell() {
  const { stack } = useNavigationState();
  const { goBack } = useNavigationActions();
  const prevStackLengthRef = useRef(stack.length);

  const prevLength = prevStackLengthRef.current;
  prevStackLengthRef.current = stack.length;
  const isForward = stack.length >= prevLength;

  useSwipeBack({ onBack: goBack, enabled: stack.length > 0 });

  const topLayer = stack[stack.length - 1];

  let content: ReactNode = null;
  let viewKey = 'empty';

  if (topLayer?.view === 'notes-list') {
    content = <NotesList group={topLayer.group} />;
    viewKey = `notes-list-${topLayer.group}`;
  } else if (topLayer?.view === 'note-detail') {
    content = <NoteDetailPage noteId={topLayer.noteId} />;
    viewKey = `note-detail-${topLayer.noteId}`;
  }

  return (
    <div className={styles.shell}>
      <AnimatePresence initial={false} custom={isForward} mode="popLayout">
        <motion.div
          key={viewKey}
          className={styles.page}
          custom={isForward}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
