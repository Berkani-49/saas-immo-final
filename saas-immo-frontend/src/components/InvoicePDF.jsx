import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Le style (CSS pour PDF)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, borderBottom: '1px solid #EEE', paddingBottom: 20 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#3182ce' },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { marginBottom: 20 },
  label: { fontSize: 10, color: '#888', marginBottom: 4 },
  value: { fontSize: 12, fontWeight: 'bold' },
  table: { marginTop: 30, borderWidth: 1, borderColor: '#EEE' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F7FAFC', padding: 8, borderBottomWidth: 1, borderColor: '#EEE' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderColor: '#EEE' },
  colDesc: { flex: 3 },
  colPrice: { flex: 1, textAlign: 'right' },
  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalLine: { flexDirection: 'row', marginBottom: 5 },
  totalLabel: { width: 100, textAlign: 'right', paddingRight: 10, color: '#888' },
  totalValue: { width: 100, textAlign: 'right', fontWeight: 'bold', fontSize: 14 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 10, color: '#AAA', borderTop: '1px solid #EEE', paddingTop: 10 }
});

export default function InvoicePDF({ invoice }) {
  // Sécurité sur les dates et montants
  const date = invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue';
  const amount = invoice?.amount ? invoice.amount.toLocaleString() : '0';
  const ref = invoice?.ref || 'REF-???';
  const description = invoice?.description || 'Service immobilier';
  const clientName = invoice?.contact ? `${invoice.contact.firstName} ${invoice.contact.lastName}` : 'Client Inconnu';
  const clientEmail = invoice?.contact?.email || '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>IMMO PRO</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>10 Rue de la Réussite</Text>
            <Text style={{ fontSize: 10 }}>75001 Paris</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={{ color: '#666' }}>Ref: {ref}</Text>
            <Text style={{ color: '#666' }}>Date: {date}</Text>
          </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.label}>FACTURÉ À :</Text>
            <Text style={styles.value}>{clientName}</Text>
            <Text style={{ fontSize: 11 }}>{clientEmail}</Text>
        </View>

        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={styles.colDesc}>Description</Text>
                <Text style={styles.colPrice}>Montant</Text>
            </View>
            <View style={styles.tableRow}>
                <Text style={styles.colDesc}>{description}</Text>
                <Text style={styles.colPrice}>{amount} €</Text>
            </View>
        </View>

        <View style={styles.totalSection}>
            <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>TOTAL NET</Text>
                <Text style={styles.totalValue}>{amount} €</Text>
            </View>
        </View>

        <View style={styles.footer}>
            <Text>Facture générée automatiquement par ImmoPro SaaS.</Text>
        </View>
      </Page>
    </Document>
  );
}