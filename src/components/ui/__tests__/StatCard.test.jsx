import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatCard from '../StatCard';
import React from 'react';

describe('StatCard Component', () => {
  it('renders title and value correctly', () => {
    render(<StatCard label="Total Leyes" value="125" color="blue" />);
    expect(screen.getByText('Total Leyes')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
  });

  // TDD Paso 1: Definir comportamiento que NO existe aún (click handler)
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<StatCard label="Click Me" value="10" color="purple" onClick={handleClick} />);
    
    const card = screen.getByText('Click Me').parentElement;
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
