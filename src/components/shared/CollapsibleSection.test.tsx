import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it('should render title and be collapsed by default', () => {
    render(
      <CollapsibleSection title="Test Section" icon="💰">
        <p>Hidden content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('should expand when clicked', () => {
    render(
      <CollapsibleSection title="Test Section">
        <p>Hidden content</p>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('should be open by default when defaultOpen is true', () => {
    render(
      <CollapsibleSection title="Test Section" defaultOpen>
        <p>Visible content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('should collapse when clicked while open', () => {
    render(
      <CollapsibleSection title="Test Section" defaultOpen>
        <p>Content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});
