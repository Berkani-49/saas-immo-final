// Fichier : src/pages/InvoicesPage.jsx (Version Détective 🕵️‍♂️)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Heading, Spinner, Flex, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, 
  Badge, Button, FormControl, FormLabel, Input, Select, VStack, HStack, useToast
} from '@chakra-ui/react';
import { AddIcon, DownloadIcon } from '@chakra-ui/icons';
import jsPDF from 'jspdf'; 

export default function InvoicesPage({ token }) {
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedContact, setSelectedContact] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  
  // ⚠️ VÉRIFIE BIEN CETTE URL
  const API_URL = 'https://saas-immo-final.onrender.com';

  // --- 1. CHARGEMENT ---
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // Chargement Contacts
        try {
            const contactsRes = await axios.get(`${API_URL}/api/contacts`, config);
            setContacts(contactsRes.data);
        } catch (e) { console.error("Erreur Contacts", e); }

        // Chargement Factures
        try {
            const invoicesRes = await axios.get(`${API_URL}/api/invoices`, config);
            setInvoices(invoicesRes.data);
        } catch (e) { console.error("Erreur Factures", e); }

      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // --- 2. CRÉATION (C'est ici qu'on debug) ---
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    
    if (!amount || !selectedContact) {
        alert("Stop ! Il manque le montant ou le client.");
        return;
    }

    setIsSubmitting(true);

    // On prépare les données en forçant les nombres (Sécurité Frontend)
    const payload = {
        amount: parseInt(amount),
        contactId: parseInt(selectedContact),
        description: description || "Honoraires"
    };

    console.log("🚀 Envoi de la facture...", payload);

    try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // On envoie
        await axios.post(`${API_URL}/api/invoices`, payload, config);
        
        // Si on arrive ici, c'est que ça a marché !
        alert("Succès ! Facture créée. Je vais recharger la page.");
        window.location.reload();

    } catch (error) {
        // Si ça plante, on affiche l'erreur exacte
        console.error("💥 ERREUR CRÉATION :", error);
        alert(`Erreur : ${error.response?.data?.error || error.message}`);
        setIsSubmitting(false);
    }
  };

  // --- 3. PDF ---
  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    const date = new Date(invoice.createdAt).toLocaleDateString('fr-FR');
    
    doc.setFontSize(20); doc.setTextColor(49, 130, 206);
    doc.text("IMMO PRO", 20, 20);
    
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("10 Rue de la Réussite\n75001 Paris", 20, 26);

    doc.setFontSize(16); doc.setTextColor(0);
    doc.text("FACTURE", 140, 20);
    
    doc.setFontSize(10);
    doc.text(`Réf : ${invoice.ref}\nDate : ${date}`, 140, 28);

    doc.line(20, 40, 190, 40);
    
    doc.text("FACTURÉ À :", 20, 50);
    doc.setFontSize(12);
    doc.text(`${invoice.contact?.firstName} ${invoice.contact?.lastName}`, 20, 56);
    
    doc.rect(20, 75, 170, 10);
    doc.setFontSize(10);
    doc.text("Description", 25, 82);
    doc.text("Montant", 150, 82);

    doc.text(invoice.description, 25, 95);
    doc.text(`${invoice.amount} €`, 150, 95);

    doc.setFontSize(14);
    doc.text(`TOTAL : ${invoice.amount} €`, 140, 120);

    doc.save(`Facture_${invoice.ref}.pdf`);
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
                        <Select placeholder="Choisir un client" value={selectedContact} onChange={(e) => setSelectedContact(e.target.value)}>
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
                                <Button size="xs" leftIcon={<DownloadIcon />} onClick={() => generatePDF(inv)}>
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