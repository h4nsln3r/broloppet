type SectionTitleProps = {
  children: React.ReactNode;
};

/**
 * Gemensam sektionsrubrik (h2 + animerad underline). Används av Information, Toast, RSVP.
 */
export function SectionTitle({ children }: SectionTitleProps) {
  return <h2>{children}</h2>;
}
