<template>
  <div ref="chatsRef">
    <h1 class="text-center">Chats</h1>

    <v-card
      v-for="item in sortedMessagesAndSurveys"
      :key="item.id"
      width="500"
      class="mb-3"
      theme="dark"
      :subtitle="formatMessageSubtitle(item)"
      :class="item.uid === userChat.uid && 'ml-auto'"
      :color="item.uid === userChat.uid ? 'success' : '#555'"
    >
      <template v-if="item.text">
        <!-- Mostrar mensajes -->
        <div class="ml-5 mb-5">
          {{ item.text }}
        </div>
      </template>
      <template v-else-if="item.title">
        <!-- Mostrar encuestas -->
        <div>
          <h3 v-if="showSurveyTitle" class="text-center">Encuesta sobre:</h3>
          <h3 class="text-center">{{ item.title }}</h3>
          <div v-if="!surveyStatus[item.title] || !surveyStatus[item.title].submitted">
            <label v-for="(option, index) in item.options" :key="index">
              <input
                type="radio"
                v-model="selectedOptionSurvey[item.title]"
                :value="option"
                class="text-center ml-8"
                :disabled="surveyStatus[item.title] && surveyStatus[item.title].submitted"
              />
              {{ option }}
            </label>
            <v-btn @click="submitSurvey(item.title, selectedOptionSurvey[item.title])" color="primary" class="ml-15 mb-5 mt-5" :disabled="surveyStatus[item.title] && surveyStatus[item.title].submitted || !selectedOptionSurvey[item.title]">
              Enviar Encuesta
            </v-btn>
          </div>
          
          <v-btn @click="viewResults(item.title)" color="red" class="mb-2" style="margin-left: 180px;">
            Resultados
          </v-btn><br>
          <span v-if="isDateValid(item.timestamp)" class=" text-center" style="margin-left: 178px;">{{ formatDate(item.timestamp) }}</span>
          <div v-if="surveyStatus[item.title] && surveyStatus[item.title].submitted">
            <p class="mt-2 mb-2 text-center"><strong>Tu opción seleccionada:</strong> {{ selectedOptionSurvey[item.title] }}</p>
          </div>
        </div>
      </template>
    </v-card>
  </div>
</template>


<script setup>
import { ref, watch } from "vue";
import { auth, db } from "../firebase";
import { collection, query, onSnapshot, orderBy, addDoc, getDocs, where } from "firebase/firestore";

const userChat = ref(auth.currentUser);
const messages = ref([]);
const surveys = ref([]);
const selectedOptionSurvey = ref({});
const message = ref("");
const showSurveyTitle = ref(false);
const surveyResults = ref({});
const surveyStatus = ref({});

const qMessages = query(collection(db, "Chats"), orderBy("time"));
const qSurveys = query(collection(db, "surveys"), orderBy("timestamp"));

const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
  messages.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

const unsubscribeSurveys = onSnapshot(qSurveys, (snapshot) => {
  surveys.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

const messagesAndSurveys = ref([]);

watch([messages, surveys], () => {
  messagesAndSurveys.value = [...messages.value, ...surveys.value];
  messagesAndSurveys.value.sort((a, b) => a.time - b.time || a.timestamp - b.timestamp);
  showSurveyTitle.value = messagesAndSurveys.value.some(item => item.title);
});

const sortedMessagesAndSurveys = ref([]);

watch(messagesAndSurveys, () => {
  sortedMessagesAndSurveys.value = [...messagesAndSurveys.value];
});

const sendMessage = async () => {
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

const isDateValid = (timestamp) => {
  return !isNaN(timestamp) && timestamp !== null;
};

const formatDate = (timestamp) => {
  if (isDateValid(timestamp)) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  } else {
    return "";
  }
};

const submitSurvey = async (surveyTitle, selectedOption) => {
  if (!selectedOption) {
    alert("Selecciona una opción antes de enviar la encuesta.");
    return;
  }

  try {
    await addDoc(collection(db, "resultsSurveys"), {
      title: surveyTitle,
      selectedOption: selectedOption,
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName,
      time: Date.now(),
    });

    surveyResults.value[surveyTitle] = surveyResults.value[surveyTitle] || {};
    surveyResults.value[surveyTitle][selectedOption] =
      (surveyResults.value[surveyTitle][selectedOption] || 0) + 1;

    // Marcar la encuesta como enviada
    surveyStatus.value[surveyTitle] = { submitted: true };
  } catch (error) {
    console.error("Error al enviar la respuesta de la encuesta a Firestore:", error);
  }

  selectedOptionSurvey.value[surveyTitle] = selectedOption;
};

const viewResults = async (surveyTitle) => {
  try {
    const resultsQuery = query(collection(db, "resultsSurveys"), where("title", "==", surveyTitle));
    const resultsSnapshot = await getDocs(resultsQuery);
    const resultsData = {};

    resultsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.selectedOption in resultsData) {
        resultsData[data.selectedOption].push(data.displayName);
      } else {
        resultsData[data.selectedOption] = [data.displayName];
      }
    });

    if (Object.keys(resultsData).length > 0) {
      const resultString = Object.entries(resultsData)
        .map(([option, voters]) => `\n ${option}: ${voters.length} personas votaron \n Personas que votaron por la opcion - ${voters.join(', ')}`)
        .join('\n');

      alert(`Resultados de la encuesta "${surveyTitle}":\n${resultString}`);
    } else {
      alert(`No hay resultados para la encuesta "${surveyTitle}"`);
    }
  } catch (error) {
    console.error("Error al obtener los resultados de la encuesta desde Firestore:", error);
  }
};

const formatMessageSubtitle = (item) => {
  return `${item.displayName} - ${formatDate(item.time)}`;
};
</script>
