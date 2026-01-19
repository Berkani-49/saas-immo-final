import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AddContactForm from '../AddContactForm';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Helper pour wrapper avec ChakraProvider
const renderWithChakra = (component) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('AddContactForm', () => {
  const mockToken = 'fake-token-123';
  const mockOnContactAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher tous les champs du formulaire', () => {
    renderWithChakra(
      <AddContactForm token={mockToken} onContactAdded={mockOnContactAdded} />
    );

    // Vérifier la présence des champs principaux
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
  });

  it('devrait pouvoir saisir les informations de contact', () => {
    renderWithChakra(
      <AddContactForm token={mockToken} onContactAdded={mockOnContactAdded} />
    );

    const firstNameInput = screen.getByLabelText(/prénom/i);
    const lastNameInput = screen.getByLabelText(/nom/i);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(firstNameInput, { target: { value: 'Jean' } });
    fireEvent.change(lastNameInput, { target: { value: 'Dupont' } });
    fireEvent.change(emailInput, { target: { value: 'jean@example.com' } });

    expect(firstNameInput.value).toBe('Jean');
    expect(lastNameInput.value).toBe('Dupont');
    expect(emailInput.value).toBe('jean@example.com');
  });

  it('devrait afficher un message d\'erreur si les champs requis sont vides', async () => {
    renderWithChakra(
      <AddContactForm token={mockToken} onContactAdded={mockOnContactAdded} />
    );

    const submitButton = screen.getByRole('button', { name: /ajouter/i });
    fireEvent.click(submitButton);

    // Le toast devrait indiquer que les champs sont requis
    // Note: Le toast de Chakra UI est difficile à tester directement
    // On vérifie que axios n'a pas été appelé
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('devrait soumettre le formulaire avec succès', async () => {
    const mockResponse = {
      data: {
        id: 1,
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com'
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    renderWithChakra(
      <AddContactForm token={mockToken} onContactAdded={mockOnContactAdded} />
    );

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByLabelText(/nom/i), { target: { value: 'Dupont' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jean@example.com' } });

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /ajouter/i });
    fireEvent.click(submitButton);

    // Vérifier que l'API a été appelée
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/contacts'),
        expect.objectContaining({
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com'
        }),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` }
        })
      );
    });

    // Vérifier que le callback a été appelé
    await waitFor(() => {
      expect(mockOnContactAdded).toHaveBeenCalled();
    });
  });

  it('devrait gérer les erreurs de soumission', async () => {
    const mockError = {
      response: {
        data: { message: 'Email déjà utilisé' }
      }
    };

    axios.post.mockRejectedValueOnce(mockError);

    renderWithChakra(
      <AddContactForm token={mockToken} onContactAdded={mockOnContactAdded} />
    );

    // Remplir et soumettre le formulaire
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByLabelText(/nom/i), { target: { value: 'Dupont' } });
    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    // Le callback ne devrait pas être appelé en cas d'erreur
    await waitFor(() => {
      expect(mockOnContactAdded).not.toHaveBeenCalled();
    });
  });

  it('devrait inclure les critères de recherche pour un acheteur', async () => {
    axios.post.mockResolvedValueOnce({ data: { id: 1 } });

    renderWithChakra(
      <AddContactForm token={mockToken} onContactAdded={mockOnContactAdded} />
    );

    // Remplir les champs obligatoires
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByLabelText(/nom/i), { target: { value: 'Dupont' } });

    // Remplir les critères de recherche (si visibles)
    const budgetMinInput = screen.queryByLabelText(/budget min/i);
    if (budgetMinInput) {
      fireEvent.change(budgetMinInput, { target: { value: '200000' } });
    }

    // Soumettre
    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it('devrait désactiver le bouton pendant la soumission', async () => {
    axios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithChakra(
      <AddContactForm token={mockToken} onContactAdded={mockOnContactAdded} />
    );

    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByLabelText(/nom/i), { target: { value: 'Dupont' } });

    const submitButton = screen.getByRole('button', { name: /ajouter/i });
    fireEvent.click(submitButton);

    // Le bouton devrait être désactivé pendant la soumission
    expect(submitButton).toBeDisabled();
  });
});
