<template>
  <Teleport to="body">
    <div id="pos-ticket-print" class="ticket-container" v-if="dteData">
      
      <div class="ticket-content">
        
        <div class="text-center">
          <h3 class="font-bold text-xl">{{ emisor.nombre }}</h3>
          <p class="text-sm">{{ emisor.nombreComercial }}</p>
          <p class="text-sm">NIT: {{ emisor.nit }} | NRC: {{ emisor.nrc }}</p>
          <p class="text-sm">{{ emisor.direccion_formateada || formatDireccion(emisor.direccion) }}</p>
          <p class="text-sm">Tel: {{ emisor.telefono }}</p>
          
          <div class="divider"></div>
          
          <h4 class="font-bold mt-2">DOCUMENTO TRIBUTARIO ELECTRÓNICO</h4>
          <h4 class="font-bold text-lg">
            {{ dteData.tipoDte === '03' ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA' }}
          </h4>
        </div>

        <div class="info-section mt-2">
          <p><strong>Cód. Generación:</strong><br><span class="text-xs">{{ dteData.codigoGeneracion }}</span></p>
          <p><strong>Nº Control:</strong> {{ dteData.numeroControl }}</p>
          
          <p><strong>Sello:</strong> 
            <span v-if="dteData.selloRecibido">{{ dteData.selloRecibido }}</span>
            <span v-else class="font-bold">PENDIENTE (CONTINGENCIA)</span>
          </p>
          
          <p><strong>Fecha/Hora:</strong> {{ dteData.fhProcesamiento }}</p>
        </div>

        <div class="divider"></div>

        <div class="info-section">
          <p><strong>Cliente:</strong> {{ receptor.nombre || 'Clientes Varios' }}</p>

          <template v-if="dteData.tipoDte === '03'">
             <p v-if="receptor.nit"><strong>NIT:</strong> {{ receptor.nit }}</p>
             <p v-if="receptor.nrc"><strong>NRC:</strong> {{ receptor.nrc }}</p>
             <p v-if="receptor.desc_actividad" class="text-xs">{{ receptor.desc_actividad }}</p>
          </template>

          <template v-else>
             <p v-if="receptor.numeroDocumento">Doc: {{ receptor.numeroDocumento }}</p>
          </template>

          <p v-if="receptor.correo">Email: {{ receptor.correo }}</p>
        </div>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th class="text-left" style="width: 15%">Cant.</th>
              <th class="text-left" style="width: 60%">Desc.</th>
              <th class="text-right" style="width: 25%">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td class="align-top">{{ item.cantidad }}</td>
              <td>
                {{ item.descripcion }}
                <div v-if="item.precio_unitario || item.precioUnitario">
                  <small class="text-muted">@ ${{ formatMoney(item.precio_unitario || item.precioUnitario) }}</small>
                </div>
              </td>
              <td class="text-right align-top">
                ${{ formatMoney(item.ventaGravada || (item.cantidad * (item.precio_unitario || item.precioUnitario))) }}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div v-if="dteData.tipoDte === '01'" class="totals-section">
            <div class="flex-row font-bold text-lg">
              <span>TOTAL A PAGAR:</span>
              <span>${{ formatMoney(resumen.totalPagar) }}</span>
            </div>
            <div class="text-center mt-1" style="font-size: 10px; color: #000;">
              (Precios con IVA incluido)
            </div>
        </div>

        <div v-else class="totals-section">
            <div class="flex-row">
              <span>Suma Ventas (Neto):</span>
              <span>${{ formatMoney(resumen.totalGravada) }}</span>
            </div>

            <div class="flex-row">
              <span>IVA (13%):</span>
              <span>${{ formatMoney(resumen.iva) }}</span>
            </div>

            <div class="flex-row" v-if="parseFloat(resumen.retencion || 0) > 0">
              <span>(-) Retención:</span>
              <span>${{ formatMoney(resumen.retencion) }}</span>
            </div>

            <div class="flex-row font-bold text-lg mt-1 border-t">
              <span>TOTAL A PAGAR:</span>
              <span>${{ formatMoney(resumen.totalPagar) }}</span>
            </div>
        </div>
        
        <div class="divider"></div>

        <div class="text-center mt-4">
          <div class="qr-wrapper mb-2">
             <QrcodeVue :value="qrString" :size="110" level="M" render-as="svg" />
          </div>
          
          <p class="text-xs">Consulta en hacienda.gob.sv</p>
          <p class="text-xs mt-1">Condición: {{ mapCondicion(dteData.condicionOperacion) }}</p>
          <p class="font-bold mt-2">*** GRACIAS POR SU COMPRA ***</p>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import QrcodeVue from 'qrcode.vue';

const props = defineProps({
  dteData: { type: Object, required: false }, 
  items: { type: Array, default: () => [] },
  receptor: { type: Object, default: () => ({}) },
  emisor: { type: Object, required: true },
  resumen: { type: Object, default: () => ({ totalGravada: 0, iva: 0, retencion: 0, totalPagar: 0 }) }
});

// Función robusta para formatear moneda
const formatMoney = (amount) => {
  const val = parseFloat(amount || 0);
  if (isNaN(val)) return '0.00';
  return val.toFixed(2);
};

// Función para formatear dirección (si viene objeto JSON o string)
const formatDireccion = (dir) => {
  if (!dir) return '';
  if (typeof dir === 'object') return dir.complemento || '';
  return dir;
};

// Mapeo simple de condición de operación
const mapCondicion = (codigo) => {
    if (codigo == 1) return 'Contado';
    if (codigo == 2) return 'Crédito';
    return 'Contado'; // Default
};

// Generación del string para el QR de Hacienda
const qrString = computed(() => {
  if (!props.dteData) return '';
  const baseUrl = 'https://admin.factura.gob.sv/consultaPublica'; 
  const params = new URLSearchParams({
    ambiente: '01', // Idealmente props.emisor.mh_ambiente
    codGen: props.dteData.codigoGeneracion,
    fechaEmi: props.dteData.fhProcesamiento ? props.dteData.fhProcesamiento.substring(0, 10) : '',
  });
  return `${baseUrl}?${params.toString()}`;
});
</script>

<style>
@media print {
  /* 1. Resetear el HTML y BODY para evitar márgenes extraños del framework */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: 100% !important;
    overflow: visible !important;
    background: white !important;
  }

  /* 2. Ocultar todo lo de Nuxt */
  body > * {
    display: none !important;
  }

  /* 3. Mostrar SOLO el ticket y posicionarlo como FIXED para garantizar top:0 real */
  body > #pos-ticket-print {
    display: block !important;
    position: fixed !important; /* Fixed es más seguro que Absolute para impresión en SPA */
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: auto !important;
    z-index: 9999 !important;
    background-color: white !important;
  }

  @page {
    margin: 0;
    size: auto;
  }
}
</style>

<style scoped>
#pos-ticket-print {
  display: none; /* Oculto en pantalla normal */
}

.ticket-content {
  /* Ancho estándar */
  width: 80mm; 
  /* Margen de seguridad: 10px arriba es suficiente si usamos position: fixed */
  padding: 10px 5px 10px 5px; 
  
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.2;
  color: black;
  
  /* Centrar el ticket en la hoja (opcional, si prefieres a la izquierda quita el margin auto) */
  margin: 0; 
}

/* Clases utilitarias */
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }
.font-bold { font-weight: bold; }
.text-xl { font-size: 16px; }
.text-lg { font-size: 14px; }
.text-sm { font-size: 11px; }
.text-xs { font-size: 10px; }
.text-muted { color: #444; }

.divider { border-bottom: 1px dashed black; margin: 8px 0; }
.border-t { border-top: 1px solid black; padding-top: 2px; }

.items-table { width: 100%; border-collapse: collapse; }
.items-table th { border-bottom: 1px solid black; padding-bottom: 2px; }
.align-top { vertical-align: top; }

.flex-row { display: flex; justify-content: space-between; }
.qr-wrapper { display: flex; justify-content: center; margin: 10px 0; }

.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
</style>