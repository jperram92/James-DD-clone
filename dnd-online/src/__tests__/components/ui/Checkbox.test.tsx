import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Checkbox from '../../../components/ui/Checkbox';

describe('Checkbox Component', () => {
  test('renders checkbox with label', () => {
    render(<Checkbox label="Test Checkbox" />);

    const checkbox = screen.getByLabelText('Test Checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test('checkbox can be checked and unchecked', () => {
    render(<Checkbox label="Test Checkbox" />);

    const checkbox = screen.getByLabelText('Test Checkbox');

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Check the checkbox
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Uncheck the checkbox
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('displays error message when provided', () => {
    const errorMessage = 'This field is required';
    render(<Checkbox label="Test Checkbox" error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Check that aria-invalid is set correctly
    const checkbox = screen.getByLabelText('Test Checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });

  test('displays helper text when provided and no error', () => {
    const helperText = 'Optional field';
    render(<Checkbox label="Test Checkbox" helperText={helperText} />);

    expect(screen.getByText(helperText)).toBeInTheDocument();
  });

  test('helper text is not shown when error is present', () => {
    const helperText = 'Optional field';
    const errorMessage = 'This field is required';

    render(
      <Checkbox
        label="Test Checkbox"
        helperText={helperText}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText(helperText)).not.toBeInTheDocument();
  });
});
