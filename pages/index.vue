<template>
  <div class="landing-wrapper">
    <v-container class="py-16 text-center">
      <h1 class="text-h2 font-weight-bold text-primary mb-6">
        Sistema de Facturación Electrónica para El Salvador
      </h1>
      <p class="text-h6 text-medium-emphasis mb-8 mx-auto" style="max-width: 800px;">
        Emite Documentos Tributarios Electrónicos (DTE) homologados por el Ministerio de Hacienda. 
        Solución completa para Facturas de Consumidor Final y Créditos Fiscales.
      </p>
      
      <div class="d-flex justify-center gap-4">
        <v-btn size="x-large" color="primary" to="/login" elevation="4">
          Ingresar al Sistema
        </v-btn>
      </div>
    </v-container>
    </div>
</template>

<script setup>
definePageMeta({
  layout: 'landing', 
  auth: false 
})

// 1. Metadatos visibles (Título, Descripción, Social)
useSeoMeta({
  title: 'Sistema de Facturación Electrónica MH El Salvador',
  ogTitle: 'Sistema de Facturación Electrónica MH El Salvador',
  description: 'Emite Facturas de Consumidor Final y Créditos Fiscales homologados por el Ministerio de Hacienda. Software DTE fácil, rápido y seguro.',
  ogDescription: 'Emite Facturas de Consumidor Final y Créditos Fiscales homologados por el Ministerio de Hacienda.',
  ogImage: '/images/social-card.jpg',
  twitterCard: 'summary_large_image',
})

// 2. Datos Estructurados JSON-LD (Esto es lo que Google lee)
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Smart DTE",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Software de facturación electrónica homologado por Hacienda El Salvador.",
        "featureList": "Emisión de DTE, Control de Clientes, Reportes Mensuales, Conexión MH"
      })
    }
  ]
})
</script>