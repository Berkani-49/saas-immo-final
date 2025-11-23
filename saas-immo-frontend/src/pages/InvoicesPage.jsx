// Fichier : src/pages/InvoicesPage.jsx (Version Corrigée - Chargement Contacts)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Heading, Spinner, Flex, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, 
  Badge, Button, FormControl, FormLabel, Input, Select, VStack, HStack, useToast
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

export default function InvoicesPage({ token }) {
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Formulaire
  const [selectedContact, setSelectedContact] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // On récupère les factures ET les contacts
        console.log("Chargement Factures & Contacts...");
        
        const [invoicesRes, contactsRes] = await Promise.all([
            axios.get('https://api-immo-final.onrender.com/api/invoices', config),
            axios.get('https://api-immo-final.onrender.com/api/contacts', config)
        ]);

        setInvoices(invoicesRes.data);
        setContacts(contactsRes.data);
        console.log("Contacts chargés :", contactsRes.data.length);

      } catch (error) {
        console.error("Erreur chargement:", error);
        toast({ title: "Erreur", description: "Impossible de charger les données.", status: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // --- CRÉATION FACTURE ---
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!amount || !selectedContact) {
        toast({ title: "Erreur", description: "Montant et Client obligatoires", status: "warning" });
        return;
    }
    setIsSubmitting(true);
    try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        await axios.post('https://api-immo-final.onrender.com/api/invoices', {
            amount,
            description,
            contactId: selectedContact
        }, config);

        // Rechargement complet pour voir la nouvelle facture
        window.location.reload(); 
        
    } catch (error) {
        toast({ title: "Erreur", description: "Impossible de créer la facture", status: "error" });
        setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Heading mb={6}>Facturation</Heading>

      {/* FORMULAIRE D'AJOUT */}
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white" mb={8}>
        <Heading size="md" mb={4}>Nouvelle Facture</Heading>
        <form onSubmit={handleCreateInvoice}>
            <VStack spacing={4}>
                <HStack width="full" alignItems="end">
                    <FormControl isRequired flex={2}>
                        <FormLabel>Client à facturer</FormLabel>
                        <Select 
                            placeholder={contacts.length > 0 ? "Choisir un client" : "Aucun contact trouvé"} 
                            value={selectedContact} 
                            onChange={(e) => setSelectedContact(e.target.value)}
                            isDisabled={contacts.length === 0}
                        >
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.firstName} {c.lastName} ({c.type === 'BUYER' ? 'Acheteur' : 'Vendeur'})
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl isRequired flex={1}>
                        <FormLabel>Montant (€)</FormLabel>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 5000" />
                    </FormControl>
                </HStack>
                
                <FormControl>
                    <FormLabel>Description / Objet</FormLabel>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Honoraires sur vente..." />
                </FormControl>

                <Button type="submit" leftIcon={<AddIcon />} colorScheme="purple" width="full" isLoading={isSubmitting}>
                    Générer la facture
                </Button>
            </VStack>
        </form>
      </Box>

      {/* LISTE DES FACTURES */}
      <Heading size="md" mb={4}>Historique ({invoices.length})</Heading>
      
      {isLoading ? (
        <Flex justify="center"><Spinner size="xl" /></Flex>
      ) : invoices.length === 0 ? (
        <Alert status="info"><AlertIcon />Aucune facture pour le moment.</Alert>
      ) : (
        <Box overflowX="auto" bg="white" borderRadius="lg" shadow="sm" borderWidth="1px">
            <Table variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th>Réf</Th>
                        <Th>Client</Th>
                        <Th>Date</Th>
                        <Th isNumeric>Montant</Th>
                        <Th>Statut</Th>
                        <Th>Action</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {invoices.map(inv => (
                        <Tr key={inv.id}>
                            <Td fontWeight="bold" fontSize="sm">{inv.ref}</Td>
                            <Td>{inv.contact?.firstName} {inv.contact?.lastName}</Td>
                            <Td>{new Date(inv.createdAt).toLocaleDateString()}</Td>
                            <Td isNumeric fontWeight="bold">{inv.amount.toLocaleString()} €</Td>
                            <Td>
                                <Badge colorScheme={inv.status === 'PAID' ? 'green' : 'orange'}>
                                    {inv.status === 'PAID' ? 'Payée' : 'En attente'}
                                </Badge>
                            </Td>
                            <Td>
                                <Button size="xs" variant="outline">PDF</Button>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
      )}
    </Box>
  );
}