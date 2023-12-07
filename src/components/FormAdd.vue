<template>
    <v-form class="w-100" @submit.prevent="sendMessage">
      <v-btn @click="openSurveyDialog" color="deep-purple-accent-4" class="mb-3" prepend-icon="mdi mdi-plus">
        Crear Encuesta
      </v-btn>
  
      <v-dialog v-model="surveyDialog" max-width="600">
        <v-card>
          <v-card-title>Crear Encuesta</v-card-title>
          <v-card-text>
            <v-text-field v-model="surveyTitle" label="Título de la Encuesta"></v-text-field>
            <v-text-field v-model="option1" label="Opción 1"></v-text-field>
            <v-text-field v-model="option2" label="Opción 2"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="closeSurveyDialog">Cancelar</v-btn>
            <v-btn @click="sendSurvey">Enviar Encuesta</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <v-text-field
        color="success"
        label="Ingrese mensaje aquí"
        variant="outlined"
        hide-details
        append-icon="mdi-send"
        @click:append="sendMessage"
        v-model="message"
      ></v-text-field>
    </v-form>
  </template>
  
  <script setup>
  import { addDoc, collection } from "@firebase/firestore";
  import { auth, db } from "../firebase";
  import { ref } from "vue";
  
  const message = ref("");
  const surveyDialog = ref(false);
  const surveyTitle = ref("");
  const option1 = ref("");
  const option2 = ref("");
  
  const sendMessage = async () => {
    console.log("enviando mensaje" + message.value);
    try {
      await addDoc(collection(db, "Chats"), {
        text: message.value,
        time: Date.now(),
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName,
      });
  
      message.value = "";
    } catch (error) {
      console.log(error);
    }
  };
  
  const openSurveyDialog = () => {
    surveyDialog.value = true;
  };
  
  const closeSurveyDialog = () => {
    surveyDialog.value = false;
    surveyTitle.value = "";
    option1.value = "";
    option2.value = "";
  };
  
  const sendSurvey = async () => {
    if (!surveyTitle.value || !option1.value || !option2.value) {
      alert("Todos los campos de la encuesta son obligatorios.");
      return;
    }
  
    const surveyData = {
      title: surveyTitle.value,
      options: [option1.value, option2.value],
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName,
      timestamp: Date.now(),
    };
  
    try {
      await addDoc(collection(db, "surveys"), surveyData);
      closeSurveyDialog();
    } catch (error) {
      console.error("Error al enviar encuesta a Firestore:", error);
    }
  };
  </script>
  