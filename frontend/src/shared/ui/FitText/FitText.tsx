import {
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

type FitTextProps = {
  children: ReactNode;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>;

export function FitText({
  children,
  className,
  maxFontSize = 64,
  minFontSize = 28,
  style,
  ...rest
}: FitTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const applySingleLine = (size: number) => {
      el.style.whiteSpace = 'nowrap';
      el.style.overflowWrap = 'normal';
      el.style.wordBreak = 'normal';
      el.style.fontSize = `${size}px`;
    };

    const applyMultiLine = (size: number) => {
      el.style.whiteSpace = 'normal';
      el.style.overflowWrap = 'normal';
      el.style.wordBreak = 'keep-all';
      el.style.hyphens = 'none';
      el.style.fontSize = `${size}px`;
    };

    const fitsSingleLine = () => el.scrollWidth <= el.clientWidth + 1;

    const fit = () => {
      let low = minFontSize;
      let high = maxFontSize;
      let best = minFontSize;

      applySingleLine(maxFontSize);
      if (fitsSingleLine()) {
        return;
      }

      for (let index = 0; index < 14; index += 1) {
        const middle = (low + high) / 2;
        applySingleLine(middle);

        if (fitsSingleLine()) {
          best = middle;
          low = middle;
        } else {
          high = middle;
        }
      }

      applySingleLine(best);
      if (fitsSingleLine()) {
        return;
      }

      applyMultiLine(minFontSize);
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(el);
    if (el.parentElement) {
      observer.observe(el.parentElement);
    }

    return () => observer.disconnect();
  }, [children, maxFontSize, minFontSize]);

  return (
    <strong
      ref={ref}
      className={className}
      style={{
        ...style,
        overflowWrap: 'normal',
        wordBreak: 'keep-all',
        hyphens: 'none',
      }}
      {...rest}
    >
      {children}
    </strong>
  );
}
