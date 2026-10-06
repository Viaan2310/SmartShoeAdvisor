import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';

/** Shared presentation-only control; preserves each screen's existing events. */
const AdvisorButton = forwardRef<HTMLButtonElement, ButtonProps>(function AdvisorButton({ type = 'button', ...props }, ref) {
  return <Button ref={ref} type={type} variant="advisor" size="auto" {...props} />;
});
export default AdvisorButton;