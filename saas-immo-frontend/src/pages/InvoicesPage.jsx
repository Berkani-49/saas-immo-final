// Fichier : src/pages/InvoicesPage.jsx (Version Impression HTML)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Heading, Spinner, Flex, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, 
  Badge, Button, FormControl, FormLabel, Input, Select, VStack, HStack, useToast
} from '@chakra-ui/react';
import { AddIcon, DownloadIcon } from '@chakra-ui/icons';

export default function InvoicesPage({ token }) {
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedContact, setSelectedContact] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  // --- CHARGEMENT SÉPARÉ (Plus robuste) ---
  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      // 1. Charger les Contacts (Vital pour le formulaire)
      try {
        const contactsRes = await axios.get('https://api-immo-final.onrender.com/api/contacts', config);
        setContacts(contactsRes.data);
      } catch (error) {
        console.error("Erreur chargement contacts:", error);
        toast({ title: "Erreur", description: "Impossible de charger les clients.", status: "error" });
      }

      // 2. Charger les Factures (Si ça plante, c'est pas grave pour le formulaire)
      try {
        const invoicesRes = await axios.get('https://api-immo-final.onrender.com/api/invoices', config);
        setInvoices(invoicesRes.data);
      } catch (error) {
        console.error("Erreur chargement factures:", error);
        // On ne met pas d'alerte ici pour ne pas spammer si la table est juste vide/nouvelle
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

  // --- FONCTION D'IMPRESSION ---
  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    const date = new Date(invoice.createdAt).toLocaleDateString('fr-FR');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Facture ${invoice.ref}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #3182ce; }
            .invoice-title { text-align: right; }
            .invoice-title h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .section { margin-bottom: 30px; }
            .label { font-size: 12px; color: #888; font-weight: bold; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: bold; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f7fafc; padding: 10px; border-bottom: 1px solid #eee; }
            td { padding: 15px 10px; border-bottom: 1px solid #eee; }
            .amount { text-align: right; font-weight: bold; }
            .total { margin-top: 30px; text-align: right; font-size: 20px; font-weight: bold; }
            .footer { position: fixed; bottom: 40px; left: 0; right: 0; text-align: center; color: #aaa; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">IMMO PRO<br><span style="font-size: 12px; color: #666; font-weight: normal;">10 Rue de la Réussite<br>75001 Paris</span></div>
            <div class="invoice-title">
              <h1>Facture</h1>
              <p>Réf : ${invoice.ref}</p>
              <p>Date : ${date}</p>
            </div>
          </div>

          <div class="section">
            <div class="label">Facturé à :</div>
            <div class="value">${invoice.contact?.firstName} ${invoice.contact?.lastName}</div>
            <div>${invoice.contact?.email || ''}</div>
          </div>

          <table>
            <thead><tr><th>Description</th><th class="amount">Montant</th></tr></thead>
            <tbody>
              <tr>
                <td>${invoice.description || 'Prestation immobilière'}</td>
                <td class="amount">${invoice.amount.toLocaleString()} €</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Net : ${invoice.amount.toLocaleString()} €
          </div>

          <div class="footer">Facture générée automatiquement par ImmoPro SaaS.</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                                <Button size="xs" leftIcon={<DownloadIcon />} onClick={() => handlePrintInvoice(inv)}>
                                    Imprimer / PDF
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