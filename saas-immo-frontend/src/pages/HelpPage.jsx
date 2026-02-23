import React from 'react';
import {
  Box, Heading, Text, VStack, HStack, Icon, Card, CardBody,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Button, SimpleGrid
} from '@chakra-ui/react';
import { FiHelpCircle, FiMail, FiBook, FiMessageSquare } from 'react-icons/fi';

const FAQ_ITEMS = [
  {
    question: 'Comment ajouter un bien immobilier ?',
    answer: 'Rendez-vous dans "Mes Biens" depuis le menu, puis remplissez le formulaire en haut de page avec les informations du bien (adresse, prix, surface, etc.). Cliquez sur "Ajouter" pour enregistrer.'
  },
  {
    question: 'Comment fonctionne le système d\'abonnement ?',
    answer: 'Nous proposons 3 plans : Gratuit (3 biens, 5 contacts), Pro (39€/mois - illimité + factures, analytics, diffusion), Premium (79€/mois - tout + IA, matching, staging). Vous pouvez changer de plan à tout moment depuis "Abonnement".'
  },
  {
    question: 'Comment ajouter un employé à mon agence ?',
    answer: 'Allez dans "Mon Équipe" (plan Pro requis). Cliquez sur "Ajouter un employé", entrez son email et ses informations. Un email avec ses identifiants de connexion lui sera envoyé automatiquement.'
  },
  {
    question: 'Comment diffuser mes biens sur les portails (SeLoger, LeBonCoin...) ?',
    answer: 'Rendez-vous dans "Multi-diffusion" (plan Pro requis). Sélectionnez un bien, choisissez les portails de diffusion, et cliquez sur "Publier". Le statut de chaque diffusion est visible en temps réel.'
  },
  {
    question: 'Comment fonctionne la signature électronique ?',
    answer: 'Dans "Signatures" (plan Pro requis), créez un document (mandat de vente, bail, etc.), renseignez les informations du signataire, et envoyez le lien. Le signataire peut signer directement en ligne.'
  },
  {
    question: 'Comment exporter mes données (RGPD) ?',
    answer: 'Rendez-vous dans "RGPD" depuis le menu. Cliquez sur "Exporter mes données" pour télécharger un fichier JSON contenant toutes vos informations personnelles et données stockées.'
  },
  {
    question: 'Comment fonctionne le matching acheteur/bien ?',
    answer: 'Quand vous ajoutez un bien, le système compare automatiquement les critères de recherche de vos contacts acheteurs (budget, ville, surface, chambres) avec les caractéristiques du bien. Les matchs avec un score > 50% sont notifiés.'
  },
  {
    question: 'Comment réinitialiser mon mot de passe ?',
    answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié ?". Entrez votre email et vous recevrez un lien de réinitialisation valide pendant 1 heure.'
  }
];

export default function HelpPage() {
  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <HStack mb={2}>
            <Icon as={FiHelpCircle} boxSize={6} color="brand.400" />
            <Heading size="lg" color="gray.800">Aide & Support</Heading>
          </HStack>
          <Text color="gray.400">Trouvez des réponses à vos questions ou contactez-nous.</Text>
        </Box>

        {/* Contact rapide */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card bg="white" borderColor="gray.200" borderWidth="1px" _hover={{ borderColor: 'brand.500' }} transition="all 0.2s">
            <CardBody textAlign="center">
              <Icon as={FiMail} boxSize={8} color="brand.400" mb={3} />
              <Heading size="sm" color="gray.800" mb={2}>Email</Heading>
              <Text color="gray.400" fontSize="sm" mb={3}>Réponse sous 24h</Text>
              <Button as="a" href="mailto:support@immopro.com" size="sm" colorScheme="blue" variant="outline">
                Nous contacter
              </Button>
            </CardBody>
          </Card>

          <Card bg="white" borderColor="gray.200" borderWidth="1px" _hover={{ borderColor: 'brand.500' }} transition="all 0.2s">
            <CardBody textAlign="center">
              <Icon as={FiBook} boxSize={8} color="brand.400" mb={3} />
              <Heading size="sm" color="gray.800" mb={2}>Documentation</Heading>
              <Text color="gray.400" fontSize="sm" mb={3}>Guides et tutoriels</Text>
              <Button size="sm" colorScheme="blue" variant="outline" isDisabled>
                Bientôt disponible
              </Button>
            </CardBody>
          </Card>

          <Card bg="white" borderColor="gray.200" borderWidth="1px" _hover={{ borderColor: 'brand.500' }} transition="all 0.2s">
            <CardBody textAlign="center">
              <Icon as={FiMessageSquare} boxSize={8} color="brand.400" mb={3} />
              <Heading size="sm" color="gray.800" mb={2}>Chat</Heading>
              <Text color="gray.400" fontSize="sm" mb={3}>Support en direct</Text>
              <Button size="sm" colorScheme="blue" variant="outline" isDisabled>
                Bientôt disponible
              </Button>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* FAQ */}
        <Card bg="white" borderColor="gray.200" borderWidth="1px">
          <CardBody>
            <Heading size="md" color="gray.800" mb={4}>Questions fréquentes</Heading>
            <Accordion allowMultiple>
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} border="none" mb={2}>
                  <AccordionButton
                    bg="gray.50"
                    borderRadius="lg"
                    _hover={{ bg: 'gray.600' }}
                    _expanded={{ bg: 'gray.600', borderBottomRadius: 0 }}
                  >
                    <Box flex="1" textAlign="left" color="gray.800" fontWeight="medium" fontSize="sm">
                      {item.question}
                    </Box>
                    <AccordionIcon color="gray.400" />
                  </AccordionButton>
                  <AccordionPanel bg="gray.50" borderBottomRadius="lg" color="gray.600" fontSize="sm" pb={4}>
                    {item.answer}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
