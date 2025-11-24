// Fichier : src/pages/InvoicesPage.jsx (Version PDF à la demande)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Heading, Spinner, Flex, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, 
  Badge, Button, FormControl, FormLabel, Input, Select, VStack, HStack, useToast
} from '@chakra-ui/react';
import { AddIcon, DownloadIcon } from '@chakra-ui/icons';

// NOUVEAU : On importe 'pdf' pour générer manuellement
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '../components/InvoicePDF.jsx';

export default function InvoicesPage({ token }) {
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour savoir quel PDF est en train de charger (par ID)
  const [loadingPdfId, setLoadingPdfId] = useState(null);

  // Formulaire
  const [selectedContact, setSelectedContact] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const [invoicesRes, contactsRes] = await Promise.all([
            axios.get('https://api-immo-final.onrender.com/api/invoices', config),
            axios.get('https://api-immo-final.onrender.com/api/contacts', config)
        ]);
        setInvoices(invoicesRes.data);
        setContacts(contactsRes.data);
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!amount || !selectedContact) return;
    setIsSubmitting(true);
    try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        await axios.post('https://api-immo-final.onrender.com/api/invoices', {
            amount, description, contactId: selectedContact
        }, config);
        window.location.reload(); 
    } catch (error) {
        toast({ title: "Erreur création", status: "error" });
        setIsSubmitting(false);
    }
  };

  // --- NOUVELLE FONCTION DE TÉLÉCHARGEMENT ---
  const handleDownloadPdf = async (invoice) => {
    setLoadingPdfId(invoice.id); // On active le chargement sur CE bouton
    try {
      // 1. On génère le blob (le fichier) à la volée
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      
      // 2. On crée un lien invisible pour le télécharger
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facture_${invoice.ref}.pdf`;
      document.body.appendChild(link);
      link.click(); // On clique dessus virtuellement
      document.body.removeChild(link); // On nettoie
      
    } catch (error) {
      console.error("Erreur PDF:", error);
      toast({ title: "Erreur génération PDF", status: "error" });
    } finally {
      setLoadingPdfId(null); // On arrête le chargement
    }
  };

  return (
    <Box>
      <Heading mb={6}>Facturation</Heading>

      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white" mb={8}>
        <Heading size="md" mb={4}>Nouvelle Facture</Heading>
        <form onSubmit={handleCreateInvoice}>
            <VStack spacing={4}>
                <HStack width="full" alignItems="end">
                    <FormControl isRequired flex={2}>
                        <FormLabel>Client à facturer</FormLabel>
                        <Select placeholder={contacts.length > 0 ? "Choisir un client" : "Chargement..."} value={selectedContact} onChange={(e) => setSelectedContact(e.target.value)}>
                            {contacts.map(c => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
                        </Select>
                    </FormControl>
                    <FormControl isRequired flex={1}>
                        <FormLabel>Montant (€)</FormLabel>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </FormControl>
                </HStack>
                <FormControl><FormLabel>Description</FormLabel><Input value={description} onChange={(e) => setDescription(e.target.value)} /></FormControl>
                <Button type="submit" leftIcon={<AddIcon />} colorScheme="purple" width="full" isLoading={isSubmitting}>Générer la facture</Button>
            </VStack>
        </form>
      </Box>

      <Heading size="md" mb={4}>Historique ({invoices.length})</Heading>
      
      {isLoading ? ( <Flex justify="center"><Spinner size="xl" /></Flex> ) : (
        <Box overflowX="auto" bg="white" borderRadius="lg" shadow="sm" borderWidth="1px">
            <Table variant="simple">
                <Thead bg="gray.50">
                    <Tr><Th>Réf</Th><Th>Client</Th><Th>Date</Th><Th isNumeric>Montant</Th><Th>Statut</Th><Th>Action</Th></Tr>
                </Thead>
                <Tbody>
                    {invoices.map(inv => (
                        <Tr key={inv.id}>
                            <Td fontWeight="bold">{inv.ref}</Td>
                            <Td>{inv.contact?.firstName} {inv.contact?.lastName}</Td>
                            <Td>{new Date(inv.createdAt).toLocaleDateString()}</Td>
                            <Td isNumeric fontWeight="bold">{inv.amount.toLocaleString()} €</Td>
                            <Td><Badge colorScheme={inv.status === 'PAID' ? 'green' : 'orange'}>{inv.status === 'PAID' ? 'Payée' : 'En attente'}</Badge></Td>
                            <Td>
                                {/* BOUTON MAGIQUE */}
                                <Button 
                                    size="xs" 
                                    leftIcon={<DownloadIcon />} 
                                    colorScheme="gray" 
                                    onClick={() => handleDownloadPdf(inv)}
                                    isLoading={loadingPdfId === inv.id} // Seul ce bouton tourne
                                    loadingText="PDF..."
                                >
                                    PDF
                                </Button>
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