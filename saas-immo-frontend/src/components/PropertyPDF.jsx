// Fichier : src/components/PropertyPDF.jsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// 1. Le Design (CSS pour PDF)
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '2px solid #3182ce', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', textTransform: 'uppercase' },
  subtitle: { fontSize: 12, color: '#718096', marginTop: 5 },
  
  imageContainer: { height: 300, marginBottom: 20, borderRadius: 5, overflow: 'hidden' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  
  priceTag: { 
    backgroundColor: '#48BB78', color: 'white', padding: 10, 
    fontSize: 20, borderRadius: 5, alignSelf: 'flex-start' 
  },
  
  features: { 
    flexDirection: 'row', gap: 20, backgroundColor: '#EBF8FF', 
    padding: 15, borderRadius: 5, flex: 1, marginLeft: 10 
  },
  featureText: { fontSize: 12, color: '#2C5282', fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#2D3748', marginTop: 10 },
  description: { fontSize: 11, lineHeight: 1.5, color: '#4A5568', textAlign: 'justify' },
  
  footer: { 
    position: 'absolute', bottom: 30, left: 30, right: 30, 
    borderTop: '1px solid #E2E8F0', paddingTop: 10, textAlign: 'center' 
  },
  footerText: { fontSize: 10, color: '#A0AEC0' }
});

// 2. Le Document
export default function PropertyPDF({ property }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Fiche Vitrine</Text>
          <Text style={styles.subtitle}>{property.address}, {property.postalCode} {property.city}</Text>
        </View>

        {/* Photo Principale */}
        <View style={styles.imageContainer}>
            {/* On gère le cas où il n'y a pas d'image */}
            {property.imageUrl ? (
                <Image src={property.imageUrl} style={styles.image} />
            ) : (
                <View style={{...styles.image, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center'}}>
                    <Text>Pas de photo disponible</Text>
                </View>
            )}
        </View>

        {/* Prix et Détails */}
        <View style={styles.row}>
            <View style={styles.priceTag}>
                <Text>{property.price.toLocaleString()} €</Text>
            </View>
            <View style={styles.features}>
                <Text style={styles.featureText}>{property.area} m²</Text>
                <Text style={styles.featureText}>{property.rooms} Pièces</Text>
                <Text style={styles.featureText}>{property.bedrooms} Chambres</Text>
            </View>
        </View>

        {/* Description */}
        <View>
            <Text style={styles.sectionTitle}>Description du bien</Text>
            <Text style={styles.description}>
                {property.description || "Aucune description fournie pour ce bien."}
            </Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Document généré par Mon Agence SaaS • Contactez-nous pour une visite.
            </Text>
            {property.agent && (
                <Text style={{...styles.footerText, marginTop: 5, fontWeight: 'bold'}}>
                    Agent : {property.agent.firstName} {property.agent.lastName}
                </Text>
            )}
        </View>

      </Page>
    </Document>
  );
}