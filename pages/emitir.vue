<template>
  <div v-if="!authStore.user?.empresa" class="d-flex justify-center align-center" style="height: 80vh;">
    <div class="text-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-grey">Cargando configuración...</p>
    </div>
  </div>
  <div v-else>
    <v-container>
      <h1 class="mb-4">Emitir Nuevo Documento Tributario</h1>
  
      <v-overlay :model-value="initialLoading" class="align-center justify-center" persistent>
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-overlay>
  
      <!-- dialogo para indicar si se transmite o no -->
      <v-dialog v-model="resultDialog.show" persistent max-width="600px">
        <v-card :color="resultDialog.success ? 'green-lighten-5' : 'red-lighten-5'">
          <v-card-title class="d-flex align-center">
            <v-icon 
              :icon="resultDialog.success ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" 
              :color="resultDialog.success ? 'success' : 'error'" 
              class="mr-3"
              size="large"
            ></v-icon>
            <span class="text-h5">{{ resultDialog.title }}</span>
          </v-card-title>
          
          <v-card-text class="text-body-1 pt-4">
            {{ resultDialog.message }}
            <p v-if="resultDialog.details" class="text-caption mt-3">
              <strong>Detalles:</strong> {{ resultDialog.details }}
            </p>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
  
            <v-btn color="primary" variant="text" @click="closeResultDialog">
              Entendido
            </v-btn>
  
            <v-btn
              v-if="!resultDialog.success"
              color="secondary"
              variant="flat"
              @click="retrySubmit"
            >
              Reintentar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-dialog v-model="dialog.show" persistent max-width="800px">
        <v-card>
          <v-card-title><span class="text-h5">Nuevo Cliente</span></v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8"><v-text-field label="Nombre Completo o Razón Social*" v-model="dialog.newClient.nombre" required></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="Nombre Comercial" v-model="dialog.newClient.nombre_comercial"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="NIT" v-model="dialog.newClient.nit"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="NRC" v-model="dialog.newClient.nrc"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="Teléfono" v-model="dialog.newClient.telefono"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field label="Código de Actividad" v-model="dialog.newClient.cod_actividad"></v-text-field></v-col>
              <v-col cols="12" md="8"><v-text-field label="Descripción de Actividad" v-model="dialog.newClient.desc_actividad"></v-text-field></v-col>
              <v-col cols="12"><v-text-field label="Correo Electrónico" v-model="dialog.newClient.correo" type="email"></v-text-field></v-col>
            </v-row>
            <v-card-text>
              <v-row>
                <v-divider class="my-3"></v-divider>
                <v-col cols="12" md="6">
                  <v-select
                    label="Otro Tipo de Documento (Para NRE)"
                    v-model="dialog.newClient.tipo_documento"
                    :items="[{title:'DUI', value:'13'}, {title:'Pasaporte', value:'03'}, {title:'Otro', value:'37'}]"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field 
                    label="Número del Otro Documento"
                    v-model="dialog.newClient.num_documento"
                  ></v-text-field>
                </v-col>
                <v-divider class="my-3"></v-divider>
  
              </v-row>
              </v-card-text>
            <h4 class="mt-4">Dirección</h4>
            <v-divider class="mb-2"></v-divider>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-select label="Departamento" v-model="dialog.newClient.direccion.departamento" :items="locations" item-title="nombre" item-value="codigo"></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select label="Municipio" v-model="dialog.newClient.direccion.municipio" :items="filteredMunicipios" item-title="nombre" item-value="codigo" :disabled="!dialog.newClient.direccion.departamento"></v-select>
              </v-col>
            </v-row>
            <v-textarea label="Complemento (Calle, # Casa, Colonia...)" v-model="dialog.newClient.direccion.complemento" rows="2"></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="closeDialog">Cancelar</v-btn>
            <v-btn color="blue-darken-1" variant="text" @click="saveNewClient" :loading="dialog.loading">Guardar Cliente</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-card class="mt-4" :loading="loading" :disabled="initialLoading">
        <v-card-text>
          <v-form @submit.prevent="submitDTE">
            <v-row>
              
              <v-col cols="12" md="4">
                <v-select v-model="form.tipo_dte" :items="documentTypes" item-title="title" item-value="value" label="Tipo de Documento" variant="outlined"></v-select>
              </v-col>
  
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.punto_de_venta_id"
                  :items="puntosDeVentaPermitidos"
                  item-title="nombre"
                  item-value="id"
                  label="Punto de Venta*"
                  variant="outlined"
                  :rules="[v => !!v || 'Debe seleccionar un punto de venta']"
                  :disabled="puntosDeVentaPermitidos.length <= 1"
                ></v-select>
              </v-col>
  
              <v-col v-if="form.tipo_dte !== '04'" cols="12" md="4">
                <v-select v-model="form.condicion_operacion" :items="[{title: 'Contado', value: '1'}, {title: 'A Crédito', value: '2'}, {title: 'Otro', value: '3'}]" label="Condición de la Operación" variant="outlined"></v-select>
              </v-col>
            </v-row>
  
            <v-row v-if="form.condicion_operacion === '2'">
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.plazo"
                  :items="plazos"
                  label="Plazo del Crédito*"
                  variant="outlined"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.periodo"
                  label="Período (ej. 30, 60, 90)*"
                  type="number"
                  variant="outlined"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
            </v-row>
  
            <v-row v-if="form.tipo_dte === '05' || form.tipo_dte === '06'" class="mt-4">
              <v-col cols="12">
                <v-autocomplete
                  v-model="form.documento_relacionado"
                  @update:modelValue="handleDocumentoSeleccionado" v-model:search="searchTermDoc"
                  :items="searchResultsDoc"
                  :loading="searchLoadingDoc"
                  item-title="numero_control"
                  return-object
                  label="Buscar CCFE a afectar (por Nº Control o Código Generación)*"
                  placeholder="Escriba para buscar el CCFE..."
                  variant="outlined"
                  clearable
                  no-filter
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :subtitle="`Cod. Gen: ${item.raw.codigo_generacion.slice(0, 15)}...`"
                      :title="`Nº Control: ${item.raw.numero_control}`"
                    ></v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
  
            <v-autocomplete
              v-model="form.cliente"
              v-model:search="searchTerm"
              :items="searchResults"
              :loading="searchLoading"
              :no-filter="true"
              item-title="nombre"
              return-object
              label="Cliente"
              placeholder="Escriba para buscar..."
              variant="outlined"
              class="mt-2"
              clearable
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.nombre" lines="two">
                  </v-list-item>
              </template>
  
              <template v-slot:append>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      color="primary"
                      variant="tonal"
                      @click="dialog.show = true"
                      :icon="$vuetify.display.xs"
                    >
                      <v-icon :start="$vuetify.display.smAndUp">mdi-account-plus</v-icon>
                      <span class="d-none d-sm-inline">Nuevo Cliente</span>
                    </v-btn>
                  </template>
                  <span>Agregar nuevo cliente</span>
                </v-tooltip>
              </template>
            </v-autocomplete>
            
            
            <v-card 
              v-if="['03', '05', '06'].includes(form.tipo_dte) && form.cliente?.id"
              variant="tonal"
              class="mt-4 mb-6 pa-3"
            >
              </v-card>
  
            <v-card
              v-if="form.tipo_dte === '14' && form.cliente"
              variant="tonal"
              class="mt-4 mb-6 pa-3"
            >
              <v-card-title class="pa-0">Datos del Sujeto Excluido</v-card-title>
              <p class="text-caption">Para este documento, solo se requiere el nombre y número de documento del cliente.</p>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <p class="text-caption">Nombre</p>
                  <p :class="!form.cliente.nombre && 'text-error font-weight-bold'">
                    {{ form.cliente.nombre || 'REQUERIDO' }}
                  </p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-caption">Documento</p>
                  <p :class="!form.cliente.numDocumento && 'text-error font-weight-bold'">
                    {{ form.cliente.numDocumento || 'REQUERIDO' }}
                  </p>
                </v-col>
              </v-row>
            </v-card>
  
            <v-card 
              v-if="form.tipo_dte === '03' && form.cliente?.id"
              variant="tonal"
              class="mt-4 mb-6 pa-3"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <v-card-title class="pa-0">Datos del Receptor (CCFE)</v-card-title>
                <v-btn size="small" variant="text" color="primary">Editar Cliente</v-btn>
              </div>
              
              <v-row dense>
                <v-col cols="12" md="4">
                  <p class="text-caption">NIT</p>
                  <p :class="!form.cliente.nit && 'text-error font-weight-bold'">{{ form.cliente.nit || 'REQUERIDO' }}</p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-caption">NRC</p>
                  <p :class="!form.cliente.nrc && 'text-error font-weight-bold'">{{ form.cliente.nrc || 'REQUERIDO' }}</p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-caption">Nombre Comercial</p>
                  <p :class="!form.cliente.nombre_comercial && 'text-error font-weight-bold'">{{ form.cliente.nombre_comercial || 'REQUERIDO' }}</p>
                </v-col>
                <v-col cols="12" md="8">
                  <p class="text-caption">Actividad Económica</p>
                  <p :class="!form.cliente.desc_actividad && 'text-error font-weight-bold'">{{ form.cliente.desc_actividad || 'REQUERIDO' }}</p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-caption">Correo Electrónico</p>
                  <p :class="!form.cliente.correo && 'text-error font-weight-bold'">{{ form.cliente.correo || 'REQUERIDO' }}</p>
                </v-col>
              </v-row>
            </v-card>
  
            <!-- <v-row>
              <v-col>
                <v-checkbox
                  v-model="esVentaTercero"
                  label="¿Es una Venta por Cuenta de Tercero?"
                ></v-checkbox>
              </v-col>
            </v-row> -->
  
            <!-- <v-card v-if="esVentaTercero" variant="tonal" class="mb-6 pa-4">
              <h3 class="mb-4 text-h6">Datos del Tercero (Mandante)</h3>
              <v-autocomplete
                v-model="mandante"
                :items="mandanteResults"
                v-model:search="mandanteSearchTerm"
                :loading="mandanteSearchLoading"
                item-title="nombre"
                return-object
                label="Buscar Tercero (por Nombre, NIT o NRC)"
                variant="outlined"
                placeholder="Escriba para buscar un cliente..."
                no-filter
                clearable
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.nombre" :subtitle="`NIT: ${item.raw.nit}`"></v-list-item>
                </template>
              </v-autocomplete>
            </v-card> -->
            <!-- <v-divider class="my-6"></v-divider> -->
            
            <div v-if="form.tipo_dte === '03' && form.cliente?.id" class="mb-4">
              <p class="text-caption">Datos del Cliente Seleccionado:</p>
              <v-row dense>
                <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nit" label="NIT" variant="underlined" readonly density="compact"></v-text-field></v-col>
                <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.nrc" label="NRC" variant="underlined" readonly density="compact"></v-text-field></v-col>
                <v-col cols="12" md="4"><v-text-field :model-value="form.cliente.correo" label="Correo" variant="underlined" readonly density="compact"></v-text-field></v-col>
              </v-row>
            </div>
  
            <div v-if="form.tipo_dte !== '07'">
              <h3 class="mt-8">Ítems</h3>
              <v-divider class="mb-4"></v-divider>
              <!-- <v-row v-if="(form.tipo_dte === '03' || form.tipo_dte === '01') && form.cliente?.categoria_contribuyente === 'GRANDE'">
                  <v-col cols="12">
                      <v-switch
                          v-model="aplicaRetencion"
                          label="Aplicar Retención 1% (Ventas gravadas >= $100)"
                          color="primary"
                          hide-details
                      ></v-switch>
                  </v-col>
              </v-row> -->
              <v-row align="center">
                <v-col cols="12" md="4">
                  <v-combobox
                      v-if="authStore.user?.empresa?.usa_inventario"
                      v-model="newItem.descripcion"
                      label="Buscar por Nombre, SKU o Escanear Barcode"
                      placeholder="Escribe o escanea aquí..."
                      prepend-inner-icon="mdi-barcode-scan"
                      :items="searchedProducts"
                      item-title="nombre"
                      item-value="id"
                      @update:search="searchProducts"
                      :loading="isSearching"
                      no-filter
                      @update:model-value="productSelected"
                      @keydown.enter.prevent 
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                      return-object
                      clearable
                  >
                    <template v-slot:prepend-inner>
                      <v-chip
                          v-if="newItem.codigo"
                          class="ma-1"
                          color="blue-grey-lighten-4"
                          text-color="blue-grey-darken-3"
                          size="small"
                          label
                          variant="flat"
                      >
                          <strong>{{ newItem.codigo }}</strong>
                      </v-chip>
                  </template>
  
                    <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props" lines="two">
                            <v-list-item-title class="font-weight-bold">
                                {{ item.raw.nombre }}
                            </v-list-item-title>
                            
                            <v-list-item-subtitle class="d-flex align-center mt-1">
                                <span v-if="item.raw.barcode" class="mr-3 text-high-emphasis">
                                    <v-icon size="x-small" start>mdi-barcode</v-icon> 
                                    {{ item.raw.barcode }}
                                </span>
                                <span v-else-if="item.raw.sku" class="mr-3 text-medium-emphasis">
                                    <v-icon size="x-small" start>mdi-label-outline</v-icon> 
                                    SKU: {{ item.raw.sku }}
                                </span>
                                
                                <v-chip size="x-small" color="green" class="mr-2" variant="outlined">
                                    ${{ parseFloat(item.raw.precio_unitario).toFixed(2) }}
                                </v-chip>
                                
                                <span class="text-caption text-disabled">
                                    (Int: {{ item.raw.codigo }})
                                </span>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>
                    
                    <template v-slot:no-data>
                        <v-list-item>
                            <v-list-item-title>
                                No se encontraron productos.
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                Presiona Enter para agregar como texto libre.
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>
                  </v-combobox>
                  <v-text-field
                    v-else
                    v-model="newItem.descripcion"
                    label="Descripción"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3" lg="2">
                  <v-select v-model="newItem.tipoItem" :items="tiposDeItem" label="Tipo" variant="outlined" density="compact" hide-details="auto"></v-select>
                </v-col>
                
                <v-col cols="6" md="3" lg="2">
                  <v-select v-model="newItem.uniMedida" :items="unidadesDeMedida" item-title="title" item-value="value" label="U. Medida" variant="outlined" density="compact" hide-details="auto"></v-select>
                </v-col>
                
                <v-col cols="12" md="2">
                  <v-text-field v-model.number="newItem.cantidad" label="Cantidad" type="number" variant="outlined" density="compact" hide-details="auto"></v-text-field>
                </v-col>
                
                <v-col cols="12" md="3" lg="2">
                  <v-text-field v-model.number="newItem.precio_unitario" :label="precioUnitarioLabel" type="number" prefix="$" variant="outlined" density="compact" hide-details="auto"></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="4" md="3" class="d-flex align-center mt-2 mt-sm-0">
                  <v-chip
                    v-if="clienteEsExentoGlobal"
                    color="teal"
                    text-color="white"
                    label
                    prepend-icon="mdi-check-decagram"
                    class="mr-4"
                  >
                    Exento
                  </v-chip>
                  
                  <v-checkbox
                    v-else
                    v-model="newItem.esExento"
                    label="Venta Exenta"
                    color="primary"
                    hide-details
                  ></v-checkbox>
                  
                  <v-btn class="ml-auto" color="primary" @click="addItem" prepend-icon="mdi-plus" size="large">Añadir</v-btn>
                </v-col>
              </v-row>
  
              <v-table v-if="form.items.length > 0" density="compact" class="mt-4 border">
                <thead>
                  <tr>
                    <th class="text-left">Descripción</th>
                    <th class="text-center">Tipo</th>
                    <th class="text-center">U. Medida</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-center">P. Unitario</th>
                    <th class="text-right">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in form.items" :key="index">
                    <td>{{ item.descripcion }}</td>
                    <td class="text-caption text-center" style="vertical-align: middle;">
                      {{ item.tipoItem === 1 ? 'Bien' : 'Servicio' }}
                    </td>
                     
                    <td class="text-caption text-center" style="vertical-align: middle;">
                      {{ getUnidadMedidaNombre(item.uniMedida) }}
                    </td>
                     
                    <td class="text-caption text-center" style="vertical-align: middle;">
                      {{ item.cantidad }}
                    </td>
                     <!-- <td style="width: 120px;">
                        <v-text-field
                          v-model.number="item.cantidad"
                          type="number"
                          variant="underlined"
                          density="compact"
                          hide-details
                          min="0.01"
                          class="centered-input"
                        ></v-text-field>
                      </td> -->
                     <td class="text-caption text-center" style="vertical-align: middle;">
                      ${{ item.precio_unitario.toFixed(2) }}
                     </td>
                     
                    <td class="text-caption text-right" style="vertical-align: middle;">
                      ${{ (item.cantidad * item.precio_unitario).toFixed(2) }}
                    </td>
                    <!-- <td><v-btn icon="mdi-delete" variant="text" color="error" size="x-small" @click="removeItem(index)"></v-btn></td> -->
                    <td class="d-flex align-center justify-end">
                      <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" @click="editItem(item, index)"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="removeItem(index)"></v-btn>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="subtotales.total > 0">
          
                  <tr v-if="form.tipo_dte !== '01'">
                      <td colspan="5" class="text-center font-weight-bold">SUBTOTAL</td>
                      <td class="text-center font-weight-bold">${{ subtotales.subTotal.toFixed(2) }}</td>
                      <td></td>
                  </tr>
  
                  <tr v-if="form.tipo_dte === '03'">
                      <td colspan="5" class="text-center font-weight-bold">IVA (13%)</td>
                      <td class="text-center font-weight-bold">${{ subtotales.iva.toFixed(2) }}</td>
                      <td></td>
                  </tr>
  
                  <tr v-if="aplicaRetencion">
                      <td colspan="5" class="text-center font-weight-bold text-error">IVA RETENIDO (1%)</td>
                      <td class="text-center font-weight-bold text-error">- ${{ ivaRetenidoCalculado.toFixed(2) }}</td>
                      <td></td>
                  </tr>
  
                  <tr v-if="rentaRetenidaCalculada > 0">
                    <td colspan="5" class="text-center font-weight-bold text-error">RENTA RETENIDA (10%)</td>
                    <td class="text-center font-weight-bold text-error">- ${{ rentaRetenidaCalculada.toFixed(2) }}</td>
                    <td></td>
                  </tr>
  
                  <tr v-if="aplicaRetencion">
                      <td colspan="5" class="text-center">
                          <v-chip color="info" label size="small">
                              <v-icon start icon="mdi-information-outline"></v-icon>
                              Retención Automática (Gran Contribuyente)
                          </v-chip>
                      </td>
                      <td class="text-center font-weight-bold text-error">- ${{ ivaRetenidoCalculado.toFixed(2) }}</td>
                      <td></td>
                  </tr>
                  
                  <tr>
                      <td colspan="5" class="text-center text-h6 font-weight-black">
                          {{ aplicaRetencion ? 'TOTAL A PAGAR' : 'TOTAL' }}
                      </td>
                      <td class="text-center text-h6 font-weight-black">${{ totalAPagar.toFixed(2) }}</td>
                      <td></td>
                  </tr>
  
              </tfoot>
              </v-table>
            </div>
            <v-card class="mt-6" v-if="form.tipo_dte === '07'">
            <v-card-title>Documentos a los que se Aplica Retención</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Tipo DTE</th>
                    <th>Nº Documento</th>
                    <th>Monto Sujeto Ret.</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(doc, index) in form.documentos_retenidos" :key="index">
                    <td>{{ doc.tipoDte }}</td>
                    <td>{{ doc.numeroDocumento }}</td>
                    <td>${{ doc.montoSujetoGrav }}</td>
                    <td>
                      <v-btn icon="mdi-delete" size="x-small" color="error" @click="eliminarDocumentoRetenido(index)"></v-btn>
                    </td>
                  </tr>
                  <tr v-if="form.documentos_retenidos.length === 0">
                      <td colspan="4" class="text-center">Añada un documento para aplicar retención...</td>
                  </tr>
                </tbody>
              </v-table>
  
              <v-divider class="my-4"></v-divider>
  
              <p class="mb-4 font-weight-bold">Añadir Documento:</p>
              <v-row>
                  <v-col cols="12" md="3">
                      <v-select label="Tipo DTE afectado" :items="[{title: 'CCF', value: '03'}]" v-model="nuevoDocRetenido.tipoDte" variant="outlined"></v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                      <v-select label="Tipo Generación" :items="[{title: 'Electrónico', value: 2}, {title: 'Físico', value: 1}]" v-model="nuevoDocRetenido.tipoDoc" variant="outlined"></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                      <v-text-field label="Nº Documento o Código Generación" v-model="nuevoDocRetenido.numeroDocumento" variant="outlined"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                      <v-text-field type="date" label="Fecha Emisión" v-model="nuevoDocRetenido.fechaEmision" variant="outlined"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                      <v-text-field type="number" label="Monto Sujeto a Retención" v-model="nuevoDocRetenido.montoSujetoGrav" prefix="$" variant="outlined"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                      <v-text-field label="Descripción" v-model="nuevoDocRetenido.descripcion" variant="outlined"></v-text-field>
                  </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="agregarDocumentoRetenido">Añadir Documento</v-btn>
            </v-card-actions>
          </v-card>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4 d-flex flex-column flex-sm-row align-center">
          <div class="flex-grow-1 w-100 order-sm-first order-first">
            <v-expand-transition>
              <div :key="validationErrors.length">
                <v-alert
                  v-if="validationErrors.length > 0"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="text-body-2 text-sm-body-1"
                >
                  <div class="font-weight-bold mb-1">Recuerde completar los siguientes datos para poder emitir:</div>
                  <ul class="pl-4">
                    <li v-for="(error, i) in validationErrors" :key="i">
                      {{ error }}
                    </li>
                  </ul>
                </v-alert>
  
                <v-alert
                  v-else
                  type="success"
                  variant="tonal"
                  density="compact"
                  class="text-body-2 text-sm-body-1"
                >
                  <div class="d-flex align-center font-weight-bold">
                    <v-icon start>mdi-check-circle-outline</v-icon>
                    ¡Todo listo para emitir su documento!
                  </div>
                </v-alert>
              </div>
            </v-expand-transition>
          </div>
          <v-switch 
              v-modeltch
              v-if="authStore.user?.roles?.some(role => role.name === 'Admin')"
              v-model="form.force_contingency"
              color="orange-darken-3"
              label="Enviar en Modo Contingencia"
              hide-details
              class="mb-4"
            ></v-switch>
          <div class="w-100 w-sm-auto mt-4 mt-sm-0 d-flex justify-center order-sm-last order-last">
            <v-btn 
              color="success" 
              size="large" 
              @click="submitDTE" 
              :disabled="validationErrors.length > 0 || loading" 
              :loading="loading"
              block
              max-width="300" 
            >
              Emitir Documento
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-container>
    <v-container>
       <TicketDTE 
          ref="ticketRef"
          :dte-data="datosFacturaExitosa"
          :items="form.items"
          :receptor="form.cliente || { nombre: 'Clientes Varios' }"
          
          :emisor="authStore.user?.empresa || {}" 
          
          :resumen="resumenTicketSnapshot"
        />
  
       <v-dialog v-model="editDialog" max-width="500px">
        <v-card>
          <v-card-title>Editar Detalle</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field 
                  v-model="editedItem.descripcion" 
                  label="Descripción" 
                  variant="outlined"
                  @keydown.enter="saveEdit" 
                ></v-text-field>
              </v-col>
              
              <v-col cols="6">
                <v-select 
                  v-model="editedItem.tipoItem" 
                  :items="tiposDeItem" 
                  label="Tipo" 
                  item-title="title" item-value="value"
                  variant="outlined" density="compact"
                ></v-select>
              </v-col>
              
              <v-col cols="6">
                <v-autocomplete 
                  v-model="editedItem.uniMedida" 
                  :items="unidadesDeMedida" 
                  label="Unidad" 
                  item-title="title" item-value="value"
                  variant="outlined" density="compact"
                ></v-autocomplete>
              </v-col>
  
              <v-col cols="6">
                <v-text-field 
                  v-model.number="editedItem.cantidad" 
                  label="Cantidad" type="number"
                  variant="outlined" density="compact"
                  @keydown.enter="saveEdit"
                ></v-text-field>
              </v-col>
  
              <v-col cols="6">
                <v-text-field 
                  v-model.number="editedItem.precio_unitario" 
                  label="Precio Unitario" type="number" prefix="$"
                  variant="outlined" density="compact"
                  @keydown.enter="saveEdit"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-checkbox 
                  v-model="editedItem.esExento" 
                  label="Venta Exenta" 
                  color="primary"
                  density="compact"
                  hide-details
                  @keydown.enter="saveEdit"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="closeEdit">Cancelar</v-btn>
            <v-btn color="primary" variant="text" @click="saveEdit">Guardar Cambios</v-btn>
          </v-card-actions>
        </v-card>
       </v-dialog>
       <TicketDTE 
          ref="ticketRef"
          :dte-data="datosFacturaExitosa"
          :items="form.items"
          :receptor="form.cliente || { nombre: 'Clientes Varios' }"
          :emisor="authStore.user.empresa" 
          :resumen="resumenTicketSnapshot"
        />
    </v-container>
  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';
import TicketDTE from '~/components/pos/TicketDTE.vue';

const datosFacturaExitosa = ref(null);
const { $api } = useNuxtApp();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();
const route = useRoute();

// --- ESTADOS DEL COMPONENTE ---
const resumenTicketSnapshot = ref({
  totalGravada: 0,
  totalPagar: 0
});
const initialLoading = ref(true);
const loading = ref(false);
const error = ref(null);
const documentTypes = ref([]);
const locations = ref([]);
const searchLoading = ref(false);
const searchResults = ref([]);
const searchTerm = ref('');
let searchTimeout = null;

const puntosDeVentaPermitidos = ref([]);
const searchedProducts = ref([]);
const isSearching = ref(false);

const searchTermDoc = ref('');
const searchLoadingDoc = ref(false);
const searchResultsDoc = ref([]);
let searchTimeoutDoc = null;

const tiposDeItem = ref([
    { title: 'Bien', value: 1 },
    { title: 'Servicio', value: 2 }
]);

const unidadesDeMedida = ref([
    { title: 'Unidad', value: 59 },
    { title: 'Otra', value: 99 },
    { title: 'Días', value: 5 },
    { title: 'Mes', value: 6 },
    { title: 'Año', value: 7 },
    { title: 'Litro', value: 23 },
    { title: 'Kilogramo', value: 34 },
]);

const form = ref({
  tipo_dte: '01',
  punto_de_venta_id: null,
  condicion_operacion: '1',
  plazo: null,
  periodo: null,
  cliente: null,
  items: [],
  documento_relacionado: null,
  documentos_retenidos: [],
  force_contingency: false,
});

const newItem = ref({
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
  tipoItem: 1,
  uniMedida: 59,
  codigo: null,
  esExento: false,
});

const resultDialog = ref({
  show: false,
  success: false,
  title: '',
  message: '',
  details: ''
});

const dialog = ref({
  show: false,
  loading: false,
  newClient: {
    nombre: '', nit: '', nrc: '', correo: '', nombre_comercial: '',
    cod_actividad: '', desc_actividad: '', telefono: '',
    direccion: { departamento: null, municipio: null, complemento: '' }
  }
});

const condicionesOperacion = ref([
    { title: 'Contado', value: '1' },
    { title: 'A Crédito', value: '2' },
    { title: 'Otro', value: '3' },
]);

const plazos = ref([
    { title: 'Días', value: '01' },
    { title: 'Meses', value: '02' },
    { title: 'Años', value: '03' },
]);

const esVentaTercero = ref(false);
const mandante = ref(null);
const mandanteSearchTerm = ref('');
const mandanteSearchLoading = ref(false);
const mandanteResults = ref([]);
let mandanteSearchTimeout = null;

const nuevoDocRetenido = ref({
    tipoDte: '03',
    tipoDoc: 2,
    numeroDocumento: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    montoSujetoGrav: null,
    descripcion: ''
});

const rules = {
  required: value => !!value || 'Este campo es requerido.',
};


// B. Base para cálculos: Total Gravado SIN IVA


// ===================================================================
// === LÓGICA FISCAL AUTOMATIZADA (VERSIÓN ÚNICA Y CORRECTA) ===
// ===================================================================

// 1. ¿El cliente seleccionado es Exento de IVA?
const clienteEsExentoGlobal = computed(() => {
    return form.value.cliente?.es_exento || false;
});

const totalGravadaSinIva = computed(() => {
  return form.value.items.reduce((acc, item) => {
    if (!item.esExento) {
      const precioSinIva = parseFloat(item.precio_unitario) / 1.13;
      return acc + (precioSinIva * parseFloat(item.cantidad));
    }
    return acc;
  }, 0);
});

// 2. ¿Se debe APLICAR la retención? (100% automático)
const aplicaRetencion = computed(() => {
    // Si no hay cliente, no aplica.
    if (!form.value.cliente) return false;

    // Se evalúan las 3 reglas de negocio en orden.
    const esDteAplicable = ['01', '03'].includes(form.value.tipo_dte);
    const esGranContribuyente = form.value.cliente.categoria_contribuyente === 'GRANDE';
    const montoAplica = totalGravadaSinIva.value >= 100;

    // Devuelve true solo si se cumplen TODAS las condiciones.
    return esDteAplicable && esGranContribuyente && montoAplica;
});

// 3. ¿Cuál es el MONTO de la retención a calcular?
const ivaRetenidoCalculado = computed(() => {
  // Si la computada anterior es false, el resultado es 0.
  if (!aplicaRetencion.value) {
    return 0;
  }
  // Si aplica, calcula el 1% sobre la base gravada sin IVA.
  return parseFloat((totalGravadaSinIva.value * 0.01).toFixed(2));
});

const rentaRetenidaCalculada = computed(() => {
  if (form.value.tipo_dte !== '14') {
    return 0;
  }

  // Hacemos el reduce "seguro"
  const totalCompra = form.value.items
    .reduce((acc, item) => {
      // Convertimos a número (o 0 si es null/undefined)
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precio_unitario) || 0;
      return acc + (cantidad * precio);
    }, 0); // Empezamos con 0
  
  // Devuelve el 10% del total de la compra
  return totalCompra * 0.10;
});

// 4. ¿Cuál es el TOTAL A PAGAR final que ve el usuario?
const totalAPagar = computed(() => {
  
  const total = subtotales.value.total; 
  
  const ivaRete = ivaRetenidoCalculado.value;  
  const rentaRete = rentaRetenidaCalculada.value;

  return total - ivaRete - rentaRete;
});

// ===================================================================
// === FIN LÓGICA FISCAL ===
// ===================================================================


// --- PROPIEDADES COMPUTADAS GENERALES ---
const subtotales = computed(() => {
  // 1. Detectamos el modo de cálculo del cliente
  const usarCalculoUnitario = form.value.cliente?.usar_calculo_unitario || false;

  // 2. Calculamos el total acumulado
  const total = form.value.items.reduce((acc, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precioConIva = parseFloat(item.precio_unitario) || 0;

    // IMPORTANTE: Si es exento, no aplicamos desglose de IVA
    if (item.esExento) {
      return acc + (cantidad * precioConIva);
    }

    if (usarCalculoUnitario) {
      // --- LÓGICA CLIENTE EXIGENTE ($7.77) ---
      // 1. Base unitaria redondeada (1.25 / 1.13 = 1.11)
      let baseUnit = precioConIva / 1.13;
      baseUnit = Math.round(baseUnit * 100) / 100; 

      // 2. Subtotal de la línea Base (1.11 * 7 = 7.77)
      const subTotalLinea = baseUnit * cantidad;

      // 3. Reconstruimos el total con IVA para sumar (7.77 * 1.13 = 8.78)
      return acc + (subTotalLinea * 1.13); 

    } else {
      // --- LÓGICA ESTÁNDAR ($7.74) ---
      // Suma directa del precio bruto (1.25 * 7 = 8.75)
      return acc + (cantidad * precioConIva);
    }
  }, 0);
  
  if (total === 0) {
    return { subTotal: 0, iva: 0, total: 0 };
  }

  // 3. Desglosamos para el footer
  const baseImponible = total / 1.13;
  const iva = total - baseImponible;
  
  return { 
    subTotal: baseImponible, 
    iva: iva, 
    total: total 
  };
});

const precioUnitarioLabel = computed(() => 'Precio Unitario (con IVA)');

const filteredMunicipios = computed(() => {
  if (!dialog.value.newClient.direccion.departamento) return [];
  const selectedDept = locations.value.find(d => d.codigo === dialog.value.newClient.direccion.departamento);
  return selectedDept ? selectedDept.municipios : [];
});

const validationErrors = computed(() => {
  const errors = [];
  const cliente = form.value.cliente;

  if (!form.value.punto_de_venta_id) {
    errors.push('Debe seleccionar un punto de venta.');
  }

  if (!cliente) {
    errors.push('Debe seleccionar un cliente.');
  } else {
    switch (form.value.tipo_dte) {
      case '03':
        if (!cliente.nit) errors.push('El cliente debe tener un NIT.');
        if (!cliente.nrc) errors.push('El cliente debe tener un NRC.');
        if (!cliente.nombre) errors.push('El cliente debe tener un Nombre o Razón Social.');
        if (!cliente.cod_actividad) errors.push('El cliente debe tener un Código de Actividad.');
        if (!cliente.desc_actividad) errors.push('El cliente debe tener una Descripción de Actividad.');
        if (!cliente.nombre_comercial) errors.push('El cliente debe tener un Nombre Comercial.');
        if (!cliente.direccion?.complemento) errors.push('El cliente debe tener una Dirección.');
        if (!cliente.telefono) errors.push('El cliente debe tener un Teléfono.');
        if (!cliente.correo) errors.push('El cliente debe tener un Correo Electrónico.');
        break;
      case '05': case '06':
        if (!cliente.nit) errors.push('El cliente debe tener un NIT.');
        if (!cliente.nrc) errors.push('El cliente debe tener un NRC.');
        if (!cliente.nombre) errors.push('El cliente debe tener un Nombre o Razón Social.');
        break;
      case '14':
        if (!cliente.nombre) errors.push('El cliente debe tener un Nombre.');
        if (!cliente.numDocumento) errors.push('El cliente debe tener un Número de Documento.');
        break;
    }
  }
  
  if (form.value.tipo_dte === '07') {
    if (form.value.documentos_retenidos.length === 0) {
      errors.push('Debe agregar al menos un documento a retener.');
    }
  } else {
    if (form.value.items.length === 0) {
      errors.push('Debe agregar al menos un ítem al documento.');
    }
  }

  const empresaUsaInventario = authStore.user?.empresa?.usa_inventario;
  if (empresaUsaInventario && form.value.items.length > 0) {
    const hayItemsLibres = form.value.items.some(item => !item.codigo);
    if (hayItemsLibres) {
      errors.push('Cuando el inventario está activado, todos los ítems deben ser seleccionados del catálogo.');
    }
  }

  return errors;
});

const editDialog = ref(false);
const editedItemIndex = ref(-1);
const editedItem = ref({
  descripcion: '',
  tipoItem: 1,
  uniMedida: 59,
  cantidad: 1,
  precio_unitario: 0,
  esExento: false,
  // ... otros campos
});



// --- WATCHERS ---
watch(searchTerm, (newVal) => {
  clearTimeout(searchTimeout);
  if (form.value.cliente && newVal === form.value.cliente.nombre) {
    return;
  }
  if (newVal && newVal.length >= 2) {
    searchTimeout = setTimeout(() => {
      fetchClients(newVal);
    }, 500);
  } else {
    searchResults.value = [];
  }
});

watch(() => dialog.value.newClient.direccion.departamento, () => {
  dialog.value.newClient.direccion.municipio = null;
});

watch(searchTermDoc, (newVal) => {
  if (form.value.documento_relacionado && newVal === form.value.documento_relacionado.numero_control) return;
  clearTimeout(searchTimeoutDoc);
  if (newVal && newVal.length >= 3) {
    searchTimeoutDoc = setTimeout(() => fetchDocuments(newVal), 500);
  } else {
    searchResultsDoc.value = [];
  }
});

watch(esVentaTercero, (newVal) => {
  if (!newVal) {
    mandante.value = null;
  }
});

watch(mandanteSearchTerm, (newVal) => {
  clearTimeout(mandanteSearchTimeout);
  if (newVal && newVal.length >= 3) {
    mandanteSearchTimeout = setTimeout(async () => {
      mandanteSearchLoading.value = true;
      try {
        const response = await $api(`/api/clients/search?term=${newVal}`);
        mandanteResults.value = response.data;
      } finally {
        mandanteSearchLoading.value = false;
      }
    }, 500);
  }
});

watch(() => form.value.condicion_operacion, (newCondition) => {
    if (newCondition !== '2') {
        form.value.plazo = null;
        form.value.periodo = null;
    }
});

watch(() => form.value.cliente, (newClient) => {
    // Cuando el cliente cambia, DESTRUIMOS el objeto 'newItem' anterior
    // y lo REEMPLAZAMOS por uno nuevo. Esto fuerza una actualización visual completa.
    newItem.value = {
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      tipoItem: 1,
      uniMedida: 59,
      codigo: null,
      // El nuevo objeto se crea desde cero con el estado de exención correcto.
      esExento: newClient?.es_exento || false,
    };
}, { deep: true });


// --- MÉTODOS ---

onMounted(async () => {
    initialLoading.value = true;
    try {
        const user = await authStore.fetchUser();
        if (!user) {
            notificationStore.showNotification({ message: 'No se pudieron cargar los datos del usuario.', color: 'error' });
            return;
        }
        puntosDeVentaPermitidos.value = user.puntos_de_venta_permitidos || [];
        if (user.default_punto_de_venta) {
            form.value.punto_de_venta_id = user.default_punto_de_venta.id;
        } else if (puntosDeVentaPermitidos.value.length > 0) {
            form.value.punto_de_venta_id = puntosDeVentaPermitidos.value[0].id;
        }
        const [types, fetchedLocations] = await Promise.all([
            $api('/api/document-types'),
            $api('/api/locations')
        ]);
        documentTypes.value = types;
        locations.value = fetchedLocations;
        await cargarClientePorDefecto();
    } catch (err) {
        notificationStore.showNotification({ message: 'Error al inicializar la página.', color: 'error' });
    } finally {
        initialLoading.value = false;
    }
});


function addItem() {
    // 1. Manejo de Exención (Tu lógica actual)
    if (clienteEsExentoGlobal.value) {
        newItem.value.esExento = true;
    }

    // 2. Validaciones
    const desc = newItem.value.descripcion || '';
    
    // Nota: Convertimos a números para asegurar validación correcta
    const cant = parseFloat(newItem.value.cantidad);
    const precio = parseFloat(newItem.value.precio_unitario);

    if (desc.toString().trim() === '' || cant <= 0 || precio < 0) {
        notificationStore.showNotification({
            message: 'La descripción es obligatoria y la cantidad debe ser mayor a cero.',
            color: 'warning'
        });
        return;
    }

    // 3. --- LÓGICA DE AGRUPACIÓN (NUEVO) ---
    let indexExistente = -1;

    // Solo buscamos duplicados si el ítem TIENE CÓDIGO (es un producto, no servicio libre)
    if (newItem.value.codigo) {
        indexExistente = form.value.items.findIndex(item => 
            item.codigo === newItem.value.codigo
        );
    }

    if (indexExistente !== -1) {
        // CASO A: YA EXISTE -> SUMAMOS LA CANTIDAD
        // Convertimos a float para evitar que "1" + "1" sea "11"
        const nuevaCantidad = parseFloat(form.value.items[indexExistente].cantidad) + cant;
        form.value.items[indexExistente].cantidad = nuevaCantidad;
        
        // (Opcional) Actualizamos el precio unitario por si cambió en el catálogo, 
        // o puedes dejar el viejo. Aquí actualizo al más reciente:
        form.value.items[indexExistente].precio_unitario = precio;

    } else {
        // CASO B: NO EXISTE -> AGREGAMOS NUEVA FILA
        form.value.items.push({ 
            ...newItem.value,
            cantidad: cant, // Aseguramos que se guarde como número
            precio_unitario: precio
        });
    }

    // 4. Limpieza (Tu lógica actual mejorada)
    newItem.value = { 
        descripcion: '', 
        cantidad: 1,      // Reiniciamos a 1 para el siguiente escaneo
        precio_unitario: 0, 
        tipoItem: 1, 
        uniMedida: 59,
        esExento: clienteEsExentoGlobal.value, 
        codigo: null
    };
    
    // 5. (Opcional) Devolver el foco al buscador para seguir escaneando rápido
    // document.getElementById('mi-input-buscador')?.focus();
}

function removeItem(index) {
  form.value.items.splice(index, 1);
}

async function submitDTE() {
  loading.value = true;
  error.value = null;

  try {
    const payload = JSON.parse(JSON.stringify(form.value));

    const usarCalculoUnitario = form.value.cliente?.usar_calculo_unitario || false;

    // Recorremos los ítems para recalcular matemáticamente antes de enviar
    if (payload.items && payload.items.length > 0) {
      payload.items = payload.items.map(item => {
        const cantidad = parseFloat(item.cantidad);
        const precioInputConIva = parseFloat(item.precio_unitario); // El precio que escribió el cajero ($1.25)
        
        // Si es exento, no hacemos desglose de IVA
        if (item.esExento) {
           return item;
        }

        let precioUniSinIva;
        let ventaGravada;

        if (usarCalculoUnitario) {
          // --- MÉTODO B: CLIENTE EXIGENTE (Línea por Línea) ---
          // 1. Quitamos IVA al unitario y REDONDEAMOS YA (2 decimales)
          let baseUnit = precioInputConIva / 1.13;
          baseUnit = Math.round(baseUnit * 100) / 100; // Ej: 1.11

          // 2. Multiplicamos por cantidad
          ventaGravada = baseUnit * cantidad; // Ej: 1.11 * 7 = 7.77
          
          // 3. El precio para el JSON es el redondeado
          precioUniSinIva = baseUnit;

        } else {
          // --- MÉTODO A: ESTÁNDAR (Sobre el Total) ---
          // 1. Calculamos total bruto
          const totalBruto = precioInputConIva * cantidad; // 8.75

          // 2. Quitamos IVA al total
          let baseTotal = totalBruto / 1.13; 
          ventaGravada = Number(baseTotal.toFixed(2)); // 7.74

          // 3. Calculamos unitario preciso para que cuadre la reversa
          precioUniSinIva = Number((ventaGravada / cantidad).toFixed(6)); // 1.1057...
        }

        // Sobreescribimos los valores en el payload para el JSON
        return {
          ...item,
          precio_unitario: precioUniSinIva, // Hacienda recibe esto sin IVA
          venta_gravada: ventaGravada,      // Hacienda recibe esto como subtotal línea
          // Guardamos el precio original por si acaso (opcional)
          precio_con_iva: precioInputConIva 
        };
      });
    }

    payload.iva_retenido = ivaRetenidoCalculado.value;

    payload.rete_renta = rentaRetenidaCalculada.value;

    if (payload.cliente) {
      const clienteSnakeCase = {};
      for (const key in payload.cliente) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        clienteSnakeCase[snakeKey] = payload.cliente[key];
      }
      payload.cliente = clienteSnakeCase;
    }

    if (['05', '06'].includes(payload.tipo_dte) && form.value.documento_relacionado) {
        const docRel = form.value.documento_relacionado;
        payload.documento_relacionado = {
            tipoDte: docRel.tipo_dte,
            codigoGeneracion: docRel.codigo_generacion,
            fecEmi: docRel.fh_procesamiento.split('T')[0]
        };
    }

    if (esVentaTercero.value && mandante.value) {
      payload.ventaTercero = {
        nit: mandante.value.nit,
        nombre: mandante.value.nombre
      };
    }

    if (payload.tipo_dte === '07') {
      payload.documentos_retenidos = form.value.documentos_retenidos;
    } else {
      payload.items = form.value.items;
    }
    
    const response = await $api('/api/invoices', {
      method: 'POST',
      body: payload,
    });

    if (response.estado === 'PROCESADO') {

      await prepararImprimir(response, payload.tipo_dte);

      resultDialog.value = {
        show: true, success: true, title: 'Transmisión Exitosa',
        message: 'El Documento Tributario Electrónico ha sido procesado y aceptado por el Ministerio de Hacienda.',
        details: `Nº Control: ${response.numeroControl}`
      };
    } else if (response.estado === 'CONTINGENCIA' || response.estado === 'CONTINGENCIA_PENDIENTE') {
      
      await prepararImprimir(response, payload.tipo_dte);
      
      resultDialog.value = {
        show: true, success: true, title: 'Documento en Contingencia',
        message: 'No hubo conexión con Hacienda. El documento se guardó correctamente y se enviará de forma automática más tarde.',
        details: `Nº Control: ${response.numeroControl}`
      };
    } else {
      const errorMsg = response.observaciones ? response.observaciones.join(', ') : 'Respuesta de rechazo no especificada.';
      resultDialog.value = {
        show: true, success: false, title: 'Documento Rechazado',
        message: 'Hacienda rechazó el documento. Por favor, revisa los detalles del error.',
        details: errorMsg
      };
    }

  } catch (err) {
    let dialogTitle = 'Error de Transmisión';
    let dialogMessage = 'No se pudo completar la solicitud. Revisa tu conexión o contacta a soporte.';
    let dialogDetails = err.data?.message || 'No hay detalles adicionales.';

    if (err.data) {
        const errorData = err.data;
        if (errorData.custom_user_message) {
            dialogTitle = '⚠️ Error de Configuración de Ambiente';
            dialogMessage = 'Se ha detectado un problema con la configuración del ambiente de la empresa:';
            dialogDetails = errorData.custom_user_message;
        } else if (errorData.descripcionMsg) {
            dialogTitle = 'Documento Rechazado por Hacienda';
            dialogMessage = 'Hacienda ha rechazado el documento por la siguiente razón:';
            dialogDetails = errorData.descripcionMsg;
        }
    }

    resultDialog.value = {
        show: true, success: false, title: dialogTitle,
        message: dialogMessage, details: dialogDetails
    };
  } finally {
    loading.value = false;
  }
}

function openDialog() { dialog.value.show = true; }

function closeDialog() {
    dialog.value.show = false;
    dialog.value.newClient = {
        nombre: '', nit: '', nrc: '', correo: '', nombre_comercial: '',
        cod_actividad: '', desc_actividad: '', telefono: '',
        direccion: { departamento: null, municipio: null, complemento: '' }
    };
}

async function fetchClients(term) {
  searchLoading.value = true;
  try {
    const response = await $api(`/api/clients/search?term=${term}`);
    searchResults.value = response.data;
  } catch (e) {
    notificationStore.showNotification({ message: 'Error al buscar clientes.', color: 'error' });
  } finally {
    searchLoading.value = false;
  }
}

async function saveNewClient() {
  if (!dialog.value.newClient.nombre) {
    return notificationStore.showNotification({ message: 'El nombre del cliente es requerido.', color: 'warning' });
  }
  dialog.value.loading = true;
  try {
    const response = await $api('/api/clients', {
      method: 'POST',
      body: dialog.value.newClient,
    });

    const savedClientData = response.data;
    
    searchResults.value.unshift(savedClientData);
    form.value.cliente = savedClientData;

    notificationStore.showNotification({ message: 'Cliente guardado exitosamente.' });
    closeDialog();
  } catch (err) {
    notificationStore.showNotification({ message: err.data?.message || 'Error al guardar el cliente.', color: 'error' });
  } finally {
    dialog.value.loading = false;
  }
}

async function fetchDocuments(term) {
  searchLoadingDoc.value = true;
  try {
    const response = await $api(`/api/invoices/search-for-credit-note?term=${term}`);
    searchResultsDoc.value = response;
  } catch (e) {
    notificationStore.showNotification({ message: 'Error al buscar documentos.', color: 'error' });
  } finally {
    searchLoadingDoc.value = false;
  }
}

async function handleDocumentoSeleccionado(selectedDoc) {
  if (!selectedDoc) {
    form.value.cliente = null;
    form.value.items = [];
    return;
  }
  loading.value = true;
  try {
    const originalDte = await $api(`/api/invoices/${selectedDoc.codigo_generacion}`);
    form.value.cliente = originalDte.receptor;
    form.value.items = originalDte.cuerpoDocumento.map(item => {
      const eraExento = item.ventaExenta > 0;
      const precioUnitarioParaForm = eraExento
        ? item.precioUni
        : parseFloat((item.precioUni * 1.13).toFixed(5));
      return {
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: precioUnitarioParaForm,
        codigo: item.codigo,
        tipoItem: item.tipoItem,
        uniMedida: item.uniMedida,
        esExento: eraExento,
      };
    });
    notificationStore.showNotification({ message: 'Cliente e ítems cargados desde el CCFE original.', color: 'info' });
  } catch (error) {
    notificationStore.showNotification({ message: 'No se pudieron cargar los detalles del documento seleccionado.', color: 'error' });
    form.value.cliente = null;
    form.value.items = [];
  } finally {
    loading.value = false;
  }
}

function agregarDocumentoRetenido() {
  if (!nuevoDocRetenido.value.numeroDocumento || !nuevoDocRetenido.value.montoSujetoGrav) {
    notificationStore.showNotification({ message: 'Debe rellenar al menos el número de documento y el monto.', color: 'warning' });
    return;
  }
  form.value.documentos_retenidos.push({ ...nuevoDocRetenido.value });
  nuevoDocRetenido.value = {
    tipoDte: '03',
    tipoDoc: 2,
    numeroDocumento: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    montoSujetoGrav: null,
    descripcion: ''
  };
}

function eliminarDocumentoRetenido(index) {
  form.value.documentos_retenidos.splice(index, 1);
}

function closeResultDialog() {
  const wasSuccess = resultDialog.value.success;
  resultDialog.value.show = false;
  if (wasSuccess) {
    router.push('/historial');
  }
}

function retrySubmit() {
  resultDialog.value.show = false;
  submitDTE();
}

function getUnidadMedidaNombre(value) {
    const unidad = unidadesDeMedida.value.find(u => u.value === value);
    return unidad ? unidad.title : 'Desconocido';
}

async function searchProducts(query) {
  if (!query || query.length < 2) {
    searchedProducts.value = [];
    return;
  }

  isSearching.value = true;
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    try {
      const response = await $api(`/api/products/search?q=${query}`);
      searchedProducts.value = response;

      // --- LÓGICA DE AUTO-AGREGADO (SCANNER) ---
      if (response.length === 1) {
        const product = response[0];
        const cleanQuery = query.trim();

        // Verificamos si lo que se buscó es IDÉNTICO al Barcode o SKU
        // Usamos == para ser flexibles con tipos (string vs number)
        if (product.barcode == cleanQuery || product.sku == cleanQuery || product.codigo == cleanQuery) {
            
            // 1. PREPARAR EL ÍTEM (Tu función actual)
            productSelected(product); 
            
            // 2. DEFINIR CANTIDAD POR DEFECTO (Scanner siempre suma 1)
            // Asegúrate de que tu newItem tenga cantidad
            if (!newItem.value.cantidad) newItem.value.cantidad = 1;

            // 3. AGREGAR A LA LISTA DE FACTURA
            // ¡Aquí llamamos a la función que usa tu botón "+"!
            addItem(); // <--- REEMPLAZA ESTO CON EL NOMBRE REAL DE TU FUNCIÓN

            // 4. FEEDBACK Y LIMPIEZA
            // Mostramos una notificación pequeña o sonido (opcional)
            // notificationStore.showNotification({ message: 'Producto agregado', color: 'success' });

            // Limpiamos para el siguiente escaneo INMEDIATAMENTE
            searchedProducts.value = [];
            newItem.value.descripcion = null; // O ''
            
            // Truco: Mantener el foco en el combo para el siguiente
            // document.activeElement.blur(); // A veces ayuda quitar y poner foco
            // nextTick(() => refCombobox.value.focus());
        }
      }
      // ------------------------------------------

    } catch (error) {
      console.error("Error buscando productos:", error);
      searchedProducts.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 300); // Bajé a 300ms para que el scanner se sienta más rápido
}

function productSelected(value) {
  // Caso 1: Se seleccionó un PRODUCTO del catálogo (es un objeto)
  if (typeof value === 'object' && value !== null) {
    newItem.value.descripcion = value.nombre;
    newItem.value.precio_unitario = parseFloat(value.precio_unitario);
    newItem.value.codigo = value.codigo;
    // LÓGICA CLAVE: El ítem es exento si el CLIENTE lo es, O si el PRODUCTO lo es.
    newItem.value.esExento = clienteEsExentoGlobal.value || !!value.es_exento_de_iva;
  } 
  // Caso 2: Se está escribiendo TEXTO LIBRE o se limpió el campo
  else {
    newItem.value.descripcion = value || '';
    newItem.value.codigo = null;
    newItem.value.precio_unitario = 0;
    // Al escribir o limpiar, la exención depende únicamente del estado del cliente.
    newItem.value.esExento = clienteEsExentoGlobal.value;
  }
}

// Función reutilizable para manejar la impresión
async function prepararImprimir(response, tipoDte) {
  if (!['01', '03'].includes(tipoDte)) return;

  const empresaConfig = authStore.user?.empresa?.configuracion || {};
  const imprimirAuto = empresaConfig.imprimir_automaticamente_ticket ?? false;

  if (!imprimirAuto) {
      console.log("Impresión automática omitida por configuración.");
      return;
  }

  // A. Llenamos datos de cabecera
  datosFacturaExitosa.value = {
    codigoGeneracion: response.codigoGeneracion,
    numeroControl: response.numeroControl,
    selloRecibido: response.selloRecibido || null,
    fhProcesamiento: response.fhProcesamiento || new Date().toLocaleString(),
    tipoDte: tipoDte
  };

  // B. LLENAMOS EL SNAPSHOT (Usando .value explícitamente)
  // Importante: Usamos '|| 0' por si acaso alguna variable es undefined
  resumenTicketSnapshot.value = {
    totalGravada: parseFloat(subtotales.value.subTotal || 0),
    iva: parseFloat(subtotales.value.iva || 0), // <--- NUEVO
    retencion: parseFloat(ivaRetenidoCalculado.value || 0) + parseFloat(rentaRetenidaCalculada.value || 0), // <--- NUEVO
    totalPagar: parseFloat(totalAPagar.value || 0)
  };

  // C. Esperamos al DOM y mandamos imprimir
  await nextTick();
  setTimeout(() => {
    window.print();
  }, 500);
}

function editItem(item, index) {
  editedItemIndex.value = index;
  // Clonamos el ítem para no editarlo en tiempo real en la tabla (hasta guardar)
  editedItem.value = { ...item }; 
  editDialog.value = true;
}

function saveEdit() {
  if (editedItemIndex.value > -1) {
    // Actualizamos el ítem en la lista principal
    Object.assign(form.value.items[editedItemIndex.value], editedItem.value);
  }
  closeEdit();
}

function closeEdit() {
  editDialog.value = false;
  nextTick(() => {
    editedItem.value = { ...newItem.value }; // Resetear o dejar vacío
    editedItemIndex.value = -1;
  });
}

async function cargarClientePorDefecto() {
  // Si ya hay un cliente seleccionado (ej. al editar borrador), no hacemos nada
  if (form.value.cliente?.id) return;

  try {
    // ESTRATEGIA: Buscamos por el nombre común "Varios" o "Consumidor Final"
    // Si en tu BD se llama diferente, cambia este string.
    const query = 'Varios'; 
    
    const response = await $api('/api/clients', {
      params: { search: query, per_page: 1 }
    });

    // Asumiendo que tu API devuelve { data: [...] } o un array directo
    const clientes = response.data || response;

    if (clientes.length > 0) {
      // Tomamos el primero que encuentre
      // (Idealmente tu backend debería devolver el que tenga is_generic = 1)
      const clienteDefault = clientes[0];
      
      console.log("Cliente por defecto asignado:", clienteDefault.nombre);
      form.value.cliente = clienteDefault;
    }
  } catch (error) {
    console.error("No se pudo cargar el cliente por defecto:", error);
  }
}

</script>

<style scoped>
/* Centrar el texto dentro del input de Vuetify */
.centered-input :deep(input) {
  text-align: center;
}

/* (Opcional) Ocultar las flechitas de subir/bajar número para que se vea más limpio */
.centered-input :deep(input::-webkit-outer-spin-button),
.centered-input :deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

/* Ajuste para Selects dentro de tabla */
.compact-select :deep(.v-field__input) {
  font-size: 13px;
  padding-top: 0;
  padding-bottom: 0;
  min-height: 32px;
}

/* Ajuste para Inputs numéricos dentro de tabla */
.centered-input :deep(input) {
  text-align: center;
  font-size: 13px;
  padding-top: 0;
  padding-bottom: 0;
}

/* Reducir padding de las celdas para ganar espacio */
.v-table--density-compact > .v-table__wrapper > table > tbody > tr > td {
  padding: 0 8px;
  height: 48px; /* Altura fija cómoda */
}
</style>